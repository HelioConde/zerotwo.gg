import { GameBadge, Icon } from '../../components/ZeroTwoUI';

export function ValorantFeatureGate({feature,onUseLeague}:{feature:'history';onUseLeague:()=>void}){
 return <section className="valorantFeatureGate valorantLifeGate">
  <header><GameBadge game="valorant"/><small>RIOT LIFE // VALORANT // HISTÓRIA</small><h2>SUA HISTÓRIA DE VALORANT COMEÇA <span>DEPOIS DO OPT-IN.</span></h2><p>League e VALORANT continuam separados. A História de VALORANT só pode crescer a partir de partidas autorizadas pelo próprio jogador.</p></header>
  <div><Icon name="dna"/><span><b>NÃO MISTURAMOS MÉTRICAS ENTRE JOGOS.</b><small>Cada fonte mantém sua própria linha do tempo, contexto e regras de acesso.</small></span></div>
  <button onClick={onUseLeague}>← ABRIR HISTÓRIA DO LEAGUE</button>
 </section>;
}
