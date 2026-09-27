import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/http.ts';

const SHARDS=new Set(['br','latam','na','eu','kr','ap']);

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return json({error:'method_not_allowed'},405);

  const supabaseUrl=Deno.env.get('SUPABASE_URL')!;
  const anonKey=Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const clientId=Deno.env.get('RIOT_RSO_CLIENT_ID');
  const redirectUri=Deno.env.get('RIOT_RSO_REDIRECT_URI');
  const appUrl=(Deno.env.get('APP_URL')||'https://helioconde.github.io/zerotwo.gg/').replace(/\/+$/,'/');

  if(!clientId||!redirectUri)return json({error:'valorant_rso_not_configured'},503);

  const authorization=req.headers.get('Authorization');
  if(!authorization)return json({error:'unauthorized'},401);

  const userClient=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:authorization}}});
  const {data:{user},error:userError}=await userClient.auth.getUser();
  if(userError||!user)return json({error:'unauthorized'},401);

  const body=await req.json().catch(()=>({}));
  const shard=String(body?.shard||'br').toLowerCase();
  if(!SHARDS.has(shard))return json({error:'invalid_shard'},400);

  const state=crypto.randomUUID();
  const admin=createClient(supabaseUrl,serviceKey);
  const {error:stateError}=await admin.from('riot_rso_states').insert({
    state,
    user_id:user.id,
    game:'valorant',
    shard,
    return_to:appUrl
  });
  if(stateError)return json({error:'state_persist_failed'},500);

  const authorize=new URL('https://auth.riotgames.com/authorize');
  authorize.searchParams.set('client_id',clientId);
  authorize.searchParams.set('redirect_uri',redirectUri);
  authorize.searchParams.set('response_type','code');
  authorize.searchParams.set('scope','openid offline_access');
  authorize.searchParams.set('state',state);

  return json({authorizationUrl:authorize.toString(),shard});
});
