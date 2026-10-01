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
  ['riot-next','AGORA VAI']
] as const;

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
  const recentCompare=recentVsOld?[
    {label:'KDA',recent:recentVsOld.recentKda,old:recentVsOld.oldKda,format:(v:number)=>v.toFixed(2)},
    {label:'RESULTADO',recent:recentVsOld.recentWr,old:recentVsOld.oldWr,format:(v:number)=>Math.round(v)+'%'}
  ]:[];

  const currentMode=data?.modeSummaries?.find((m:any)=>m.name===data?.summary?.mainContext)||null;
  const currentMetric=currentMode?.name==='ARENA'
    ?{label:'TOP 4',value:currentMode?.top4Rate!=null?currentMode.top4Rate+'%':'—'}
    :{label:'RESULTADO',value:currentMode?.winRate!=null?currentMode.winRate+'%':data?.summary?.winRate!=null?data.summary.winRate+'%':'—'};
  const currentModeGames=Number(currentMode?.games||matches.filter((m:any)=>m.context===data?.summary?.mainContext).length||0);
  const signature=data?.championSummaries?.[0]||null;
  const signatureChampion=signature?champions?.[signature.name]:null;
  const signatureShare=signature&&matches.length?Math.round(Number(signature.games||0)/matches.length*100):0;
  const peakMatch=useMemo(()=>[...matches].sort((a:any,b:any)=>num(b?.kda)-num(a?.kda))[0]||null,[matches]);
  const peakChampion=peakMatch?champions?.[peakMatch.champion]:null;
  const sampleLabel=sampleDays>0?sampleDays+' '+(sampleDays===1?'dia':'dias'):'janela recente';
  const changeTitle=snapshotDelta
    ?(snapshotDelta.modeChanged||snapshotDelta.championChanged?'SUA HISTÓRIA MUDOU ENTRE AS VISITAS.':'SUA MEMÓRIA JÁ COMEÇOU A CRESCER.')
    :recentVsOld
      ?(recentVsOld.recentChampion!==recentVsOld.oldChampion?'SEU FOCO MUDOU DENTRO DESTA JANELA.':'A FASE RECENTE NÃO É IGUAL À ANTERIOR.')
      :'AINDA É CEDO PARA MEDIR UMA MUDANÇA.';
  const recentKdaDelta=recentVsOld?recentVsOld.recentKda-recentVsOld.oldKda:null;
  const recentResultDelta=recentVsOld?recentVsOld.recentWr-recentVsOld.oldWr:null;
  const sampleQuality=matches.length>=150?'HISTÓRIA FORTE':matches.length>=75?'BOA AMOSTRA':matches.length>=30?'EM FORMAÇÃO':'AMOSTRA INICIAL';
  const chapterIndex=Math.max(0,RIOT_CHAPTERS.findIndex(([id])=>id===activeChapter));
  const readingProgress=Math.round(((chapterIndex+1)/RIOT_CHAPTERS.length)*100);
  const sampleWarning=matches.length<30?'Amostra pequena: trate padrões como sinais iniciais.':matches.length<75?'Amostra em formação: a leitura fica mais confiável conforme o histórico cresce.':'Amostra suficiente para padrões recentes com melhor contexto.';

  return <section className="riotStory" aria-label="Riot Life em capítulos">
    <header className="riotStoryIntro">
      <div>
        <small>ZEROTWO // RIOT LIFE</small>
        <h2>ISTO NÃO É UM DASHBOARD.<br/><span>É A SUA HISTÓRIA RECENTE.</span></h2>
        <p>{matches.length} partidas disponíveis organizadas em capítulos. O ZeroTwo pode aprofundar esta Riot Life até 200 partidas para encontrar padrões mais confiáveis sem despejar tudo na tela.</p>
      </div>
      <div className="riotStoryCoverage">
        <span><small>AMOSTRA</small><b>{matches.length}</b><em>partidas</em></span>
        <span><small>JANELA</small><b>{sampleDays||'—'}</b><em>{sampleDays===1?'dia':'dias'}</em></span>
        <span><small>MEMÓRIA</small><b>{Math.max(1,snapshots.length)}</b><em>{memoryMode==='cloud'?'cloud':memoryMode==='checking'?'sync':'local'}</em></span>
        <span><small>QUALIDADE</small><b className="sampleQualityValue">{sampleQuality}</b><em>{matches.length}/200 analisadas</em></span>
      </div>
      <div className="riotSampleNote" data-tone={matches.length<30?'low':matches.length<75?'mid':'good'}><Icon name="status"/><span><b>{sampleQuality}</b><small>{sampleWarning}</small></span></div>
    </header>

    <nav className="riotStoryNav" aria-label="Capítulos da Riot Life">
      {RIOT_CHAPTERS.map(([id,label],index)=><a key={id} href={'#'+id} className={activeChapter===id?'active':''} aria-current={activeChapter===id?'step':undefined}><span>{String(index+1).padStart(2,'0')}</span><b>{label}</b></a>)}
      <i className="riotStoryProgress" aria-hidden="true"><span style={{width:readingProgress+'%'}}/></i>
      <small className="riotStoryReadout">{readingProgress}% · ~2 min de leitura</small>
    </nav>

    <div className="riotStoryFlow">
      <section id="riot-now" className="riotChapter riotChapterNow">
        <div className="riotChapterNumber">01</div>
        <div className="riotChapterCopy">
          <small>AGORA // O PALCO DESTA FASE</small>
          <h3>{data?.summary?.mainContext||'SEU CONTEXTO'} <span>É ONDE SUA HISTÓRIA ESTÁ ACONTECENDO.</span></h3>
          <p>{currentModeGames>0?currentModeGames+' de '+matches.length+' partidas desta janela vieram desse contexto.':'Este é o contexto mais presente entre as partidas disponíveis.'} O número ao lado pertence só a este capítulo.</p><small className="chapterSource">FONTE // RIOT MATCH-V5 · {matches.length} partidas observadas</small>
          <div className="riotNowMeta"><span><small>PERÍODO</small><b>{windowStart} → {windowEnd}</b></span><span><small>ÚLTIMA PARTIDA</small><b>{daysSinceLatest===0?'hoje':daysSinceLatest+'d atrás'}</b></span></div>
          {modeDistribution.length>0&&<div className="riotModeDistribution" aria-label="Distribuição dos modos jogados">{modeDistribution.map((mode:any)=><span key={mode.name}><i style={{width:mode.share+'%'}}/><b>{mode.name}</b><em>{mode.games} · {mode.share}%</em></span>)}</div>
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
          {signatureTop.length>1&&<div className="signatureTopList" aria-label="Campeões mais presentes">{signatureTop.map((champ:any,index:number)=><span key={champ.name}><i>{index+1}</i><b>{champ.name}</b><em>{champ.games}x{champ.winRate!=null?' · '+champ.winRate+'%':''}</em></span>)}</div>}
        </div>
        <div className="riotChapterHeroMetric">
          <b>{signatureShare}%</b>
          <span>DA AMOSTRA</span>
          <em>{signature.contexts?.join(' · ')||data?.summary?.mainContext||'recente'}</em>
        </div>
      </section>}

      <section id="riot-session" className="riotChapter riotChapterSession">
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
        </div>
        <div className="riotChapterHeroMetric">
          <b>{peakMatch.kda??'—'}</b>
          <span>KDA</span>
          <em>{peakMatch.duration??'—'} min</em>
        </div>
      </section>}

      <section id="riot-change" className="riotChapterGroup riotChapterChange">
        <div className="riotChapterGroupIntro">
          <span className="riotChapterNumber">05</span>
          <div><small>MUDANÇA // O QUE NÃO É MAIS IGUAL</small><h3>{changeTitle}</h3><p>Este capítulo não repete seus números atuais; ele mostra apenas diferenças entre momentos comparáveis.</p>{recentCompare.length>0&&<div className="riotBeforeAfter">{recentCompare.map((row:any)=><span key={row.label}><small>{row.label}</small><i><em style={{width:Math.min(100,Math.max(8,(row.old/(Math.max(row.old,row.recent)||1))*100))+'%'}}/></i><b>{row.format(row.old)} → {row.format(row.recent)}</b></span>)}</div>}</div>
          <div className="riotChangeFacts">
            {snapshotDelta?.kda!=null&&Math.abs(snapshotDelta.kda)>=.1&&<span><small>KDA DESDE A PRIMEIRA MEMÓRIA</small><b>{snapshotDelta.kda>0?'+':''}{snapshotDelta.kda.toFixed(2)}</b></span>}
            {snapshotDelta?.winRate!=null&&Math.abs(snapshotDelta.winRate)>=1&&<span><small>RESULTADO DESDE A PRIMEIRA MEMÓRIA</small><b>{snapshotDelta.winRate>0?'+':''}{snapshotDelta.winRate.toFixed(0)} p.p.</b></span>}
            {!snapshotDelta&&recentKdaDelta!=null&&<span><small>KDA RECENTE VS. ANTERIOR</small><b>{recentKdaDelta>=0?'+':''}{recentKdaDelta.toFixed(2)}</b></span>}
            {!snapshotDelta&&recentResultDelta!=null&&<span><small>RESULTADO RECENTE VS. ANTERIOR</small><b>{recentResultDelta>=0?'+':''}{recentResultDelta} p.p.</b></span>}
          </div>
        </div>
        <PlayerEras data={data} champions={champions} ddv={ddv}/>
      </section>

      <section id="riot-people" className="riotChapterGroup riotChapterPeople">
        <div className="riotChapterGroupIntro">
          <span className="riotChapterNumber">06</span>
          <div><small>PESSOAS // QUEM SE REPETE</small><h3>ALGUNS NOMES VOLTAM A APARECER.</h3><p>Aqui não tentamos medir amizade ou “sinergia”. Só mostramos quem realmente se repetiu nas partidas analisadas.</p><small className="chapterSource">FONTE // participantes do Match-V5; recorrência não significa amizade ou causalidade</small></div>
        </div>
        <FrequentTeammates data={data} platform={platform}/>
      </section>

      <section id="riot-next" className="riotChapterGroup riotChapterNext">
        <div className="riotChapterGroupIntro">
          <span className="riotChapterNumber">07</span>
          <div><small>AGORA VAI // O QUE VALE OLHAR</small><h3>O RESTO SÓ ENTRA SE TROUXER ALGO NOVO.</h3><p>Patch e experiências interativas ficam no fim porque adicionam contexto novo; não repetem o resumo da sua conta.</p></div>
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
