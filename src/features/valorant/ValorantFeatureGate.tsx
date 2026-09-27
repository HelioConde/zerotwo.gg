import { GameBadge, Icon } from '../../components/ZeroTwoUI';

const COPY={
  history:{
    eyebrow:'PLAYER 01 // VALORANT // MINHA HISTÓRIA',
    title:'SUA HISTÓRIA DE VALORANT VEM DEPOIS DO RSO.',
    text:'A História precisa ser construída com partidas VALORANT autorizadas pelo próprio jogador. Até essa fonte existir, o ZeroTwo não mistura seu histórico de League com VALORANT.',
    icon:'dna'
  },
  sync:{
    eyebrow:'PLAYER 01 // VALORANT // 02 SYNC',
    title:'SYNC DE VALORANT PRECISA DE PARTIDAS EM COMUM.',
    text:'O 02 Sync só poderá comparar a dupla depois que o matching de VALORANT existir e houver evidência pós-partida suficiente dos dois jogadores.',
    icon:'sync'
  }
} as const;

export function ValorantFeatureGate({feature,onUseLeague}:{feature:'history'|'sync',onUseLeague:()=>void}){
  const c=COPY[feature];
  return <section className="valorantFeatureGate">
    <header><GameBadge game="valorant"/><small>{c.eyebrow}</small><h2>{c.title}</h2><p>{c.text}</p></header>
    <div><Icon name={c.icon}/><span><b>NÃO MISTURAMOS DADOS ENTRE JOGOS</b><small>League continua disponível enquanto a camada VALORANT é concluída.</small></span></div>
    <button onClick={onUseLeague}>← ABRIR ESTA ÁREA NO LEAGUE</button>
  </section>;
}
