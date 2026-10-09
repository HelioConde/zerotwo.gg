import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS"};
const out=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...H,"Content-Type":"application/json","Cache-Control":s===200?"private, max-age=30":"no-store"}});
const RH:any={americas:"americas.api.riotgames.com",europe:"europe.api.riotgames.com",asia:"asia.api.riotgames.com",sea:"sea.api.riotgames.com"};
const PH:any={br1:"br1.api.riotgames.com",na1:"na1.api.riotgames.com",la1:"la1.api.riotgames.com",la2:"la2.api.riotgames.com",euw1:"euw1.api.riotgames.com",eun1:"eun1.api.riotgames.com",kr:"kr.api.riotgames.com",jp1:"jp1.api.riotgames.com",oc1:"oc1.api.riotgames.com",tr1:"tr1.api.riotgames.com",ru:"ru.api.riotgames.com",ph2:"ph2.api.riotgames.com",sg2:"sg2.api.riotgames.com",th2:"th2.api.riotgames.com",tw2:"tw2.api.riotgames.com",vn2:"vn2.api.riotgames.com"};
const Q:any={400:"NORMAL DRAFT",420:"RANKED SOLO/DUO",430:"NORMAL BLIND",440:"RANKED FLEX",490:"QUICKPLAY",450:"ARAM",1700:"ARENA",1710:"ARENA",1810:"SWARM",1820:"SWARM",1830:"SWARM",1840:"SWARM"};
const CTX:any={400:"NORMAL",420:"RANKED",430:"NORMAL",440:"RANKED",480:"NORMAL",490:"NORMAL",450:"ARAM",1700:"ARENA",1710:"ARENA",1740:"ARENA",1750:"ARENA",1810:"SWARM",1820:"SWARM",1830:"SWARM",1840:"SWARM",2300:"BRAWL",2400:"ARAM MAYHEM"};
const POS:any={TOP:"TOP",JUNGLE:"JUNGLE",MIDDLE:"MID",MID:"MID",BOTTOM:"ADC",UTILITY:"SUPPORT"};
const SRCTX=new Set(["RANKED","NORMAL"]);
async function rf(u:string,k:string){try{const r=await fetch(u,{headers:{"X-Riot-Token":k,Accept:"application/json"},signal:AbortSignal.timeout(12000)});let d:any=null;try{d=await r.json()}catch{}return{ok:r.ok,status:r.status,retryAfter:r.headers.get("Retry-After"),data:d}}catch{return{ok:false,status:503,retryAfter:null,data:null}}}
const riotFailure=(status:number)=>status===401||status===403?"Consulta indisponível: autenticação da Riot recusada.":status===404?"Dados não encontrados para esta conta ou servidor.":status===429?"Limite de consultas Riot atingido. Tente novamente em instantes.":"Serviço Riot indisponível temporariamente. Tente novamente mais tarde.";
const upstreamStatus=(status:number)=>status===429?429:status===401||status===403?503:status===404?404:502;
const avg=(arr:any[],k:string)=>arr.length?+(arr.reduce((a:number,x:any)=>a+Number(x[k]||0),0)/arr.length).toFixed(2):null;
const tops=(arr:any[],k:string,n=3)=>{const f:any={};arr.forEach((x:any)=>{const v=x[k];if(v)f[v]=(f[v]||0)+1});return Object.entries(f).sort((a:any,b:any)=>Number(b[1])-Number(a[1])).slice(0,n).map((x:any)=>({name:x[0],games:x[1]}))};
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:H});
 if(req.method!=="POST")return out({error:"method"},405);
 const key=Deno.env.get("RIOT_API_KEY"),url=Deno.env.get("SUPABASE_URL"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!key||!url||!service)return out({error:"unavailable",message:"Consulta temporariamente indisponível."},503);
 let b:any={};try{b=await req.json()}catch{return out({error:"json"},400)}
 const gn=String(b.gameName||"").trim(),tl=String(b.tagLine||"").replace(/^#/,"").trim(),reg=String(b.region||"americas").toLowerCase(),plat=String(b.platform||"br1").toLowerCase();
 const requestedLimit=Math.min(100,Math.max(1,Math.floor(Number(b.limit||b.matchLimit||20)||20)));
 if(!gn||!tl||gn.length>32||tl.length>12)return out({error:"riot_id",message:"Use Nome#TAG com tamanho válido."},400);
 if(!RH[reg]||!PH[plat])return out({error:"routing",message:"Servidor não suportado."},400);
 const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const cacheKey=reg+":"+plat+":"+gn.toLowerCase()+"#"+tl.toLowerCase();
 let account:any=null,summoner:any=null;
 const {data:pc}=await db.from("riot_player_cache").select("*").eq("cache_key",cacheKey).maybeSingle();
 if(pc&&new Date(pc.expires_at).getTime()>Date.now()){account=pc.account_data;summoner=pc.summoner_data}
 if(!account){
   const ar=await rf("https://"+RH[reg]+"/riot/account/v1/accounts/by-riot-id/"+encodeURIComponent(gn)+"/"+encodeURIComponent(tl),key);
   if(!ar.ok)return out({error:"player",message:ar.status===404?"Riot ID não encontrado. Confira Nome#TAG.":riotFailure(ar.status),riotStatus:ar.status,retryAfter:ar.retryAfter},upstreamStatus(ar.status));
   account={puuid:ar.data.puuid,gameName:ar.data.gameName||gn,tagLine:ar.data.tagLine||tl};
   const sr=await rf("https://"+PH[plat]+"/lol/summoner/v4/summoners/by-puuid/"+encodeURIComponent(account.puuid),key);summoner=sr.ok?sr.data:null;
   const now=new Date(),exp=new Date(now.getTime()+15*60*1000);
   await db.from("riot_player_cache").upsert({cache_key:cacheKey,puuid:account.puuid,game_name:account.gameName,tag_line:account.tagLine,region:reg,platform:plat,account_data:account,summoner_data:summoner,fetched_at:now.toISOString(),expires_at:exp.toISOString(),updated_at:now.toISOString()},{onConflict:"cache_key"});
 }
 const puuid=account.puuid;
 const [ids,ranked,mastery]=await Promise.all([
   rf("https://"+RH[reg]+"/lol/match/v5/matches/by-puuid/"+encodeURIComponent(puuid)+"/ids?start=0&count="+requestedLimit,key),
   rf("https://"+PH[plat]+"/lol/league/v4/entries/by-puuid/"+encodeURIComponent(puuid),key),
   rf("https://"+PH[plat]+"/lol/champion-mastery/v4/champion-masteries/by-puuid/"+encodeURIComponent(puuid)+"/top?count=5",key)
 ]);
 const player={gameName:account.gameName||gn,tagLine:account.tagLine||tl,level:summoner?.summonerLevel??null,profileIconId:summoner?.profileIconId??null,platform:plat.toUpperCase()};
 if(!ids.ok)return out({error:"matches",message:riotFailure(ids.status),riotStatus:ids.status,retryAfter:ids.retryAfter,player},upstreamStatus(ids.status));
 const target=(Array.isArray(ids.data)?ids.data:[]).slice(0,requestedLimit) as string[];
 const {data:cached}=target.length?await db.from("lol_match_cache").select("match_id,match_data,expires_at").in("match_id",target):{data:[] as any[]};
 // Completed Riot matches are immutable; avoid re-fetching expired cache records unnecessarily.
 const cmap=new Map((cached||[]).filter((x:any)=>x.match_data&&x.match_id).map((x:any)=>[x.match_id,x.match_data]));
 const missing=target.filter((id:string)=>!cmap.has(id));
 let fetchedNow=0,rateLimited=false;
 for(let i=0;i<missing.length;i+=3){
   if(i>0)await new Promise(resolve=>setTimeout(resolve,300));
   const batch=missing.slice(i,i+3);
   const got=await Promise.all(batch.map(async(id:string)=>({id,res:await rf("https://"+RH[reg]+"/lol/match/v5/matches/"+encodeURIComponent(id),key)})));
   const cacheWrites:any[]=[];
   for(const x of got){
     if(!x.res.ok||!x.res.data?.info)continue;
     const m=x.res.data,info=m.info;
     cmap.set(x.id,m);fetchedNow++;
     cacheWrites.push(db.from("lol_match_cache").upsert({match_id:x.id,region:reg,game_start:info.gameStartTimestamp?new Date(info.gameStartTimestamp).toISOString():null,game_duration:info.gameDuration||null,queue_id:info.queueId||null,match_data:m,fetched_at:new Date().toISOString(),expires_at:new Date(Date.now()+30*24*60*60*1000).toISOString(),updated_at:new Date().toISOString()},{onConflict:"match_id"}))
   }
   // Writes must not serialize every uncached Riot match.
   if(cacheWrites.length)await Promise.allSettled(cacheWrites);
   if(got.some((x:any)=>x.res.status===429)){rateLimited=true;break}
 }
 const raw=target.map((id:string)=>cmap.get(id)).filter(Boolean);
 const rows=raw.map((m:any)=>{const p=m.info?.participants?.find((x:any)=>x.puuid===puuid);if(!p)return null;const secs=Number(m.info?.gameDuration||0),mins=Math.max(1,secs/60),qid=Number(m.info?.queueId||0);if(qid===0)return null;const rawPos=String(p.teamPosition||p.individualPosition||"").toUpperCase(),rawMode=String(m.info?.gameMode||"").toUpperCase(),context=rawMode==="CHERRY"?"ARENA":(CTX[qid]||rawMode||"OUTRO"),eligible=secs>=300&&!String(m.info?.gameType||"").includes("TUTORIAL"),cs=Number(p.totalMinionsKilled||0)+Number(p.neutralMinionsKilled||0),champ=p.championName==="MonkeyKing"?"Wukong":p.championName,teamId=Number(p.teamId||0),all=m.info?.participants||[],placement=Number(p.subteamPlacement||0)||null;
   return{id:m.metadata?.matchId,playedAt:m.info?.gameStartTimestamp||null,duration:Math.round(mins),queueId:qid,queue:context==="ARENA"?"ARENA":(Q[qid]||context||("FILA "+qid)),context,mapId:m.info?.mapId,mode:m.info?.gameMode,eligible,win:context==="ARENA"?placement===1:!!p.win,placement,champion:champ,championId:Number(p.championId||0)||null,position:POS[rawPos]||null,kills:Number(p.kills||0),deaths:Number(p.deaths||0),assists:Number(p.assists||0),kda:+((Number(p.kills||0)+Number(p.assists||0))/Math.max(1,Number(p.deaths||0))).toFixed(2),cs,csPerMin:+(cs/mins).toFixed(2),vision:Number(p.visionScore||0),visionPerMin:+(Number(p.visionScore||0)/mins).toFixed(2),damage:Number(p.totalDamageDealtToChampions||0),damagePerMin:+(Number(p.challenges?.damagePerMinute??(Number(p.totalDamageDealtToChampions||0)/mins))||0).toFixed(0),teamDamageShare:p.challenges?.teamDamagePercentage!=null?Math.round(Number(p.challenges.teamDamagePercentage)*1000)/10:null,physicalDamage:Number(p.physicalDamageDealtToChampions||0),magicDamage:Number(p.magicDamageDealtToChampions||0),trueDamage:Number(p.trueDamageDealtToChampions||0),gold:Number(p.goldEarned||0),goldSpent:Number(p.goldSpent||0),goldPerMin:p.challenges?.goldPerMinute!=null?+Number(p.challenges.goldPerMinute).toFixed(0):+(Number(p.goldEarned||0)/mins).toFixed(0),damageTaken:Number(p.totalDamageTaken||0),damageTakenShare:p.challenges?.damageTakenOnTeamPercentage!=null?Math.round(Number(p.challenges.damageTakenOnTeamPercentage)*1000)/10:null,damageMitigated:Number(p.damageSelfMitigated||0),healing:Number(p.totalHeal||0),healsOnTeammates:Number(p.totalHealsOnTeammates||0),shieldOnTeammates:Number(p.totalDamageShieldedOnTeammates||0),effectiveHealShield:Number(p.challenges?.effectiveHealAndShielding||0),ccSeconds:Number(p.timeCCingOthers||0),ccDealt:Number(p.totalTimeCCDealt||0),turretDamage:Number(p.damageDealtToTurrets||0),turretTakedowns:Number(p.turretTakedowns||0),objectiveDamage:Number(p.damageDealtToObjectives||0),dragonKills:Number(p.dragonKills||0),baronKills:Number(p.baronKills||0),riftHeraldTakedowns:Number(p.challenges?.riftHeraldTakedowns||0),objectivesStolen:Number(p.objectivesStolen||0),soloKills:Number(p.challenges?.soloKills||0),doubleKills:Number(p.doubleKills||0),tripleKills:Number(p.tripleKills||0),quadraKills:Number(p.quadraKills||0),pentaKills:Number(p.pentaKills||0),largestKillingSpree:Number(p.largestKillingSpree||0),longestTimeLiving:Number(p.longestTimeSpentLiving||0),timeSpentDead:Number(p.totalTimeSpentDead||0),firstBloodKill:!!p.firstBloodKill,firstBloodAssist:!!p.firstBloodAssist,wardsPlaced:Number(p.wardsPlaced||0),wardsKilled:Number(p.wardsKilled||0),controlWards:Number(p.detectorWardsPlaced||0),killParticipation:p.challenges?.killParticipation!=null?Math.round(Number(p.challenges.killParticipation)*100):null,augments:[p.playerAugment1,p.playerAugment2,p.playerAugment3,p.playerAugment4,p.playerAugment5,p.playerAugment6].map((x:any)=>Number(x||0)).filter((x:number)=>x>0),items:[p.item0,p.item1,p.item2,p.item3,p.item4,p.item5,p.item6].filter((x:any)=>Number(x)>0),runeStyles:(p.perks?.styles||[]).map((x:any)=>({style:Number(x.style||0),selections:(x.selections||[]).map((s:any)=>Number(s.perk||0)).filter((v:number)=>v>0)})),summonerSpells:[Number(p.summoner1Id||0),Number(p.summoner2Id||0)].filter((v:number)=>v>0),teamChampions:all.filter((x:any)=>Number(x.teamId)===teamId).map((x:any)=>x.championName==="MonkeyKing"?"Wukong":x.championName),enemyChampions:all.filter((x:any)=>Number(x.teamId)!==teamId).map((x:any)=>x.championName==="MonkeyKing"?"Wukong":x.championName)} }).filter(Boolean);
 const sample=rows.filter((x:any)=>x.eligible),srSample=sample.filter((x:any)=>SRCTX.has(x.context));
 const contexts:any={};sample.forEach((x:any)=>{(contexts[x.context]??=[]).push(x)});
 const modeSummaries=Object.entries(contexts).map(([name,list]:any)=>{const wins=list.filter((x:any)=>x.win).length,pos=tops(list.filter((x:any)=>x.position),"position",1)[0]?.name||null,placements=list.map((x:any)=>x.placement).filter((x:any)=>Number(x)>0).map(Number),arena=name==="ARENA";return{name,games:list.length,wins,losses:arena?null:list.length-wins,winRate:arena?null:Math.round(wins/list.length*100),avgPlacement:arena&&placements.length?+(placements.reduce((a:number,b:number)=>a+b,0)/placements.length).toFixed(1):null,top4Rate:arena&&placements.length?Math.round(placements.filter((x:number)=>x<=4).length/placements.length*100):null,firstPlaces:arena?placements.filter((x:number)=>x===1).length:null,avgKda:avg(list,"kda"),avgDamagePerMin:avg(list,"damagePerMin"),avgCsPerMin:SRCTX.has(name)?avg(list,"csPerMin"):null,avgVisionPerMin:SRCTX.has(name)?avg(list,"visionPerMin"):null,primaryPosition:SRCTX.has(name)?pos:null,topChampions:tops(list,"champion",3)}}).sort((a:any,b:any)=>b.games-a.games);
 const mainContext=modeSummaries[0]?.name||null,primaryPosition=tops(srSample.filter((x:any)=>x.position),"position",1)[0]?.name||null,wins=sample.filter((x:any)=>x.win).length;const championSummaries=tops(sample,"champion",5).map((c:any)=>{const list=sample.filter((x:any)=>x.champion===c.name),arenaList=list.filter((x:any)=>x.context==="ARENA"),nonArena=list.filter((x:any)=>x.context!=="ARENA"),cw=nonArena.filter((x:any)=>x.win).length,placements=arenaList.map((x:any)=>x.placement).filter((x:any)=>Number(x)>0).map(Number);return{name:c.name,games:list.length,wins:cw,winRate:nonArena.length?Math.round(cw/nonArena.length*100):null,arenaGames:arenaList.length,avgPlacement:placements.length?+(placements.reduce((a:number,b:number)=>a+b,0)/placements.length).toFixed(1):null,top4Rate:placements.length?Math.round(placements.filter((x:number)=>x<=4).length/placements.length*100):null,avgKda:avg(list,"kda"),avgDamagePerMin:avg(list,"damagePerMin"),contexts:Array.from(new Set(list.map((x:any)=>x.context)))}});
 const rankRows=(ranked.ok&&Array.isArray(ranked.data)?ranked.data:[]).filter((x:any)=>x.queueType==="RANKED_SOLO_5x5"||x.queueType==="RANKED_FLEX_SR").map((x:any)=>({queue:x.queueType==="RANKED_SOLO_5x5"?"SOLO/DUO":"FLEX",tier:x.tier,rank:x.rank,lp:x.leaguePoints,wins:x.wins,losses:x.losses,winRate:(x.wins+x.losses)?Math.round(x.wins/(x.wins+x.losses)*100):0}));
 const masteryRows=(mastery.ok&&Array.isArray(mastery.data)?mastery.data:[]).map((x:any)=>({championId:x.championId,championName:sample.find((r:any)=>Number(r.championId)===Number(x.championId))?.champion||null,level:x.championLevel,points:x.championPoints,lastPlayTime:x.lastPlayTime}));
 const journeySnapshotsEnabled=String(Deno.env.get("CHAMPION_JOURNEY_SNAPSHOTS_ENABLED")||"").toLowerCase()==="true";
 if(journeySnapshotsEnabled){
   try{
     const profileKey=plat+":"+String(account.gameName||gn).toLowerCase()+"#"+String(account.tagLine||tl).toLowerCase();
     const journeyChampions=championSummaries.map((c:any)=>{
       const mm=masteryRows.find((m:any)=>String(m.championName||"").toLowerCase()===String(c.name||"").toLowerCase());
       return {name:c.name,games:Number(c.games||0),avgKda:c.avgKda==null?null:Number(c.avgKda),masteryPoints:Number(mm?.points||0),masteryLevel:Number(mm?.level||0)};
     });
     const {data:previous}=await db.from("lol_champion_journey_snapshots").select("sample_matches,signature,champions").eq("profile_key",profileKey).order("captured_at",{ascending:false}).limit(1).maybeSingle();
     const signature=journeyChampions[0]?.name||null;
     const unchanged=previous&&Number(previous.sample_matches||0)===sample.length&&String(previous.signature||"")===String(signature||"")&&JSON.stringify(previous.champions||[])===JSON.stringify(journeyChampions);
     if(!unchanged)await db.from("lol_champion_journey_snapshots").insert({profile_key:profileKey,game_name:account.gameName||gn,tag_line:account.tagLine||tl,platform:plat,captured_at:new Date().toISOString(),sample_matches:sample.length,signature,champions:journeyChampions,source_version:"public-lol-profile-v1"});
   }catch(e){console.warn("champion journey snapshot skipped",e instanceof Error?e.message:String(e))}
 }
 const enough=sample.length>0,mainMode=modeSummaries[0]||null;
 const performanceSignal=mainMode?.name==="ARENA"&&mainMode.avgPlacement!=null?"Na Arena, sua colocação média foi "+mainMode.avgPlacement+" e você ficou no Top 4 em "+mainMode.top4Rate+"% da amostra.":wins+" vitórias em "+sample.length+" partidas recentes analisadas.";
 return out({player,ranked:rankRows,mastery:masteryRows,modeSummaries,championSummaries,status:{ranked:ranked.ok?"ok":"unavailable",mastery:mastery.ok?"ok":"unavailable",history:rateLimited||raw.length<target.length?"partial":"ok",rankedStatus:ranked.ok?null:ranked.status,masteryStatus:mastery.ok?null:mastery.status},summary:{matches:sample.length,recentMatches:rows.length,wins:enough?wins:null,losses:enough?sample.length-wins:null,winRate:enough?Math.round(wins/sample.length*100):null,avgKda:avg(sample,"kda"),avgCsPerMin:avg(srSample,"csPerMin"),avgVisionPerMin:avg(srSample,"visionPerMin"),avgDamagePerMin:avg(sample,"damagePerMin"),primaryPosition,mainContext,contexts:modeSummaries.map((x:any)=>({name:x.name,games:x.games})),topChampions:tops(sample,"champion",3),confidence:sample.length>=8?"BOA":sample.length>=4?"EM FORMAÇÃO":sample.length?"INICIAL":"SEM AMOSTRA"},matches:rows,analysis:enough?{headline:sample.length<4?"AINDA ESTAMOS CONHECENDO ESTE JOGO":mainContext?"MOMENTO RECENTE: "+mainContext:"PADRÃO RECENTE",signals:["KDA médio de "+avg(sample,"kda")+" no histórico recente.",mainContext+" foi o modo mais frequente nesta amostra.",performanceSignal]}:{headline:"AINDA SEM PARTIDAS RECENTES PARA ANALISAR",signals:["Quando houver histórico disponível, o ZeroTwo separa padrões por modo.","ARAM, Arena, Normal e Ranked podem contribuir para encontrar um 02.","Métricas específicas só são comparadas quando fazem sentido naquele modo."]},cache:{requested:requestedLimit,availableIds:target.length,matchesLoaded:raw.length,cached:target.length-missing.length,fetched:fetchedNow,pending:Math.max(0,target.length-raw.length),rateLimited}});
});