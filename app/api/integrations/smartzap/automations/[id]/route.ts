import { createClient } from '@/lib/supabase/server';
import { isAllowedOrigin } from '@/lib/security/sameOrigin';

function json<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

async function getAdminProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.organization_id || profile.role !== 'admin') return null;
  return profile as { organization_id: string; role: string };
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAllowedOrigin(req)) return json({ error: 'Forbidden' }, 403);

  const supabase = await createClient();
  const profile = await getAdminProfile(supabase);
  if (!profile) return json({ error: 'Unauthorized or Forbidden' }, 401);

  const { id } = await params;
  const body = await req.json().catch(() => null) as {
    boardStageId?: string;
    templateId?: string;
    templateName?: string;
    variableMappings?: unknown[];
    isActive?: boolean;
  } | null;

  if (!body) return json({ error: 'Invalid body' }, 400);

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.boardStageId !== undefined) updates.board_stage_id = body.boardStageId;
  if (body.templateId !== undefined) updates.template_id = body.templateId;
  if (body.templateName !== undefined) updates.template_name = body.templateName;
  if (body.variableMappings !== undefined) updates.variable_mappings = body.variableMappings;
  if (body.isActive !== undefined) updates.is_active = body.isActive;

  const { data, error } = await supabase
    .from('smartzap_automations')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .select()
    .single();

  if (error) return json({ error: error.message }, 500);
  if (!data) return json({ error: 'Not found' }, 404);

  return json({ automation: data });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAllowedOrigin(req)) return json({ error: 'Forbidden' }, 403);

  const supabase = await createClient();
  const profile = await getAdminProfile(supabase);
  if (!profile) return json({ error: 'Unauthorized or Forbidden' }, 401);

  const { id } = await params;

  const { error } = await supabase
    .from('smartzap_automations')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id);

  if (error) return json({ error: error.message }, 500);

  return json({ ok: true });
}
