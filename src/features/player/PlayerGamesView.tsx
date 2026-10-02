import { GameBadge } from '../../components/ZeroTwoUI';

export function PlayerGamesView({riot,riotId,server,onSetup}:{riot:any;riotId:string;server:string;onSetup:()=>void}){
  return <section className="loggedSimpleView">
    <header><small>JOGOS // FONTE ATUAL</small><h2>LEAGUE OF LEGENDS <span>ATIVO.</span></h2><p>Nesta versão do ZeroTwo, a Riot Life usa somente dados de League of Legends.</p></header>
    <div className="loggedGamesGrid leagueOnlyGrid">
      <article className={riot?'connected':''}>
        <GameBadge game="lol"/>
        <div><small>LEAGUE OF LEGENDS</small><h3>{riot?'CONECTADO':'NÃO CONECTADO'}</h3><p>{riot?riotId+' · '+server+' · nível '+(riot.summoner_level??'—'):'Use seu Riot ID para ativar a leitura pública e conectada.'}</p></div>
        <button onClick={onSetup}>{riot?'ATUALIZAR RIOT ID':'CONECTAR LEAGUE'}</button>
      </article>
    </div>
  </section>;
}
