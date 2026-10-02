import { Icon, GameBadge } from '../../components/ZeroTwoUI';
import { getLocale } from '../../i18n';

type Sync02ViewProps={
  syncLoading:boolean;
  connections:any[];
  gamerName:string;
  riotId:string;
  openSync:()=>void;
  duoFeedback:Record<string,string>;
  rateDuo:(connection:any,verdict:'play_again'|'not_a_fit')=>void;
  setView:(view:any)=>void;
};

function plural(n:number,one:string,many:string){
  return n===1?one:many;
}

function observedContext(connection:any){
  const contexts=Array.isArray(connection?.sync?.metrics?.contexts)?connection.sync.metrics.contexts:[];
  return [...contexts].sort((a:any,b:any)=>Number(b?.games||0)-Number(a?.games||0))[0]||null;
}

function hypothesisCopy(connection:any){
  const mode=connection.matchedMode&&connection.matchedMode!=='ANY'?connection.matchedMode:'qualquer modo';
  return connection.searchType==='RECURRING'
    ? `Testar se vocês querem repetir ${mode} ao longo de outras sessões.`
    : `Testar se vocês funcionam juntos em ${mode} nesta sessão.`;
}

function observationCopy(connection:any){
  const total=Number(connection?.sync?.matches_together||0);
  if(!total)return 'Ainda não existe partida compartilhada para comparar com a hipótese inicial.';
  const observed=observedContext(connection);
  const intended=String(connection.matchedMode||'ANY').toUpperCase();
  if(observed?.name){
    const observedName=String(observed.name).toUpperCase();
    if(intended==='ANY')return `A primeira evidência apareceu em ${observedName}. Agora o Sync pode acompanhar se esse contexto se repete.`;
    if(observedName===intended)return `A intenção inicial era ${intended}, e esse contexto já apareceu nas partidas encontradas juntos.`;
    return `A intenção inicial era ${intended}, mas as partidas encontradas juntos aconteceram principalmente em ${observedName}. O contexto real mudou.`;
  }
  return `O ZeroTwo encontrou ${total} ${plural(total,'partida compartilhada','partidas compartilhadas')}. Ainda falta contexto suficiente para dizer como esse padrão evolui.`;
}

function sampleLabel(total:number){
  if(total<=0)return 'SEM EVIDÊNCIA';
  if(total<3)return 'PRIMEIROS SINAIS';
  return 'AMOSTRA INICIAL';
}

export function Sync02View({syncLoading,connections,gamerName,riotId,openSync,duoFeedback,rateDuo,setView}:Sync02ViewProps){
  return <section className="syncView syncLearningView">
    <header>
      <div>
        <small>ZEROTWO // 02 SYNC</small>
        <h2>O MATCH ERA A HIPÓTESE.<br/><span>AGORA VEM A EVIDÊNCIA.</span></h2>
        <p>O Sync procura partidas realmente jogadas juntos depois da conexão. Ele mostra o que aconteceu sem transformar poucas partidas em uma nota definitiva.</p>
      </div>
      <button className="syncRefresh" onClick={openSync} disabled={syncLoading}><Icon name="sync"/> {syncLoading?'PROCURANDO PARTIDAS...':'ATUALIZAR EVIDÊNCIA'}</button>
    </header>

    {syncLoading?<div className="clientLoading">PROCURANDO PARTIDAS DA DUPLA<span>...</span></div>
    :connections.length?<div className="syncConnections">
      {connections.map(c=>{
        const total=Number(c.sync?.matches_together||0);
        const wins=Number(c.sync?.wins_together||0);
        const losses=Number(c.sync?.losses_together||0);
        const newMatches=Number(c._newMatches||0);
        const observed=observedContext(c);
        const contexts=Array.isArray(c.sync?.metrics?.contexts)?c.sync.metrics.contexts:[];
        const championPairs=Array.isArray(c.sync?.metrics?.championPairs)?c.sync.metrics.championPairs:[];
        const feedback=duoFeedback[c.connectionId];

        return <article className="syncJourneyCard syncLearningCard" key={c.connectionId}>
          {c.labMode&&<div className="labConnectionNotice">LAB // CONEXÃO DE DEMONSTRAÇÃO · ESTE PLAYER 02 NÃO É UMA PESSOA REAL</div>}
          {newMatches>0&&<div className="syncNewEvidence"><Icon name="spark"/><b>{newMatches} {plural(newMatches,'NOVA PARTIDA JUNTOS','NOVAS PARTIDAS JUNTOS')}</b><span>desde sua última visita ao Sync</span></div>}

          <div className="syncOrigin">
            <span>{c.searchType==='RECURRING'?'PARCERIA RECORRENTE':'SESSÃO AGORA'} // <b>{c.matchedMode==='ANY'?'QUALQUER MODO':c.matchedMode||'QUALQUER MODO'}</b></span>
            <em>MATCH EM {new Date(c.matchedAt).toLocaleDateString(getLocale())}</em>
          </div>

          <div className="syncIdentity">
            <div className="syncPerson"><span>01</span><div><small>PLAYER 01</small><b>{gamerName}</b><GameBadge game="lol" label={riotId}/></div></div>
            <div className="syncLink"><Icon name="sync"/><b>02 SYNC</b><small>{total?sampleLabel(total):'PRONTO PARA TESTAR'}</small></div>
            <div className="syncPerson player02"><span>02</span><div><small>PLAYER 02</small><b>{c.player02.nickname}</b><GameBadge game="lol" label={c.player02.riotId||'LEAGUE OF LEGENDS'}/>{c.player02.riotId&&<button className="copyRiotId" onClick={()=>navigator.clipboard.writeText(c.player02.riotId)}>COPIAR RIOT ID</button>}</div></div>
          </div>

          <div className="syncLearningFlow">
            <section className="syncHypothesis">
              <small>01 // HIPÓTESE INICIAL</small>
              <b>{c.searchType==='RECURRING'?'VOCÊS SE CONECTARAM PARA TESTAR UMA PARCERIA.':'VOCÊS SE CONECTARAM PARA TESTAR UMA SESSÃO.'}</b>
              <p>{hypothesisCopy(c)}</p>
            </section>
            <span className="syncFlowArrow">→</span>
            <section className={total?'syncObservation hasEvidence':'syncObservation'}>
              <small>02 // O QUE ACONTECEU</small>
              <b>{total?`${total} ${plural(total,'PARTIDA JUNTOS ENCONTRADA','PARTIDAS JUNTOS ENCONTRADAS')}`:'AINDA SEM PARTIDA JUNTOS'}</b>
              <p>{observationCopy(c)}</p>
            </section>
            <span className="syncFlowArrow">→</span>
            <section className={total>=3?'syncLearning active':'syncLearning'}>
              <small>03 // APRENDIZADO</small>
              <b>{sampleLabel(total)}</b>
              <p>{total>=3?'Já existe uma amostra inicial para acompanhar tendências simples. Ainda não é um veredito de compatibilidade.':total?'O Sync começou a observar a dupla, mas ainda precisa de mais partidas para procurar repetição.':'O aprendizado começa quando houver evidência real de vocês jogando no mesmo time.'}</p>
            </section>
          </div>

          {total>0?<>
            <div className="syncEvidenceSummary">
              <span><small>PARTIDAS JUNTOS</small><b>{total}</b></span>
              <span><small>VITÓRIAS</small><b>{wins}</b></span>
              <span><small>DERROTAS</small><b>{losses}</b></span>
              <span><small>CONTEXTO MAIS VISTO</small><b>{observed?.name||'—'}</b><em>{observed?.games?`${observed.games}x`:''}</em></span>
            </div>

            <div className="syncWhatChanged">
              <small>O QUE MUDOU DESDE O MATCH?</small>
              <h3>{observationCopy(c)}</h3>
              <p>{total<3?'Ainda estamos separando acaso de padrão. Mais partidas ajudam o Sync a comparar a hipótese inicial com o que vocês realmente fazem juntos.':'Com três ou mais partidas, já dá para acompanhar recorrência de contexto e combinações de campeões sem tratar isso como causalidade.'}</p>
            </div>

            {(contexts.length||championPairs.length)>0&&<details className="syncEvidenceDetails">
              <summary>VER EVIDÊNCIAS DA DUPLA <b>{contexts.length+championPairs.length} GRUPOS</b></summary>
              <div>
                <section><small>MODOS JOGADOS JUNTOS</small><p>{contexts.map((x:any)=>x.name+' · '+x.games+'x').join('   //   ')||'—'}</p></section>
                <section><small>PARES DE CAMPEÕES</small><p>{championPairs.map((x:any)=>x.pair+' · '+x.games+'x').join('   //   ')||'—'}</p></section>
              </div>
            </details>}

            <div className="duoFeedback syncHumanSignal">
              <div><small>SINAL HUMANO // OPCIONAL</small><b>DEPOIS DE JOGAR: VOCÊ REPETIRIA ESSA DUPLA?</b><p>Seu feedback não prova compatibilidade, mas adiciona contexto humano às partidas observadas.</p>{feedback&&<em>RESPOSTA SALVA // {feedback==='play_again'?'JOGARIA DE NOVO':'NÃO COMBINOU'}</em>}</div>
              <div className="duoFeedbackActions"><button className={feedback==='not_a_fit'?'selected':''} onClick={()=>rateDuo(c,'not_a_fit')}>NÃO COMBINOU</button><button className={feedback==='play_again'?'selected positive':''} onClick={()=>rateDuo(c,'play_again')}><Icon name="check"/> JOGARIA DE NOVO</button></div>
            </div>
          </>:<div className="syncMission">
            <div className="syncMissionIcon"><Icon name="game"/></div>
            <div><small>PRÓXIMO PASSO</small><b>JOGUEM JUNTOS. O RESTO VEM DEPOIS.</b><p>Adicione o Player 02 pelo Riot ID, joguem no mesmo time e volte ao Sync. A próxima atualização procura essa partida e começa a substituir hipótese por evidência.</p></div>
            <div className="syncMissionActions">{c.player02.riotId&&<button onClick={()=>navigator.clipboard.writeText(c.player02.riotId)}>COPIAR RIOT ID</button>}<button onClick={openSync}><Icon name="sync"/> JÁ JOGAMOS</button></div>
          </div>}
        </article>;
      })}
    </div>:<div className="empty02 syncEmptyState">
      <span><Icon name="sync"/></span>
      <small>02 SYNC</small>
      <b>AINDA NÃO EXISTE UMA DUPLA PARA ACOMPANHAR.</b>
      <p>Primeiro encontre um 02 e tenha interesse mútuo. Depois disso o Sync acompanha o que realmente acontece quando vocês jogam juntos.</p>
      <button onClick={()=>setView('find')}>ENCONTRAR MEU 02 →</button>
    </div>}
  </section>;
}
