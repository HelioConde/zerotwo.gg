import { useState } from 'react';
import { Icon, GameBadge } from '../../components/ZeroTwoUI';
import { ValorantConnect } from '../valorant/ValorantConnect';
import { fmtStatNumber, hourLabel } from '../../lib/format';

type PlayerCentralViewProps={
  riot:any;
  riotId:string;
  server:string;
  onSetup:()=>void;
  notice:string;
  publicProfile:any;
  analyzeDna:(force?:boolean)=>void;
  analyzing:boolean;
  mainPublicMode:any;
  soloRank:any;
  history:any;
  openHistory:(deepen:boolean)=>void;
  dna:any;
  activeGame:'lol'|'valorant';
  setActiveGame:(game:'lol'|'valorant')=>void;
};

export function PlayerCentralView({riot,riotId,server,onSetup,notice,publicProfile,analyzeDna,analyzing,mainPublicMode,soloRank,history,openHistory,dna,activeGame,setActiveGame}:PlayerCentralViewProps){
  const [valorantLinked,setValorantLinked]=useState(false);
  const gameSwitch=<div className="playerGameSwitch lifeGameSwitch" role="tablist" aria-label="Jogo ativo">
    <button role="tab" aria-selected={activeGame==='lol'} className={activeGame==='lol'?'active':''} onClick={()=>setActiveGame('lol')}><GameBadge game="lol"/><span><b>LEAGUE</b><small>{riot?'CONECTADO':'CONFIGURAR'}</small></span></button>
    <button role="tab" aria-selected={activeGame==='valorant'} className={activeGame==='valorant'?'active valorant':''} onClick={()=>setActiveGame('valorant')}><GameBadge game="valorant"/><span><b>VALORANT</b><small>{valorantLinked?'CONECTADO':'RSO'}</small></span></button>
  </div>;

  if(activeGame==='valorant')return <div className="loggedLifeView">{gameSwitch}<ValorantConnect expanded onLinkedChange={setValorantLinked} onUseLeague={()=>setActiveGame('lol')}/></div>;

  const topChampion=publicProfile?.summary?.topChampions?.[0]?.name||publicProfile?.championSummaries?.[0]?.name||'—';
  const recent=publicProfile?.matches?.slice?.(0,4)||[];
  const favoriteHour=history?.summary?.favoriteHour;
  const profileUrl=riot?'?player='+encodeURIComponent(riotId)+'&server='+(riot?.platform||'br1'):null;

  return <div className="loggedLifeView">
    {gameSwitch}

    <section className="loggedLifeHero">
      <div className="loggedLifeHeroCopy">
        <small>MINHA RIOT LIFE // {server}</small>
        <h2>{riot?'SUA CONTA ESTÁ':'CONECTE SUA'} <span>{riot?'EM MOVIMENTO.':'RIOT LIFE.'}</span></h2>
        <p>{riot?riotId+' · '+server+'. O ZeroTwo organiza seu momento, sua história e as mudanças que aparecem conforme você joga.':'Informe seu Riot ID para começar a construir sua história.'}</p>
        <div className="loggedLifeHeroActions">
          {profileUrl?<a className="loggedPrimary" href={profileUrl}><Icon name="spark"/> ABRIR MINHA RIOT LIFE PÚBLICA</a>:<button className="loggedPrimary" onClick={onSetup}>CONECTAR RIOT ID →</button>}
          {riot&&<button onClick={()=>analyzeDna(false)} disabled={analyzing}><Icon name="sync"/> {analyzing?'ATUALIZANDO...':'ATUALIZAR LEITURA'}</button>}
        </div>
        {notice&&<small className="clientNotice">{notice}</small>}
      </div>

      <div className="loggedLifeIdentity">
        <span className="loggedLifeGlyph">ZT</span>
        <div><small>IDENTIDADE CONECTADA</small><b>{riot?riotId:'SEM RIOT ID'}</b><em>{riot?server+' · NÍVEL '+(riot.summoner_level??'—'):'Conecte sua conta para começar'}</em></div>
      </div>
    </section>

    {publicProfile?<>
      <section className="loggedNow">
        <header>
          <div><small>AGORA</small><h3>O QUE ESTÁ MAIS FORTE NESTA AMOSTRA.</h3></div>
          <a href={profileUrl||'#'}>VER EXPERIÊNCIA COMPLETA →</a>
        </header>
        <div className="loggedNowGrid">
          <span><small>CONTEXTO</small><b>{publicProfile.summary.mainContext||'—'}</b><em>{publicProfile.summary.matches||0} partidas</em></span>
          <span><small>{mainPublicMode?.name==='ARENA'?'TOP 4':'RESULTADO'}</small><b>{mainPublicMode?.name==='ARENA'&&mainPublicMode.top4Rate!=null?mainPublicMode.top4Rate+'%':publicProfile.summary.winRate!=null?publicProfile.summary.winRate+'%':'—'}</b><em>{mainPublicMode?.name||'amostra recente'}</em></span>
          <span><small>KDA</small><b>{publicProfile.summary.avgKda??'—'}</b><em>média observada</em></span>
          <span><small>ASSINATURA</small><b>{topChampion}</b><em>mais presente</em></span>
          <span><small>RANK</small><b>{soloRank?soloRank.tier+' '+soloRank.rank:'—'}</b><em>{soloRank?soloRank.lp+' LP':'sem rank publicado'}</em></span>
        </div>
      </section>

      <section className="loggedLifeSplit">
        <article className="loggedRecent">
          <header><div><small>ÚLTIMAS PARTIDAS</small><h3>SEU RITMO RECENTE</h3></div><span>{recent.length}</span></header>
          <div>{recent.map((m:any)=><span key={m.id} className={m.win?'win':'loss'}>
            <i/>
            <b>{m.champion}</b>
            <small>{m.context} · {m.kills}/{m.deaths}/{m.assists}</small>
            <em>{m.context==='ARENA'&&m.placement?m.placement+'º':m.win?'VITÓRIA':'DERROTA'}</em>
          </span>)}</div>
          {profileUrl&&<a href={profileUrl}>ABRIR HISTÓRICO COMPLETO →</a>}
        </article>

        <article className="loggedStoryPreview">
          <small>MINHA HISTÓRIA</small>
          <h3>{favoriteHour!=null?'VOCÊ COSTUMA APARECER '+hourLabel(favoriteHour)+'.':'SUA HISTÓRIA ESTÁ SENDO CONSTRUÍDA.'}</h3>
          <p>{history?.modes?.[0]?history.modes[0].name+' domina a amostra ampliada. ':''}{history?.circle?.[0]?'Você voltou a encontrar '+history.circle[0].riotId+' em '+history.circle[0].games+' partidas.':'Abra sua história para aprofundar rotina, modos e mudanças observadas.'}</p>
          <button onClick={()=>openHistory(false)}>ABRIR MINHA HISTÓRIA →</button>
        </article>
      </section>
    </>:riot?<section className="loggedEmptyInsight"><Icon name="sync"/><div><small>PREPARANDO SUA RIOT LIFE</small><b>AINDA ESTAMOS LENDO SUAS PARTIDAS.</b><p>A consulta conectada existe, mas a leitura pública ainda não terminou de carregar.</p></div></section>:null}

    <section className="loggedEvidence">
      <header><div><small>EVIDÊNCIA</small><h3>DADOS QUE SUSTENTAM A LEITURA.</h3></div><span>{dna?dna.matches_analyzed+' '+(dna.matches_analyzed===1?'PARTIDA':'PARTIDAS'):'AGUARDANDO'}</span></header>
      {dna?<div className="loggedEvidenceGrid">
        <span><small>POSIÇÃO</small><b>{dna.primary_position||'—'}</b></span>
        <span><small>KDA MÉDIO</small><b>{dna.metrics?.avgKda??'—'}</b></span>
        <span><small>CS / MIN</small><b>{dna.metrics?.avgCsPerMin??'—'}</b></span>
        <span><small>VISÃO / MIN</small><b>{dna.metrics?.avgVisionPerMin??'—'}</b></span>
        <span><small>DANO / MIN</small><b>{fmtStatNumber(dna.metrics?.avgDamagePerMin)}</b></span>
      </div>:<p>{riot?'A leitura é criada automaticamente a partir das partidas recentes.':'Conecte League para começar.'}</p>}
      {dna?.top_champions?.length>0&&<div className="loggedEvidenceChampions"><small>MAIS JOGADOS</small><b>{dna.top_champions.map((x:any)=>x.name+' · '+x.games+'x').join('   //   ')}</b></div>}
    </section>
  </div>;
}
