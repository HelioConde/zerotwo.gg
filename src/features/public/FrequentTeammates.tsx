import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../supabase';
import { Icon } from '../../components/ZeroTwoUI';

type Props={data:any;platform:string};

type Teammate={
  riotId:string;
  gameName:string;
  tagLine:string;
  games:number;
  wins:number;
  winRate:number;
  firstPlayedAt:number;
  lastPlayedAt:number;
  champions:Array<{name:string;games:number}>;
  positions:Array<{name:string;games:number}>;
  pairChampions:Array<{name:string;games:number}>;
  recentGames:number;
  olderGames:number;
  phase:'persistent'|'now'|'before'|'single';
};

function regionFor(platform:string){
  return ['br1','na1','la1','la2'].includes(platform)?'americas':
    ['kr','jp1'].includes(platform)?'asia':
    ['ph2','sg2','th2','tw2','vn2'].includes(platform)?'sea':'europe';
}
function when(ts:number){
  if(!ts)return '—';
  return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(ts));
}
function daysSince(ts:number){
  return ts?Math.max(0,Math.floor((Date.now()-ts)/86400000)):0;
}
function relationshipStatus(ts:number){
  const days=daysSince(ts);
  if(days<=3)return {label:'ATIVA AGORA',tone:'active'};
  if(days<=14)return {label:'RECENTE',tone:'recent'};
  return {label:'EM PAUSA',tone:'paused'};
}
function safeCacheRead(key:string,signature:string){
  try{
    const raw=JSON.parse(localStorage.getItem(key)||'null');
    if(!raw||raw.signature!==signature||Date.now()-Number(raw.savedAt||0)>20*60*1000)return null;
    if(!Array.isArray(raw.rows))return null;
    return raw;
  }catch{return null}
}

export function FrequentTeammates({data,platform}:Props){
  const root=useRef<HTMLElement|null>(null);
  const [rows,setRows]=useState<Teammate[]>([]);
  const [analyzed,setAnalyzed]=useState(0);
  const [loading,setLoading]=useState(false);
  const [attempted,setAttempted]=useState(false);

  const matchIds=useMemo(
    ()=>[...new Set((data?.matches||[]).map((m:any)=>String(m?.id||'')).filter(Boolean))].slice(0,12),
    [data]
  );
  const playerKey=((data?.player?.gameName||'player')+'#'+(data?.player?.tagLine||'')+'-'+platform).toLowerCase();
  const matchSignature=matchIds.join(',');
  const cacheKey='zt_recurring_players_v2_'+playerKey;

  useEffect(()=>{
    setRows([]);
    setAnalyzed(0);
    setLoading(false);
    setAttempted(false);
  },[playerKey,matchSignature]);

  useEffect(()=>{
    const el=root.current;
    if(!el||attempted||!matchIds.length)return;
    const observer=new IntersectionObserver(entries=>{
      if(!entries.some(x=>x.isIntersecting))return;
      observer.disconnect();
      setAttempted(true);

      const cached=safeCacheRead(cacheKey,matchSignature);
      if(cached){
        setRows(cached.rows);
        setAnalyzed(Number(cached.analyzed||0));
        return;
      }

      setLoading(true);
      supabase.functions.invoke('public-lol-teammates',{
        body:{
          gameName:data?.player?.gameName,
          tagLine:data?.player?.tagLine,
          region:regionFor(platform),
          matchIds
        }
      }).then(({data:result,error})=>{
        if(!error&&Array.isArray(result?.teammates)){
          const next=result.teammates as Teammate[];
          const nextAnalyzed=Number(result.matchesAnalyzed||0);
          setRows(next);
          setAnalyzed(nextAnalyzed);
          try{localStorage.setItem(cacheKey,JSON.stringify({
            signature:matchSignature,
            savedAt:Date.now(),
            rows:next,
            analyzed:nextAnalyzed
          }))}catch{}
        }
      }).finally(()=>setLoading(false));
    },{rootMargin:'240px'});
    observer.observe(el);
    return()=>observer.disconnect();
  },[attempted,cacheKey,data,matchIds,matchSignature,platform]);

  function openPlayer(riotId:string){
    const url=location.pathname+'?player='+encodeURIComponent(riotId)+'&server='+encodeURIComponent(platform);
    location.href=url;
  }

  const featured=rows[0]||null;
  const featuredStatus=featured?relationshipStatus(featured.lastPlayedAt):null;
  const featuredShare=featured&&analyzed?Math.round(featured.games/analyzed*100):0;
  const observedSpan=featured?.firstPlayedAt&&featured?.lastPlayedAt
    ?Math.max(0,Math.ceil((featured.lastPlayedAt-featured.firstPlayedAt)/86400000))
    :0;
  const repeated=rows.filter(row=>row.games>=2);
  const timeline=useMemo(()=>({
    now:rows.filter(row=>row.phase==='now').sort((a,b)=>b.recentGames-a.recentGames),
    persistent:rows.filter(row=>row.phase==='persistent').sort((a,b)=>b.recentGames-a.recentGames||b.games-a.games),
    before:rows.filter(row=>row.phase==='before').sort((a,b)=>b.olderGames-a.olderGames)
  }),[rows]);
  const hasTimeline=analyzed>=5&&(timeline.now.length+timeline.persistent.length+timeline.before.length)>0;

  if(attempted&&!loading&&!rows.length)return null;

  return <section className="frequentTeammates" ref={root}>
    <header>
      <div><small>RECURRING PLAYERS</small><h3>COM QUEM VOCÊ <span>MAIS JOGA?</span></h3><p>Companheiros que mais se repetiram nas partidas recentes analisadas. É frequência observada, não uma lista de amigos.</p></div>
      <div className="teammateSample"><small>AMOSTRA</small><b>{analyzed||matchIds.length}</b><em>partidas</em></div>
    </header>

    {loading?<div className="teammatesLoading"><Icon name="sync"/><b>PROCURANDO JOGADORES RECORRENTES...</b></div>:<>
      {featured&&featured.games>=2&&<article className="featuredTeammate">
        <div className="featuredMateLead">
          <small>PARCERIA MAIS RECORRENTE DA AMOSTRA</small>
          <h4>{featured.gameName}<span>#{featured.tagLine}</span></h4>
          <div className={'mateStatus '+featuredStatus?.tone}><i/>{featuredStatus?.label}</div>
          <p>
            Vocês apareceram juntos em <strong>{featured.games}</strong> das {analyzed||matchIds.length} partidas analisadas
            {featuredShare>0?<> — <strong>{featuredShare}%</strong> desta janela.</>:'.'}
          </p>
          <button onClick={()=>openPlayer(featured.riotId)}>ABRIR RIOT LIFE DE {featured.gameName.toUpperCase()} →</button>
        </div>
        <div className="featuredMateMetrics">
          <span><small>PARTIDAS JUNTOS</small><b>{featured.games}</b><em>na amostra</em></span>
          <span><small>RESULTADO*</small><b>{featured.winRate}%</b><em>{featured.wins} vitórias</em></span>
          <span><small>ÚLTIMA VEZ</small><b>{daysSince(featured.lastPlayedAt)===0?'HOJE':daysSince(featured.lastPlayedAt)+'d'}</b><em>{when(featured.lastPlayedAt)}</em></span>
          <span><small>JANELA OBSERVADA</small><b>{observedSpan}d</b><em>{when(featured.firstPlayedAt)} → {when(featured.lastPlayedAt)}</em></span>
        </div>
        <div className="featuredMatePair">
          <small>COMBINAÇÃO MAIS REPETIDA</small>
          <b>{featured.pairChampions?.[0]?.name||'Ainda sem padrão forte'}</b>
          <p>{featured.pairChampions?.[0]?featured.pairChampions[0].games+' partida'+(featured.pairChampions[0].games===1?'':'s')+' nesta combinação.':'Precisamos de mais partidas para formar uma combinação recorrente.'}</p>
          {featured.positions?.[0]&&<span>Posição mais vista do parceiro · <strong>{featured.positions[0].name}</strong></span>}
        </div>
      </article>}

      {hasTimeline&&<section className="playersTimeline">
        <header>
          <div><small>PLAYERS TIMELINE</small><h4>QUEM ESTÁ <span>ENTRANDO, FICANDO OU SUMINDO</span> DA SUA JANELA RECENTE.</h4></div>
          <p>Comparamos as <strong>4 partidas mais recentes</strong> com o restante desta mesma amostra. É uma leitura de frequência, não de relacionamento.</p>
        </header>
        <div className="playersTimelineLanes">
          {timeline.now.length>0&&<article className="timelineLane now">
            <div className="timelineLaneTitle"><i/><span><small>AGORA</small><b>COMEÇARAM A SE REPETIR</b></span></div>
            <div>{timeline.now.slice(0,3).map(row=><button key={row.riotId} onClick={()=>openPlayer(row.riotId)}>
              <span><b>{row.gameName}</b><small>#{row.tagLine}</small></span>
              <em>{row.recentGames}x nas últimas 4</em>
              <Icon name="arrow"/>
            </button>)}</div>
          </article>}
          {timeline.persistent.length>0&&<article className="timelineLane persistent">
            <div className="timelineLaneTitle"><i/><span><small>CONTINUA</small><b>ATRAVESSARAM A JANELA</b></span></div>
            <div>{timeline.persistent.slice(0,3).map(row=><button key={row.riotId} onClick={()=>openPlayer(row.riotId)}>
              <span><b>{row.gameName}</b><small>#{row.tagLine}</small></span>
              <em>{row.olderGames} antes · {row.recentGames} agora</em>
              <Icon name="arrow"/>
            </button>)}</div>
          </article>}
          {timeline.before.length>0&&<article className="timelineLane before">
            <div className="timelineLaneTitle"><i/><span><small>ANTES</small><b>NÃO APARECEM NAS ÚLTIMAS 4</b></span></div>
            <div>{timeline.before.slice(0,3).map(row=><button key={row.riotId} onClick={()=>openPlayer(row.riotId)}>
              <span><b>{row.gameName}</b><small>#{row.tagLine}</small></span>
              <em>{row.olderGames}x na parte anterior</em>
              <Icon name="arrow"/>
            </button>)}</div>
          </article>}
        </div>
      </section>}

      <div className="teammateSectionLabel">
        <span><small>{repeated.length?'JOGADORES QUE SE REPETIRAM':'JOGADORES MAIS ENCONTRADOS'}</small><b>{rows.length} jogadores identificados</b></span>
        {repeated.length>0&&<em>{repeated.length} apareceram em 2+ partidas</em>}
      </div>

      <div className="teammateGrid">{rows.slice(0,6).map((row,index)=>{
        const status=relationshipStatus(row.lastPlayedAt);
        return <button key={row.riotId} onClick={()=>openPlayer(row.riotId)}>
          <span className="mateRank">{String(index+1).padStart(2,'0')}</span>
          <div className="mateIdentity"><small>{row.games>=2?'JOGADOR RECORRENTE':'ENCONTRADO NA AMOSTRA'}</small><b>{row.gameName}<em>#{row.tagLine}</em></b><span><i className={'mateMiniStatus '+status.tone}/>{status.label} · {when(row.lastPlayedAt)}</span></div>
          <div className="mateNumbers"><span><b>{row.games}</b><small>JUNTOS</small></span><span><b>{row.winRate}%</b><small>VITÓRIAS*</small></span></div>
          <div className="mateChampions"><small>MAIS VISTOS</small><b>{row.champions?.map(x=>x.name).join(' · ')||'—'}</b>{row.pairChampions?.[0]&&<em>{row.pairChampions[0].name}</em>}</div>
          <Icon name="arrow"/>
        </button>;
      })}</div>
    </>}

    {!loading&&rows.length>0&&<footer><span>* Resultado da equipe nas partidas da amostra. Não mede “sinergia” nem causalidade.</span><b>ABRA UM JOGADOR PARA VER A RIOT LIFE DELE →</b></footer>}
  </section>;
}
