import { useMemo, useState } from 'react';
import { Icon } from '../../components/ZeroTwoUI';

type Props={data:any};

type Question={id:string;prompt:string;options:string[];answer:string;note:string};

function countBy<T>(rows:T[],get:(row:T)=>string){
  const map=new Map<string,number>();
  rows.forEach(row=>{const key=get(row);if(key)map.set(key,(map.get(key)||0)+1)});
  return [...map.entries()].sort((a,b)=>b[1]-a[1]);
}
function uniq<T>(rows:T[]){return [...new Set(rows)]}

export function RiotArcade({data}:Props){
  const questions=useMemo<Question[]>(()=>{
    const matches=data?.matches||[];
    const qs:Question[]=[];
    const champions=countBy(matches,(m:any)=>m.champion||'');
    if(champions.length>=2){
      const options=champions.slice(0,3).map(x=>x[0]);
      qs.push({id:'champion',prompt:'QUAL CAMPEÃO MAIS APARECEU NESTA AMOSTRA?',options,answer:champions[0][0],note:champions[0][0]+' apareceu '+champions[0][1]+'x.'});
    }
    const modes=countBy(matches,(m:any)=>m.context||'');
    if(modes.length>=2){
      const options=modes.slice(0,3).map(x=>x[0]);
      qs.push({id:'mode',prompt:'QUAL CONTEXTO DOMINOU SUAS PARTIDAS?',options,answer:modes[0][0],note:modes[0][0]+' foi o contexto mais frequente: '+modes[0][1]+' partidas.'});
    }
    const kdas=uniq(matches.map((m:any)=>Number(m.kda)).filter((x:number)=>Number.isFinite(x))).sort((a,b)=>b-a);
    if(kdas.length>=2){
      const options=kdas.slice(0,3).map(x=>String(x));
      qs.push({id:'kda',prompt:'QUAL FOI O MAIOR KDA OBSERVADO EM UMA PARTIDA?',options,answer:String(kdas[0]),note:'O maior KDA da amostra foi '+kdas[0]+'.'});
    }
    const damages=uniq(matches.map((m:any)=>Math.round(Number(m.damage||0)/100)/10).filter((x:number)=>x>0)).sort((a,b)=>b-a);
    if(damages.length>=2&&qs.length<3){
      const options=damages.slice(0,3).map(x=>x+'k');
      qs.push({id:'damage',prompt:'QUAL FOI O MAIOR DANO OBSERVADO?',options,answer:String(damages[0])+'k',note:'O pico observado foi '+damages[0]+'k de dano.'});
    }
    return qs.slice(0,3);
  },[data]);

  const [answers,setAnswers]=useState<Record<string,string>>({});
  const answered=Object.keys(answers).length;
  const score=questions.filter(q=>answers[q.id]===q.answer).length;
  if(!questions.length)return null;
  const active=questions.find(q=>!answers[q.id])||questions[questions.length-1];
  const finished=answered>=questions.length;

  return <section className="riotArcade">
    <header><div><small>RIOT CHALLENGES ARCADE</small><h3>VOCÊ CONHECE O SEU <span>PRÓPRIO HISTÓRICO?</span></h3><p>Um minijogo curto criado apenas com fatos encontrados nas suas partidas atuais.</p></div><div className="arcadeScore"><small>PLACAR</small><b>{score}/{questions.length}</b><em>{finished?'final':'em andamento'}</em></div></header>
    {!finished?<div className="arcadeGame">
      <div className="arcadeProgress">{questions.map((q,i)=><i key={q.id} className={answers[q.id]?(answers[q.id]===q.answer?'correct':'wrong'):q.id===active.id?'active':''}><span>{i+1}</span></i>)}</div>
      <small>PERGUNTA {answered+1} DE {questions.length}</small>
      <h4>{active.prompt}</h4>
      <div className="arcadeOptions">{active.options.map(option=><button key={option} onClick={()=>setAnswers(v=>({...v,[active.id]:option}))}>{option}</button>)}</div>
    </div>:<div className="arcadeResult"><Icon name={score===questions.length?'spark':'check'}/><small>RESULTADO</small><b>{score===questions.length?'VOCÊ SABE EXATAMENTE O QUE ANDA FAZENDO.':score===0?'SEU HISTÓRICO TE SURPREENDEU.':'VOCÊ CONHECIA PARTE DA HISTÓRIA.'}</b><p>{questions.map(q=>q.note).join(' ')}</p><button onClick={()=>setAnswers({})}>JOGAR DE NOVO ↻</button></div>}
  </section>;
}
