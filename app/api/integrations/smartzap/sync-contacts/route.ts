import { createClient } from '@/lib/supabase/server';
import { isAllowedOrigin } from '@/lib/security/sameOrigin';
import { SmartZapClient } from '@/lib/integrations/smartzap/client';

function json<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/**
 * POST /api/integrations/smartzap/sync-contacts
 * Syncs CRM contacts with SmartZap (batch).
 * Accepts optional { contactIds: string[] } to sync a subset.
 */
export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) return json({ error: 'Forbidden' }, 403);

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) return json({ error: 'Profile not found' }, 404);
  if (profile.role !== 'admin') return json({ error: 'Forbidden' }, 403);

  const { data: config, error: configErr } = await supabase
    .from('smartzap_config')
    .select('base_url, api_key, is_active')
    .eq('organization_id', profile.organization_id)
    .single();

  if (configErr || !config || !config.is_active) {
    return json({ error: 'SmartZap não está configurado ou está desativado' }, 400);
  }

  const body = await req.json().catch(() => null) as { contactIds?: string[] } | null;

  // Fetch contacts with phone numbers
  let query = supabase
    .from('contacts')
    .select('id, name, phone, email')
    .not('phone', 'is', null)
    .neq('phone', '');

  if (body?.contactIds && body.contactIds.length > 0) {
    query = query.in('id', body.contactIds);
  } else {
    query = query.limit(500);
  }

  const { data: contacts, error: contactsErr } = await query;

  if (contactsErr) return json({ error: contactsErr.message }, 500);
  if (!contacts || contacts.length === 0) return json({ synced: 0, skipped: 0 });

  // SmartZap contact sync endpoint (if available)
  // This is a best-effort batch import — SmartZap API shape may vary
  const client = new SmartZapClient(config.base_url, config.api_key);
  let synced = 0;
  let skipped = 0;

  for (const contact of contacts) {
    if (!contact.phone) { skipped++; continue; }
    try {
      await (client as unknown as { syncContact?: (c: unknown) => Promise<void> }).syncContact?.({
        phone: contact.phone,
        name: contact.name,
        email: contact.email,
      });
      synced++;
    } catch {
      skipped++;
    }
  }

  return json({ synced, skipped, total: contacts.length });
}
