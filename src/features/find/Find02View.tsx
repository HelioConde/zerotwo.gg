import { Icon, GameBadge, RoleBadge } from '../../components/ZeroTwoUI';
import { ztLog } from '../../lib/telemetry';
import { getLocale } from '../../i18n';

type Find02ViewProps={
  activeGame:'lol'|'valorant';
  setActiveGame:(game:'lol'|'valorant')=>void;
  finding:boolean;
  findType:string;
  findMeta:any;
  server:string;
  setFindType:(value:any)=>void;
  findMode:string;
  setFindMode:(value:any)=>void;
  find02:(mode?:any,type?:any)=>void;
  stopDiscovery:()=>void;
  findMessage:string;
  candidates:any[];
  candidateIndex:number;
  session:any;
  nextCandidate:()=>void|Promise<void>;
  candidateAction:(id:string,action:'interested'|'skip')=>void;
  openSync:()=>void;
  shareMyPlayer:()=>void;
};

function safeArray(value:any){
  return Array.isArray(value)?value:[];
}

function displayMode(candidate:any,fallback:string){
  const mode=candidate?.desiredMode||fallback||'ANY';
  return mode==='ANY'?'QUALQUER':mode;
}

export function Find02View({activeGame,setActiveGame,finding,findType,findMeta,server,setFindType,findMode,setFindMode,find02,stopDiscovery,findMessage,candidates,candidateIndex,session,nextCandidate,candidateAction,openSync,shareMyPlayer}:Find02ViewProps){
  if(activeGame==='valorant')return <section className="find02View focusFind valorantFindLocked">
    <header><small>ZEROTWO // FIND YOUR 02 // VALORANT</small><h2>MATCHING DE VALORANT.<br/><span>AINDA NÃO.</span></h2><p>O ZeroTwo já tem o caminho oficial de conexão via Riot Sign On preparado, mas o Find 02 de VALORANT precisa de uma camada própria de elegibilidade e sinais antes de ser liberado.</p></header>
    <div className="valorantFindReasonGrid">
      <article><GameBadge game="valorant"/><small>01 // IDENTIDADE</small><b>RSO PRIMEIRO</b><p>O próprio jogador autoriza a conta Riot. Não usamos busca pública arbitrária.</p></article>
      <article><Icon name="dna"/><small>02 // CONTEXTO</small><b>DADOS PÓS-PARTIDA</b><p>Agentes, filas e padrões recentes precisam existir antes de virar sinais de matching.</p></article>
      <article><Icon name="sync"/><small>03 // MATCHING</small><b>BACKEND ESPECÍFICO</b><p>League e VALORANT não devem compartilhar regras de modo, rank ou contexto como se fossem o mesmo jogo.</p></article>
    </div>
    <div className="valorantFindActions"><button onClick={()=>setActiveGame('lol')}>← ENCONTRAR 02 NO LEAGUE</button><span>VALORANT SERÁ ATIVADO DEPOIS DO RSO + MATCHING ESPECÍFICO</span></div>
  </section>;

  const current=candidates.length?candidates[Math.min(candidateIndex,candidates.length-1)]:null;
  const sessionSignals=safeArray(current?.sessionSignals);
  const reasons=safeArray(current?.reasons);
  const behavioralReasons=reasons.filter((r:any)=>r?.group!=='session');
  const evidenceCount=reasons.length;
  const candidateMode=current?displayMode(current,findMode):findMode==='ANY'?'QUALQUER':findMode;

  return <section className="find02View focusFind">
    <header>
      <small>ZEROTWO // FIND YOUR 02</small>
      <h2>{finding?'PROCURANDO':current?'UM 02 PARA':'SEU PRÓXIMO'} <span>{finding?'VOCÊ...':current?'VOCÊ AVALIAR.':'02.'}</span></h2>
      <p>{finding
        ?(findType==='RECURRING'?'Buscando alguém cuja rotina, modo e contexto façam sentido para jogar outras vezes.':'Primeiro filtramos quem realmente pode entrar na mesma sessão. Depois usamos os sinais disponíveis para explicar a indicação.')
        :current
          ?'O filtro operacional já passou. Agora veja o que sabemos, o que ainda não sabemos e decida se vale testar essa conexão.'
          :findMeta
            ?(findType==='RECURRING'?'Ainda não apareceu uma parceria recorrente para esse contexto.':'Ainda não apareceu um 02 jogável nesta sessão.')
            :'Escolha como e o que você quer jogar. A busca só começa quando você confirmar.'}
      </p>
      {!finding&&findMeta&&<div className="findContext">
        <span><small>SERVIDOR</small><b>{server}</b></span>
        <span><small>MODO</small><b>{findMeta.desiredMode==='ANY'?'QUALQUER':findMeta.desiredMode}</b></span>
        <span><small>TIPO</small><b>{findMeta.searchType==='RECURRING'?'RECORRENTE':'AGORA'}</b></span>
      </div>}
    </header>

    {!current&&<>
      <div className="findTypeBar">
        <button className={findType==='NOW'?'active':''} onClick={()=>{setFindType('NOW');sessionStorage.setItem('zt_find_type','NOW')}}><Icon name="game"/><span><b>JOGAR AGORA</b><small>Sessão ativa por 2 horas</small></span></button>
        <button className={findType==='RECURRING'?'active':''} onClick={()=>{setFindType('RECURRING');sessionStorage.setItem('zt_find_type','RECURRING')}}><Icon name="sync"/><span><b>PARCERIA RECORRENTE</b><small>Procura alguém para repetir</small></span></button>
      </div>
      <div className="findModeBar"><small>QUERO JOGAR</small>{['ANY','RANKED','NORMAL','ARAM','ARENA'].map(m=><button key={m} className={findMode===m?'active':''} onClick={()=>{setFindMode(m);sessionStorage.setItem('zt_find_mode',m)}}>{m==='ANY'?'QUALQUER':m}</button>)}</div>
      {!findMeta&&<button className="startFindButton" onClick={()=>find02(findMode,findType)}><Icon name="search"/> INICIAR BUSCA</button>}
    </>}

    {findMeta&&<div className="discoverySession">
      <span><Icon name="status"/> {findMeta.searchType==='RECURRING'?'Sua busca recorrente fica ativa por até 14 dias.':'Seu Player fica disponível nesta sessão por até 2 horas.'}</span>
      <button onClick={stopDiscovery}>ENCERRAR BUSCA</button>
    </div>}

    {findMessage&&<div className="findStatus">{findMessage}</div>}

    {finding?<div className="matchSearchState">
      <span className="searchPulse"><Icon name="search"/></span>
      <b>BUSCANDO JOGADORES COMPATÍVEIS</b>
      <p>Servidor, modo, intenção e os sinais disponíveis estão sendo considerados.</p>
      <div><i/><i/><i/></div>
    </div>:current?<div className="candidateFocus">
      <article className="candidateCard featuredCandidate candidateDecisionCard">
        <div className="candidateTop">
          <span className="candidateAvatar">02</span>
          <div>
            <small>PLAYER 02 // {Math.min(candidateIndex,candidates.length-1)+1} DE {candidates.length}</small>
            <h3>{current.nickname||current.riotId||'PLAYER 02'}</h3>
            <div className="candidateIdentityLine"><GameBadge game="lol" label={current.riotId||'LEAGUE OF LEGENDS'}/><RoleBadge role={current.primaryPosition}/></div>
          </div>
          <strong className={'candidateFit '+(current.fitBand||'initial')}>{current.isTest?'LAB // ':''}{current.fitLabel||'SINAIS DISPONÍVEIS'}</strong>
        </div>

        <div className="candidateDecisionSummary">
          <div className="candidateWhy">
            <small>{current.searchType==='RECURRING'?'POR QUE VALE TESTAR ESSA PARCERIA?':'POR QUE VALE TESTAR AGORA?'}</small>
            <h4>{current.whyNow||'O contexto operacional combina; os outros sinais ainda precisam ser testados jogando juntos.'}</h4>
            <p>O ZeroTwo não transforma esses sinais em uma nota artificial. A confirmação vem da experiência de vocês e, depois, do 02 Sync.</p>
          </div>
          <div className="candidateEssentials">
            <span><small>MODO</small><b>{candidateMode}</b></span>
            <span><small>BUSCA</small><b>{current.searchType==='RECURRING'?'RECORRENTE':'AGORA'}</b></span>
            {current.availability&&<span><small>DISPONIBILIDADE</small><b>{current.availability}</b></span>}
            <span><small>EVIDÊNCIAS</small><b>{evidenceCount||'POUCAS'}</b></span>
          </div>
        </div>

        <div className="candidateSignalsPrimary">
          <small>O QUE JÁ SABEMOS</small>
          <div>
            {sessionSignals.slice(0,2).map((x:any)=><span key={x.key||x.label}><Icon name="check"/> {x.label}</span>)}
            {behavioralReasons.slice(0,2).map((r:any)=><span key={r.key||r.text}><Icon name="dna"/> {r.text}</span>)}
            {!sessionSignals.length&&!behavioralReasons.length&&<span className="candidateLowEvidence"><Icon name="status"/> Ainda há pouca evidência de estilo. Isso é mostrado como incerteza, não preenchido com precisão inventada.</span>}
          </div>
        </div>

        <details className="candidateEvidenceDetails" onToggle={e=>{if((e.currentTarget as HTMLDetailsElement).open)ztLog(session.user.id,'candidate_details_opened',{area:'product_funnel',context:{mode:findMode,type:findType}})}}>
          <summary>VER DETALHES E EVIDÊNCIAS <b>{evidenceCount?evidenceCount+' SINAIS':'POUCA AMOSTRA'}</b></summary>
          <div className="candidateEvidenceBody">
            <div className="candidateEvidenceMeta">
              <span><small>JOGO</small><b>LEAGUE</b></span>
              <span><small>NÍVEL</small><b>{current.summonerLevel??'—'}</b></span>
              <span><small>POSIÇÃO</small><b>{current.primaryPosition||'—'}</b></span>
              <span><small>HORÁRIO</small><b>{current.availability||'NÃO INFORMADO'}</b></span>
            </div>
            {reasons.length?reasons.map((r:any)=><p key={'detail-'+(r.key||r.text)}><Icon name="check"/> {r.text}</p>):<p><Icon name="status"/> Ainda estamos conhecendo o perfil deste jogador. O matching usa apenas o que está realmente disponível.</p>}
          </div>
        </details>

        {current.interestStatus==='matched'?<div className="matchSuccess">
          <Icon name="sync"/>
          <div><small>01 + 02</small><b>DEU MATCH.</b><p>Agora começa a parte que diferencia o ZeroTwo: descobrir como vocês funcionam jogando juntos.</p></div>
          <div className="matchSuccessActions"><button onClick={()=>current.riotId&&navigator.clipboard.writeText(current.riotId)}>COPIAR RIOT ID</button><button onClick={openSync}>ABRIR 02 SYNC <Icon name="arrow"/></button></div>
        </div>:<div className="candidateDecisionFooter">
          <div><small>VOCÊ DECIDE.</small><p>Só vira conexão quando o interesse for mútuo.</p></div>
          <div className="candidateActions decisionActions">
            <button onClick={nextCandidate}>MOSTRAR OUTRO 02</button>
            <button disabled={current.interestStatus==='pending'} onClick={()=>candidateAction(current.userId,'interested')}><Icon name="game"/>{current.interestStatus==='pending'?' INTERESSE ENVIADO':' TENHO INTERESSE'}</button>
          </div>
        </div>}
      </article>
    </div>:findMeta?<div className="empty02 improvedEmpty waitingPool">
      <span><Icon name="search"/></span>
      <small>{findType==='RECURRING'?'BUSCA RECORRENTE ATIVA':'BUSCA ATIVA'}</small>
      <b>{findType==='RECURRING'?'AINDA NÃO HÁ UMA PARCERIA REAL NESTE CONTEXTO.':'AINDA NÃO HÁ UM 02 REAL DISPONÍVEL AGORA.'}</b>
      <p>{findType==='RECURRING'?'Sua busca fica aberta por até 14 dias. Quando você voltar, o ZeroTwo continua procurando alguém com servidor, modo e rotina compatíveis.':'Seu Player 01 continua disponível por até 2 horas. Você pode tentar de novo agora ou compartilhar seu Player com alguém que já joga com você.'}</p>
      {findMeta?.sessionExpiresAt&&<em>ATIVA ATÉ {new Date(findMeta.sessionExpiresAt).toLocaleString(getLocale(),{dateStyle:'short',timeStyle:'short'})}</em>}
      <div><button onClick={()=>find02(findMode,findType)}><Icon name="search"/> TENTAR NOVAMENTE</button><button onClick={shareMyPlayer}><Icon name="arrow"/> COMPARTILHAR MEU PLAYER</button></div>
    </div>:<div className="findStartPanel"><Icon name="search"/><b>SUA BUSCA AINDA NÃO COMEÇOU.</b><p>Escolha se quer jogar agora ou criar uma parceria recorrente, selecione o modo e confirme em “Iniciar busca”.</p></div>}
  </section>;
}
