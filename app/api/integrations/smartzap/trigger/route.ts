import { createClient } from '@/lib/supabase/server';
import { isAllowedOrigin } from '@/lib/security/sameOrigin';
import { triggerSmartZapForStageChange } from '@/lib/integrations/smartzap/dispatch';

function json<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/**
 * POST /api/integrations/smartzap/trigger
 * Internal endpoint called fire-and-forget from useMoveDeal.
 * Body: { dealId: string, stageId: string }
 */
export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) return json({ error: 'Forbidden' }, 403);

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) return json({ error: 'Profile not found' }, 404);

  const body = await req.json().catch(() => null) as { dealId?: string; stageId?: string } | null;

  if (!body?.dealId || !body?.stageId) {
    return json({ error: 'dealId and stageId are required' }, 400);
  }

  // Run async — caller doesn't wait for result
  triggerSmartZapForStageChange(profile.organization_id, body.dealId, body.stageId).catch(
    (err) => console.error('[SmartZap trigger] Error:', err)
  );

  return json({ ok: true });
}
