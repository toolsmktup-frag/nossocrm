import { createClient } from '@/lib/supabase/server';
import { isAllowedOrigin } from '@/lib/security/sameOrigin';

function json<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

async function getOrgAndRole(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) return null;
  return profile as { organization_id: string; role: string };
}

export async function GET() {
  const supabase = await createClient();
  const profile = await getOrgAndRole(supabase);
  if (!profile) return json({ error: 'Unauthorized' }, 401);
  if (profile.role !== 'admin') return json({ error: 'Forbidden' }, 403);

  const { data, error } = await supabase
    .from('smartzap_config')
    .select('id, base_url, is_active, updated_at')
    .eq('organization_id', profile.organization_id)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);

  // Never return raw api_key to client
  return json({ config: data ?? null });
}

export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) return json({ error: 'Forbidden' }, 403);

  const supabase = await createClient();
  const profile = await getOrgAndRole(supabase);
  if (!profile) return json({ error: 'Unauthorized' }, 401);
  if (profile.role !== 'admin') return json({ error: 'Forbidden' }, 403);

  const body = await req.json().catch(() => null);
  if (!body) return json({ error: 'Invalid body' }, 400);

  const { baseUrl, apiKey, isActive } = body as {
    baseUrl?: string;
    apiKey?: string;
    isActive?: boolean;
  };

  if (!baseUrl || typeof baseUrl !== 'string') {
    return json({ error: 'baseUrl is required' }, 400);
  }

  const upsertData: Record<string, unknown> = {
    organization_id: profile.organization_id,
    base_url: baseUrl.trim(),
    updated_at: new Date().toISOString(),
  };

  if (typeof isActive === 'boolean') upsertData.is_active = isActive;

  // Only update api_key if explicitly provided (non-empty)
  if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0) {
    upsertData.api_key = apiKey.trim();
  }

  const { error } = await supabase
    .from('smartzap_config')
    .upsert(upsertData, { onConflict: 'organization_id' });

  if (error) return json({ error: error.message }, 500);

  return json({ ok: true });
}
