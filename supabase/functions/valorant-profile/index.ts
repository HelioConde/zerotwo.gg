import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/http.ts';

function safeNum(value:unknown){
  const n=Number(value);
  return Number.isFinite(n)?n:0;
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return json({error:'method_not_allowed'},405);

  const authorization=req.headers.get('Authorization');
  if(!authorization)return json({error:'unauthorized'},401);

  const supabaseUrl=Deno.env.get('SUPABASE_URL')!;
  const anonKey=Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const riotApiKey=Deno.env.get('RIOT_API_KEY');

  const userClient=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:authorization}}});
  const {data:{user},error:userError}=await userClient.auth.getUser();
  if(userError||!user)return json({error:'unauthorized'},401);

  const admin=createClient(supabaseUrl,serviceKey);
  const {data:account,error:accountError}=await admin
    .from('valorant_accounts')
    .select('user_id,puuid,game_name,tag_line,shard,sharing_enabled,linked_at')
    .eq('user_id',user.id)
    .maybeSingle();

  if(accountError)return json({error:'valorant_account_lookup_failed'},500);
  if(!account||!account.sharing_enabled)return json({linked:false});

  if(!riotApiKey)return json({
    linked:true,
    configured:false,
    account:{gameName:account.game_name,tagLine:account.tag_line,shard:account.shard}
  },503);

  const base=`https://${account.shard}.api.riotgames.com`;
  const riotHeaders={'X-Riot-Token':riotApiKey};

  const [listResponse,contentResponse]=await Promise.all([
    fetch(base+'/val/match/v1/matchlists/by-puuid/'+encodeURIComponent(account.puuid),{headers:riotHeaders}),
    fetch(base+'/val/content/v1/contents?locale=pt-BR',{headers:riotHeaders})
  ]);

  if(!listResponse.ok){
    return json({error:'valorant_matchlist_failed',status:listResponse.status},listResponse.status===429?429:502);
  }

  const list=await listResponse.json();
  const content=contentResponse.ok?await contentResponse.json():{};
  const agentNames=new Map<string,string>((content?.characters||[]).map((x:any)=>[String(x.id),String(x.name||x.localizedNames?.['pt-BR']||'Agente')]));

  const history=(list?.history||[]).slice(0,6);
  const detailResponses=await Promise.all(history.map((entry:any)=>
    fetch(base+'/val/match/v1/matches/'+encodeURIComponent(entry.matchId),{headers:riotHeaders})
      .then(async r=>r.ok?await r.json():null)
      .catch(()=>null)
  ));

  const matches=detailResponses.map((match:any,index:number)=>{
    if(!match)return null;
    const me=(match.players||[]).find((p:any)=>p.puuid===account.puuid);
    if(!me)return null;
    const team=(match.teams||[]).find((t:any)=>String(t.teamId)===String(me.teamId));
    const stats=me.stats||{};
    const info=match.matchInfo||{};
    const rounds=Math.max(1,safeNum(stats.roundsPlayed));
    const deaths=safeNum(stats.deaths);
    return {
      id:String(info.matchId||history[index]?.matchId||''),
      startedAt:safeNum(info.gameStartMillis||history[index]?.gameStartTimeMillis),
      durationMs:safeNum(info.gameLengthMillis),
      queue:String(info.queueId||history[index]?.queueId||''),
      mapId:String(info.mapId||''),
      gameMode:String(info.gameMode||''),
      agentId:String(me.characterId||''),
      agent:agentNames.get(String(me.characterId||''))||'Agente',
      teamId:String(me.teamId||''),
      won:typeof team?.won==='boolean'?team.won:null,
      kills:safeNum(stats.kills),
      deaths,
      assists:safeNum(stats.assists),
      score:safeNum(stats.score),
      roundsPlayed:rounds,
      scorePerRound:Math.round((safeNum(stats.score)/rounds)*10)/10,
      kda:Math.round(((safeNum(stats.kills)+safeNum(stats.assists))/Math.max(1,deaths))*100)/100
    };
  }).filter(Boolean);

  const played=matches.length;
  const wins=matches.filter((m:any)=>m.won===true).length;
  const decided=matches.filter((m:any)=>typeof m.won==='boolean').length;
  const avg=(values:number[])=>values.length?Math.round((values.reduce((a,b)=>a+b,0)/values.length)*100)/100:null;

  const agentCount=new Map<string,number>();
  const queueCount=new Map<string,number>();
  for(const match of matches as any[]){
    agentCount.set(match.agent,(agentCount.get(match.agent)||0)+1);
    const q=match.queue||'unknown';
    queueCount.set(q,(queueCount.get(q)||0)+1);
  }

  const topAgents=[...agentCount.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([name,games])=>({name,games}));
  const queues=[...queueCount.entries()].sort((a,b)=>b[1]-a[1]).map(([name,games])=>({name,games}));

  return json({
    linked:true,
    configured:true,
    account:{
      gameName:account.game_name,
      tagLine:account.tag_line,
      shard:account.shard,
      linkedAt:account.linked_at
    },
    summary:{
      matches:played,
      winRate:decided?Math.round((wins/decided)*100):null,
      avgKda:avg((matches as any[]).map(m=>m.kda)),
      avgScorePerRound:avg((matches as any[]).map(m=>m.scorePerRound)),
      topAgents,
      queues
    },
    matches
  });
});
