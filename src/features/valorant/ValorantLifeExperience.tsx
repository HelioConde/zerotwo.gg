import { useMemo } from 'react';
import { GameBadge } from '../../components/ZeroTwoUI';

type Props={profile:any};

const num=(v:any)=>Number(v)||0;
const mean=(values:number[])=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
const pct=(n:number,d:number)=>d?Math.round(n/d*100):0;
const playedAt=(m:any)=>Number(m?.startedAt||0);
const WEEKDAYS=['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];

function sessionize(matches:any[]){
  const rows=[...matches].sort((a,b)=>playedAt(b)-playedAt(a));
  const sessions:any[][]=[];
  for(const match of rows){
    const current=sessions[sessions.length-1];
    if(!current){sessions.push([match]);continue}
    const gap=Math.abs(playedAt(current[current.length-1])-playedAt(match));
    if(gap<=2*60*60*1000)current.push(match);
    else sessions.push([match]);
  }
  return sessions;
}
function topBy(rows:any[],get:(row:any)=>string){
  const map=new Map<string,number>();
  rows.forEach(row=>{const key=get(row);if(key)map.set(key,(map.get(key)||0)+1)});
  return [...map.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';
}
function deviation(values:number[]){
  if(values.length<2)return 0;
  const m=mean(values);
  return Math.sqrt(mean(values.map(v=>(v-m)**2)));
}
function period(ts:number){
  const hour=new Date(ts).getHours();
  if(hour<6)return 'MADRUGADA';
  if(hour<12)return 'MANHÃ';
  if(hour<18)return 'TARDE';
  return 'NOITE';
}
function longestStreak(rows:any[],won:boolean){
  let best=0,current=0;
  [...rows].sort((a,b)=>playedAt(a)-playedAt(b)).forEach(row=>{
    if(row.won===won){current++;best=Math.max(best,current)}else current=0;
  });
  return best;
}
function currentStreak(rows:any[]){
  if(!rows.length)return {won:true,games:0};
  const ordered=[...rows].sort((a,b)=>playedAt(b)-playedAt(a));
  const won=ordered[0].won===true;
  let games=0;
  for(const row of ordered){if((row.won===true)!==won)break;games++}
  return {won,games};
}
function fmtDuration(ms:number){
  const min=Math.max(0,Math.round(ms/60000));
  return min>=60?Math.floor(min/60)+'h '+(min%60)+'m':min+' min';
}
function Chapter({id,number,kicker,title,copy,metrics,children}:{id:string;number:string;kicker:string;title:string;copy:string;metrics:Array<{label:string;value:any;note?:string}>;children?:any}){
  return <section id={id} className="valorantChapter">
    <span className="valorantChapterNumber">{number}</span>
    <div className="valorantChapterCopy"><small>{kicker}</small><h3>{title}</h3><p>{copy}</p></div>
    <div className="valorantChapterMetrics">{metrics.map(metric=><span key={metric.label}><small>{metric.label}</small><b>{metric.value}</b>{metric.note&&<em>{metric.note}</em>}</span>)}</div>
    {children}
  </section>;
}

const CHAPTERS=[
 ['val-now','AGORA'],['val-agent','AGENTE'],['val-map','MAPA'],['val-session','SESSÃO'],['val-aim','MIRA'],
 ['val-damage','DANO'],['val-combat','COMBATE'],['val-score','SCORE'],['val-economy','ECONOMIA'],['val-weapons','ARMAS'],
 ['val-abilities','HABILIDADES'],['val-first','1º DUELO'],['val-rounds','ROUNDS'],['val-multi','MULTIKILLS'],['val-consistency','CONSISTÊNCIA'],
 ['val-streaks','SEQUÊNCIAS'],['val-hours','HORÁRIOS'],['val-duration','DURAÇÃO'],['val-trend','TENDÊNCIA'],['val-evidence','EVIDÊNCIAS']
] as const;

export function ValorantLifeExperience({profile}:Props){
  const matches=useMemo(()=>[...(profile?.matches||[])].sort((a,b)=>playedAt(b)-playedAt(a)),[profile]);
  const summary=profile?.summary||{};
  const sessions=useMemo(()=>sessionize(matches),[matches]);
  const latestSession=sessions[0]||[];

  const data=useMemo(()=>{
    const wins=matches.filter((m:any)=>m.won===true).length;
    const decided=matches.filter((m:any)=>typeof m.won==='boolean').length;
    const topAgent=summary?.topAgents?.[0]?.name||topBy(matches,(m:any)=>m.agent);
    const topMap=summary?.topMaps?.[0]?.name||topBy(matches,(m:any)=>m.map);
    const topQueue=summary?.queues?.[0]?.name||topBy(matches,(m:any)=>m.queueLabel||m.queue);
    const topWeapon=summary?.topWeapons?.[0]?.name||'—';
    const hs=matches.map((m:any)=>m.headshotRate).filter((v:any)=>v!=null).map(Number);
    const adr=matches.map((m:any)=>num(m.damagePerRound)).filter((v:number)=>v>0);
    const acs=matches.map((m:any)=>num(m.scorePerRound)).filter((v:number)=>v>0);
    const kd=matches.map((m:any)=>num(m.kd)).filter((v:number)=>v>0);
    const economy=matches.filter((m:any)=>m.economy?.avgLoadoutValue!=null);
    const abilities=matches.reduce((acc:any,m:any)=>{
      acc.grenade+=num(m.abilities?.grenade);acc.a1+=num(m.abilities?.ability1);acc.a2+=num(m.abilities?.ability2);acc.ult+=num(m.abilities?.ultimate);
      return acc;
    },{grenade:0,a1:0,a2:0,ult:0});
    const firstKills=matches.reduce((s:number,m:any)=>s+num(m.firstKills),0);
    const firstDeaths=matches.reduce((s:number,m:any)=>s+num(m.firstDeaths),0);
    const roundWins=matches.reduce((s:number,m:any)=>s+num(m.roundsWon),0);
    const rounds=matches.reduce((s:number,m:any)=>s+num(m.roundsPlayed),0);
    const multis=matches.reduce((acc:any,m:any)=>{
      acc.two+=num(m.multiKills?.two);acc.three+=num(m.multiKills?.three);acc.four+=num(m.multiKills?.four);acc.aces+=num(m.multiKills?.aces);
      return acc;
    },{two:0,three:0,four:0,aces:0});
    const current=currentStreak(matches);
    const periodMap=new Map<string,any[]>();
    matches.forEach((m:any)=>{const p=period(playedAt(m));periodMap.set(p,[...(periodMap.get(p)||[]),m])});
    const periods=[...periodMap.entries()].map(([name,rows])=>({name,games:rows.length,winRate:pct(rows.filter((m:any)=>m.won===true).length,rows.filter((m:any)=>typeof m.won==='boolean').length),acs:mean(rows.map((m:any)=>num(m.scorePerRound)))})).sort((a,b)=>b.games-a.games);
    const durations=matches.map((m:any)=>num(m.durationMs)).filter((v:number)=>v>0);
    const medianDuration=[...durations].sort((a,b)=>a-b)[Math.floor(durations.length/2)]||0;
    const short=matches.filter((m:any)=>num(m.durationMs)<=medianDuration);
    const long=matches.filter((m:any)=>num(m.durationMs)>medianDuration);
    const recent=matches.slice(0,10),previous=matches.slice(10,20);
    const trend=previous.length>=5?{
      winNow:pct(recent.filter((m:any)=>m.won===true).length,recent.filter((m:any)=>typeof m.won==='boolean').length),
      winOld:pct(previous.filter((m:any)=>m.won===true).length,previous.filter((m:any)=>typeof m.won==='boolean').length),
      acsNow:mean(recent.map((m:any)=>num(m.scorePerRound))),
      acsOld:mean(previous.map((m:any)=>num(m.scorePerRound))),
      adrNow:mean(recent.map((m:any)=>num(m.damagePerRound))),
      adrOld:mean(previous.map((m:any)=>num(m.damagePerRound))),
      hsNow:mean(recent.map((m:any)=>num(m.headshotRate)).filter((v:number)=>v>0)),
      hsOld:mean(previous.map((m:any)=>num(m.headshotRate)).filter((v:number)=>v>0)),
      agentNow:topBy(recent,(m:any)=>m.agent),agentOld:topBy(previous,(m:any)=>m.agent)
    }:null;
    return {
      wins,decided,winRate:decided?pct(wins,decided):0,topAgent,topMap,topQueue,topWeapon,
      hs:mean(hs),adr:mean(adr),acs:mean(acs),kd:mean(kd),acsDev:deviation(acs),
      avgLoadout:mean(economy.map((m:any)=>num(m.economy?.avgLoadoutValue))),
      avgSpent:mean(economy.map((m:any)=>num(m.economy?.avgSpent))),
      abilities,firstKills,firstDeaths,roundWins,rounds,roundWinRate:pct(roundWins,rounds),multis,current,
      bestWinStreak:longestStreak(matches,true),worstStreak:longestStreak(matches,false),periods,
      medianDuration,shortWin:pct(short.filter((m:any)=>m.won===true).length,short.filter((m:any)=>typeof m.won==='boolean').length),
      longWin:pct(long.filter((m:any)=>m.won===true).length,long.filter((m:any)=>typeof m.won==='boolean').length),
      trend
    };
  },[matches,summary]);

  const latestSessionData=useMemo(()=>{
    if(!latestSession.length)return null;
    const decided=latestSession.filter((m:any)=>typeof m.won==='boolean');
    return {
      games:latestSession.length,
      wins:latestSession.filter((m:any)=>m.won===true).length,
      winRate:pct(latestSession.filter((m:any)=>m.won===true).length,decided.length),
      acs:mean(latestSession.map((m:any)=>num(m.scorePerRound))),
      adr:mean(latestSession.map((m:any)=>num(m.damagePerRound))),
      agent:topBy(latestSession,(m:any)=>m.agent),
      duration:fmtDuration(Math.max(0,playedAt(latestSession[0])-playedAt(latestSession[latestSession.length-1])+num(latestSession[latestSession.length-1]?.durationMs)))
    };
  },[latestSession]);

  if(!matches.length)return <section className="valorantLifeStory valorantLifeStoryEmpty"><GameBadge game="valorant"/><small>RIOT LIFE // VALORANT</small><h3>PRONTA PARA RECEBER SUA HISTÓRIA.</h3><p>A conta está conectada, mas ainda não há partidas autorizadas disponíveis para construir os capítulos.</p></section>;

  return <section className="valorantLifeStory">
    <header className="valorantStoryIntro">
      <div><GameBadge game="valorant"/><small>ZEROTWO // RIOT LIFE // VALORANT</small><h2>SEU VALORANT,<br/><span>ALÉM DO PLACAR.</span></h2><p>{matches.length} partidas autorizadas já organizadas em 20 capítulos próprios de VALORANT. A história cresce conforme novas partidas entram no cache.</p></div>
      <div className="valorantStoryCoverage">
        <span><small>AMOSTRA</small><b>{matches.length}</b><em>partidas</em></span>
        <span><small>RESULTADO</small><b>{data.winRate}%</b><em>vitórias</em></span>
        <span><small>ACS</small><b>{Math.round(data.acs)}</b><em>score/round</em></span>
        <span><small>ADR</small><b>{Math.round(data.adr)}</b><em>dano/round</em></span>
      </div>
    </header>

    <nav className="valorantStoryNav" aria-label="Capítulos da Riot Life de VALORANT">
      {CHAPTERS.map(([id,label],index)=><a key={id} href={'#'+id}><span>{String(index+1).padStart(2,'0')}</span><b>{label}</b></a>)}
    </nav>

    <div className="valorantStoryFlow">
      <Chapter id="val-now" number="01" kicker="AGORA // CONTEXTO" title={data.topQueue+' É O PALCO DESTA FASE.'} copy="O modo mais presente define o contexto da leitura recente; as métricas abaixo continuam separadas por VALORANT." metrics={[
        {label:'PARTIDAS',value:matches.length},{label:'RESULTADO',value:data.winRate+'%'},{label:'FILA',value:data.topQueue},{label:'SHARD',value:String(profile?.account?.shard||'').toUpperCase()}
      ]}/>

      <Chapter id="val-agent" number="02" kicker="ASSINATURA // AGENTE" title={data.topAgent+' É QUEM MAIS APARECE.'} copy="Frequência de agente descreve sua fase recente. Não é uma nota de habilidade nem uma recomendação." metrics={[
        {label:'AGENTE',value:data.topAgent},{label:'AGENTES NA AMOSTRA',value:new Set(matches.map((m:any)=>m.agent)).size},{label:'KDA',value:summary?.avgKda??'—'},{label:'KD',value:summary?.avgKd??data.kd.toFixed(2)}
      ]}/>

      <Chapter id="val-map" number="03" kicker="MAPAS // ONDE" title={data.topMap+' É O MAPA MAIS PRESENTE.'} copy="O mapa muda ângulos, economia e ritmo. A Riot Life mantém essa informação separada para comparações futuras." metrics={[
        {label:'MAPA',value:data.topMap},{label:'MAPAS DIFERENTES',value:new Set(matches.map((m:any)=>m.map)).size},{label:'MAIS JOGADO',value:summary?.topMaps?.[0]?.games??'—'}
      ]}/>

      <Chapter id="val-session" number="04" kicker="SESSÃO // ÚLTIMO BLOCO" title={latestSessionData?latestSessionData.games+' PARTIDAS FORMARAM SUA ÚLTIMA SESSÃO.':'AINDA SEM SESSÃO.'} copy="Partidas separadas por até duas horas entram no mesmo bloco para mostrar ritmo sem misturar dias diferentes." metrics={latestSessionData?[
        {label:'JOGOS',value:latestSessionData.games},{label:'RESULTADO',value:latestSessionData.winRate+'%'},{label:'ACS',value:Math.round(latestSessionData.acs)},{label:'ADR',value:Math.round(latestSessionData.adr)},{label:'AGENTE',value:latestSessionData.agent},{label:'DURAÇÃO',value:latestSessionData.duration}
      ]:[]}/>

      <Chapter id="val-aim" number="05" kicker="MIRA // IMPACTO" title="HEADSHOT É CONTEXTO, NÃO UMA NOTA ÚNICA." copy="A taxa é calculada pelos impactos registrados nos rounds. Body e leg shots continuam no backend para aprofundar a leitura depois." metrics={[
        {label:'HEADSHOT',value:data.hs?data.hs.toFixed(1)+'%':'—'},{label:'HEADSHOTS',value:matches.reduce((s:number,m:any)=>s+num(m.headshots),0)},{label:'BODY SHOTS',value:matches.reduce((s:number,m:any)=>s+num(m.bodyshots),0)},{label:'LEG SHOTS',value:matches.reduce((s:number,m:any)=>s+num(m.legshots),0)}
      ]}/>

      <Chapter id="val-damage" number="06" kicker="DANO // ADR" title="QUANTO DANO VOCÊ PRODUZ POR ROUND?" copy="ADR usa o dano registrado round a round, evitando comparar apenas totais de partidas com durações diferentes." metrics={[
        {label:'ADR',value:Math.round(data.adr)},{label:'DANO TOTAL',value:matches.reduce((s:number,m:any)=>s+num(m.damageDealt),0).toLocaleString('pt-BR')},{label:'DANO RECEBIDO',value:matches.reduce((s:number,m:any)=>s+num(m.damageReceived),0).toLocaleString('pt-BR')}
      ]}/>

      <Chapter id="val-combat" number="07" kicker="COMBATE // K/D/A" title="O PLACAR GANHA CONTEXTO QUANDO VIRA MÉDIA." copy="Kills, deaths e assists são agregados à janela, separados do score e do dano." metrics={[
        {label:'KILLS',value:matches.reduce((s:number,m:any)=>s+num(m.kills),0)},{label:'DEATHS',value:matches.reduce((s:number,m:any)=>s+num(m.deaths),0)},{label:'ASSISTS',value:matches.reduce((s:number,m:any)=>s+num(m.assists),0)},{label:'KD',value:(summary?.avgKd??data.kd).toFixed?.(2)||summary?.avgKd},{label:'KDA',value:summary?.avgKda??'—'}
      ]}/>

      <Chapter id="val-score" number="08" kicker="SCORE // ACS" title="SEU SCORE POR ROUND É MAIS COMPARÁVEL QUE O TOTAL." copy="ACS aqui é o score/round retornado a partir dos dados oficiais da partida; não é MMR e não tenta inferir rank oculto." metrics={[
        {label:'ACS',value:Math.round(data.acs)},{label:'PICO',value:Math.round(Math.max(...matches.map((m:any)=>num(m.scorePerRound))))},{label:'DESVIO',value:data.acsDev.toFixed(1),note:'variação entre partidas'}
      ]}/>

      <Chapter id="val-economy" number="09" kicker="ECONOMIA // ROUND" title="QUANTO VALOR PASSA PELO SEU LOADOUT?" copy="A economia é calculada a partir dos dados de cada round. Não classificamos compra como eco/full-buy sem um critério oficial explícito." metrics={[
        {label:'LOADOUT MÉDIO',value:Math.round(data.avgLoadout).toLocaleString('pt-BR')},{label:'GASTO / ROUND',value:Math.round(data.avgSpent).toLocaleString('pt-BR')},{label:'PLANTS',value:summary?.plants??matches.reduce((s:number,m:any)=>s+num(m.plants),0)},{label:'DEFUSES',value:summary?.defuses??matches.reduce((s:number,m:any)=>s+num(m.defuses),0)}
      ]}/>

      <Chapter id="val-weapons" number="10" kicker="ARMAS // ESCOLHAS" title={data.topWeapon+' É A ARMA QUE MAIS APARECE.'} copy="O uso é observado a partir da arma registrada na economia dos rounds. Isso prepara comparativos futuros por agente e mapa." metrics={[
        {label:'MAIS PRESENTE',value:data.topWeapon},{label:'ARMAS DIFERENTES',value:new Set(matches.flatMap((m:any)=>(m.weapons||[]).map((w:any)=>w.name))).size},{label:'ROUNDS MAPEADOS',value:matches.reduce((s:number,m:any)=>s+(m.weapons||[]).reduce((a:number,w:any)=>a+num(w.rounds),0),0)}
      ]}/>

      <Chapter id="val-abilities" number="11" kicker="HABILIDADES // USO" title="AS HABILIDADES TAMBÉM DEIXAM UMA ASSINATURA." copy="Casts são somados sem tentar dizer se foram bons ou ruins. O objetivo é construir contexto por agente ao longo do tempo." metrics={[
        {label:'GRENADE / C',value:data.abilities.grenade},{label:'ABILITY 1 / Q',value:data.abilities.a1},{label:'ABILITY 2 / E',value:data.abilities.a2},{label:'ULTIMATES',value:data.abilities.ult}
      ]}/>

      <Chapter id="val-first" number="12" kicker="PRIMEIRO DUELO // ABERTURA" title="QUEM ESTÁ ABRINDO OS ROUNDS?" copy="Primeiro abate e primeira morte são detectados pelo primeiro evento de kill de cada round disponível no Match-V1." metrics={[
        {label:'FIRST KILLS',value:data.firstKills},{label:'FIRST DEATHS',value:data.firstDeaths},{label:'SALDO',value:(data.firstKills-data.firstDeaths>0?'+':'')+(data.firstKills-data.firstDeaths)}
      ]}/>

      <Chapter id="val-rounds" number="13" kicker="ROUNDS // CONVERSÃO" title="A HISTÓRIA DO VALORANT ACONTECE ROUND A ROUND." copy="A taxa abaixo usa rounds vencidos dentro das partidas observadas, sem converter isso em uma previsão de vitória." metrics={[
        {label:'ROUNDS',value:data.rounds},{label:'VENCIDOS',value:data.roundWins},{label:'CONVERSÃO',value:data.roundWinRate+'%'},{label:'DIFERENÇA MÉDIA',value:summary?.avgRoundDiff??'—'}
      ]}/>

      <Chapter id="val-multi" number="14" kicker="MULTIKILLS // PICO" title="QUANTOS ROUNDS VIRARAM MULTIKILL?" copy="Contamos rounds com 2K, 3K, 4K e 5K. Aces ficam separados para não desaparecer dentro do total." metrics={[
        {label:'2K+',value:data.multis.two},{label:'3K+',value:data.multis.three},{label:'4K+',value:data.multis.four},{label:'ACES',value:data.multis.aces}
      ]}/>

      <Chapter id="val-consistency" number="15" kicker="CONSISTÊNCIA // OSCILAÇÃO" title="SEU ACS SE REPETE OU OSCILA?" copy="Desvio de ACS descreve estabilidade dentro da própria amostra. Menor variação não significa automaticamente melhor desempenho." metrics={[
        {label:'ACS MÉDIO',value:Math.round(data.acs)},{label:'DESVIO ACS',value:data.acsDev.toFixed(1)},{label:'PARTIDAS',value:matches.length}
      ]}/>

      <Chapter id="val-streaks" number="16" kicker="SEQUÊNCIAS // EMBALO" title="QUAL FOI A MAIOR SEQUÊNCIA DE RESULTADOS?" copy="Vitórias e derrotas consecutivas são observadas na ordem real das partidas autorizadas." metrics={[
        {label:'MAIOR VITÓRIA',value:data.bestWinStreak+' jogos'},{label:'MAIOR DERROTA',value:data.worstStreak+' jogos'},{label:'SEQUÊNCIA ATUAL',value:data.current.games+' jogos',note:data.current.won?'vitórias':'derrotas'}
      ]}/>

      <Chapter id="val-hours" number="17" kicker="HORÁRIOS // QUANDO" title={(data.periods[0]?.name||'—')+' É QUANDO VOCÊ MAIS APARECE.'} copy="Faixas do dia usam o horário local do dispositivo e descrevem frequência, não causalidade de desempenho." metrics={[
        {label:'MAIS ATIVO',value:data.periods[0]?.name||'—'},{label:'JOGOS',value:data.periods[0]?.games||0},{label:'RESULTADO',value:data.periods[0]?data.periods[0].winRate+'%':'—'},{label:'ACS',value:data.periods[0]?Math.round(data.periods[0].acs):'—'}
      ]}/>

      <Chapter id="val-duration" number="18" kicker="DURAÇÃO // CURTA OU LONGA" title="O RESULTADO MUDA QUANDO A PARTIDA SE ALONGA?" copy="A mediana da sua própria amostra divide partidas curtas e longas, evitando um corte arbitrário único." metrics={[
        {label:'MEDIANA',value:fmtDuration(data.medianDuration)},{label:'CURTAS',value:data.shortWin+'%',note:'resultado'},{label:'LONGAS',value:data.longWin+'%',note:'resultado'}
      ]}/>

      <Chapter id="val-trend" number="19" kicker="TENDÊNCIA // 10 VS 10" title={data.trend?'AS ÚLTIMAS 10 JÁ PODEM SER COMPARADAS.':'AINDA FALTA HISTÓRICO PARA 10 VS 10.'} copy="A janela curta reage rápido às mudanças, mas continua subordinada à história maior acumulada." metrics={data.trend?[
        {label:'RESULTADO',value:data.trend.winNow+'%',note:'antes '+data.trend.winOld+'%'},{label:'ACS',value:Math.round(data.trend.acsNow),note:'antes '+Math.round(data.trend.acsOld)},{label:'ADR',value:Math.round(data.trend.adrNow),note:'antes '+Math.round(data.trend.adrOld)},{label:'HEADSHOT',value:data.trend.hsNow.toFixed(1)+'%',note:'antes '+data.trend.hsOld.toFixed(1)+'%'},{label:'AGENTE',value:data.trend.agentNow,note:'antes '+data.trend.agentOld}
      ]:[{label:'AMOSTRA',value:matches.length},{label:'STATUS',value:'EM FORMAÇÃO'}]}/>

      <Chapter id="val-evidence" number="20" kicker="EVIDÊNCIAS // PARTIDAS" title="OS CAPÍTULOS VOLTAM PARA AS PARTIDAS." copy="A leitura é sempre derivada dos dados autorizados. Abra o histórico para conferir agente, mapa, score, mira e rounds de cada partida." metrics={[
        {label:'CACHE',value:profile?.cache?.accumulated??matches.length,note:'partidas acumuladas'},{label:'NOVAS AGORA',value:profile?.cache?.fetchedNow??0},{label:'OBSERVADAS AGORA',value:profile?.cache?.observedNow??matches.length},{label:'LIMITE',value:profile?.cache?.requested??100}
      ]}>
        <div className="valorantEvidenceMatches">{matches.slice(0,8).map((m:any)=><article key={m.id} className={m.won===true?'win':m.won===false?'loss':''}><div><small>{m.queueLabel} · {m.map}</small><b>{m.agent}</b></div><span><b>{m.kills}/{m.deaths}/{m.assists}</b><small>K/D/A</small></span><span><b>{Math.round(num(m.scorePerRound))}</b><small>ACS</small></span><span><b>{Math.round(num(m.damagePerRound))}</b><small>ADR</small></span><span><b>{m.headshotRate!=null?m.headshotRate+'%':'—'}</b><small>HS</small></span><em>{m.won===true?'VITÓRIA':m.won===false?'DERROTA':'—'}</em></article>)}</div>
      </Chapter>
    </div>
  </section>;
}
