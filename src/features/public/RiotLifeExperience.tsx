import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/ZeroTwoUI';
import { ChampionCareer } from './ChampionCareer';
import { MyRiotPatch } from './MyRiotPatch';
import '../../riot-life.css';

type RiotLifeProps={
  data:any;
  platform:string;
  champions:any;
  ddv:string;
};

type Snapshot={
  at:number;
  mainContext:string|null;
  avgKda:number|null;
  winRate:number|null;
  topChampion:string|null;
  rank:string|null;
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
  const [snapshots,setSnapshots]=useState<Snapshot[]>(()=>{try{const raw=JSON.parse(localStorage.getItem(storageKey)||'[]');return Array.isArray(raw)?raw:[]}catch{return[]}});

  const currentSnapshot=useMemo<Snapshot>(()=>({
    at:Date.now(),
    mainContext:data?.summary?.mainContext||null,
    avgKda:data?.summary?.avgKda!=null?num(data.summary.avgKda):null,
    winRate:data?.summary?.winRate!=null?num(data.summary.winRate):null,
    topChampion:data?.championSummaries?.[0]?.name||matches[0]?.champion||null,
    rank:rankLabel(data?.ranked||[])
  }),[data,matches]);

  useEffect(()=>{
    const next=[...snapshots];
    const last=next[next.length-1];
    const changed=!last||Date.now()-last.at>20*60*1000||
      last.mainContext!==currentSnapshot.mainContext||
      last.topChampion!==currentSnapshot.topChampion||
      last.rank!==currentSnapshot.rank||
      last.avgKda!==currentSnapshot.avgKda||
      last.winRate!==currentSnapshot.winRate;
    if(changed){
      const merged=[...next,currentSnapshot].slice(-24);
      try{localStorage.setItem(storageKey,JSON.stringify(merged))}catch{}
      if(merged.length!==snapshots.length)setSnapshots(merged);
    }
  // Persist one useful snapshot per meaningful profile state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[playerKey,currentSnapshot.mainContext,currentSnapshot.topChampion,currentSnapshot.rank,currentSnapshot.avgKda,currentSnapshot.winRate]);

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

  return <section className="riotLife" aria-label="Riot Life">
    <header className="riotLifeHeader">
      <div>
        <small>ZEROTWO // RIOT LIFE</small>
        <h3>SEUS DADOS CONTAM <span>UMA HISTÓRIA.</span></h3>
        <p>Em vez de só listar números, o ZeroTwo procura mudanças, sessões e momentos que realmente dizem algo sobre como você vem jogando.</p>
      </div>
      <div className="riotLifeCoverage">
        <span><small>AMOSTRA</small><b>{matches.length}</b><em>partidas</em></span>
        <span><small>JANELA</small><b>{sampleDays||'—'}</b><em>{sampleDays===1?'dia':'dias'}</em></span>
        <span><small>VISITAS</small><b>{Math.max(1,snapshots.length)}</b><em>memórias</em></span>
      </div>
    </header>

    <div className="riotLifeGrid">
      <article className="riotPassport riotLifeCard">
        <div className="riotCardTop"><span>RIOT PASSPORT</span><b>01</b></div>
        <div className="riotPassportIdentity">
          <div className="riotPassportIcon">{data?.player?.profileIconId?<img src={'https://ddragon.leagueoflegends.com/cdn/'+ddv+'/img/profileicon/'+data.player.profileIconId+'.png'} alt=""/>:'01'}</div>
          <div><small>{String(platform).toUpperCase()}</small><h4>{data?.player?.gameName}<span>#{data?.player?.tagLine}</span></h4><p>Nível {data?.player?.level??'—'} · {data?.summary?.mainContext||'contexto em leitura'}</p></div>
        </div>
        <div className="riotPassportSignals">
          <span><small>RANK</small><b>{passportRank||'Sem rank publicado'}</b></span>
          <span><small>ASSINATURA RECENTE</small><b>{data?.championSummaries?.[0]?.name||latest?.champion||'Em análise'}</b></span>
          <span><small>MAESTRIA</small><b>{masteryChampion?.name||'Em análise'}</b></span>
        </div>
      </article>

      <article className="riotLifeCard sessionLab">
        <div className="riotCardTop"><span>SESSION LAB</span><b>02</b></div>
        {latestSessionDesc?<><h4>{latestSessionDesc.games} {latestSessionDesc.games===1?'PARTIDA':'PARTIDAS'} NA ÚLTIMA SESSÃO.</h4>
          <div className="sessionNumbers">
            <span><b>{latestSessionDesc.winRate}%</b><small>{latestSession.some((m:any)=>m.context==='ARENA')?'TOP 4 / W':'VITÓRIAS'}</small></span>
            <span><b>{latestSessionDesc.avgKda.toFixed(2)}</b><small>KDA MÉDIO</small></span>
            <span><b>{latestSessionDesc.duration}</b><small>DURAÇÃO</small></span>
          </div>
          <p>{latestSessionDesc.trend?<>Seu KDA <strong>{latestSessionDesc.trend}</strong> entre o começo e o fim desta sessão. Isso é um sinal observado nesta amostra, não uma causa.</>:<>Ainda precisamos de mais jogos na mesma sessão para medir se seu desempenho muda com o tempo.</>}</p>
        </>:<p>Ainda não há horários suficientes na resposta para reconstruir uma sessão.</p>}
      </article>

      <article className="riotLifeCard personalMeta">
        <div className="riotCardTop"><span>PERSONAL META</span><b>03</b></div>
        {personalMeta?<><small>NÃO É O META GLOBAL. É O QUE FUNCIONOU NA SUA AMOSTRA.</small><h4>{personalMeta.name}</h4>
          <div className="personalMetaBar"><span style={{width:Math.max(8,personalMeta.winRate)+'%'}}/></div>
          <div className="personalMetaStats"><span><b>{personalMeta.games}</b><small>JOGOS</small></span><span><b>{personalMeta.winRate}%</b><small>RESULTADO</small></span><span><b>{personalMeta.avgKda.toFixed(2)}</b><small>KDA</small></span></div>
          <p>Entre campeões com pelo menos 2 aparições nesta consulta, este foi o sinal mais forte por resultado observado.</p>
        </>:<p>Precisamos de pelo menos duas partidas com o mesmo campeão para construir seu Personal Meta.</p>}
      </article>

      <article className="riotLifeCard timeMachine">
        <div className="riotCardTop"><span>TIME MACHINE</span><b>04</b></div>
        {snapshotDelta?<><small>DESDE {formatDate(snapshotDelta.since)}</small><h4>{snapshotDelta.modeChanged||snapshotDelta.championChanged?'VOCÊ NÃO É MAIS O MESMO PLAYER.':'SEU PERFIL ESTÁ GANHANDO MEMÓRIA.'}</h4>
          <ul>
            {snapshotDelta.modeChanged&&<li>Contexto principal: <b>{firstSnapshot?.mainContext}</b> → <strong>{currentSnapshot.mainContext}</strong></li>}
            {snapshotDelta.championChanged&&<li>Campeão mais presente: <b>{firstSnapshot?.topChampion}</b> → <strong>{currentSnapshot.topChampion}</strong></li>}
            {snapshotDelta.kda!=null&&Math.abs(snapshotDelta.kda)>=.1&&<li>KDA da amostra: <strong>{snapshotDelta.kda>0?'+':''}{snapshotDelta.kda.toFixed(2)}</strong></li>}
            {snapshotDelta.winRate!=null&&Math.abs(snapshotDelta.winRate)>=1&&<li>Win rate da amostra: <strong>{snapshotDelta.winRate>0?'+':''}{snapshotDelta.winRate.toFixed(0)} p.p.</strong></li>}
          </ul>
          <p>O ZeroTwo começa a guardar snapshots locais das suas consultas para comparar sua evolução sem inventar histórico que a API não entregou.</p>
        </>:recentVsOld?<><small>TIME MACHINE // AMOSTRA ATUAL</small><h4>{recentVsOld.recentChampion!==recentVsOld.oldChampion?'SEU FOCO JÁ MUDOU DENTRO DESTA AMOSTRA.':'COMPARE O COMEÇO COM O AGORA.'}</h4>
          <div className="timeCompare"><span><small>PARTE MAIS ANTIGA</small><b>{recentVsOld.oldChampion||'—'}</b><em>{recentVsOld.oldMode||'—'} · {recentVsOld.oldWr}%</em></span><Icon name="arrow"/><span><small>PARTE MAIS RECENTE</small><b>{recentVsOld.recentChampion||'—'}</b><em>{recentVsOld.recentMode||'—'} · {recentVsOld.recentWr}%</em></span></div>
          <p>Na próxima visita, esta seção poderá comparar snapshots reais de dias diferentes.</p>
        </>:<p>Continue usando o ZeroTwo. A Time Machine começa a ficar útil quando conseguimos comparar momentos diferentes.</p>}
      </article>
    </div>

    {latest&&<article className="matchStory">
      <div className="matchStoryVisual">
        {latestChampion&&<img src={'https://ddragon.leagueoflegends.com/cdn/'+ddv+'/img/champion/'+latestChampion.id+'.png'} alt=""/>}
        <span>{latest.context}</span>
      </div>
      <div className="matchStoryCopy">
        <div className="riotCardTop"><span>MATCH STORY // ÚLTIMA PARTIDA</span><b>05</b></div>
        <small>{formatDate(playedAt(latest))} · {latest.duration??'—'} MIN</small>
        <h4>{latest.context==='ARENA'?(num(latest.placement)<=4?'TOP 4 COM '+latest.champion:latest.champion+' TERMINOU EM '+latest.placement+'º'):(latest.win?'VITÓRIA DE '+latest.champion:'DERROTA DE '+latest.champion)}.</h4>
        <p>
          Você terminou com <strong>{latest.kills} / {latest.deaths} / {latest.assists}</strong> e KDA <strong>{latest.kda}</strong>.
          {latest.killParticipation!=null&&<> Participou de <strong>{latest.killParticipation}%</strong> das eliminações da equipe.</>}
          {latest.damage!=null&&<> Causou <strong>{Math.round(num(latest.damage)/100)/10}k</strong> de dano.</>}
          {latest.position&&<> Sua função registrada foi <strong>{latest.position}</strong>.</>}
        </p>
        <button onClick={()=>document.querySelector<HTMLButtonElement>('.profileViewNav button:nth-child(3)')?.click()}>ABRIR A PARTIDA E O HISTÓRICO →</button>
      </div>
    </article>}

    <ChampionCareer data={data} champions={champions} ddv={ddv}/>
    <MyRiotPatch data={data} champions={champions} ddv={ddv}/>
  </section>;
}
