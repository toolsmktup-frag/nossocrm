import { createStaticAdminClient } from '@/lib/supabase/server';
import { SmartZapClient } from './client';
import { resolveVariables } from './variables';
import type { SmartZapCampaignPayload } from '@/types/smartzap';

/**
 * Called server-side when a deal moves to a new stage.
 * Looks up active automations for the stage, resolves variables, dispatches to SmartZap,
 * and inserts a dispatch log entry.
 */
export async function triggerSmartZapForStageChange(
  orgId: string,
  dealId: string,
  stageId: string
): Promise<void> {
  const supabase = createStaticAdminClient();

  // 1. Fetch SmartZap config for this org
  const { data: config, error: configErr } = await supabase
    .from('smartzap_config')
    .select('base_url, api_key, is_active')
    .eq('organization_id', orgId)
    .single();

  if (configErr || !config || !config.is_active) return;

  // 2. Fetch active automations for this stage
  const { data: automations, error: autoErr } = await supabase
    .from('smartzap_automations')
    .select('id, template_id, variable_mappings')
    .eq('organization_id', orgId)
    .eq('board_stage_id', stageId)
    .eq('is_active', true);

  if (autoErr || !automations || automations.length === 0) return;

  // 3. Fetch deal + contact
  const { data: deal } = await supabase
    .from('deals')
    .select('id, title, value, contact_id, owner_id, stage_id')
    .eq('id', dealId)
    .single();

  if (!deal) return;

  const { data: contact } = deal.contact_id
    ? await supabase
        .from('contacts')
        .select('id, name, phone, email')
        .eq('id', deal.contact_id)
        .single()
    : { data: null };

  const { data: owner } = deal.owner_id
    ? await supabase
        .from('profiles')
        .select('name')
        .eq('id', deal.owner_id)
        .single()
    : { data: null };

  const { data: stage } = await supabase
    .from('board_stages')
    .select('label')
    .eq('id', stageId)
    .single();

  const dealCtx = {
    title: deal.title,
    value: deal.value,
    ownerName: (owner as any)?.name,
    stageName: (stage as any)?.label,
  };

  const contactCtx = {
    name: (contact as any)?.name,
    phone: (contact as any)?.phone,
    email: (contact as any)?.email,
  };

  const client = new SmartZapClient(config.base_url, config.api_key);

  for (const auto of automations) {
    const variables = resolveVariables(auto.variable_mappings ?? [], dealCtx, contactCtx);

    const phone = contactCtx.phone ?? '';
    if (!phone) {
      await insertLog(supabase, orgId, auto.id, dealId, phone, auto.template_id, null, null, null, 'Contato sem telefone');
      continue;
    }

    const payload: SmartZapCampaignPayload = {
      templateId: auto.template_id,
      phone,
      variables,
      campaignName: `NossoCRM – ${dealCtx.title ?? dealId}`,
    };

    try {
      const { status, body } = await client.dispatch(payload);
      await insertLog(supabase, orgId, auto.id, dealId, phone, auto.template_id, payload, status, body, null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await insertLog(supabase, orgId, auto.id, dealId, phone, auto.template_id, payload, null, null, msg);
    }
  }
}

async function insertLog(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  orgId: string,
  automationId: string,
  dealId: string,
  contactPhone: string,
  templateId: string,
  payload: SmartZapCampaignPayload | null,
  responseStatus: number | null,
  responseBody: unknown,
  error: string | null
) {
  await supabase.from('smartzap_dispatch_logs').insert({
    organization_id: orgId,
    automation_id: automationId,
    deal_id: dealId,
    contact_phone: contactPhone,
    template_id: templateId,
    payload,
    response_status: responseStatus,
    response_body: responseBody ?? null,
    error,
  });
}
