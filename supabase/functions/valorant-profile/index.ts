import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/http.ts';

function safeNum(value:unknown){
  const n=Number(value);
  return Number.isFinite(n)?n:0;
}
function round(value:number,digits=2){
  const power=10**digits;
  return Math.round(value*power)/power;
}
function avg(values:number[]){
  const valid=values.filter(Number.isFinite);
  return valid.length?round(valid.reduce((a,b)=>a+b,0)/valid.length,2):null;
}
function topEntries<T>(rows:T[],key:(row:T)=>string,limit=5){
  const map=new Map<string,number>();
  for(const row of rows){
    const name=key(row);
    if(!name)continue;
    map.set(name,(map.get(name)||0)+1);
  }
  return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([name,games])=>({name,games}));
}
function localizedName(row:any,fallback:string){
  return String(row?.localizedNames?.['pt-BR']||row?.name||fallback||'');
}
const QUEUE_LABELS:Record<string,string>={
  competitive:'COMPETITIVO',
  unrated:'SEM CLASSIFICAÇÃO',
  swiftplay:'DISPARADA',
  spikerush:'DISPUTA DA SPIKE',
  deathmatch:'MATA-MATA',
  ggteam:'DISPUTA DE EQUIPES',
  onefa:'REPLICAÇÃO',
  snowball:'GUERRA DE BOLAS',
  escalation:'DISPUTA DE ARMAS',
  newmap:'NOVO MAPA'
};

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

  const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
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

  let body:any={};
  try{body=await req.json()}catch{}
  const requestedLimit=Math.min(100,Math.max(10,Math.floor(Number(body?.limit||100)||100)));
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
  const agentNames=new Map<string,string>((content?.characters||[]).map((x:any)=>[String(x.id),localizedName(x,'Agente')]));
  const mapNames=new Map<string,string>((content?.maps||[]).map((x:any)=>[String(x.id),localizedName(x,'Mapa')]));
  const equipNames=new Map<string,string>((content?.equips||[]).map((x:any)=>[String(x.id),localizedName(x,'Arma')]));

  const observed=(Array.isArray(list?.history)?list.history:[]).filter((x:any)=>x?.matchId);
  const observedIds=[...new Set(observed.map((x:any)=>String(x.matchId)))];

  const {data:cachedRows}=observedIds.length
    ?await admin.from('valorant_match_cache').select('match_id,match_data').in('match_id',observedIds)
    :{data:[] as any[]};
  const cacheMap=new Map<string,any>((cachedRows||[]).map((row:any)=>[String(row.match_id),row.match_data]));
  const missing=observedIds.filter(id=>!cacheMap.has(id));
  let fetchedNow=0;
  let rateLimited=false;

  for(let i=0;i<missing.length;i+=4){
    const batch=missing.slice(i,i+4);
    const results=await Promise.all(batch.map(async(matchId)=>{
      try{
        const response=await fetch(base+'/val/match/v1/matches/'+encodeURIComponent(matchId),{headers:riotHeaders});
        if(response.status===429)return {matchId,status:429,data:null};
        if(!response.ok)return {matchId,status:response.status,data:null};
        return {matchId,status:200,data:await response.json()};
      }catch{
        return {matchId,status:0,data:null};
      }
    }));

    for(const result of results){
      if(result.status===429){rateLimited=true;continue}
      if(!result.data)continue;
      const info=result.data?.matchInfo||{};
      cacheMap.set(result.matchId,result.data);
      fetchedNow++;
      await admin.from('valorant_match_cache').upsert({
        match_id:result.matchId,
        shard:account.shard,
        game_start:info.gameStartMillis?new Date(Number(info.gameStartMillis)).toISOString():null,
        queue_id:String(info.queueId||''),
        match_data:result.data,
        fetched_at:new Date().toISOString(),
        updated_at:new Date().toISOString()
      },{onConflict:'match_id'});
    }
    if(rateLimited)break;
  }

  const observedById=new Map<string,any>(observed.map((entry:any)=>[String(entry.matchId),entry]));
  const historyLinks=observedIds.filter(id=>cacheMap.has(id)).map(matchId=>{
    const entry=observedById.get(matchId)||{};
    const match=cacheMap.get(matchId);
    const info=match?.matchInfo||{};
    const millis=safeNum(info.gameStartMillis||entry.gameStartTimeMillis);
    return {
      user_id:user.id,
      match_id:matchId,
      started_at:millis?new Date(millis).toISOString():null,
      queue_id:String(info.queueId||entry.queueId||''),
      observed_at:new Date().toISOString()
    };
  });
  if(historyLinks.length)await admin.from('valorant_user_matches').upsert(historyLinks,{onConflict:'user_id,match_id'});

  const {data:userHistory,error:historyError}=await admin
    .from('valorant_user_matches')
    .select('match_id,started_at,queue_id')
    .eq('user_id',user.id)
    .order('started_at',{ascending:false,nullsFirst:false})
    .limit(requestedLimit);

  if(historyError)return json({error:'valorant_history_lookup_failed'},500);
  const accumulatedIds=(userHistory||[]).map((row:any)=>String(row.match_id));
  const {data:accumulatedCache}=accumulatedIds.length
    ?await admin.from('valorant_match_cache').select('match_id,match_data').in('match_id',accumulatedIds)
    :{data:[] as any[]};
  const accumulatedMap=new Map<string,any>((accumulatedCache||[]).map((row:any)=>[String(row.match_id),row.match_data]));

  const normalizeMatch=(match:any)=>{
    if(!match)return null;
    const me=(match.players||[]).find((p:any)=>p.puuid===account.puuid);
    if(!me)return null;
    const stats=me.stats||{};
    const info=match.matchInfo||{};
    const teamId=String(me.teamId||'');
    const team=(match.teams||[]).find((t:any)=>String(t.teamId)===teamId);
    const rounds=Array.isArray(match.roundResults)?match.roundResults:[];
    const playerRoundStats=rounds.map((roundRow:any)=>({
      round:roundRow,
      stats:(roundRow.playerStats||[]).find((p:any)=>p.puuid===account.puuid)||null
    })).filter((x:any)=>x.stats);

    let headshots=0,bodyshots=0,legshots=0,damageDealt=0,damageReceived=0;
    let firstKills=0,firstDeaths=0,plants=0,defuses=0;
    let rounds2k=0,rounds3k=0,rounds4k=0,aces=0;
    let loadoutTotal=0,spentTotal=0,remainingTotal=0,economyRounds=0;
    const weapons=new Map<string,number>();

    rounds.forEach((roundRow:any)=>{
      const myStats=(roundRow.playerStats||[]).find((p:any)=>p.puuid===account.puuid);
      if(myStats){
        const kills=Array.isArray(myStats.kills)?myStats.kills:[];
        if(kills.length>=2)rounds2k++;
        if(kills.length>=3)rounds3k++;
        if(kills.length>=4)rounds4k++;
        if(kills.length>=5)aces++;

        for(const hit of (myStats.damage||[])){
          headshots+=safeNum(hit.headshots);
          bodyshots+=safeNum(hit.bodyshots);
          legshots+=safeNum(hit.legshots);
          damageDealt+=safeNum(hit.damage);
        }

        const economy=myStats.economy||{};
        const weaponId=String(economy.weapon||'');
        if(weaponId)weapons.set(weaponId,(weapons.get(weaponId)||0)+1);
        loadoutTotal+=safeNum(economy.loadoutValue);
        spentTotal+=safeNum(economy.spent);
        remainingTotal+=safeNum(economy.remaining);
        economyRounds++;
      }

      for(const pStats of (roundRow.playerStats||[])){
        for(const hit of (pStats.damage||[])){
          if(String(hit.receiver||'')===String(account.puuid))damageReceived+=safeNum(hit.damage);
        }
      }

      const killEvents:any[]=[];
      const seen=new Set<string>();
      for(const pStats of (roundRow.playerStats||[])){
        for(const kill of (pStats.kills||[])){
          const key=[kill.killer,kill.victim,kill.timeSinceRoundStartMillis,kill.timeSinceGameStartMillis].join('|');
          if(seen.has(key))continue;
          seen.add(key);
          killEvents.push(kill);
        }
      }
      killEvents.sort((a,b)=>safeNum(a.timeSinceRoundStartMillis||a.timeSinceGameStartMillis)-safeNum(b.timeSinceRoundStartMillis||b.timeSinceGameStartMillis));
      const first=killEvents[0];
      if(first){
        if(String(first.killer||'')===String(account.puuid))firstKills++;
        if(String(first.victim||'')===String(account.puuid))firstDeaths++;
      }
      if(String(roundRow.bombPlanter||'')===String(account.puuid))plants++;
      if(String(roundRow.bombDefuser||'')===String(account.puuid))defuses++;
    });

    const hits=headshots+bodyshots+legshots;
    const roundsPlayed=Math.max(1,safeNum(stats.roundsPlayed)||rounds.length);
    const roundsWon=safeNum(team?.roundsWon)||rounds.filter((r:any)=>String(r.winningTeam||'')===teamId).length;
    const roundsLost=Math.max(0,roundsPlayed-roundsWon);
    const deaths=safeNum(stats.deaths);
    const ability=stats.abilityCasts||{};
    const agentId=String(me.characterId||'');
    const mapId=String(info.mapId||'');
    const queueId=String(info.queueId||'');
    const topWeapons=[...weapons.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,roundsUsed])=>({
      id,
      name:equipNames.get(id)||'Arma',
      rounds:roundsUsed
    }));

    return {
      id:String(info.matchId||''),
      startedAt:safeNum(info.gameStartMillis),
      durationMs:safeNum(info.gameLengthMillis),
      queue:queueId,
      queueLabel:QUEUE_LABELS[queueId]||queueId.toUpperCase()||'FILA',
      mapId,
      map:mapNames.get(mapId)||'Mapa',
      gameMode:String(info.gameMode||''),
      agentId,
      agent:agentNames.get(agentId)||'Agente',
      teamId,
      competitiveTier:safeNum(me.competitiveTier),
      won:typeof team?.won==='boolean'?team.won:null,
      kills:safeNum(stats.kills),
      deaths,
      assists:safeNum(stats.assists),
      kd:round(safeNum(stats.kills)/Math.max(1,deaths),2),
      kda:round((safeNum(stats.kills)+safeNum(stats.assists))/Math.max(1,deaths),2),
      score:safeNum(stats.score),
      roundsPlayed,
      roundsWon,
      roundsLost,
      roundDiff:roundsWon-roundsLost,
      scorePerRound:round(safeNum(stats.score)/roundsPlayed,1),
      damageDealt,
      damageReceived,
      damagePerRound:round(damageDealt/roundsPlayed,1),
      headshots,
      bodyshots,
      legshots,
      headshotRate:hits?round((headshots/hits)*100,1):null,
      firstKills,
      firstDeaths,
      firstDuelDelta:firstKills-firstDeaths,
      multiKills:{two:rounds2k,three:rounds3k,four:rounds4k,aces},
      plants,
      defuses,
      economy:{
        avgLoadoutValue:economyRounds?round(loadoutTotal/economyRounds,0):null,
        avgSpent:economyRounds?round(spentTotal/economyRounds,0):null,
        avgRemaining:economyRounds?round(remainingTotal/economyRounds,0):null
      },
      abilities:{
        grenade:safeNum(ability.grenadeCasts),
        ability1:safeNum(ability.ability1Casts),
        ability2:safeNum(ability.ability2Casts),
        ultimate:safeNum(ability.ultimateCasts)
      },
      weapons:topWeapons,
      teamAgents:(match.players||[]).filter((p:any)=>String(p.teamId||'')===teamId).map((p:any)=>agentNames.get(String(p.characterId||''))||'Agente'),
      enemyAgents:(match.players||[]).filter((p:any)=>String(p.teamId||'')!==teamId).map((p:any)=>agentNames.get(String(p.characterId||''))||'Agente')
    };
  };

  const matches=accumulatedIds.map(id=>normalizeMatch(accumulatedMap.get(id))).filter(Boolean);
  const played=matches.length;
  const wins=matches.filter((m:any)=>m.won===true).length;
  const decided=matches.filter((m:any)=>typeof m.won==='boolean').length;
  const weaponRows:any[]=[];
  for(const match of matches as any[]){
    for(const weapon of match.weapons||[]){
      for(let i=0;i<safeNum(weapon.rounds);i++)weaponRows.push({name:weapon.name});
    }
  }

  const summary={
    matches:played,
    winRate:decided?Math.round((wins/decided)*100):null,
    avgKda:avg((matches as any[]).map(m=>safeNum(m.kda))),
    avgKd:avg((matches as any[]).map(m=>safeNum(m.kd))),
    avgScorePerRound:avg((matches as any[]).map(m=>safeNum(m.scorePerRound))),
    avgDamagePerRound:avg((matches as any[]).map(m=>safeNum(m.damagePerRound))),
    avgHeadshotRate:avg((matches as any[]).map(m=>m.headshotRate==null?NaN:safeNum(m.headshotRate))),
    avgRoundDiff:avg((matches as any[]).map(m=>safeNum(m.roundDiff))),
    firstKills:(matches as any[]).reduce((sum,m)=>sum+safeNum(m.firstKills),0),
    firstDeaths:(matches as any[]).reduce((sum,m)=>sum+safeNum(m.firstDeaths),0),
    plants:(matches as any[]).reduce((sum,m)=>sum+safeNum(m.plants),0),
    defuses:(matches as any[]).reduce((sum,m)=>sum+safeNum(m.defuses),0),
    topAgents:topEntries(matches as any[],m=>String(m.agent||''),6),
    topMaps:topEntries(matches as any[],m=>String(m.map||''),6),
    queues:topEntries(matches as any[],m=>String(m.queueLabel||m.queue||''),6),
    topWeapons:topEntries(weaponRows,m=>String((m as any).name||''),6)
  };

  return json({
    linked:true,
    configured:true,
    account:{
      gameName:account.game_name,
      tagLine:account.tag_line,
      shard:account.shard,
      linkedAt:account.linked_at
    },
    summary,
    matches,
    cache:{
      requested:requestedLimit,
      observedNow:observedIds.length,
      accumulated:matches.length,
      cachedNow:observedIds.length-missing.length,
      fetchedNow,
      rateLimited
    }
  });
});
