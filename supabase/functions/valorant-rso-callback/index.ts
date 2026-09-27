import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function appRedirect(base:string,params:Record<string,string>){
  const url=new URL(base);
  for(const [k,v] of Object.entries(params))url.searchParams.set(k,v);
  return Response.redirect(url.toString(),302);
}

function accountCluster(shard:string){
  if(['br','latam','na'].includes(shard))return 'americas';
  if(shard==='eu')return 'europe';
  return 'asia';
}

Deno.serve(async(req)=>{
  const defaultApp=(Deno.env.get('APP_URL')||'https://helioconde.github.io/zerotwo.gg/').replace(/\/+$/,'/');
  if(req.method!=='GET')return appRedirect(defaultApp,{valorant:'error',reason:'method'});

  const url=new URL(req.url);
  const code=url.searchParams.get('code');
  const state=url.searchParams.get('state');
  const oauthError=url.searchParams.get('error');

  if(oauthError)return appRedirect(defaultApp,{valorant:'error',reason:'denied'});
  if(!code||!state)return appRedirect(defaultApp,{valorant:'error',reason:'missing_code'});

  const supabaseUrl=Deno.env.get('SUPABASE_URL')!;
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const clientId=Deno.env.get('RIOT_RSO_CLIENT_ID');
  const clientSecret=Deno.env.get('RIOT_RSO_CLIENT_SECRET');
  const redirectUri=Deno.env.get('RIOT_RSO_REDIRECT_URI');

  if(!clientId||!clientSecret||!redirectUri)return appRedirect(defaultApp,{valorant:'error',reason:'not_configured'});

  const admin=createClient(supabaseUrl,serviceKey);
  const {data:pending,error:pendingError}=await admin
    .from('riot_rso_states')
    .select('state,user_id,shard,return_to,expires_at')
    .eq('state',state)
    .eq('game','valorant')
    .maybeSingle();

  if(pendingError||!pending)return appRedirect(defaultApp,{valorant:'error',reason:'invalid_state'});
  await admin.from('riot_rso_states').delete().eq('state',state);

  if(new Date(pending.expires_at).getTime()<Date.now())return appRedirect(pending.return_to||defaultApp,{valorant:'error',reason:'expired'});

  const body=new URLSearchParams();
  body.set('grant_type','authorization_code');
  body.set('code',code);
  body.set('redirect_uri',redirectUri);

  const tokenResponse=await fetch('https://auth.riotgames.com/token',{
    method:'POST',
    headers:{
      'Authorization':'Basic '+btoa(clientId+':'+clientSecret),
      'Content-Type':'application/x-www-form-urlencoded'
    },
    body
  });

  if(!tokenResponse.ok)return appRedirect(pending.return_to||defaultApp,{valorant:'error',reason:'token_exchange'});
  const tokens=await tokenResponse.json();
  const accessToken=String(tokens?.access_token||'');
  if(!accessToken)return appRedirect(pending.return_to||defaultApp,{valorant:'error',reason:'token_missing'});

  const cluster=accountCluster(pending.shard);
  const accountResponse=await fetch(`https://${cluster}.api.riotgames.com/riot/account/v1/accounts/me`,{
    headers:{Authorization:'Bearer '+accessToken}
  });
  if(!accountResponse.ok)return appRedirect(pending.return_to||defaultApp,{valorant:'error',reason:'account_lookup'});

  const account=await accountResponse.json();
  if(!account?.puuid||!account?.gameName||!account?.tagLine)return appRedirect(pending.return_to||defaultApp,{valorant:'error',reason:'account_invalid'});

  const {error:saveError}=await admin.from('valorant_accounts').upsert({
    user_id:pending.user_id,
    puuid:account.puuid,
    game_name:account.gameName,
    tag_line:account.tagLine,
    shard:pending.shard,
    sharing_enabled:true,
    linked_at:new Date().toISOString(),
    updated_at:new Date().toISOString()
  },{onConflict:'user_id'});

  if(saveError)return appRedirect(pending.return_to||defaultApp,{valorant:'error',reason:'save_failed'});

  // We intentionally do not persist Riot access/refresh tokens.
  // The successful RSO link records the user's opt-in; match data is fetched server-side
  // with the approved Riot Production API key.
  return appRedirect(pending.return_to||defaultApp,{valorant:'linked'});
});
