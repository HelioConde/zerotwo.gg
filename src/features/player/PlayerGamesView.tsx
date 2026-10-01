import { GameBadge } from '../../components/ZeroTwoUI';
import { ValorantConnect } from '../valorant/ValorantConnect';

export function PlayerGamesView({riot,riotId,server,onSetup,activeGame,setActiveGame}:{riot:any;riotId:string;server:string;onSetup:()=>void;activeGame:'lol'|'valorant';setActiveGame:(game:'lol'|'valorant')=>void}){
  return <section className="loggedSimpleView">
    <header><small>JOGOS // FONTES</small><h2>SUAS FONTES <span>RIOT.</span></h2><p>Conecte jogos para ampliar a Riot Life. Cada integração mantém suas próprias regras de acesso e privacidade.</p></header>
    <div className="loggedGamesGrid">
      <article className={riot?'connected':''}>
        <GameBadge game="lol"/>
        <div><small>LEAGUE OF LEGENDS</small><h3>{riot?'CONECTADO':'NÃO CONECTADO'}</h3><p>{riot?riotId+' · '+server+' · nível '+(riot.summoner_level??'—'):'Use seu Riot ID para ativar a leitura pública e conectada.'}</p></div>
        <button onClick={riot?()=>setActiveGame('lol'):onSetup}>{riot?'USAR LEAGUE':'CONECTAR LEAGUE'}</button>
      </article>
      <article>
        <GameBadge game="valorant"/>
        <div><small>VALORANT</small><h3>RIOT SIGN ON</h3><p>Dados pessoais de VALORANT exigem autorização do próprio jogador. A integração permanece separada da busca pública de League.</p></div>
        <button onClick={()=>setActiveGame('valorant')}>ABRIR VALORANT</button>
      </article>
    </div>
    {activeGame==='valorant'&&<div className="loggedValorantConnect"><ValorantConnect expanded onUseLeague={()=>setActiveGame('lol')}/></div>}
  </section>;
}
