import { corsHeaders, json } from '../_shared/http.ts';

type Input={
  gameName?:string;
  tagLine?:string;
  region?:string;
  matchIds?:string[];
};

type MateRow={
  riotId:string;
  gameName:string;
  tagLine:string;
  games:number;
  wins:number;
  lastPlayedAt:number;
  champions:Map<string,number>;
  positions:Map<string,number>;
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
  const res=await fetch(url,{headers:{'X-Riot-Token':key}});
  if(res.status===429){
    const retry=Math.min(2,Number(res.headers.get('Retry-After')||1));
    await new Promise(resolve=>setTimeout(resolve,retry*1000));
    return riotGet(url,key);
  }
  if(!res.ok){
    const body=await res.text().catch(()=> '');
    throw new Error('Riot API '+res.status+(body?': '+body.slice(0,120):''));
  }
  return res.json();
}

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return json({error:'method_not_allowed'},405);

  const riotApiKey=Deno.env.get('RIOT_API_KEY');
  if(!riotApiKey)return json({error:'riot_not_configured'},503);

  let input:Input={};
  try{input=await req.json()}catch{return json({error:'invalid_json'},400)}

  const gameName=text(input.gameName,32);
  const tagLine=text(input.tagLine,12);
  const region=allowedRegions.has(String(input.region))?String(input.region):'americas';
  const matchIds=[...new Set((input.matchIds||[]).map(x=>text(x,64)).filter(Boolean))].slice(0,12);

  if(!gameName||!tagLine)return json({error:'riot_id_required'},400);
  if(!matchIds.length)return json({teammates:[],matchesAnalyzed:0});

  try{
    const accountUrl='https://'+region+'.api.riotgames.com/riot/account/v1/accounts/by-riot-id/'+encodeURIComponent(gameName)+'/'+encodeURIComponent(tagLine);
    const account=await riotGet(accountUrl,riotApiKey);
    const targetPuuid=text(account?.puuid,120);
    if(!targetPuuid)return json({error:'player_not_found'},404);

    const mates=new Map<string,MateRow>();
    let analyzed=0;

    // Process in small batches to avoid creating unnecessary bursts against Match-V5.
    for(let i=0;i<matchIds.length;i+=4){
      const batch=matchIds.slice(i,i+4);
      const results=await Promise.all(batch.map(async matchId=>{
        try{
          const match=await riotGet('https://'+region+'.api.riotgames.com/lol/match/v5/matches/'+encodeURIComponent(matchId),riotApiKey);
          return match;
        }catch(error){
          console.warn('public-lol-teammates match skipped',matchId,error);
          return null;
        }
      }));

      for(const match of results){
        const participants=Array.isArray(match?.info?.participants)?match.info.participants:[];
        const target=participants.find((p:any)=>p?.puuid===targetPuuid);
        if(!target)continue;
        analyzed++;
        const playedAt=Number(match?.info?.gameEndTimestamp||match?.info?.gameCreation||0);
        const targetTeamId=target.teamId;

        for(const p of participants){
          if(!p||p.puuid===targetPuuid||p.teamId!==targetTeamId)continue;
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
              lastPlayedAt:0,
              champions:new Map(),
              positions:new Map()
            };
            mates.set(key,row);
          }
          row.games++;
          if(Boolean(target.win))row.wins++;
          row.lastPlayedAt=Math.max(row.lastPlayedAt,playedAt);
          inc(row.champions,text(p.championName,40));
          inc(row.positions,text(p.teamPosition||p.individualPosition||'',20));
        }
      }
    }

    const teammates=[...mates.values()]
      .sort((a,b)=>b.games-a.games||b.wins-a.wins||b.lastPlayedAt-a.lastPlayedAt)
      .slice(0,8)
      .map(row=>({
        riotId:row.riotId,
        gameName:row.gameName,
        tagLine:row.tagLine,
        games:row.games,
        wins:row.wins,
        winRate:row.games?Math.round(row.wins/row.games*100):0,
        lastPlayedAt:row.lastPlayedAt,
        champions:[...row.champions.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([name,games])=>({name,games})),
        positions:[...row.positions.entries()].sort((a,b)=>b[1]-a[1]).slice(0,2).map(([name,games])=>({name,games}))
      }));

    return json({teammates,matchesAnalyzed:analyzed,sampleRequested:matchIds.length});
  }catch(error){
    console.error('public-lol-teammates failed',error);
    const message=error instanceof Error?error.message:'unknown_error';
    return json({error:'teammates_lookup_failed',message},502);
  }
});
