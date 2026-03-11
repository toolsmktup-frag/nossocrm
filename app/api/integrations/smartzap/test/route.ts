import { createClient } from '@/lib/supabase/server';
import { isAllowedOrigin } from '@/lib/security/sameOrigin';
import { SmartZapClient } from '@/lib/integrations/smartzap/client';

function json<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

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

  // Accept inline credentials (for pre-save test) or use stored config
  const body = await req.json().catch(() => null) as { baseUrl?: string; apiKey?: string } | null;

  let baseUrl: string;
  let apiKey: string;

  if (body?.baseUrl && body?.apiKey) {
    baseUrl = body.baseUrl.trim();
    apiKey = body.apiKey.trim();
  } else {
    // Use stored config
    const { data: config, error } = await supabase
      .from('smartzap_config')
      .select('base_url, api_key')
      .eq('organization_id', profile.organization_id)
      .single();

    if (error || !config) return json({ error: 'SmartZap não configurado' }, 400);
    baseUrl = config.base_url;
    apiKey = config.api_key;
  }

  const client = new SmartZapClient(baseUrl, apiKey);
  const result = await client.testConnection();

  return json(result, result.ok ? 200 : 400);
}
