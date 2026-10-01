import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/ZeroTwoUI';
import { ChampionCareer } from './ChampionCareer';
import { MyRiotPatch } from './MyRiotPatch';
import { RiotArcade } from './RiotArcade';
import { FrequentTeammates } from './FrequentTeammates';
import { PlayerEras } from './PlayerEras';
import { RiotWrapped } from './RiotWrapped';
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

  return <section className="riotLife riotLifeV2" aria-label="Riot Life">
    <header className="riotLifeHub">
      <div className="riotLifeHubTitle">
        <small>ZEROTWO // RIOT LIFE</small>
        <h3>UMA CONTA. <span>UMA HISTÓRIA.</span></h3>
        <p>Comece pelo resumo. Abra a história ou explore os detalhes só quando quiser aprofundar.</p>
      </div>
      <div className="riotLifeHubMeta">
        <span><small>AMOSTRA</small><b>{matches.length}</b><em>partidas</em></span>
        <span><small>JANELA</small><b>{sampleDays||'—'}</b><em>{sampleDays===1?'dia':'dias'}</em></span>
        <span><small>MEMÓRIA</small><b>{Math.max(1,snapshots.length)}</b><em>{memoryMode==='cloud'?'cloud':memoryMode==='checking'?'sync':'local'}</em></span>
      </div>
      <nav className="riotLifeTabs" aria-label="Navegar pela Riot Life">
        <button className={lifeView==='overview'?'active':''} onClick={()=>setLifeView('overview')}><span>01</span><b>RESUMO</b><small>O que importa agora</small></button>
        <button className={lifeView==='story'?'active':''} onClick={()=>setLifeView('story')}><span>02</span><b>HISTÓRIA</b><small>Mudanças e pessoas</small></button>
        <button className={lifeView==='explore'?'active':''} onClick={()=>setLifeView('explore')}><span>03</span><b>EXPLORAR</b><small>Campeões, patch e arcade</small></button>
      </nav>
    </header>

    {lifeView==='overview'&&<div className="riotLifeView riotLifeOverview">
      <RiotWrapped data={data} platform={platform} champions={champions} ddv={ddv}/>

      {latest&&daysSinceLatest>=14&&<aside className="returningPlayer">
        <div className="returningSignal"><span>{daysSinceLatest}</span><small>DIAS</small></div>
        <div><small>RETURNING PLAYER</small><b>{daysSinceLatest>=60?'VOCÊ ESTÁ VOLTANDO DEPOIS DE UMA LONGA PAUSA.':'VOCÊ DEU UMA PAUSA NO LEAGUE.'}</b><p>A última partida observada nesta consulta foi em <strong>{formatDate(playedAt(latest))}</strong>. Abra Explorar para ver mudanças de patch ligadas ao seu histórico recente.</p></div>
        <button onClick={()=>setLifeView('explore')}>VER O QUE MUDOU →</button>
      </aside>}

      <div className="riotLifeSummaryGrid">
        <article className="riotPassport riotLifeCard">
          <div className="riotCardTop"><span>RIOT PASSPORT</span><b>01</b></div>
          <div className="riotPassportIdentity">
            <div className="riotPassportIcon">{data?.player?.profileIconId?<img src={'https://ddragon.leagueoflegends.com/cdn/'+ddv+'/img/profileicon/'+data.player.profileIconId+'.png'} alt=""/>:'ZT'}</div>
            <div><small>{String(platform).toUpperCase()}</small><h4>{data?.player?.gameName}<span>#{data?.player?.tagLine}</span></h4><p>Nível {data?.player?.level??'—'} · {data?.summary?.mainContext||'contexto em leitura'}</p></div>
          </div>
          <div className="riotPassportSignals">
            <span><small>RANK</small><b>{passportRank||'Sem rank publicado'}</b></span>
            <span><small>ASSINATURA</small><b>{data?.championSummaries?.[0]?.name||latest?.champion||'Em análise'}</b></span>
            <span><small>MAESTRIA</small><b>{masteryChampion?.name||'Em análise'}</b></span>
          </div>
        </article>

        <article className="riotLifeCard sessionLab">
          <div className="riotCardTop"><span>ÚLTIMA SESSÃO</span><b>02</b></div>
          {latestSessionDesc?<><h4>{latestSessionDesc.games} {latestSessionDesc.games===1?'PARTIDA':'PARTIDAS'} JUNTAS.</h4>
            <div className="sessionNumbers">
              <span><b>{latestSessionDesc.winRate}%</b><small>{latestSession.some((m:any)=>m.context==='ARENA')?'TOP 4 / W':'VITÓRIAS'}</small></span>
              <span><b>{latestSessionDesc.avgKda.toFixed(2)}</b><small>KDA</small></span>
              <span><b>{latestSessionDesc.duration}</b><small>DURAÇÃO</small></span>
            </div>
            <p>{latestSessionDesc.trend?<>Seu KDA <strong>{latestSessionDesc.trend}</strong> entre o começo e o fim da sessão.</>:<>Ainda precisamos de mais jogos na mesma sessão para medir uma mudança interna.</>}</p>
          </>:<p>Ainda não há horários suficientes para reconstruir uma sessão.</p>}
        </article>

        <article className="riotLifeCard personalMeta">
          <div className="riotCardTop"><span>PERSONAL META</span><b>03</b></div>
          {personalMeta?<><small>O QUE FUNCIONOU NESTA AMOSTRA</small><h4>{personalMeta.name}</h4>
            <div className="personalMetaBar"><span style={{width:Math.max(8,personalMeta.winRate)+'%'}}/></div>
            <div className="personalMetaStats"><span><b>{personalMeta.games}</b><small>JOGOS</small></span><span><b>{personalMeta.winRate}%</b><small>RESULTADO</small></span><span><b>{personalMeta.avgKda.toFixed(2)}</b><small>KDA</small></span></div>
          </>:<p>Precisamos de pelo menos duas partidas com o mesmo campeão.</p>}
        </article>
      </div>

      {latest&&<article className="matchStory matchStoryV2">
        <div className="matchStoryVisual">
          {latestChampion&&<img src={'https://ddragon.leagueoflegends.com/cdn/'+ddv+'/img/champion/'+latestChampion.id+'.png'} alt=""/>}
          <span>{latest.context}</span>
        </div>
        <div className="matchStoryCopy">
          <div className="riotCardTop"><span>ÚLTIMA PARTIDA</span><b>04</b></div>
          <small>{formatDate(playedAt(latest))} · {latest.duration??'—'} MIN</small>
          <h4>{latest.context==='ARENA'?(num(latest.placement)<=4?'TOP 4 COM '+latest.champion:latest.champion+' TERMINOU EM '+latest.placement+'º'):(latest.win?'VITÓRIA DE '+latest.champion:'DERROTA DE '+latest.champion)}.</h4>
          <p>Você terminou com <strong>{latest.kills} / {latest.deaths} / {latest.assists}</strong> e KDA <strong>{latest.kda}</strong>.{latest.killParticipation!=null&&<> Participou de <strong>{latest.killParticipation}%</strong> das eliminações.</>}</p>
          <button onClick={()=>document.querySelector<HTMLButtonElement>('.profileViewNav button[data-view="matches"]')?.click()}>ABRIR HISTÓRICO →</button>
        </div>
      </article>}

      <button className="riotLifeContinue" onClick={()=>setLifeView('story')}><span><small>CONTINUAR A RIOT LIFE</small><b>VER COMO ESSA HISTÓRIA MUDOU</b></span><Icon name="arrow"/></button>
    </div>}

    {lifeView==='story'&&<div className="riotLifeView riotLifeStory">
      <section className="riotSectionIntro">
        <small>02 // HISTÓRIA</small>
        <h3>O QUE MUDOU <span>ENTRE UM MOMENTO E OUTRO.</span></h3>
        <p>Aqui entram apenas comparações temporais, eras observadas e jogadores que realmente se repetiram na amostra.</p>
      </section>

      <article className="riotLifeCard timeMachine timeMachineWide">
        <div className="riotCardTop"><span>TIME MACHINE</span><b>01</b></div>
        {snapshotDelta?<><small>DESDE {formatDate(snapshotDelta.since)}</small><h4>{snapshotDelta.modeChanged||snapshotDelta.championChanged?'SEU PERFIL MUDOU ENTRE AS VISITAS.':'SUA MEMÓRIA ESTÁ CRESCENDO.'}</h4>
          <ul>
            {snapshotDelta.modeChanged&&<li>Contexto principal: <b>{firstSnapshot?.mainContext}</b> → <strong>{currentSnapshot.mainContext}</strong></li>}
            {snapshotDelta.championChanged&&<li>Campeão mais presente: <b>{firstSnapshot?.topChampion}</b> → <strong>{currentSnapshot.topChampion}</strong></li>}
            {snapshotDelta.kda!=null&&Math.abs(snapshotDelta.kda)>=.1&&<li>KDA da amostra: <strong>{snapshotDelta.kda>0?'+':''}{snapshotDelta.kda.toFixed(2)}</strong></li>}
            {snapshotDelta.winRate!=null&&Math.abs(snapshotDelta.winRate)>=1&&<li>Resultado da amostra: <strong>{snapshotDelta.winRate>0?'+':''}{snapshotDelta.winRate.toFixed(0)} p.p.</strong></li>}
          </ul>
        </>:recentVsOld?<><small>AMOSTRA ATUAL</small><h4>{recentVsOld.recentChampion!==recentVsOld.oldChampion?'SEU FOCO JÁ MUDOU DENTRO DESTA JANELA.':'COMPARE O COMEÇO COM O AGORA.'}</h4>
          <div className="timeCompare"><span><small>ANTES</small><b>{recentVsOld.oldChampion||'—'}</b><em>{recentVsOld.oldMode||'—'} · {recentVsOld.oldWr}%</em></span><Icon name="arrow"/><span><small>AGORA</small><b>{recentVsOld.recentChampion||'—'}</b><em>{recentVsOld.recentMode||'—'} · {recentVsOld.recentWr}%</em></span></div>
        </>:<p>Precisamos de mais histórico para construir uma comparação útil.</p>}
      </article>

      <PlayerEras data={data} champions={champions} ddv={ddv}/>
      <FrequentTeammates data={data} platform={platform}/>
      <button className="riotLifeContinue" onClick={()=>setLifeView('explore')}><span><small>QUER APROFUNDAR?</small><b>EXPLORAR CAMPEÕES, PATCH E ARCADE</b></span><Icon name="arrow"/></button>
    </div>}

    {lifeView==='explore'&&<div className="riotLifeView riotLifeExplore">
      <section className="riotSectionIntro">
        <small>03 // EXPLORAR</small>
        <h3>APROFUNDE SÓ NO QUE <span>TE INTERESSA.</span></h3>
        <p>Campeões, mudanças de patch e experiências geradas pelo seu próprio histórico ficam aqui — fora do caminho principal.</p>
      </section>
      <div className="riotExploreOrder">
        <ChampionCareer data={data} champions={champions} ddv={ddv}/>
        <MyRiotPatch data={data} champions={champions} ddv={ddv}/>
        <RiotArcade data={data}/>
      </div>
    </div>}
  </section>;
}
