import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const core=[
['01','Find Your 02','Match adaptativo por intenção, disponibilidade, preferências e gameplay.'],
['02','02 Sync','Depois do match, medimos se a dupla realmente funciona e o sistema aprende.'],
['03','Gaming DNA','Identidade comportamental viva em LoL e VALORANT.'],
['04','02 Lab','Hipóteses e experimentos pessoais baseados no seu histórico.'],
['05','02 AI','Pergunte aos seus dados e receba respostas com evidências.'],
['06','Cross-Game DNA','Descubra padrões do seu estilo que sobrevivem entre jogos.']
];
const universe=['Compatibility Explanation','02 Intent','Squad DNA','Discoveries','Players Like Me','Evolution Paths','Champion / Agent Affinity','My Gaming Universe','Player Journey','02 Challenges','Rivals','02 Experiments','02 Research','02 Wrapped','Gameplay Feed','ZeroTwo Identity','Who’s Looking for 02?','02 Reputation','02 Streak'];
function App(){return <main>
<nav><a className="brand" href="#">ZERO<span>TWO</span><small>.GG</small></a><div className="navlinks"><a href="#core">Produto</a><a href="#universe">Universo 02</a><button>Entrar com Riot</button></div></nav>
<section className="hero"><div className="eyebrow"><i/> LEAGUE OF LEGENDS + VALORANT</div><h1>YOU'RE <em>01.</em><br/>FIND YOUR <span>02.</span></h1><p>Não procure apenas alguém do mesmo elo. Encontre alguém que <strong>funciona com você</strong> — e deixe o ZeroTwo aprender com cada partida da dupla.</p><div className="actions"><button className="primary">Encontrar meu 02 →</button><a className="ghost" href="#core">Ver como funciona</a></div><div className="loop"><b>01</b><span>entender você</span><strong>→</strong><b>02</b><span>prever o match</span><strong>→</strong><b>SYNC</b><span>provar jogando</span><strong>→</strong><b>LEARN</b></div></section>
<section id="core" className="section"><header><span>CORE SYSTEM</span><h2>O match é só o começo.</h2><p>ZeroTwo fecha o ciclo que um LFG comum abandona: prever, conectar, jogar, medir e aprender.</p></header><div className="grid">{core.map((x,i)=><article className={i<3?'hot':''} key={x[1]}><small>{x[0]}</small><h3>{x[1]}</h3><p>{x[2]}</p>{i===0&&<b className="badge">IDEIA PRINCIPAL</b>}</article>)}</div></section>
<section className="sync"><div className="syncCopy"><span>02 SYNC</span><h2>Compatibilidade que precisa ser <em>provada.</em></h2><p>Uma porcentagem bonita não basta. O ZeroTwo transforma compatibilidade em uma hipótese e aprende com as partidas posteriores.</p><ol><li><b>01</b> previsão inicial</li><li><b>02</b> vocês jogam</li><li><b>03</b> Sync mede mudanças</li><li><b>04</b> próximo match melhora</li></ol></div><div className="card"><div className="online">● POSSÍVEL 02</div><small>HÉLIO × PLAYER 02</small><strong>92<sup>%</sup></strong><p>Hipótese de compatibilidade</p><div className="metrics"><span>Gameplay <b>94</b></span><span>Horários <b>97</b></span><span>Playstyle <b>89</b></span><span>Objetivos <b>88</b></span></div><button>Testar em 5 partidas</button><small className="note">Ainda não validado pelo 02 Sync</small></div></section>
<section id="universe" className="section universe"><header><span>PRODUCT UNIVERSE</span><h2>Uma identidade gamer, não outro tracker.</h2><p>Essas capacidades entram conforme o núcleo provar valor. O roadmap pode mudar com dados reais de uso.</p></header><div className="chips">{universe.map((x,i)=><span key={x}><b>{String(i+7).padStart(2,'0')}</b>{x}</span>)}</div></section>
<footer><a className="brand" href="#">ZERO<span>TWO</span><small>.GG</small></a><p>You're 01. Find your 02.</p><small>Produto independente. Não endossado pela Riot Games.</small></footer>
</main>}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);