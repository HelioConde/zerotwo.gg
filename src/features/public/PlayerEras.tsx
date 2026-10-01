import { useMemo } from 'react';
import { Icon } from '../../components/ZeroTwoUI';

type Props={data:any;champions:any;ddv:string};

type Era={
  index:number;
  matches:any[];
  start:number;
  end:number;
  games:number;
  wins:number;
  resultRate:number;
  avgKda:number;
  champion:string|null;
  championGames:number;
  context:string|null;
  position:string|null;
  boundary:'natural'|'sample';
};

const num=(v:any)=>Number.isFinite(Number(v))?Number(v):0;
const ts=(m:any)=>{
  const raw=m?.playedAt;
  if(typeof raw==='number')return raw<1e12?raw*1000:raw;
  const parsed=Date.parse(String(raw||''));
  return Number.isFinite(parsed)?parsed:0;
};
function top(rows:any[],get:(row:any)=>string){
  const counts=new Map<string,number>();
  rows.forEach(row=>{const key=get(row);if(key)counts.set(key,(counts.get(key)||0)+1)});
  return [...counts.entries()].sort((a,b)=>b[1]-a[1])[0]||null;
}
function median(values:number[]){
  if(!values.length)return 0;
  const sorted=[...values].sort((a,b)=>a-b);
  const mid=Math.floor(sorted.length/2);
  return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;
}
function fmtDate(value:number){
  if(!value)return '—';
  return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(value));
}
function resultWon(match:any){
  return match?.context==='ARENA'
    ?num(match?.placement)>0&&num(match?.placement)<=4
    :Boolean(match?.win);
}
function summarize(matches:any[],index:number,boundary:'natural'|'sample'):Era{
  const champ=top(matches,m=>String(m?.champion||''));
  const context=top(matches,m=>String(m?.context||''));
  const position=top(matches,m=>String(m?.position||''));
  const wins=matches.filter(resultWon).length;
  return {
    index,
    matches,
    start:ts(matches[0]),
    end:ts(matches[matches.length-1]),
    games:matches.length,
    wins,
    resultRate:matches.length?Math.round(wins/matches.length*100):0,
    avgKda:matches.length?matches.reduce((sum,m)=>sum+num(m?.kda),0)/matches.length:0,
    champion:champ?.[0]||null,
    championGames:champ?.[1]||0,
    context:context?.[0]||null,
    position:position?.[0]||null,
    boundary
  };
}

function buildEras(matches:any[]):Era[]{
  const ordered=[...matches].filter(m=>ts(m)>0).sort((a,b)=>ts(a)-ts(b));
  if(ordered.length<6)return [];

  const gaps=ordered.slice(1).map((match,i)=>({
    index:i+1,
    gap:ts(match)-ts(ordered[i])
  })).filter(x=>x.gap>0);

  const med=median(gaps.map(x=>x.gap));
  const naturalThreshold=Math.max(48*60*60*1000,med*3);
  const natural=gaps
    .filter(x=>x.gap>=naturalThreshold)
    .sort((a,b)=>b.gap-a.gap)
    .slice(0,2)
    .map(x=>x.index)
    .sort((a,b)=>a-b);

  let cuts=natural;
  let boundary:'natural'|'sample'='natural';

  if(!cuts.length){
    boundary='sample';
    const count=ordered.length>=10?3:2;
    cuts=[];
    for(let i=1;i<count;i++)cuts.push(Math.round(ordered.length*i/count));
  }else if(cuts.length===1&&ordered.length>=11){
    const left=cuts[0],right=ordered.length-cuts[0];
    if(Math.min(left,right)>=5){
      const largestSide=left>=right?'left':'right';
      const extra=largestSide==='left'?Math.round(left/2):cuts[0]+Math.round(right/2);
      cuts=[...cuts,extra].sort((a,b)=>a-b);
      boundary='sample';
    }
  }

  const points=[0,...cuts,ordered.length];
  return points.slice(0,-1)
    .map((start,i)=>summarize(ordered.slice(start,points[i+1]),i,boundary))
    .filter(era=>era.games>=2);
}

export function PlayerEras({data,champions,ddv}:Props){
  const eras=useMemo(()=>buildEras(data?.matches||[]),[data]);
  if(eras.length<2)return null;

  const first=eras[0];
  const latest=eras[eras.length-1];
  const champChanged=first.champion&&latest.champion&&first.champion!==latest.champion;
  const contextChanged=first.context&&latest.context&&first.context!==latest.context;
  const kdaDelta=latest.avgKda-first.avgKda;
  const resultDelta=latest.resultRate-first.resultRate;
  const hasNatural=eras.some(e=>e.boundary==='natural');

  let headline='SUA AMOSTRA TEM CAPÍTULOS DIFERENTES.';
  if(champChanged)headline='SEU FOCO DE CAMPEÃO MUDOU.';
  else if(contextChanged)headline='VOCÊ MUDOU O TIPO DE PARTIDA QUE DOMINAVA.';
  else if(Math.abs(kdaDelta)>=.5)headline='O MESMO PERFIL APARECEU COM OUTRO RITMO.';

  return <section className="playerEras">
    <header>
      <div>
        <small>PLAYER ERAS // HISTÓRIA DA AMOSTRA</small>
        <h3>{headline}</h3>
        <p>{hasNatural?'As divisões priorizam pausas reais entre partidas.':'Não encontramos uma pausa temporal forte, então dividimos a amostra em capítulos cronológicos equivalentes.'} Isso descreve somente os jogos disponíveis nesta consulta.</p>
      </div>
      <div className="erasShift">
        <small>DO PRIMEIRO AO ÚLTIMO CAPÍTULO</small>
        <span><b>{kdaDelta>=0?'+':''}{kdaDelta.toFixed(2)}</b><em>KDA</em></span>
        <span><b>{resultDelta>=0?'+':''}{resultDelta} p.p.</b><em>RESULTADO</em></span>
      </div>
    </header>

    <div className="erasTrack">
      {eras.map((era,index)=>{
        const champ=era.champion?champions?.[era.champion]:null;
        const label=index===eras.length-1?'FASE ATUAL':index===0?'INÍCIO DA AMOSTRA':'TRANSIÇÃO';
        return <article key={era.index} className={index===eras.length-1?'current':''}>
          <div className="eraVisual">
            {champ&&<img src={'https://ddragon.leagueoflegends.com/cdn/'+ddv+'/img/champion/'+champ.id+'.png'} alt=""/>}
            <span>{String(index+1).padStart(2,'0')}</span>
          </div>
          <div className="eraCopy">
            <small>{label} · {fmtDate(era.start)} → {fmtDate(era.end)}</small>
            <h4>{era.champion||'SEM CAMPEÃO DOMINANTE'}</h4>
            <p>
              {era.champion&&<><strong>{era.champion}</strong> apareceu em {era.championGames} de {era.games} partidas. </>}
              {era.context&&<>O contexto dominante foi <strong>{era.context}</strong>{era.position?' em '+era.position:''}.</>}
            </p>
            <div className="eraStats">
              <span><b>{era.games}</b><small>PARTIDAS</small></span>
              <span><b>{era.resultRate}%</b><small>{era.context==='ARENA'?'TOP 4':'RESULTADO'}</small></span>
              <span><b>{era.avgKda.toFixed(2)}</b><small>KDA</small></span>
            </div>
          </div>
          {index<eras.length-1&&<div className="eraConnector"><Icon name="arrow"/><small>{era.boundary==='natural'?'PAUSA DETECTADA':'PRÓXIMO CAPÍTULO'}</small></div>}
        </article>;
      })}
    </div>

    <footer>
      <Icon name="dna"/>
      <span><b>ERA NÃO É RÓTULO PERMANENTE.</b> É uma forma visual de organizar mudanças observadas em uma janela limitada de partidas.</span>
    </footer>
  </section>;
}
