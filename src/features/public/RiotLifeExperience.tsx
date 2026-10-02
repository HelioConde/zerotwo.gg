import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/ZeroTwoUI';
import { MyRiotPatch } from './MyRiotPatch';
import { RiotArcade } from './RiotArcade';
import { FrequentTeammates } from './FrequentTeammates';
import { PlayerEras } from './PlayerEras';
import {
  loadCloudRiotLifeSnapshots,
  mergeRiotLifeSnapshots,
  saveCloudRiotLifeSnapshot,
  type RiotLifeSnapshot as Snapshot
} from './riotLifeMemory';
import '../../riot-life.css';

type RiotLifeProps={
  data:any;
  platform:string;
  champions:any;
  ddv:string;
};

const num=(v:any)=>Number.isFinite(Number(v))?Number(v):0;
const avg=(rows:any[],key:string)=>rows.length?rows.reduce((s,x)=>s+num(x?.[key]),0)/rows.length:0;
const pct=(wins:number,total:number)=>total?Math.round((wins/total)*100):0;
const RIOT_CHAPTERS=[
  ['riot-now','AGORA'],
  ['riot-signature','ASSINATURA'],
  ['riot-session','SESSÃO'],
  ['riot-peak','PONTO ALTO'],
  ['riot-change','MUDANÇA'],
  ['riot-people','PESSOAS'],
  ['riot-rhythm','RITMO'],
  ['riot-consistency','CONSISTÊNCIA'],
  ['riot-damage','DANO'],
  ['riot-economy','ECONOMIA'],
  ['riot-survival','SOBREVIVÊNCIA'],
  ['riot-mastery','MAESTRIA'],
  ['riot-arena','ARENA'],
  ['riot-streaks','SEQUÊNCIAS'],
  ['riot-hours','HORÁRIOS'],
  ['riot-days','DIAS'],
  ['riot-duration','DURAÇÃO'],
  ['riot-impact','IMPACTO'],
  ['riot-trend','TENDÊNCIA'],
  ['riot-next','AGORA VAI']
] as const;

const z2Art=(name:string)=>import.meta.env.BASE_URL+'assets/zerotwo/'+encodeURIComponent(name);
function contextArtwork(context:any){
  const value=String(context||'').toUpperCase();
  if(value.includes('ARENA'))return z2Art('arena.png');
  if(value.includes('ARAM'))return z2Art('aram.png');
  if(value.includes('RANKED'))return z2Art('ranqueado.png');
  if(value.includes('NORMAL')||value.includes('SUMMONER'))return z2Art('Summoners rift.png');
  return null;
}
const STORY_ART={
  session:z2Art('PARTIDA NA ÚLTIMA SESSÃO.png'),
  change:z2Art('SEU FOCO MUDOU DENTRO DESTA JANELA.png'),
  people:z2Art('ALGUNS NOMES VOLTAM A APARECER.png')
} as const;

function playedAt(match:any){
  const raw=match?.playedAt;
  if(typeof raw==='number') return raw<1e12?raw*1000:raw;
  const parsed=Date.parse(String(raw||''));
  return Number.isFinite(parsed)?parsed:0;
}
function topBy<T>(rows:T[],key:(row:T)=>string){
  const map=new Map<string,number>();
  rows.forEach(row=>{const value=key(row);if(value)map.set(value,(map.get(value)||0)+1)});
  return [...map.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
}
function rankLabel(ranked:any[]){
  const solo=(ranked||[]).find((x:any)=>String(x?.queue||'').toLowerCase().includes('solo'))||(ranked||[])[0];
  return solo?.tier?[solo.tier,solo.rank,solo.lp!=null?solo.lp+' LP':null].filter(Boolean).join(' '):null;
}
function sessionize(matches:any[]){
  const ordered=[...(matches||[])].filter(x=>playedAt(x)>0).sort((a,b)=>playedAt(a)-playedAt(b));
  const groups:any[][]=[];
  const gap=2*60*60*1000;
  ordered.forEach(match=>{
    const current=groups[groups.length-1];
    if(!current||playedAt(match)-playedAt(current[current.length-1])>gap) groups.push([match]);
    else current.push(match);
  });
  return groups.reverse();
}
function formatDate(ts:number){
  if(!ts)return '—';
  return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(ts));
}
function formatDuration(matches:any[]){
  if(!matches.length)return '—';
  const start=playedAt(matches[0]);
  const last=matches[matches.length-1];
  const end=playedAt(last)+(num(last?.duration)*60*1000);
  const mins=Math.max(0,Math.round((end-start)/60000));
  if(mins<60)return mins+' min';
  const h=Math.floor(mins/60),m=mins%60;
  return m?h+'h '+m+'min':h+'h';
}
const positiveResult=(m:any)=>m?.context==='ARENA'?(num(m?.placement)>0&&num(m?.placement)<=4):!!m?.win;
function meanValues(values:number[]){
  return values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
}
function median(values:number[]){
  if(!values.length)return 0;
  const rows=[...values].sort((a,b)=>a-b),mid=Math.floor(rows.length/2);
  return rows.length%2?rows[mid]:(rows[mid-1]+rows[mid])/2;
}
function deviation(values:number[]){
  if(values.length<2)return 0;
  const mean=meanValues(values);
  return Math.sqrt(meanValues(values.map(v=>(v-mean)**2)));
}
function resultRate(rows:any[]){return pct(rows.filter(positiveResult).length,rows.length)}
function longestResultStreak(rows:any[],wanted:boolean){
  let best=0,current=0;
  [...rows].sort((a,b)=>playedAt(a)-playedAt(b)).forEach(row=>{
    if(positiveResult(row)===wanted){current++;best=Math.max(best,current)}else current=0;
  });
  return best;
}
function currentResultStreak(rows:any[]){
  if(!rows.length)return {positive:true,games:0};
  const ordered=[...rows].sort((a,b)=>playedAt(b)-playedAt(a));
  const positive=positiveResult(ordered[0]);
  let games=0;
  for(const row of ordered){if(positiveResult(row)!==positive)break;games++}
  return {positive,games};
}
function periodOf(ts:number){
  const hour=new Date(ts).getHours();
  if(hour<6)return 'MADRUGADA';
  if(hour<12)return 'MANHÃ';
  if(hour<18)return 'TARDE';
  return 'NOITE';
}
const WEEKDAYS=['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
function DeepDiveChapter({id,number,kicker,title,copy,metrics,art,secondaryArt,children}:{id:string;number:string;kicker:string;title:string;copy:string;metrics:Array<{label:string;value:any;note?:string}>;art?:string;secondaryArt?:string;children?:any}){
  return <section id={id} className={'riotDeepChapter'+(art?' hasArt':'')}>
    {art&&<img className="riotDeepArt" loading="lazy" decoding="async" src={art} alt="" aria-hidden="true"/>}
    {secondaryArt&&<img className="riotDeepArtSecondary" loading="lazy" decoding="async" src={secondaryArt} alt="" aria-hidden="true"/>}
    {(art||secondaryArt)&&<div className="riotDeepArtShade"/>}
    <span className="riotChapterNumber">{number}</span>
    <div className="riotDeepCopy"><small>{kicker}</small><h3>{title}</h3><p>{copy}</p></div>
    <div className="riotDeepMetrics">{metrics.map(metric=><span key={metric.label}><small>{metric.label}</small><b>{metric.value}</b>{metric.note&&<em>{metric.note}</em>}</span>)}</div>
    {children}
  </section>
}

export function RiotLifeExperience({data,platform,champions,ddv}:RiotLifeProps){
  const matches=useMemo(()=>[...(data?.matches||[])].sort((a,b)=>playedAt(b)-playedAt(a)),[data]);
  const sessions=useMemo(()=>sessionize(matches),[matches]);
  const playerKey=((data?.player?.gameName||'player')+'#'+(data?.player?.tagLine||'')+'-'+platform).toLowerCase();
  const storageKey='zt_riot_life_'+playerKey;
  const [snapshots,setSnapshots]=useState<Snapshot[]>([]);
  const [memoryMode,setMemoryMode]=useState<'checking'|'local'|'cloud'>('checking');
  const [memoryReady,setMemoryReady]=useState(false);
  const [lifeView,setLifeView]=useState<'overview'|'story'|'explore'>('overview');
  const [activeChapter,setActiveChapter]=useState<string>('riot-now');

  useEffect(()=>{
    const sections=RIOT_CHAPTERS.map(([id])=>document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if(!sections.length)return;
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(visible?.target?.id)setActiveChapter(visible.target.id);
    },{rootMargin:'-22% 0px -58% 0px',threshold:[.1,.25,.5]});
    sections.forEach(section=>observer.observe(section));
    return()=>observer.disconnect();
  },[matches.length]);

  const currentSnapshot=useMemo<Snapshot>(()=>({
    at:Date.now(),
    mainContext:data?.summary?.mainContext||null,
    avgKda:data?.summary?.avgKda!=null?num(data.summary.avgKda):null,
    winRate:data?.summary?.winRate!=null?num(data.summary.winRate):null,
    topChampion:data?.championSummaries?.[0]?.name||matches[0]?.champion||null,
    rank:rankLabel(data?.ranked||[])
  }),[data,matches]);

  useEffect(()=>{
    let active=true;
    setMemoryReady(false);
    setMemoryMode('checking');
    let local:Snapshot[]=[];
    try{
      const raw=JSON.parse(localStorage.getItem(storageKey)||'[]');
      if(Array.isArray(raw))local=raw;
    }catch{}
    setSnapshots(local);
    (async()=>{
      const remote=await loadCloudRiotLifeSnapshots(playerKey);
      if(!active)return;
      const merged=mergeRiotLifeSnapshots(local,remote.snapshots);
      try{localStorage.setItem(storageKey,JSON.stringify(merged))}catch{}
      setSnapshots(merged);
      setMemoryMode(remote.cloud?'cloud':'local');
      setMemoryReady(true);
    })();
    return()=>{active=false};
  },[playerKey,storageKey]);

  useEffect(()=>{
    if(!memoryReady)return;
    const last=snapshots[snapshots.length-1];
    const changed=!last||Date.now()-last.at>20*60*1000||
      last.mainContext!==currentSnapshot.mainContext||
      last.topChampion!==currentSnapshot.topChampion||
      last.rank!==currentSnapshot.rank||
      last.avgKda!==currentSnapshot.avgKda||
      last.winRate!==currentSnapshot.winRate;
    if(!changed)return;
    const merged=mergeRiotLifeSnapshots(snapshots,[currentSnapshot]);
    try{localStorage.setItem(storageKey,JSON.stringify(merged))}catch{}
    setSnapshots(merged);
    if(memoryMode==='cloud'){
      saveCloudRiotLifeSnapshot({
        playerKey,
        platform,
        gameName:data?.player?.gameName||'Player',
        tagLine:data?.player?.tagLine||'',
        snapshot:currentSnapshot
      }).then(saved=>{if(!saved)setMemoryMode('local')});
    }
  // Persist only meaningful profile-state changes after local/cloud history loads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[memoryReady,playerKey,currentSnapshot.mainContext,currentSnapshot.topChampion,currentSnapshot.rank,currentSnapshot.avgKda,currentSnapshot.winRate]);

  const latestSession=sessions[0]||[];
  const latestSessionDesc=useMemo(()=>{
    if(!latestSession.length)return null;
    const wins=latestSession.filter((m:any)=>m.context==='ARENA'?num(m.placement)>0&&num(m.placement)<=4:!!m.win).length;
    const first=latestSession.slice(0,Math.ceil(latestSession.length/2));
    const second=latestSession.slice(Math.ceil(latestSession.length/2));
    const firstKda=avg(first,'kda'),secondKda=avg(second,'kda');
    const delta=second.length?secondKda-firstKda:0;
    return {
      games:latestSession.length,
      wins,
      winRate:pct(wins,latestSession.length),
      avgKda:avg(latestSession,'kda'),
      duration:formatDuration([...latestSession].sort((a,b)=>playedAt(a)-playedAt(b))),
      trend:latestSession.length>=4?(delta>.35?'subiu':delta<-.35?'caiu':'manteve'):null,
      delta
    };
  },[latestSession]);

  const recentVsOld=useMemo(()=>{
    if(matches.length<6)return null;
    const cut=Math.max(3,Math.floor(matches.length/2));
    const recent=matches.slice(0,cut),old=matches.slice(cut);
    const recentWins=recent.filter((m:any)=>m.context==='ARENA'?num(m.placement)>0&&num(m.placement)<=4:!!m.win).length;
    const oldWins=old.filter((m:any)=>m.context==='ARENA'?num(m.placement)>0&&num(m.placement)<=4:!!m.win).length;
    return {
      recentKda:avg(recent,'kda'),
      oldKda:avg(old,'kda'),
      recentWr:pct(recentWins,recent.length),
      oldWr:pct(oldWins,old.length),
      recentChampion:topBy(recent,(m:any)=>m.champion||''),
      oldChampion:topBy(old,(m:any)=>m.champion||''),
      recentMode:topBy(recent,(m:any)=>m.context||''),
      oldMode:topBy(old,(m:any)=>m.context||'')
    };
  },[matches]);

  const focusedComparison=useMemo(()=>{
    const context=String(data?.summary?.mainContext||'');
    const source=context?matches.filter((m:any)=>String(m?.context||'')===context):matches;
    if(source.length<8)return null;
    const size=Math.min(20,Math.max(4,Math.floor(source.length/2)));
    const recent=source.slice(0,size);
    const previous=source.slice(size,size*2);
    if(previous.length<4)return null;
    const summarize=(rows:any[])=>{
      const positive=rows.filter((m:any)=>m.context==='ARENA'?(num(m.placement)>0&&num(m.placement)<=4):!!m.win).length;
      const placements=rows.map((m:any)=>num(m.placement)).filter((v:number)=>v>0);
      const goldPerMin=rows.map((m:any)=>num(m.duration)>0?num(m.gold)/num(m.duration):0).filter((v:number)=>v>0);
      return {
        games:rows.length,
        result:pct(positive,rows.length),
        kda:avg(rows,'kda'),
        damagePerMin:avg(rows,'damagePerMin'),
        goldPerMin:goldPerMin.length?goldPerMin.reduce((s:number,v:number)=>s+v,0)/goldPerMin.length:0,
        duration:avg(rows,'duration'),
        deaths:avg(rows,'deaths'),
        uniqueChampions:new Set(rows.map((m:any)=>m.champion).filter(Boolean)).size,
        topChampion:topBy(rows,(m:any)=>m.champion||''),
        avgPlacement:placements.length?placements.reduce((s:number,v:number)=>s+v,0)/placements.length:null
      };
    };
    return {context,size,recent:summarize(recent),previous:summarize(previous)};
  },[data?.summary?.mainContext,matches]);

  const arenaPlacement=useMemo(()=>{
    const arena=matches.filter((m:any)=>m.context==='ARENA'&&num(m.placement)>0);
    if(!arena.length)return null;
    const first=arena.filter((m:any)=>num(m.placement)===1).length;
    const top4=arena.filter((m:any)=>num(m.placement)<=4).length;
    const mid=arena.filter((m:any)=>num(m.placement)>=2&&num(m.placement)<=4).length;
    const outside=arena.length-top4;
    return {
      games:arena.length,
      first:pct(first,arena.length),
      mid:pct(mid,arena.length),
      outside:pct(outside,arena.length),
      avg:+(arena.reduce((s:number,m:any)=>s+num(m.placement),0)/arena.length).toFixed(2)
    };
  },[matches]);

  const arenaAugments=useMemo(()=>{
    const arena=matches.filter((m:any)=>m.context==='ARENA'&&Array.isArray(m.augments)&&m.augments.length);
    const map=new Map<number,{id:number,games:number,top4:number,first:number,champions:Map<string,number>}>();
    arena.forEach((match:any)=>{
      const seen=new Set<number>((match.augments||[]).map(Number).filter((id:number)=>id>0));
      seen.forEach(id=>{
        const row=map.get(id)||{id,games:0,top4:0,first:0,champions:new Map<string,number>()};
        row.games++;
        if(num(match.placement)>0&&num(match.placement)<=4)row.top4++;
        if(num(match.placement)===1)row.first++;
        if(match.champion)row.champions.set(match.champion,(row.champions.get(match.champion)||0)+1);
        map.set(id,row);
      });
    });
    return [...map.values()].map(row=>({
      id:row.id,
      games:row.games,
      top4Rate:pct(row.top4,row.games),
      firstRate:pct(row.first,row.games),
      champion:[...row.champions.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||null
    })).sort((a,b)=>b.games-a.games||b.top4Rate-a.top4Rate).slice(0,6);
  },[matches]);

  const itemStory=useMemo(()=>{
    const map=new Map<number,{id:number,games:number,positive:number}>();
    matches.forEach((match:any)=>{
      const seen=new Set<number>((match.items||[]).map(Number).filter((id:number)=>id>0));
      seen.forEach(id=>{
        const row=map.get(id)||{id,games:0,positive:0};
        row.games++;
        if(positiveResult(match))row.positive++;
        map.set(id,row);
      });
    });
    return [...map.values()].map(row=>({...row,resultRate:pct(row.positive,row.games)})).sort((a,b)=>b.games-a.games||b.resultRate-a.resultRate).slice(0,6);
  },[matches]);

  const deepDive=useMemo(()=>{
    const context=String(data?.summary?.mainContext||'');
    const focus=context?matches.filter((m:any)=>String(m?.context||'')===context):matches;
    const safe=focus.length?focus:matches;
    const days=Math.max(1,Math.ceil(((playedAt(safe[0]||{})||Date.now())-(playedAt(safe[safe.length-1]||{})||Date.now()))/86400000)||1);
    const kdas=safe.map((m:any)=>num(m.kda)).filter((v:number)=>Number.isFinite(v));
    const avgKda=meanValues(kdas);
    const kdaDev=deviation(kdas);
    const consistent=kdas.length?pct(kdas.filter((v:number)=>Math.abs(v-avgKda)<=Math.max(.5,avgKda*.25)).length,kdas.length):0;
    const goldPerMin=safe.map((m:any)=>num(m.goldPerMin)>0?num(m.goldPerMin):(num(m.duration)>0?num(m.gold)/num(m.duration):0)).filter((v:number)=>v>0);
    const damages=safe.map((m:any)=>num(m.damagePerMin)).filter((v:number)=>v>0);
    const durations=safe.map((m:any)=>num(m.duration)).filter((v:number)=>v>0);
    const deathValues=safe.map((m:any)=>num(m.deaths));
    const uniqueChampions=new Set(safe.map((m:any)=>m.champion).filter(Boolean));
    const champCounts=new Map<string,number>();
    safe.forEach((m:any)=>{if(m.champion)champCounts.set(m.champion,(champCounts.get(m.champion)||0)+1)});
    const orderedChamps=[...champCounts.entries()].sort((a,b)=>b[1]-a[1]);
    const top5Share=safe.length?pct(orderedChamps.slice(0,5).reduce((sum,row)=>sum+row[1],0),safe.length):0;
    const repeatedChamps=orderedChamps.filter(row=>row[1]>=2).length;
    const currentStreak=currentResultStreak(safe);

    const periodMap=new Map<string,any[]>();
    const dayMap=new Map<string,any[]>();
    safe.forEach((m:any)=>{
      const ts=playedAt(m);if(!ts)return;
      const period=periodOf(ts),day=WEEKDAYS[new Date(ts).getDay()];
      periodMap.set(period,[...(periodMap.get(period)||[]),m]);
      dayMap.set(day,[...(dayMap.get(day)||[]),m]);
    });
    const periodRows=[...periodMap.entries()].map(([name,rows])=>({name,games:rows.length,result:resultRate(rows),kda:avg(rows,'kda')})).sort((a,b)=>b.games-a.games);
    const dayRows=[...dayMap.entries()].map(([name,rows])=>({name,games:rows.length,result:resultRate(rows),kda:avg(rows,'kda')})).sort((a,b)=>b.games-a.games);
    const bestPeriod=[...periodRows].filter(x=>x.games>=3).sort((a,b)=>b.result-a.result||b.kda-a.kda)[0]||periodRows[0]||null;
    const bestDay=[...dayRows].filter(x=>x.games>=3).sort((a,b)=>b.result-a.result||b.kda-a.kda)[0]||dayRows[0]||null;

    const medDuration=median(durations);
    const short=safe.filter((m:any)=>num(m.duration)<=medDuration);
    const long=safe.filter((m:any)=>num(m.duration)>medDuration);
    const kp=safe.map((m:any)=>num(m.killParticipation)).filter((v:number)=>v>0);
    const teamDamageShares=safe.map((m:any)=>num(m.teamDamageShare)).filter((v:number)=>v>0);
    const physicalTotal=safe.reduce((s:number,m:any)=>s+num(m.physicalDamage),0);
    const magicTotal=safe.reduce((s:number,m:any)=>s+num(m.magicDamage),0);
    const trueTotal=safe.reduce((s:number,m:any)=>s+num(m.trueDamage),0);
    const typedDamageTotal=physicalTotal+magicTotal+trueTotal;
    const soloKills=safe.reduce((s:number,m:any)=>s+num(m.soloKills),0);
    const multikills=safe.reduce((s:number,m:any)=>s+num(m.doubleKills)+num(m.tripleKills)+num(m.quadraKills)+num(m.pentaKills),0);
    const pentas=safe.reduce((s:number,m:any)=>s+num(m.pentaKills),0);
    const firstBloods=safe.filter((m:any)=>m.firstBloodKill||m.firstBloodAssist).length;
    const allySupport=safe.reduce((s:number,m:any)=>s+num(m.healsOnTeammates)+num(m.shieldOnTeammates),0);
    const objectives=safe.reduce((s:number,m:any)=>s+num(m.dragonKills)+num(m.baronKills)+num(m.riftHeraldTakedowns)+num(m.objectivesStolen),0);
    const objectiveSteals=safe.reduce((s:number,m:any)=>s+num(m.objectivesStolen),0);
    const wardsPlaced=safe.reduce((s:number,m:any)=>s+num(m.wardsPlaced),0);
    const wardsKilled=safe.reduce((s:number,m:any)=>s+num(m.wardsKilled),0);
    const controlWards=safe.reduce((s:number,m:any)=>s+num(m.controlWards),0);
    const recent10=safe.slice(0,10),previous10=safe.slice(10,20);
    const recentTrend=previous10.length>=5?{
      kdaNow:avg(recent10,'kda'),kdaOld:avg(previous10,'kda'),
      resultNow:resultRate(recent10),resultOld:resultRate(previous10),
      damageNow:avg(recent10,'damagePerMin'),damageOld:avg(previous10,'damagePerMin'),
      champNow:topBy(recent10,(m:any)=>m.champion||''),champOld:topBy(previous10,(m:any)=>m.champion||'')
    }:null;

    return {
      context,games:safe.length,days,
      rhythm:{gamesPerDay:safe.length/days,sessions:sessionize(safe).length,gamesPerSession:sessionize(safe).length?safe.length/sessionize(safe).length:0,activeDays:new Set(safe.map((m:any)=>new Date(playedAt(m)).toDateString())).size},
      consistency:{kdaDev,consistent,avgKda,result:resultRate(safe)},
      damage:{avg:meanValues(damages),peak:damages.length?Math.max(...damages):0,total:meanValues(safe.map((m:any)=>num(m.damage)).filter((v:number)=>v>0)),teamShare:meanValues(teamDamageShares),physical:typedDamageTotal?pct(physicalTotal,typedDamageTotal):0,magic:typedDamageTotal?pct(magicTotal,typedDamageTotal):0,trueDamage:typedDamageTotal?pct(trueTotal,typedDamageTotal):0},
      economy:{goldPerMin:meanValues(goldPerMin),gold:avg(safe,'gold'),spent:avg(safe,'goldSpent'),csPerMin:avg(safe.filter((m:any)=>num(m.csPerMin)>0),'csPerMin')},
      survival:{deaths:meanValues(deathValues),taken:avg(safe,'damageTaken'),healing:avg(safe,'healing'),mitigated:avg(safe,'damageMitigated'),cc:avg(safe,'ccSeconds'),timeDead:avg(safe,'timeSpentDead'),longestLiving:Math.max(0,...safe.map((m:any)=>num(m.longestTimeLiving)))},
      pool:{unique:uniqueChampions.size,top5Share,repeated:repeatedChamps,most:orderedChamps[0]?.[0]||'—'},
      streaks:{best:longestResultStreak(safe,true),worst:longestResultStreak(safe,false),current:currentStreak},
      periods:{most:periodRows[0]||null,best:bestPeriod,rows:periodRows},
      daysOfWeek:{most:dayRows[0]||null,best:bestDay,rows:dayRows},
      duration:{median:medDuration,shortRate:resultRate(short),longRate:resultRate(long),shortGames:short.length,longGames:long.length},
      impact:{kp:meanValues(kp),turret:avg(safe,'turretDamage'),taken:avg(safe,'damageTaken'),healing:avg(safe,'healing'),soloKills,multikills,pentas,firstBloods,allySupport,objectives,objectiveSteals,objectiveDamage:avg(safe,'objectiveDamage'),wardsPlaced,wardsKilled,controlWards},
      trend:recentTrend
    };
  },[data?.summary?.mainContext,matches,sessions]);

  const personalMeta=useMemo(()=>{
    const map=new Map<string,{name:string;games:number;wins:number;kda:number;contexts:Set<string>}>();
    matches.forEach((m:any)=>{
      const name=m.champion||'Desconhecido';
      const row=map.get(name)||{name,games:0,wins:0,kda:0,contexts:new Set<string>()};
      row.games++;row.kda+=num(m.kda);
      if(m.context==='ARENA'?(num(m.placement)>0&&num(m.placement)<=4):!!m.win)row.wins++;
      if(m.context)row.contexts.add(m.context);
      map.set(name,row);
    });
    return [...map.values()].map(x=>({...x,avgKda:x.games?x.kda/x.games:0,winRate:pct(x.wins,x.games)}))
      .filter(x=>x.games>=2)
      .sort((a,b)=>(b.winRate-a.winRate)||(b.games-a.games)||(b.avgKda-a.avgKda))[0]||null;
  },[matches]);

  const latest=matches[0]||null;
  const latestChampion=latest?champions?.[latest.champion]:null;
  const firstSnapshot=snapshots[0]||null;
  const snapshotDelta=firstSnapshot&&snapshots.length>1?{
    visits:snapshots.length,
    kda:firstSnapshot.avgKda!=null&&currentSnapshot.avgKda!=null?currentSnapshot.avgKda-firstSnapshot.avgKda:null,
    winRate:firstSnapshot.winRate!=null&&currentSnapshot.winRate!=null?currentSnapshot.winRate-firstSnapshot.winRate:null,
    modeChanged:firstSnapshot.mainContext&&firstSnapshot.mainContext!==currentSnapshot.mainContext,
    championChanged:firstSnapshot.topChampion&&firstSnapshot.topChampion!==currentSnapshot.topChampion,
    since:firstSnapshot.at
  }:null;

  const passportRank=rankLabel(data?.ranked||[]);
  const masteryTop=data?.mastery?.[0];
  const masteryChampion=masteryTop?champions?.[String(masteryTop.championId)]:null;
  const oldestMatch=matches[matches.length-1];
  const sampleDays=oldestMatch&&latest?Math.max(0,Math.ceil((playedAt(latest)-playedAt(oldestMatch))/86400000)):0;
  const daysSinceLatest=latest?Math.max(0,Math.floor((Date.now()-playedAt(latest))/86400000)):0;
  const windowStart=oldestMatch?formatDate(playedAt(oldestMatch)):'—';
  const windowEnd=latest?formatDate(playedAt(latest)):'—';
  const modeDistribution=useMemo(()=>{
    const rows=(data?.modeSummaries||[]).map((m:any)=>({name:m.name||'OUTRO',games:Number(m.games||0)})).filter((m:any)=>m.games>0);
    const total=rows.reduce((sum:number,row:any)=>sum+row.games,0)||matches.length||1;
    return rows.sort((a:any,b:any)=>b.games-a.games).slice(0,4).map((row:any)=>({...row,share:Math.round(row.games/total*100)}));
  },[data,matches.length]);
  const signatureTop=(data?.championSummaries||[]).slice(0,5);
  const masteryStory=useMemo(()=>{
    const rows=(data?.mastery||[]).slice(0,5).map((m:any,index:number)=>{
      const champion=champions?.[String(m.championId)]||null;
      const name=champion?.name||('Campeão '+m.championId);
      const recent=matches.filter((match:any)=>match.champion===name);
      return {
        rank:index+1,
        championId:m.championId,
        champion,
        name,
        level:Number(m.level||0),
        points:Number(m.points||0),
        lastPlayTime:Number(m.lastPlayTime||0),
        recentGames:recent.length,
        recentShare:matches.length?Math.round(recent.length/matches.length*100):0,
        recentKda:recent.length?avg(recent,'kda'):0,
        recentResult:recent.length?resultRate(recent):null
      };
    });
    const totalPoints=rows.reduce((sum:number,row:any)=>sum+row.points,0);
    const recentMasteryGames=rows.reduce((sum:number,row:any)=>sum+row.recentGames,0);
    const top=rows[0]||null;
    const recentTop=signatureTop[0]?.name||null;
    const alignment=top&&recentTop?top.name===recentTop?'ALINHADA':'FASE DIFERENTE':'SEM COMPARAÇÃO';
    return {
      rows,
      top,
      totalPoints,
      recentMasteryGames,
      recentMasteryShare:matches.length?Math.round(recentMasteryGames/matches.length*100):0,
      alignment,
      recentTop
    };
  },[data?.mastery,champions,matches,signatureTop]);
  const recentCompare=recentVsOld?[
    {label:'KDA',recent:recentVsOld.recentKda,old:recentVsOld.oldKda,format:(v:number)=>v.toFixed(2)},
    {label:'RESULTADO',recent:recentVsOld.recentWr,old:recentVsOld.oldWr,format:(v:number)=>Math.round(v)+'%'}
  ]:[];

  const currentMode=data?.modeSummaries?.find((m:any)=>m.name===data?.summary?.mainContext)||null;
  const currentContextArt=contextArtwork(data?.summary?.mainContext||currentMode?.name);
  const currentMetric=currentMode?.name==='ARENA'
    ?{label:'TOP 4',value:currentMode?.top4Rate!=null?currentMode.top4Rate+'%':'—'}
    :{label:'RESULTADO',value:currentMode?.winRate!=null?currentMode.winRate+'%':data?.summary?.winRate!=null?data.summary.winRate+'%':'—'};
  const currentModeGames=Number(currentMode?.games||matches.filter((m:any)=>m.context===data?.summary?.mainContext).length||0);
  const signature=data?.championSummaries?.[0]||null;
  const signatureChampion=signature?champions?.[signature.name]:null;
  const signatureShare=signature&&matches.length?Math.round(Number(signature.games||0)/matches.length*100):0;
  const peakMatch=useMemo(()=>[...matches].sort((a:any,b:any)=>num(b?.kda)-num(a?.kda))[0]||null,[matches]);
  const peakFacts=useMemo(()=>peakMatch?[
    {label:'DANO / MIN',value:peakMatch.damagePerMin?Math.round(num(peakMatch.damagePerMin)).toLocaleString('pt-BR'):'—'},
    {label:'DANO TOTAL',value:peakMatch.damage?Math.round(num(peakMatch.damage)).toLocaleString('pt-BR'):'—'},
    {label:'OURO',value:peakMatch.gold?Math.round(num(peakMatch.gold)).toLocaleString('pt-BR'):'—'},
    {label:'PARTICIPAÇÃO',value:peakMatch.killParticipation!=null?Math.round(num(peakMatch.killParticipation))+'%':'—'}
  ]:[],[peakMatch]);
  const peakChampion=peakMatch?champions?.[peakMatch.champion]:null;
  const sampleLabel=sampleDays>0?sampleDays+' '+(sampleDays===1?'dia':'dias'):'janela recente';
  const changeTitle=snapshotDelta
    ?(snapshotDelta.modeChanged||snapshotDelta.championChanged?'SUA HISTÓRIA MUDOU ENTRE AS VISITAS.':'SUA MEMÓRIA JÁ COMEÇOU A CRESCER.')
    :recentVsOld
      ?(recentVsOld.recentChampion!==recentVsOld.oldChampion?'SEU FOCO MUDOU DENTRO DESTA JANELA.':'A FASE RECENTE NÃO É IGUAL À ANTERIOR.')
      :'AINDA É CEDO PARA MEDIR UMA MUDANÇA.';
  const recentKdaDelta=recentVsOld?recentVsOld.recentKda-recentVsOld.oldKda:null;
  const recentResultDelta=recentVsOld?recentVsOld.recentWr-recentVsOld.oldWr:null;
  const sampleQuality=matches.length>=90?'HISTÓRIA FORTE':matches.length>=60?'BOA AMOSTRA':matches.length>=30?'EM FORMAÇÃO':'AMOSTRA INICIAL';
  const chapterIndex=Math.max(0,RIOT_CHAPTERS.findIndex(([id])=>id===activeChapter));
  const readingProgress=Math.round(((chapterIndex+1)/RIOT_CHAPTERS.length)*100);
  const requestedDepth=Number(data?.cache?.requested||100);
  const availableDepth=Number(data?.cache?.availableIds||matches.length);
  const pendingDepth=Math.max(0,Number(data?.cache?.pending||0));
  const sampleWarning=pendingDepth>0
    ?matches.length+' partidas já carregadas de '+Math.max(availableDepth,requestedDepth)+' solicitadas. O restante entra conforme o limite temporário da Riot permite.'
    :matches.length<30?'Amostra pequena: trate padrões como sinais iniciais.':matches.length<75?'Amostra em formação: a leitura fica mais confiável conforme o histórico cresce.':'Amostra suficiente para padrões recentes com melhor contexto.';

  return <section className="riotStory" aria-label="Riot Life em capítulos">
    <header className="riotStoryIntro">
      <div>
        <small>ZEROTWO // RIOT LIFE</small>
        <h2>ISTO NÃO É UM DASHBOARD.<br/><span>É A SUA HISTÓRIA RECENTE.</span></h2>
        <p>{matches.length} partidas disponíveis organizadas em <strong>20 capítulos</strong>. O ZeroTwo pode aprofundar esta Riot Life até 100 partidas e extrair comparativos diferentes sem despejar o histórico bruto inteiro na tela.</p>
      </div>
      <div className="riotStoryCoverage">
        <span><small>AMOSTRA</small><b>{matches.length}</b><em>partidas</em></span>
        <span><small>JANELA</small><b>{sampleDays||'—'}</b><em>{sampleDays===1?'dia':'dias'}</em></span>
        <span><small>MEMÓRIA</small><b>{Math.max(1,snapshots.length)}</b><em>{memoryMode==='cloud'?'cloud':memoryMode==='checking'?'sync':'local'}</em></span>
        <span><small>QUALIDADE</small><b className="sampleQualityValue">{sampleQuality}</b><em>{matches.length}/{requestedDepth} analisadas</em></span>
      </div>
      <div className="riotSampleNote" data-tone={matches.length<30?'low':matches.length<75?'mid':'good'}><Icon name="status"/><span><b>{sampleQuality}</b><small>{sampleWarning}</small></span></div>
    </header>

    <nav className="riotStoryNav" aria-label="Capítulos da Riot Life">
      {RIOT_CHAPTERS.map(([id,label],index)=><a key={id} href={'#'+id} className={activeChapter===id?'active':''} aria-current={activeChapter===id?'step':undefined}><span>{String(index+1).padStart(2,'0')}</span><b>{label}</b></a>)}
      <i className="riotStoryProgress" aria-hidden="true"><span style={{width:readingProgress+'%'}}/></i>
      <small className="riotStoryReadout">{readingProgress}% · ~5 min de leitura</small>
    </nav>

    <div className="riotStoryFlow">
      <section id="riot-now" className="riotChapter riotChapterNow">
        {currentContextArt&&<img className="riotNarrativeArt riotNarrativeArtMode" loading="eager" decoding="async" src={currentContextArt} alt="" aria-hidden="true"/>}
        {currentContextArt&&<div className="riotNarrativeShade"/>}
        <div className="riotChapterNumber">01</div>
        <div className="riotChapterCopy">
          <small>AGORA // O PALCO DESTA FASE</small>
          <h3>{data?.summary?.mainContext||'SEU CONTEXTO'} <span>É ONDE SUA HISTÓRIA ESTÁ ACONTECENDO.</span></h3>
          <p>{currentModeGames>0?currentModeGames+' de '+matches.length+' partidas desta janela vieram desse contexto.':'Este é o contexto mais presente entre as partidas disponíveis.'} O número ao lado pertence só a este capítulo.</p><small className="chapterSource">FONTE // RIOT MATCH-V5 · {matches.length} partidas observadas</small>
          <div className="riotNowMeta"><span><small>PERÍODO</small><b>{windowStart} → {windowEnd}</b></span><span><small>ÚLTIMA PARTIDA</small><b>{daysSinceLatest===0?'hoje':daysSinceLatest+'d atrás'}</b></span></div>
          {modeDistribution.length>0&&<div className="riotModeDistribution" aria-label="Distribuição dos modos jogados">{modeDistribution.map((mode:any)=><span key={mode.name}><i style={{width:mode.share+'%'}}/><b>{mode.name}</b><em>{mode.games} · {mode.share}%</em></span>)}</div>}
        </div>
        <div className="riotChapterHeroMetric">
          <b>{currentMetric.value}</b>
          <span>{currentMetric.label}</span>
          <em>{sampleLabel}</em>
        </div>
      </section>

      {latest&&daysSinceLatest>=14&&<aside className="riotStoryInterlude returningPlayer">
        <div className="returningSignal"><span>{daysSinceLatest}</span><small>DIAS</small></div>
        <div><small>INTERLÚDIO // RETORNO</small><b>{daysSinceLatest>=60?'VOCÊ VOLTOU DEPOIS DE UMA PAUSA LONGA.':'HOUVE UMA PAUSA ENTRE VOCÊ E O LEAGUE.'}</b><p>A última partida observada foi em <strong>{formatDate(playedAt(latest))}</strong>. Isso muda a forma de ler os capítulos seguintes.</p></div>
      </aside>}

      {signature&&<section id="riot-signature" className="riotChapter riotChapterSignature">
        {signatureChampion&&<img className="riotChapterArt riotChapterArtSignature" loading="lazy" decoding="async" src={'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/'+signatureChampion.id+'_0.jpg'} alt=""/>}
        <div className="riotChapterShade"/>
        <div className="riotChapterNumber">02</div>
        <div className="riotChapterCopy">
          <small>ASSINATURA // QUEM MAIS APARECEU</small>
          <h3>{signature.name}<span> MARCOU ESTA FASE.</span></h3>
          <p>Não é “seu melhor campeão”. É simplesmente quem mais apareceu nesta janela: <strong>{signature.games} de {matches.length} partidas</strong>.</p><small className="chapterSource">FATO // frequência observada na amostra, não avaliação de habilidade</small>
          {signatureTop.length>1&&<div className="signatureTopList signatureTopRich" aria-label="Campeões mais presentes">{signatureTop.map((champ:any,index:number)=><span key={champ.name}><i>{index+1}</i><b>{champ.name}</b><em>{champ.games}x{champ.top4Rate!=null?' · Top 4 '+champ.top4Rate+'%':champ.winRate!=null?' · '+champ.winRate+'% WR':''}</em><small>KDA {num(champ.avgKda).toFixed(2)}{champ.avgDamagePerMin?' · '+Math.round(num(champ.avgDamagePerMin)).toLocaleString('pt-BR')+' dano/min':''}</small></span>)}</div>}
        </div>
        <div className="riotChapterHeroMetric">
          <b>{signatureShare}%</b>
          <span>DA AMOSTRA</span>
          <em>{signature.contexts?.join(' · ')||data?.summary?.mainContext||'recente'}</em>
        </div>
      </section>}

      <section id="riot-session" className="riotChapter riotChapterSession">
        <img className="riotNarrativeArt riotNarrativeArtSession" loading="lazy" decoding="async" src={STORY_ART.session} alt="" aria-hidden="true"/>
        <div className="riotNarrativeShade"/>
        <div className="riotChapterNumber">03</div>
        <div className="riotChapterCopy">
          <small>SESSÃO // COMO VOCÊ JOGOU DE UMA VEZ</small>
          <h3>{latestSessionDesc?latestSessionDesc.games+' '+(latestSessionDesc.games===1?'PARTIDA':'PARTIDAS')+' NA ÚLTIMA SESSÃO.':'AINDA NÃO HÁ UMA SESSÃO CLARA.'}</h3>
          <p>{latestSessionDesc?.trend?'Entre o começo e o fim, seu ritmo de KDA '+latestSessionDesc.trend+'.':'Sessões são agrupadas quando as partidas ficam próximas no tempo. Precisamos de uma sequência maior para falar de ritmo interno.'}</p><small className="chapterSource">MÉTODO // partidas separadas por até 2 horas entram na mesma sessão</small>
          {latestSession.length>0&&<div className="sessionTimeline" aria-label="Linha do tempo da última sessão">{[...latestSession].sort((a:any,b:any)=>playedAt(a)-playedAt(b)).map((match:any,index:number)=><span key={match.id||index} data-win={match.context==='ARENA'?(num(match.placement)>0&&num(match.placement)<=4):!!match.win}><i/><b>{match.champion||match.context||'Jogo'}</b><em>{match.context==='ARENA'&&match.placement?match.placement+'º':match.win?'V':'D'}</em></span>)}</div>}
        </div>
        {latestSessionDesc&&<div className="riotSessionFacts">
          <span><small>DURAÇÃO</small><b>{latestSessionDesc.duration}</b></span>
          <span><small>RESULTADO</small><b>{latestSessionDesc.winRate}%</b></span>
          <span><small>JOGOS</small><b>{latestSessionDesc.games}</b></span>
          <span><small>KDA MÉDIO</small><b>{latestSessionDesc.avgKda.toFixed(2)}</b></span>
        </div>}
      </section>

      {peakMatch&&<section id="riot-peak" className="riotChapter riotChapterPeak">
        {peakChampion&&<img className="riotChapterArt riotChapterArtPeak" loading="lazy" decoding="async" src={'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/'+peakChampion.id+'_0.jpg'} alt=""/>}
        <div className="riotChapterShade"/>
        <div className="riotChapterNumber">04</div>
        <div className="riotChapterCopy">
          <small>PONTO ALTO // UMA PARTIDA</small>
          <h3>{peakMatch.champion||'UMA PARTIDA'} <span>FOI SEU MAIOR KDA DESTA JANELA.</span></h3>
          <p>{formatDate(playedAt(peakMatch))} · {peakMatch.context||'League'} · {peakMatch.kills}/{peakMatch.deaths}/{peakMatch.assists}. Aqui o KDA aparece uma única vez porque esta seção é sobre a partida que mais se destacou por esse critério.</p><small className="chapterSource">CRITÉRIO // maior KDA dentro da janela atual, não “melhor partida” absoluta</small>
          <div className="peakFactGrid">{peakFacts.map((fact:any)=><span key={fact.label}><small>{fact.label}</small><b>{fact.value}</b></span>)}</div>
        </div>
        <div className="riotChapterHeroMetric">
          <b>{peakMatch.kda??'—'}</b>
          <span>KDA</span>
          <em>{peakMatch.duration??'—'} min</em>
        </div>
      </section>}

      <section id="riot-change" className="riotChapterGroup riotChapterChange">
        <div className="riotChapterGroupIntro riotGroupIntroArt">
          <img className="riotGroupArtwork" loading="lazy" decoding="async" src={STORY_ART.change} alt="" aria-hidden="true"/>
          <div className="riotGroupArtworkShade"/>
          <span className="riotChapterNumber">05</span>
          <div><small>MUDANÇA // O QUE NÃO É MAIS IGUAL</small><h3>{changeTitle}</h3><p>Este capítulo não repete seus números atuais; ele mostra apenas diferenças entre momentos comparáveis.</p>{recentCompare.length>0&&<div className="riotBeforeAfter">{recentCompare.map((row:any)=>{const max=Math.max(Math.abs(row.old),Math.abs(row.recent),.01);return <span key={row.label}><small>{row.label}</small><div className="compareBars"><i><label>ANTES</label><em style={{width:Math.max(6,Math.abs(row.old)/max*100)+'%'}}/></i><i className="recent"><label>AGORA</label><em style={{width:Math.max(6,Math.abs(row.recent)/max*100)+'%'}}/></i></div><b>{row.format(row.old)} → {row.format(row.recent)}</b></span>})}</div>}</div>
          <div className="riotChangeFacts">
            {snapshotDelta?.kda!=null&&Math.abs(snapshotDelta.kda)>=.1&&<span><small>KDA DESDE A PRIMEIRA MEMÓRIA</small><b>{snapshotDelta.kda>0?'+':''}{snapshotDelta.kda.toFixed(2)}</b></span>}
            {snapshotDelta?.winRate!=null&&Math.abs(snapshotDelta.winRate)>=1&&<span><small>RESULTADO DESDE A PRIMEIRA MEMÓRIA</small><b>{snapshotDelta.winRate>0?'+':''}{snapshotDelta.winRate.toFixed(0)} p.p.</b></span>}
            {!snapshotDelta&&recentKdaDelta!=null&&<span><small>KDA RECENTE VS. ANTERIOR</small><b>{recentKdaDelta>=0?'+':''}{recentKdaDelta.toFixed(2)}</b></span>}
            {!snapshotDelta&&recentResultDelta!=null&&<span><small>RESULTADO RECENTE VS. ANTERIOR</small><b>{recentResultDelta>=0?'+':''}{recentResultDelta} p.p.</b></span>}
          </div>
        </div>
        {focusedComparison&&<section className="riotWindowCompare">
          <header><div><small>COMPARATIVO // {focusedComparison.context||'JANELA'}</small><h4>{focusedComparison.size} RECENTES VS. {focusedComparison.size} ANTERIORES</h4><p>Mesma janela e mesmo contexto principal para reduzir comparações injustas entre modos diferentes.</p></div><span><b>{focusedComparison.recent.topChampion||'—'}</b><small>campeão mais presente agora</small></span></header>
          <div className="riotCompareGrid">
            {[
              {label:'KDA',old:focusedComparison.previous.kda,now:focusedComparison.recent.kda,fmt:(v:number)=>v.toFixed(2)},
              {label:focusedComparison.context==='ARENA'?'TOP 4':'RESULTADO',old:focusedComparison.previous.result,now:focusedComparison.recent.result,fmt:(v:number)=>Math.round(v)+'%'},
              {label:'DANO / MIN',old:focusedComparison.previous.damagePerMin,now:focusedComparison.recent.damagePerMin,fmt:(v:number)=>Math.round(v).toLocaleString('pt-BR')},
              {label:'OURO / MIN',old:focusedComparison.previous.goldPerMin,now:focusedComparison.recent.goldPerMin,fmt:(v:number)=>Math.round(v).toLocaleString('pt-BR')},
              {label:'MORTES / JOGO',old:focusedComparison.previous.deaths,now:focusedComparison.recent.deaths,fmt:(v:number)=>v.toFixed(1)},
              {label:'DURAÇÃO',old:focusedComparison.previous.duration,now:focusedComparison.recent.duration,fmt:(v:number)=>Math.round(v)+' min'}
            ].map((row:any)=>{
              const delta=row.now-row.old;
              const tone=Math.abs(delta)<.01?'flat':delta>0?'up':'down';
              return <article key={row.label} data-tone={tone}><small>{row.label}</small><div><span><em>ANTES</em><b>{row.fmt(row.old)}</b></span><i>→</i><span><em>AGORA</em><b>{row.fmt(row.now)}</b></span></div><p>{delta===0?'sem mudança':(delta>0?'+':'')+(row.label==='KDA'?delta.toFixed(2):row.label==='TOP 4'||row.label==='RESULTADO'?delta.toFixed(0)+' p.p.':row.label==='MORTES / JOGO'?delta.toFixed(1):row.label==='DURAÇÃO'?Math.round(delta)+' min':Math.round(delta).toLocaleString('pt-BR'))}</p></article>
            })}
          </div>
          <div className="riotCompareMeta">
            <span><small>CAMPEÕES DIFERENTES</small><b>{focusedComparison.previous.uniqueChampions} → {focusedComparison.recent.uniqueChampions}</b></span>
            <span><small>MAIS JOGADO</small><b>{focusedComparison.previous.topChampion||'—'} → {focusedComparison.recent.topChampion||'—'}</b></span>
            {focusedComparison.context==='ARENA'&&focusedComparison.previous.avgPlacement!=null&&focusedComparison.recent.avgPlacement!=null&&<span><small>COLOCAÇÃO MÉDIA</small><b>{focusedComparison.previous.avgPlacement.toFixed(2)} → {focusedComparison.recent.avgPlacement.toFixed(2)}</b></span>}
          </div>

        </section>}
        <PlayerEras data={data} champions={champions} ddv={ddv}/>
      </section>

      <section id="riot-people" className="riotChapterGroup riotChapterPeople">
        <div className="riotChapterGroupIntro riotGroupIntroArt">
          <img className="riotGroupArtwork" loading="lazy" decoding="async" src={STORY_ART.people} alt="" aria-hidden="true"/>
          <div className="riotGroupArtworkShade"/>
          <span className="riotChapterNumber">06</span>
          <div><small>PESSOAS // QUEM SE REPETE</small><h3>ALGUNS NOMES VOLTAM A APARECER.</h3><p>Aqui não tentamos medir amizade ou “sinergia”. Só mostramos quem realmente se repetiu nas partidas analisadas.</p><small className="chapterSource">FONTE // participantes do Match-V5; recorrência não significa amizade ou causalidade</small></div>
        </div>
        <FrequentTeammates data={data} platform={platform}/>
      </section>

      <DeepDiveChapter id="riot-rhythm" number="07" art={z2Art('COM QUE RITMO VOCÊ ESTÁ JOGANDO.png')} kicker="RITMO // FREQUÊNCIA" title="COM QUE RITMO VOCÊ ESTÁ JOGANDO?" copy="A frequência ajuda a separar uma fase intensa de uma janela espalhada no tempo. Não mede qualidade; mede presença." metrics={[
        {label:'JOGOS / DIA',value:deepDive.rhythm.gamesPerDay.toFixed(1),note:deepDive.days+' dias de janela'},
        {label:'SESSÕES',value:deepDive.rhythm.sessions,note:'intervalo de até 2h'},
        {label:'JOGOS / SESSÃO',value:deepDive.rhythm.gamesPerSession.toFixed(1)},
        {label:'DIAS ATIVOS',value:deepDive.rhythm.activeDays}
      ]}/>

      <DeepDiveChapter id="riot-consistency" number="08" art={z2Art('SEUS RESULTADOS OSCILAM OU SE REPETEM.png')} kicker="CONSISTÊNCIA // VARIAÇÃO" title="SEUS RESULTADOS OSCILAM OU SE REPETEM?" copy="Comparamos a dispersão do seu KDA e a frequência de partidas próximas da sua própria média. Isso mede regularidade, não habilidade." metrics={[
        {label:'KDA MÉDIO',value:deepDive.consistency.avgKda.toFixed(2)},
        {label:'DESVIO DE KDA',value:deepDive.consistency.kdaDev.toFixed(2),note:'quanto menor, mais estável'},
        {label:'PERTO DA MÉDIA',value:deepDive.consistency.consistent+'%',note:'dentro de ±25% ou 0,5'},
        {label:deepDive.context==='ARENA'?'TOP 4':'RESULTADO',value:deepDive.consistency.result+'%'}
      ]}/>

      <DeepDiveChapter id="riot-damage" number="09" art={z2Art('QUANTO DANO SUA FASE ESTÁ PRODUZINDO.png')} secondaryArt={z2Art('QUANTO DANO SUA FASE ESTÁ PRODUZINDO (2).png')} kicker="DANO // PRESSÃO" title="QUANTO DANO SUA FASE ESTÁ PRODUZINDO?" copy="Além do dano bruto, agora usamos a participação no dano da equipe e a composição físico/mágico/verdadeiro quando o Match-V5 fornece esses campos." metrics={[
        {label:'DANO / MIN',value:Math.round(deepDive.damage.avg).toLocaleString('pt-BR')},
        {label:'PICO / MIN',value:Math.round(deepDive.damage.peak).toLocaleString('pt-BR')},
        {label:'DANO / PARTIDA',value:Math.round(deepDive.damage.total).toLocaleString('pt-BR')},
        {label:'% DO DANO DO TIME',value:deepDive.damage.teamShare?deepDive.damage.teamShare.toFixed(1)+'%':'—'}
      ]}>
        <div className="damageTypeBars">
          <span><label>FÍSICO</label><i><em style={{width:deepDive.damage.physical+'%'}}/></i><b>{deepDive.damage.physical}%</b></span>
          <span><label>MÁGICO</label><i><em style={{width:deepDive.damage.magic+'%'}}/></i><b>{deepDive.damage.magic}%</b></span>
          <span><label>VERDADEIRO</label><i><em style={{width:deepDive.damage.trueDamage+'%'}}/></i><b>{deepDive.damage.trueDamage}%</b></span>
        </div>
      </DeepDiveChapter>

      <DeepDiveChapter id="riot-economy" number="10" art={z2Art('QUANTO RECURSO VOCÊ TRANSFORMA POR MINUTO.png')} kicker="ECONOMIA // RECURSOS" title="QUANTO RECURSO VOCÊ TRANSFORMA POR MINUTO?" copy="Ouro por minuto agora usa o valor oficial do Match-V5 quando disponível. Também mostramos os itens que mais se repetem na janela." metrics={[
        {label:'OURO / MIN',value:Math.round(deepDive.economy.goldPerMin).toLocaleString('pt-BR')},
        {label:'OURO / JOGO',value:Math.round(deepDive.economy.gold).toLocaleString('pt-BR')},
        {label:'OURO GASTO / JOGO',value:Math.round(deepDive.economy.spent).toLocaleString('pt-BR')},
        ...(deepDive.economy.csPerMin>0?[{label:'CS / MIN',value:deepDive.economy.csPerMin.toFixed(1),note:'Summoner’s Rift'}]:[])
      ]}>
        {itemStory.length>0&&<div className="commonItems"><small>ITENS MAIS RECORRENTES</small><div>{itemStory.map((item:any)=><span key={item.id}><img loading="lazy" src={'https://ddragon.leagueoflegends.com/cdn/'+ddv+'/img/item/'+item.id+'.png'} alt={'Item '+item.id}/><b>{item.games}x</b><em>{item.resultRate}% resultado</em></span>)}</div></div>}
      </DeepDiveChapter>

      <DeepDiveChapter id="riot-survival" number="11" art={z2Art('QUANTO CUSTA FICAR VIVO NESSA FASE.png')} kicker="SOBREVIVÊNCIA // TROCAS" title="QUANTO CUSTA FICAR VIVO NESSA FASE?" copy="Mortes, mitigação, controle e tempo fora da luta contextualizam melhor o KDA do que olhar apenas abates e mortes." metrics={[
        {label:'MORTES / JOGO',value:deepDive.survival.deaths.toFixed(1)},
        {label:'DANO RECEBIDO',value:Math.round(deepDive.survival.taken).toLocaleString('pt-BR')},
        {label:'DANO MITIGADO',value:Math.round(deepDive.survival.mitigated).toLocaleString('pt-BR')},
        {label:'CC / JOGO',value:Math.round(deepDive.survival.cc)+' s'},
        {label:'CURA / JOGO',value:Math.round(deepDive.survival.healing).toLocaleString('pt-BR')},
        {label:'TEMPO MORTO / JOGO',value:Math.round(deepDive.survival.timeDead/60)+' min'},
        {label:'MAIOR TEMPO VIVO',value:Math.round(deepDive.survival.longestLiving/60)+' min'}
      ]}/>

      <section id="riot-mastery" className="riotMasteryChapter hasArt">
        <img className="riotMasteryArtwork" loading="lazy" decoding="async" src={z2Art('CARREGA SUA MAIOR MAESTRIA.png')} alt="" aria-hidden="true"/>
        <div className="riotMasteryArtShade"/>
        <span className="riotChapterNumber">12</span>
        <div className="riotMasteryCopy">
          <small>MAESTRIA // HISTÓRIA ACUMULADA</small>
          <h3>{masteryStory.top?masteryStory.top.name+' CARREGA SUA MAIOR MAESTRIA.':'AINDA NÃO HÁ MAESTRIA DISPONÍVEL.'}</h3>
          <p>{masteryStory.top
            ?'Maestria conta a experiência acumulada ao longo da conta. A Riot Life cruza isso com as '+matches.length+' partidas recentes para mostrar se seu legado ainda aparece na fase atual.'
            :'Quando a Riot disponibilizar dados de Champion Mastery para esta conta, eles entram aqui sem misturar experiência histórica com desempenho recente.'}</p>
          <small className="chapterSource">FONTE // RIOT CHAMPION-MASTERY-V4 · forma recente // MATCH-V5</small>
        </div>
        <div className="riotMasterySummary">
          <span><small>MAIOR MAESTRIA</small><b>{masteryStory.top?masteryStory.top.points.toLocaleString('pt-BR'):'—'}</b><em>{masteryStory.top?'nível '+masteryStory.top.level:'sem dados'}</em></span>
          <span><small>FASE RECENTE</small><b>{masteryStory.recentTop||'—'}</b><em>campeão mais presente</em></span>
          <span><small>RELAÇÃO</small><b>{masteryStory.alignment}</b><em>{masteryStory.top&&masteryStory.recentTop&&masteryStory.top.name!==masteryStory.recentTop?masteryStory.top.name+' → '+masteryStory.recentTop:'história e fase atual'}</em></span>
          <span><small>TOP 5 NA AMOSTRA</small><b>{masteryStory.recentMasteryShare}%</b><em>{masteryStory.recentMasteryGames} de {matches.length} partidas</em></span>
        </div>
        {masteryStory.rows.length>0?<div className="riotMasteryList">{masteryStory.rows.map((row:any)=><article key={row.championId} className={row.rank===1?'featured':''}>
          <span className="masteryRank">{String(row.rank).padStart(2,'0')}</span>
          {row.champion&&<img loading="lazy" decoding="async" src={'https://ddragon.leagueoflegends.com/cdn/'+ddv+'/img/champion/'+row.champion.id+'.png'} alt={row.name}/>}
          <div className="masteryIdentity"><small>MAESTRIA {row.level}</small><b>{row.name}</b><em>{row.points.toLocaleString('pt-BR')} pontos</em></div>
          <div className="masteryRecent"><small>NESTA RIOT LIFE</small><b>{row.recentGames}x</b><em>{row.recentGames?row.recentShare+'% da amostra':'não apareceu'}</em></div>
          <div className="masteryRecent"><small>KDA RECENTE</small><b>{row.recentGames?row.recentKda.toFixed(2):'—'}</b><em>{row.recentResult!=null?(deepDive.context==='ARENA'?'Top 4 ':'resultado ')+row.recentResult+'%':'sem amostra recente'}</em></div>
          <div className="masteryLast"><small>ÚLTIMO REGISTRO</small><b>{row.lastPlayTime?formatDate(row.lastPlayTime):'—'}</b></div>
        </article>)}</div>:<div className="riotMasteryEmpty">Nenhum dado de maestria foi retornado pela Riot para esta consulta.</div>}
        <div className="riotMasteryPool hasArt"><img className="riotMasteryPoolArt" loading="lazy" decoding="async" src={z2Art('VOCÊ ESTÁ REPETINDO OU EXPLORANDO CAMPEÕES.png')} alt="" aria-hidden="true"/><span><small>POOL RECENTE</small><b>{deepDive.pool.unique} campeões únicos</b></span><span><small>CONCENTRAÇÃO</small><b>Top 5 = {deepDive.pool.top5Share}%</b></span><span><small>REPETIÇÃO</small><b>{deepDive.pool.repeated} usados 2+ vezes</b></span></div>
      </section>

      <DeepDiveChapter id="riot-arena" number="13" art={z2Art('ONDE SUAS ARENAS ESTÃO TERMINANDO.png')} kicker="ARENA // COLOCAÇÕES" title={arenaPlacement?"ONDE SUAS ARENAS ESTÃO TERMINANDO?":"AINDA NÃO HÁ ARENAS SUFICIENTES NESTA JANELA."} copy={arenaPlacement?"Distribuição das colocações dentro da amostra Arena. Top 4 é usado como resultado positivo, mas 1º lugar continua separado.":"Este capítulo fica reservado para colocação média, Top 4 e primeiros lugares quando partidas de Arena entrarem na amostra."} metrics={arenaPlacement?[
        {label:'ARENAS',value:arenaPlacement.games},
        {label:'COLOCAÇÃO MÉDIA',value:arenaPlacement.avg},
        {label:'1º LUGAR',value:arenaPlacement.first+'%'},
        {label:'TOP 4',value:(arenaPlacement.first+arenaPlacement.mid)+'%'}
      ]:[
        {label:'ARENAS',value:'0'},
        {label:'STATUS',value:'SEM AMOSTRA',note:'nenhum dado inventado'}
      ]}>
        {arenaPlacement&&<div className="placementBars deepPlacement">
          <span><label>1º LUGAR</label><i><em style={{width:arenaPlacement.first+'%'}}/></i><b>{arenaPlacement.first}%</b></span>
          <span><label>2º–4º</label><i><em style={{width:arenaPlacement.mid+'%'}}/></i><b>{arenaPlacement.mid}%</b></span>
          <span><label>FORA DO TOP 4</label><i><em style={{width:arenaPlacement.outside+'%'}}/></i><b>{arenaPlacement.outside}%</b></span>
        </div>}
        {arenaAugments.length>0&&<div className="arenaAugmentPanel"><small>AUMENTOS MAIS RECORRENTES</small><p>Os IDs vêm diretamente do Match-V5. O nome visual será enriquecido quando houver catálogo estável disponível.</p><div>{arenaAugments.map((augment:any)=><span key={augment.id}><b>Augment #{augment.id}</b><em>{augment.games} partidas · {augment.top4Rate}% Top 4{augment.firstRate?' · '+augment.firstRate+'% 1º':''}{augment.champion?' · '+augment.champion:''}</em></span>)}</div></div>}
      </DeepDiveChapter>

      <DeepDiveChapter id="riot-streaks" number="14" art={z2Art('QUAL FOI SUA MAIOR SEQUÊNCIA.png')} kicker="SEQUÊNCIAS // EMBALO" title="QUAL FOI SUA MAIOR SEQUÊNCIA?" copy="Contamos resultados positivos consecutivos dentro do contexto principal da amostra. Em Arena, resultado positivo significa Top 4." metrics={[
        {label:'MELHOR SEQUÊNCIA',value:deepDive.streaks.best+' jogos'},
        {label:'MAIOR SEQUÊNCIA FORA',value:deepDive.streaks.worst+' jogos'},
        {label:'SEQUÊNCIA ATUAL',value:deepDive.streaks.current.games+' jogos',note:deepDive.streaks.current.positive?'positiva':'fora do resultado'}
      ]}/>

      <DeepDiveChapter id="riot-hours" number="15" art={z2Art('QUE PARTE DO DIA VOCÊ MAIS APARECE.png')} kicker="HORÁRIOS // QUANDO" title="EM QUE PARTE DO DIA VOCÊ MAIS APARECE?" copy="Horários são calculados no fuso local do dispositivo. Só tratamos uma faixa como comparável quando há partidas suficientes nela." metrics={[
        {label:'MAIS JOGADO',value:deepDive.periods.most?.name||'—',note:deepDive.periods.most?deepDive.periods.most.games+' jogos':''},
        {label:'MELHOR AMOSTRA',value:deepDive.periods.best?.name||'—',note:deepDive.periods.best?(deepDive.context==='ARENA'?'Top 4 ':'resultado ')+deepDive.periods.best.result+'%':''},
        {label:'KDA NESSE HORÁRIO',value:deepDive.periods.best?deepDive.periods.best.kda.toFixed(2):'—'}
      ]}/>

      <DeepDiveChapter id="riot-days" number="16" art={z2Art('QUAL DIA DA SEMANA MAIS APARECE NESSA JANELA.png')} kicker="DIAS // CALENDÁRIO" title="QUAL DIA DA SEMANA MAIS APARECE NESSA JANELA?" copy="Este capítulo observa distribuição e resultado por dia da semana. Ele descreve a amostra; não afirma que o dia causa um desempenho melhor." metrics={[
        {label:'MAIS ATIVO',value:deepDive.daysOfWeek.most?.name||'—',note:deepDive.daysOfWeek.most?deepDive.daysOfWeek.most.games+' jogos':''},
        {label:'MELHOR AMOSTRA',value:deepDive.daysOfWeek.best?.name||'—',note:deepDive.daysOfWeek.best?(deepDive.context==='ARENA'?'Top 4 ':'resultado ')+deepDive.daysOfWeek.best.result+'%':''},
        {label:'KDA',value:deepDive.daysOfWeek.best?deepDive.daysOfWeek.best.kda.toFixed(2):'—'}
      ]}/>

      <DeepDiveChapter id="riot-duration" number="17" art={z2Art('O RESULTADO MUDA QUANDO A PARTIDA SE ALONGA.png')} kicker="DURAÇÃO // CURTA OU LONGA" title="O RESULTADO MUDA QUANDO A PARTIDA SE ALONGA?" copy="Dividimos a própria amostra pela duração mediana. Isso evita escolher um corte arbitrário igual para todos os modos." metrics={[
        {label:'MEDIANA',value:Math.round(deepDive.duration.median)+' min'},
        {label:deepDive.context==='ARENA'?'TOP 4 · CURTAS':'RESULTADO · CURTAS',value:deepDive.duration.shortRate+'%',note:deepDive.duration.shortGames+' jogos'},
        {label:deepDive.context==='ARENA'?'TOP 4 · LONGAS':'RESULTADO · LONGAS',value:deepDive.duration.longRate+'%',note:deepDive.duration.longGames+' jogos'}
      ]}/>

      <DeepDiveChapter id="riot-impact" number="18" art={z2Art('COMO VOCÊ PARTICIPA ALÉM DO KDA.png')} kicker="IMPACTO // PARTICIPAÇÃO" title="COMO VOCÊ PARTICIPA ALÉM DO KDA?" copy="Agora o impacto reúne participação, solo kills, multikills, suporte em aliados, objetivos e visão. Cada métrica só descreve o que o Match-V5 registrou." metrics={[
        {label:'PARTICIPAÇÃO',value:deepDive.impact.kp?Math.round(deepDive.impact.kp)+'%':'—'},
        {label:'SOLO KILLS',value:deepDive.impact.soloKills},
        {label:'MULTIKILLS',value:deepDive.impact.multikills,note:deepDive.impact.pentas?deepDive.impact.pentas+' pentakill(s)':''},
        {label:'FIRST BLOOD',value:deepDive.impact.firstBloods+'x',note:'abate ou assistência'},
        {label:'CURA + SHIELD EM ALIADOS',value:Math.round(deepDive.impact.allySupport).toLocaleString('pt-BR')},
        {label:'OBJETIVOS',value:deepDive.impact.objectives,note:deepDive.impact.objectiveSteals?deepDive.impact.objectiveSteals+' steal(s)':''},
        {label:'DANO EM OBJETIVOS',value:Math.round(deepDive.impact.objectiveDamage).toLocaleString('pt-BR')},
        {label:'VISÃO',value:deepDive.impact.wardsPlaced+' / '+deepDive.impact.wardsKilled,note:deepDive.impact.controlWards+' sentinelas de controle'},
        ...(deepDive.impact.turret>0?[{label:'DANO EM TORRES',value:Math.round(deepDive.impact.turret).toLocaleString('pt-BR')}]:[])
      ]}/>

      <DeepDiveChapter id="riot-trend" number="19" art={z2Art('AS ÚLTIMAS 10 ESTÃO DIFERENTES DAS 10 ANTERIORES.png')} kicker="TENDÊNCIA // ÚLTIMAS 10" title={deepDive.trend?"AS ÚLTIMAS 10 ESTÃO DIFERENTES DAS 10 ANTERIORES?":"AINDA FALTAM PARTIDAS PARA UMA TENDÊNCIA CURTA."} copy={deepDive.trend?"Uma janela curta reage mais rápido a mudanças recentes. Ela é mostrada ao lado da história de 100 partidas, não no lugar dela.":"Precisamos de pelo menos 15–20 partidas comparáveis no contexto principal para separar uma janela recente de uma anterior."} metrics={deepDive.trend?[
        {label:'KDA',value:deepDive.trend.kdaNow.toFixed(2),note:'antes '+deepDive.trend.kdaOld.toFixed(2)},
        {label:deepDive.context==='ARENA'?'TOP 4':'RESULTADO',value:deepDive.trend.resultNow+'%',note:'antes '+deepDive.trend.resultOld+'%'},
        {label:'DANO / MIN',value:Math.round(deepDive.trend.damageNow).toLocaleString('pt-BR'),note:'antes '+Math.round(deepDive.trend.damageOld).toLocaleString('pt-BR')},
        {label:'MAIS JOGADO',value:deepDive.trend.champNow||'—',note:'antes '+(deepDive.trend.champOld||'—')}
      ]:[
        {label:'STATUS',value:'EM FORMAÇÃO'},
        {label:'AMOSTRA',value:deepDive.games+' jogos'}
      ]}/>

      <section id="riot-next" className="riotChapterGroup riotChapterNext">
        <div className="riotChapterGroupIntro riotGroupIntroArt">
          <img className="riotGroupArtwork" loading="lazy" decoding="async" src={z2Art('O RESTO SÓ ENTRA SE TROUXER ALGO NOVO.png')} alt="" aria-hidden="true"/>
          <div className="riotGroupArtworkShade"/>
          <span className="riotChapterNumber">20</span>
          <div><small>AGORA VAI // O QUE VALE OLHAR</small><h3>O RESTO SÓ ENTRA SE TROUXER ALGO NOVO.</h3><p>Patch e experiências interativas fecham a Riot Life porque adicionam contexto novo; não repetem o resumo da sua conta.</p></div>
        </div>
        <div className="riotStoryExtras">
          <MyRiotPatch data={data} champions={champions} ddv={ddv}/>
          <RiotArcade data={data}/>
        </div>
      </section>
    </div>

    <footer className="riotStoryEnd">
      <Icon name="dna"/>
      <div><small>FIM DA HISTÓRIA PRINCIPAL</small><b>AS EVIDÊNCIAS CONTINUAM DISPONÍVEIS ABAIXO.</b><p>Partidas, campeões, maestria e contexto ficam separados da narrativa para não competir com ela.</p></div>
      <button className="riotBackTop" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>VOLTAR AO TOPO ↑</button>
    </footer>
  </section>;
}
