import { corsHeaders, json } from '../_shared/http.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Input={
  gameName?:string;
  tagLine?:string;
  region?:string;
  matchIds?:string[];
  context?:string|null;
  sampleOffset?:number;
};

type MateRow={
  riotId:string;
  gameName:string;
  tagLine:string;
  games:number;
  wins:number;
  firstPlayedAt:number;
  lastPlayedAt:number;
  champions:Map<string,number>;
  positions:Map<string,number>;
  pairChampions:Map<string,number>;
  recentGames:number;
  olderGames:number;
};

const allowedRegions=new Set(['americas','europe','asia','sea']);

function text(v:unknown,max=80){
  return String(v??'').trim().slice(0,max);
}
function inc(map:Map<string,number>,key:string){
  if(!key)return;
  map.set(key,(map.get(key)||0)+1);
}
async function riotGet(url:string,key:string){
  for(let attempt=0;attempt<2;attempt++){
    let res:Response;
    try{res=await fetch(url,{headers:{'X-Riot-Token':key},signal:AbortSignal.timeout(12000)});}
    catch{throw new Error('riot_service_unavailable');}
    if(res.status===429){
      if(attempt>0)throw new Error('riot_rate_limited');
      const retryAfter=Number(res.headers.get('Retry-After')||1);
      await new Promise(resolve=>setTimeout(resolve,Math.max(500,Math.min(3000,retryAfter*1000))));
      continue;
    }
    if(!res.ok)throw new Error(res.status===401||res.status===403?'riot_auth_unavailable':res.status===404?'riot_player_unavailable':'riot_service_unavailable');
    return res.json();
  }
  throw new Error('riot_rate_limited');
}

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return json({error:'method_not_allowed'},405);

  const riotApiKey=Deno.env.get('RIOT_API_KEY');
  const supabaseUrl=Deno.env.get('SUPABASE_URL');
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!riotApiKey)return json({error:'riot_not_configured'},503);
  const db=supabaseUrl&&serviceKey?createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}}):null;

  let input:Input={};
  try{input=await req.json()}catch{return json({error:'invalid_json'},400)}

  const gameName=text(input.gameName,32);
  const tagLine=text(input.tagLine,12);
  const region=allowedRegions.has(String(input.region))?String(input.region):'americas';
  const matchIds=[...new Set((input.matchIds||[]).map(x=>text(x,64)).filter(Boolean))].slice(0,25);
  const sampleOffset=Math.max(0,Math.floor(Number(input.sampleOffset||0)));

  if(!gameName||!tagLine)return json({error:'riot_id_required'},400);
  if(!matchIds.length)return json({teammates:[],matchesAnalyzed:0});

  try{
    const accountUrl='https://'+region+'.api.riotgames.com/riot/account/v1/accounts/by-riot-id/'+encodeURIComponent(gameName)+'/'+encodeURIComponent(tagLine);
    const account=await riotGet(accountUrl,riotApiKey);
    const targetPuuid=text(account?.puuid,120);
    if(!targetPuuid)return json({error:'player_not_found'},404);

    const mates=new Map<string,MateRow>();
    let analyzed=0;
    let cacheHits=0;
    let riotFetches=0;
    const detection={subteam:0,placement:0,teamId:0,unresolvedArena:0};
    const cachedMatches=new Map<string,any>();

    if(db&&matchIds.length){
      const {data:cacheRows}=await db.from('lol_match_cache').select('match_id,match_data').in('match_id',matchIds);
      for(const row of cacheRows||[]){
        if(row?.match_id&&row?.match_data)cachedMatches.set(String(row.match_id),row.match_data);
      }
    }

    // Match history is immutable after completion. Prefer the cache populated by
    // public-lol-profile and only fall back to Riot when a match is missing.
    for(let i=0;i<matchIds.length;i+=4){
      const batch=matchIds.slice(i,i+4);
      const results=await Promise.all(batch.map(async (matchId,batchIndex)=>{
        try{
          const cached=cachedMatches.get(matchId);
          if(cached){
            cacheHits++;
            return {match:cached,sampleIndex:i+batchIndex};
          }
          const match=await riotGet('https://'+region+'.api.riotgames.com/lol/match/v5/matches/'+encodeURIComponent(matchId),riotApiKey);
          riotFetches++;
          if(db&&match){
            const info=match?.info||{};
            await db.from('lol_match_cache').upsert({
              match_id:matchId,
              region,
              game_start:info.gameStartTimestamp?new Date(info.gameStartTimestamp).toISOString():null,
              game_duration:info.gameDuration||null,
              queue_id:info.queueId||null,
              match_data:match,
              fetched_at:new Date().toISOString(),
              expires_at:new Date(Date.now()+24*60*60*1000).toISOString(),
              updated_at:new Date().toISOString()
            },{onConflict:'match_id'});
          }
          return {match,sampleIndex:i+batchIndex};
        }catch(error){
          console.warn('public-lol-teammates match skipped',matchId,error);
          return null;
        }
      }));

      for(const result of results){
        if(!result)continue;
        const {match,sampleIndex}=result;
        const participants=Array.isArray(match?.info?.participants)?match.info.participants:[];
        const target=participants.find((p:any)=>p?.puuid===targetPuuid);
        if(!target)continue;
        analyzed++;
        const playedAt=Number(match?.info?.gameEndTimestamp||match?.info?.gameCreation||0);
        const targetTeamId=Number(target.teamId||0);
        const targetSubteamId=Number(target.playerSubteamId||0);
        const targetPlacement=Number(target.subteamPlacement||target.placement||0);
        const queueId=Number(match?.info?.queueId||0);
        const isArena=String(match?.info?.gameMode||'').toUpperCase()==='CHERRY'||[1700,1710,1750].includes(queueId)||targetSubteamId>0||targetPlacement>0;
        const sameTeamIdPeers=isArena&&targetTeamId>0
          ?participants.filter((x:any)=>x?.puuid!==targetPuuid&&Number(x?.teamId||0)===targetTeamId)
          :[];
        const useArenaTeamIdFallback=isArena&&sameTeamIdPeers.length>0&&sameTeamIdPeers.length<=2;

        for(const p of participants){
          if(!p||p.puuid===targetPuuid)continue;
          let sameSide=false;
          if(isArena){
            const mateSubteamId=Number(p.playerSubteamId||0);
            const matePlacement=Number(p.subteamPlacement||p.placement||0);
            if(targetSubteamId>0&&mateSubteamId>0&&mateSubteamId===targetSubteamId){
              sameSide=true;
              detection.subteam++;
            }else if(targetPlacement>0&&matePlacement>0&&matePlacement===targetPlacement){
              sameSide=true;
              detection.placement++;
            }else if(useArenaTeamIdFallback&&Number(p.teamId||0)===targetTeamId){
              sameSide=true;
              detection.teamId++;
            }
          }else{
            sameSide=Number(p.teamId||0)===targetTeamId;
          }
          if(!sameSide)continue;
          const mateGameName=text(p.riotIdGameName||'',32);
          const mateTagLine=text(p.riotIdTagline||'',12);
          if(!mateGameName||!mateTagLine)continue;
          const key=(mateGameName+'#'+mateTagLine).toLocaleLowerCase();
          let row=mates.get(key);
          if(!row){
            row={
              riotId:mateGameName+'#'+mateTagLine,
              gameName:mateGameName,
              tagLine:mateTagLine,
              games:0,
              wins:0,
              firstPlayedAt:0,
              lastPlayedAt:0,
              champions:new Map(),
              positions:new Map(),
              pairChampions:new Map(),
              recentGames:0,
              olderGames:0
            };
            mates.set(key,row);
          }
          row.games++;
          if(sampleOffset+sampleIndex<4)row.recentGames++;
          else row.olderGames++;
          const arenaWin=isArena&&targetPlacement>0?targetPlacement<=4:Boolean(target.win);
          if(arenaWin)row.wins++;
          row.firstPlayedAt=row.firstPlayedAt?Math.min(row.firstPlayedAt,playedAt):playedAt;
          row.lastPlayedAt=Math.max(row.lastPlayedAt,playedAt);
          inc(row.champions,text(p.championName,40));
          inc(row.positions,text(p.teamPosition||p.individualPosition||'',20));
          const targetChampion=text(target.championName,40);
          const mateChampion=text(p.championName,40);
          if(targetChampion&&mateChampion)inc(row.pairChampions,targetChampion+' + '+mateChampion);
        }
        if(isArena&&!participants.some((p:any)=>p?.puuid!==targetPuuid&&(
          (targetSubteamId>0&&Number(p.playerSubteamId||0)===targetSubteamId)||
          (targetPlacement>0&&Number(p.subteamPlacement||p.placement||0)===targetPlacement)||
          (useArenaTeamIdFallback&&Number(p.teamId||0)===targetTeamId)
        )))detection.unresolvedArena++;
      }
    }

    const teammates=[...mates.values()]
      .sort((a,b)=>b.games-a.games||b.wins-a.wins||b.lastPlayedAt-a.lastPlayedAt)
      .slice(0,30)
      .map(row=>({
        riotId:row.riotId,
        gameName:row.gameName,
        tagLine:row.tagLine,
        games:row.games,
        wins:row.wins,
        winRate:row.games?Math.round(row.wins/row.games*100):0,
        firstPlayedAt:row.firstPlayedAt,
        lastPlayedAt:row.lastPlayedAt,
        champions:[...row.champions.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([name,games])=>({name,games})),
        positions:[...row.positions.entries()].sort((a,b)=>b[1]-a[1]).slice(0,2).map(([name,games])=>({name,games})),
        pairChampions:[...row.pairChampions.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([name,games])=>({name,games})),
        recentGames:row.recentGames,
        olderGames:row.olderGames,
        phase:row.recentGames>0&&row.olderGames>0?'persistent':row.recentGames>=2?'now':row.olderGames>=2?'before':'single'
      }));

    return json({teammates,matchesAnalyzed:analyzed,sampleRequested:matchIds.length,cacheHits,riotFetches,detection});
  }catch(error){
    console.error('public-lol-teammates failed',error);
    const message=error instanceof Error?error.message:'unknown_error';
    return json({error:message==='riot_rate_limited'?'riot_rate_limited':'teammates_lookup_failed',message:message==='riot_rate_limited'?'Limite temporário da Riot. Tente novamente mais tarde.':message==='riot_auth_unavailable'?'Consulta Riot indisponível. Verifique a configuração da API.':'Não foi possível analisar os parceiros agora.'},message==='riot_rate_limited'?429:502);
  }
});
