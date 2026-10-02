import { useMemo, useState } from 'react';
import { getLocale } from '../../i18n';

type Props={data:any;champions:any;ddv:string};

const num=(v:any)=>Number.isFinite(Number(v))?Number(v):0;
const playedAt=(m:any)=>{
  const raw=m?.playedAt;
  if(typeof raw==='number') return raw<1e12?raw*1000:raw;
  const parsed=Date.parse(String(raw||''));
  return Number.isFinite(parsed)?parsed:0;
};
const date=(ts:number)=>ts?new Intl.DateTimeFormat(getLocale(),{day:'2-digit',month:'short',year:'numeric'}).format(new Date(ts)):'—';

export function ChampionCareer({data,champions,ddv}:Props){
  const careers=useMemo(()=>{
    const map=new Map<string,any>();
    (data?.matches||[]).forEach((m:any)=>{
      const name=m.champion||'Desconhecido';
      const row=map.get(name)||{name,games:[],wins:0,standardGames:0,top4:0,arenaGames:0,kda:0,kills:0,deaths:0,assists:0,damage:0};
      row.games.push(m);row.kda+=num(m.kda);row.kills+=num(m.kills);row.deaths+=num(m.deaths);row.assists+=num(m.assists);row.damage+=num(m.damage);
      if(m.context==='ARENA'){row.arenaGames++;if(num(m.placement)>0&&num(m.placement)<=4)row.top4++}
      else{row.standardGames++;if(m.win)row.wins++}
      map.set(name,row);
    });
    return [...map.values()].map(row=>{
      row.games.sort((a:any,b:any)=>playedAt(b)-playedAt(a));
      const mastery=(data?.mastery||[]).find((m:any)=>champions?.[String(m.championId)]?.name===row.name);
      const best=[...row.games].sort((a:any,b:any)=>num(b.kda)-num(a.kda))[0];
      const current=champions?.[row.name];
      return {
        ...row,
        count:row.games.length,
        avgKda:row.games.length?row.kda/row.games.length:0,
        avgDamage:row.games.length?row.damage/row.games.length:0,
        resultLabel:row.arenaGames>row.standardGames?'TOP 4':'WIN RATE',
        resultRate:row.arenaGames>row.standardGames?(row.arenaGames?Math.round(row.top4/row.arenaGames*100):0):(row.standardGames?Math.round(row.wins/row.standardGames*100):0),
        first:row.games[row.games.length-1],
        last:row.games[0],
        best,
        mastery,
        id:current?.id||null
      };
    }).sort((a,b)=>b.count-a.count||b.avgKda-a.avgKda).slice(0,6);
  },[data,champions]);

  const [selectedName,setSelectedName]=useState<string|null>(null);
  const selected=careers.find(x=>x.name===selectedName)||careers[0]||null;
  if(!selected)return null;

  return <section className="championCareer">
    <header>
      <div><small>CHAMPION CAREER // CARREIRA OBSERVADA</small><h3>SUA HISTÓRIA COM <span>{selected.name.toUpperCase()}</span>.</h3><p>Esta carreira usa somente as partidas presentes na amostra atual e a maestria oficial encontrada. Não fingimos ter toda a sua história.</p></div>
      <div className="careerRoster">{careers.map(c=><button key={c.name} className={selected.name===c.name?'active':''} onClick={()=>setSelectedName(c.name)}>{c.id&&<img src={'https://ddragon.leagueoflegends.com/cdn/'+ddv+'/img/champion/'+c.id+'.png'} alt=""/>}<span><b>{c.name}</b><small>{c.count}x</small></span></button>)}</div>
    </header>
    <div className="careerBody">
      <div className="careerPortrait">{selected.id&&<img src={'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/'+selected.id+'_0.jpg'} alt=""/>}<div><small>ASSINATURA OBSERVADA</small><b>{selected.name}</b><span>{selected.count} partidas na amostra</span></div></div>
      <div className="careerStory">
        <div className="careerStats">
          <span><small>{selected.resultLabel}</small><b>{selected.resultRate}%</b></span>
          <span><small>KDA MÉDIO</small><b>{selected.avgKda.toFixed(2)}</b></span>
          <span><small>DANO MÉDIO</small><b>{Math.round(selected.avgDamage/100)/10}k</b></span>
          <span><small>MAESTRIA</small><b>{selected.mastery?Number(selected.mastery.points).toLocaleString(getLocale()):'—'}</b></span>
        </div>
        <div className="careerTimeline">
          <span><small>PRIMEIRA NA AMOSTRA</small><b>{date(playedAt(selected.first))}</b><em>{selected.first?.context||'—'}</em></span>
          <i/>
          <span><small>MAIS RECENTE</small><b>{date(playedAt(selected.last))}</b><em>{selected.last?.context||'—'}</em></span>
          <i/>
          <span><small>MELHOR KDA OBSERVADO</small><b>{selected.best?.kda??'—'}</b><em>{date(playedAt(selected.best))}</em></span>
        </div>
        <p>Na amostra, você somou <strong>{Math.round(selected.kills)} abates</strong>, <strong>{Math.round(selected.assists)} assistências</strong> e apareceu com {selected.name} em <strong>{selected.count}</strong> partidas.</p>
      </div>
    </div>
  </section>;
}
