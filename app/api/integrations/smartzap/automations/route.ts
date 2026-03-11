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

  const { data, error } = await supabase
    .from('smartzap_automations')
    .select('id, board_stage_id, template_id, template_name, variable_mappings, is_active, created_at, updated_at')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false });

  if (error) return json({ error: error.message }, 500);

  return json({ automations: data ?? [] });
}

export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) return json({ error: 'Forbidden' }, 403);

  const supabase = await createClient();
  const profile = await getAdminProfile(supabase);
  if (!profile) return json({ error: 'Unauthorized or Forbidden' }, 401);

  const body = await req.json().catch(() => null) as {
    boardStageId?: string;
    templateId?: string;
    templateName?: string;
    variableMappings?: unknown[];
    isActive?: boolean;
  } | null;

  if (!body?.boardStageId || !body?.templateId) {
    return json({ error: 'boardStageId and templateId are required' }, 400);
  }

  const { data, error } = await supabase
    .from('smartzap_automations')
    .insert({
      organization_id: profile.organization_id,
      board_stage_id: body.boardStageId,
      template_id: body.templateId,
      template_name: body.templateName ?? null,
      variable_mappings: body.variableMappings ?? [],
      is_active: body.isActive ?? true,
    })
    .select()
    .single();

  if (error) return json({ error: error.message }, 500);

  return json({ automation: data }, 201);
}
