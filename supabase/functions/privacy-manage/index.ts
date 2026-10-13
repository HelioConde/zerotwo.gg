// Only the authenticated account owner can erase Riot Life snapshots.
// The user ID is derived from a verified access token, never the request body.
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

function allowedOrigin(origin: string | null): boolean {
  return !origin || origin === 'https://helioconde.github.io' ||
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}
function cors(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || 'https://helioconde.github.io',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info',
    Vary: 'Origin',
  };
}

Deno.serve(async request => {
  const origin = request.headers.get('origin');
  if (!allowedOrigin(origin)) return new Response(null, {status: 403});
  const headers = cors(origin);
  const answer = (status: number, payload: Record<string, unknown>) =>
    new Response(JSON.stringify(payload), {
      status, headers: {...headers, 'Content-Type':'application/json', 'Cache-Control':'no-store'}
    });
  if (request.method === 'OPTIONS') return new Response(null, {status:204, headers});
  if (request.method !== 'POST') return answer(405, {error:'method_not_allowed'});
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return answer(401, {error:'authentication_required'});
  const url = Deno.env.get('SUPABASE_URL');
  const roleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !roleKey) return answer(503, {error:'service_unavailable'});

  const admin = createClient(url, roleKey, {
    auth:{autoRefreshToken:false, persistSession:false}
  });
  const {data:{user}, error:authError} = await admin.auth.getUser(token);
  if (authError || !user) return answer(401, {error:'invalid_session'});

  let body: unknown;
  try { body = await request.json(); }
  catch { return answer(400, {error:'invalid_json'}); }
  if (!body || typeof body !== 'object' ||
      (body as Record<string, unknown>).action !== 'delete_riot_life_snapshots') {
    return answer(400, {error:'unsupported_action'});
  }
  const {error} = await admin.from('riot_life_snapshots')
    .delete()
    .eq('user_id', user.id);
  if (error) {
    console.error('privacy-manage: unable to erase snapshots', error.code || 'database_error');
    return answer(503, {error:'deletion_unavailable'});
  }
  return answer(200, {ok:true, scope:'riot_life_snapshots'});
});
