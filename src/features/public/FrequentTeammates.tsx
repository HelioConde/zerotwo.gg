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
  lastPlayedAt:number;
  champions:Array<{name:string;games:number}>;
  positions:Array<{name:string;games:number}>;
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

  useEffect(()=>{
    const el=root.current;
    if(!el||attempted||!matchIds.length)return;
    const observer=new IntersectionObserver(entries=>{
      if(!entries.some(x=>x.isIntersecting))return;
      observer.disconnect();
      setAttempted(true);
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
          setRows(result.teammates);
          setAnalyzed(Number(result.matchesAnalyzed||0));
        }
      }).finally(()=>setLoading(false));
    },{rootMargin:'240px'});
    observer.observe(el);
    return()=>observer.disconnect();
  },[attempted,data,matchIds,platform]);

  function openPlayer(riotId:string){
    const url=location.pathname+'?player='+encodeURIComponent(riotId)+'&server='+encodeURIComponent(platform);
    location.href=url;
  }

  if(attempted&&!loading&&!rows.length)return null;

  return <section className="frequentTeammates" ref={root}>
    <header>
      <div><small>RECURRING PLAYERS</small><h3>COM QUEM VOCÊ <span>MAIS JOGA?</span></h3><p>Companheiros que mais se repetiram nas partidas recentes analisadas. É frequência observada, não uma lista de amigos.</p></div>
      <div className="teammateSample"><small>AMOSTRA</small><b>{analyzed||matchIds.length}</b><em>partidas</em></div>
    </header>
    {loading?<div className="teammatesLoading"><Icon name="sync"/><b>PROCURANDO JOGADORES RECORRENTES...</b></div>:
    <div className="teammateGrid">{rows.slice(0,6).map((row,index)=><button key={row.riotId} onClick={()=>openPlayer(row.riotId)}>
      <span className="mateRank">{String(index+1).padStart(2,'0')}</span>
      <div className="mateIdentity"><small>JOGADOR RECORRENTE</small><b>{row.gameName}<em>#{row.tagLine}</em></b><span>Última vez juntos · {when(row.lastPlayedAt)}</span></div>
      <div className="mateNumbers"><span><b>{row.games}</b><small>JUNTOS</small></span><span><b>{row.winRate}%</b><small>VITÓRIAS*</small></span></div>
      <div className="mateChampions"><small>MAIS VISTOS</small><b>{row.champions?.map(x=>x.name).join(' · ')||'—'}</b></div>
      <Icon name="arrow"/>
    </button>)}</div>}
    {!loading&&rows.length>0&&<footer><span>* Resultado da equipe nas partidas da amostra. Não mede “sinergia” nem causalidade.</span><b>ABRA UM JOGADOR PARA VER A RIOT LIFE DELE →</b></footer>}
  </section>;
}
