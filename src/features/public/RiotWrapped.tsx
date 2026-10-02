import { useMemo, useState } from 'react';
import { Icon } from '../../components/ZeroTwoUI';
import { getLocale } from '../../i18n';

type Props={
  data:any;
  platform:string;
  champions:any;
  ddv:string;
};

type Highlight={
  id:string;
  eyebrow:string;
  title:string;
  value:string;
  detail:string;
  champion?:string|null;
  tone:'pink'|'violet'|'cyan'|'green'|'neutral';
};

const num=(v:any)=>Number.isFinite(Number(v))?Number(v):0;
const at=(m:any)=>{
  const raw=m?.playedAt;
  if(typeof raw==='number')return raw<1e12?raw*1000:raw;
  const parsed=Date.parse(String(raw||''));
  return Number.isFinite(parsed)?parsed:0;
};
const won=(m:any)=>m?.context==='ARENA'
  ?num(m?.placement)>0&&num(m?.placement)<=4
  :Boolean(m?.win);

function counts(rows:any[],get:(row:any)=>string){
  const map=new Map<string,number>();
  rows.forEach(row=>{
    const key=get(row);
    if(key)map.set(key,(map.get(key)||0)+1);
  });
  return [...map.entries()].sort((a,b)=>b[1]-a[1]);
}
function pct(value:number,total:number){return total?Math.round(value/total*100):0}
function avg(rows:any[],get:(row:any)=>number){return rows.length?rows.reduce((sum,row)=>sum+get(row),0)/rows.length:0}
function fmtDate(ts:number){
  return ts?new Intl.DateTimeFormat(getLocale(),{day:'2-digit',month:'short'}).format(new Date(ts)):'—';
}
function streak(matches:any[]){
  let bestWin=0,currentWin=0,bestLoss=0,currentLoss=0;
  [...matches].sort((a,b)=>at(a)-at(b)).forEach(match=>{
    if(won(match)){currentWin++;currentLoss=0;bestWin=Math.max(bestWin,currentWin)}
    else{currentLoss++;currentWin=0;bestLoss=Math.max(bestLoss,currentLoss)}
  });
  return {bestWin,bestLoss};
}

export function RiotWrapped({data,platform,champions,ddv}:Props){
  const [shared,setShared]=useState<'idle'|'done'>('idle');

  const wrapped=useMemo(()=>{
    const matches=[...(data?.matches||[])].filter((m:any)=>at(m)>0).sort((a,b)=>at(b)-at(a));
    if(matches.length<3)return null;

    const championCounts=counts(matches,m=>String(m?.champion||''));
    const contextCounts=counts(matches,m=>String(m?.context||''));
    const topChampion=championCounts[0]||null;
    const topContext=contextCounts[0]||null;
    const uniqueChampions=championCounts.length;
    const best=[...matches].sort((a,b)=>num(b?.kda)-num(a?.kda))[0];
    const {bestWin,bestLoss}=streak(matches);

    const half=Math.max(2,Math.floor(matches.length/2));
    const recent=matches.slice(0,half);
    const older=matches.slice(half);
    const recentKda=avg(recent,m=>num(m?.kda));
    const olderKda=avg(older,m=>num(m?.kda));
    const recentWins=recent.filter(won).length;
    const olderWins=older.filter(won).length;
    const recentRate=pct(recentWins,recent.length);
    const olderRate=pct(olderWins,older.length);
    const kdaDelta=recentKda-olderKda;
    const resultDelta=recentRate-olderRate;

    const highlights:Highlight[]=[];

    if(topChampion){
      highlights.push({
        id:'signature',
        eyebrow:'ASSINATURA DA AMOSTRA',
        title:topChampion[0],
        value:topChampion[1]+'x',
        detail:'Apareceu em '+pct(topChampion[1],matches.length)+'% das '+matches.length+' partidas observadas.',
        champion:topChampion[0],
        tone:'pink'
      });
    }

    if(best){
      highlights.push({
        id:'peak',
        eyebrow:'PICO OBSERVADO',
        title:best.champion||'Melhor partida',
        value:String(best.kda??'—'),
        detail:'Maior KDA da amostra · '+fmtDate(at(best))+(best.context?' · '+best.context:'')+'.',
        champion:best.champion||null,
        tone:'violet'
      });
    }

    if(matches.length>=6&&(Math.abs(kdaDelta)>=.25||Math.abs(resultDelta)>=10)){
      const bothUp=kdaDelta>0&&resultDelta>0;
      const bothDown=kdaDelta<0&&resultDelta<0;
      highlights.push({
        id:'shift',
        eyebrow:'MUDANÇA RECENTE',
        title:bothUp?'A AMOSTRA RECENTE SUBIU':bothDown?'A AMOSTRA RECENTE CAIU':'OS SINAIS RECENTES SE DIVIDIRAM',
        value:(kdaDelta>=0?'+':'')+kdaDelta.toFixed(2),
        detail:'KDA recente vs. parte anterior · '+(resultDelta>=0?'+':'')+resultDelta+' p.p. de resultado.',
        tone:bothUp?'green':bothDown?'neutral':'violet'
      });
    }

    if(topContext){
      highlights.push({
        id:'context',
        eyebrow:'ONDE VOCÊ ESTEVE',
        title:topContext[0],
        value:pct(topContext[1],matches.length)+'%',
        detail:topContext[1]+' de '+matches.length+' partidas vieram deste contexto.',
        tone:'cyan'
      });
    }

    if(uniqueChampions>=4){
      highlights.push({
        id:'variety',
        eyebrow:'VARIEDADE',
        title:uniqueChampions+' CAMPEÕES',
        value:String(uniqueChampions),
        detail:'Número de campeões diferentes encontrados nesta janela.',
        tone:'neutral'
      });
    }else if(bestWin>=2||bestLoss>=2){
      const useWins=bestWin>=bestLoss;
      highlights.push({
        id:'streak',
        eyebrow:'SEQUÊNCIA',
        title:useWins?'MELHOR SEQUÊNCIA DE VITÓRIAS':'MAIOR SEQUÊNCIA DE DERROTAS',
        value:String(useWins?bestWin:bestLoss),
        detail:'Sequência máxima encontrada somente dentro da amostra atual.',
        tone:useWins?'green':'neutral'
      });
    }

    const selected=highlights.slice(0,5);
    const first=matches[matches.length-1],last=matches[0];
    return {
      matches,
      highlights:selected,
      period:fmtDate(at(first))+' → '+fmtDate(at(last)),
      text:[
        'ZEROTWO // RIOT LIFE',
        (data?.player?.gameName||'Player')+'#'+(data?.player?.tagLine||''),
        '',
        ...selected.slice(0,4).map(h=>'• '+h.eyebrow+': '+h.title+' — '+h.value),
        '',
        matches.length+' partidas analisadas · '+fmtDate(at(first))+' → '+fmtDate(at(last))
      ].join('\n')
    };
  },[data]);

  if(!wrapped)return null;
  const shareText=wrapped.text;

  async function share(){
    const url=location.href;
    try{
      if(navigator.share){
        await navigator.share({
          title:'Minha Riot Life no ZeroTwo',
          text:shareText,
          url
        });
      }else if(navigator.clipboard){
        await navigator.clipboard.writeText(shareText+'\n'+url);
      }else return;
      setShared('done');
      window.setTimeout(()=>setShared('idle'),1800);
    }catch{}
  }

  return <section className="riotWrapped">
    <header>
      <div>
        <small>RIOT WRAPPED // AGORA</small>
        <h3>O QUE SUA AMOSTRA <span>ESTÁ DIZENDO HOJE.</span></h3>
        <p>Um resumo rápido e compartilhável dos sinais mais fortes encontrados nas partidas disponíveis. Ele muda junto com sua Riot Life.</p>
      </div>
      <div className="wrappedMeta">
        <span><small>JOGADOR</small><b>{data?.player?.gameName}<em>#{data?.player?.tagLine}</em></b></span>
        <span><small>JANELA</small><b>{wrapped.matches.length}</b><em>{wrapped.period}</em></span>
      </div>
    </header>

    <div className="wrappedCards">
      {wrapped.highlights.map((item,index)=>{
        const champ=item.champion?champions?.[item.champion]:null;
        return <article key={item.id} className={'wrappedCard '+item.tone}>
          {champ&&<img src={'https://ddragon.leagueoflegends.com/cdn/'+ddv+'/img/champion/'+champ.id+'.png'} alt=""/>}
          <div className="wrappedCardShade"/>
          <span className="wrappedNumber">{String(index+1).padStart(2,'0')}</span>
          <div className="wrappedCardCopy">
            <small>{item.eyebrow}</small>
            <h4>{item.title}</h4>
            <b>{item.value}</b>
            <p>{item.detail}</p>
          </div>
        </article>;
      })}
    </div>

    <footer>
      <div><Icon name="spark"/><span><b>WRAPPED PERMANENTE.</b> Não precisa esperar dezembro: sempre que sua amostra mudar, este resumo pode mudar junto.</span></div>
      <button onClick={share}><Icon name={shared==='done'?'check':'arrow'}/>{shared==='done'?'COPIADO / COMPARTILHADO':'COMPARTILHAR MINHA RIOT LIFE'}</button>
    </footer>
  </section>;
}
