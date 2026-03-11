import { createClient } from '@/lib/supabase/server';
import { SmartZapClient } from '@/lib/integrations/smartzap/client';

function json<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export async function GET() {
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

  if (configErr || !config) return json({ error: 'SmartZap não configurado' }, 400);
  if (!config.is_active) return json({ error: 'SmartZap está desativado' }, 400);

  try {
    const client = new SmartZapClient(config.base_url, config.api_key);
    const templates = await client.getTemplates();
    return json({ templates });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 502);
  }
}
