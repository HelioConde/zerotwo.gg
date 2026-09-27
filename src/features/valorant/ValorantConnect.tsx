import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { GameBadge, Icon } from '../../components/ZeroTwoUI';

const RSO_ENABLED=import.meta.env.VITE_VALORANT_RSO_ENABLED==='true';
const SHARDS=[
  ['br','BR'],
  ['latam','LATAM'],
  ['na','NA'],
  ['eu','EU'],
  ['kr','KR'],
  ['ap','AP']
] as const;

export function ValorantConnect({onLinkedChange,expanded=false,onUseLeague}:{onLinkedChange?:(linked:boolean)=>void,expanded?:boolean,onUseLeague?:()=>void}){
  const [profile,setProfile]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [status,setStatus]=useState('');
  const [shard,setShard]=useState('br');

  async function load(){
    if(expanded){
    if(!RSO_ENABLED){
      return <section id="valorant-connect" className="valorantDashboard unavailable">
        <header><div><GameBadge game="valorant"/><span><small>PLAYER 01 // VALORANT</small><h2>RSO PREPARADO.<br/><b>ATIVAÇÃO DEPENDE DA RIOT.</b></h2></span></div><em>PRODUCTION ACCESS</em></header>
        <div className="valorantDashboardBody">
          <article><Icon name="riot"/><small>RIOT SIGN ON</small><b>OPT-IN OBRIGATÓRIO</b><p>O ZeroTwo só poderá mostrar estatísticas específicas de VALORANT depois que o próprio jogador autorizar a conta Riot.</p></article>
          <article><Icon name="dna"/><small>ANÁLISE PÓS-PARTIDA</small><b>SEM SCOUTING AO VIVO</b><p>O plano usa histórico permitido após as partidas para construir contexto sem expor informações indevidas.</p></article>
          <article><Icon name="sync"/><small>FIND 02</small><b>MATCHING AINDA BLOQUEADO</b><p>O matching de VALORANT só será liberado quando RSO, dados e regras específicas do jogo estiverem ativos no backend.</p></article>
        </div>
        <div className="valorantDashboardActions">{onUseLeague&&<button onClick={onUseLeague}>← USAR LEAGUE AGORA</button>}<span>AGUARDANDO CREDENCIAIS RIOT PRODUCTION / RSO</span></div>
      </section>;
    }

    if(profile?.linked){
      return <section id="valorant-connect" className="valorantDashboard linked">
        <header><div><GameBadge game="valorant"/><span><small>PLAYER 01 // VALORANT CONECTADO</small><h2>{profile.account?.gameName}<b>#{profile.account?.tagLine}</b></h2></span></div><em>{String(profile.account?.shard||shard).toUpperCase()} // OPT-IN ATIVO</em></header>
        <div className="valorantSummaryGrid">
          <span><small>PARTIDAS</small><b>{profile.summary?.matches??0}</b><em>amostra recente</em></span>
          <span><small>WIN RATE</small><b>{profile.summary?.winRate!=null?profile.summary.winRate+'%':'—'}</b><em>partidas decididas</em></span>
          <span><small>KDA MÉDIO</small><b>{profile.summary?.avgKda??'—'}</b><em>recente</em></span>
          <span><small>SCORE / ROUND</small><b>{profile.summary?.avgScorePerRound??'—'}</b><em>média recente</em></span>
        </div>
        <div className="valorantDashboardColumns">
          <article><header><small>AGENTES RECENTES</small><b>QUEM MAIS APARECE</b></header>{profile.summary?.topAgents?.length?profile.summary.topAgents.map((x:any)=><span key={x.name}><b>{x.name}</b><em>{x.games} {x.games===1?'partida':'partidas'}</em></span>):<p>Ainda não há amostra suficiente.</p>}</article>
          <article><header><small>ÚLTIMAS PARTIDAS</small><b>PÓS-PARTIDA</b></header>{profile.matches?.length?profile.matches.slice(0,5).map((m:any)=><span key={m.id}><b>{m.agent||'Agente'} · {m.won===true?'VITÓRIA':m.won===false?'DERROTA':'RESULTADO —'}</b><em>{m.kills}/{m.deaths}/{m.assists} · KDA {m.kda??'—'} · {String(m.queue||'fila').toUpperCase()}</em></span>):<p>Nenhuma partida recente retornada pela API.</p>}</article>
        </div>
        <div className="valorantDashboardActions"><button onClick={load} disabled={loading}>{loading?'ATUALIZANDO...':'ATUALIZAR VALORANT'}</button><button onClick={unlink} disabled={loading}>DESCONECTAR</button><span>FIND 02 DE VALORANT SERÁ LIBERADO EM UMA ETAPA SEPARADA</span></div>
      </section>;
    }

    return <section id="valorant-connect" className="valorantDashboard ready">
      <header><div><GameBadge game="valorant"/><span><small>PLAYER 01 // VALORANT</small><h2>CONECTE SUA CONTA.<br/><b>VOCÊ CONTROLA O ACESSO.</b></h2></span></div><em>RIOT SIGN ON</em></header>
      <p className="valorantDashboardIntro">Autorize sua própria conta Riot para o ZeroTwo carregar somente os dados de VALORANT permitidos para análise pós-partida.</p>
      <div className="valorantConnectForm"><label>REGIÃO<select aria-label="Região do VALORANT" value={shard} onChange={e=>setShard(e.target.value)}>{SHARDS.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label><button onClick={connect} disabled={loading}>{loading?'ABRINDO RIOT...':'CONECTAR COM RIOT →'}</button></div>
      {status&&<p className="valorantStatus">{status}</p>}
      <div className="valorantDashboardActions">{onUseLeague&&<button onClick={onUseLeague}>← VOLTAR AO LEAGUE</button>}<span>SEM BUSCA PÚBLICA DE JOGADORES</span></div>
    </section>;
  }

  if(!RSO_ENABLED){
      onLinkedChange?.(false);
      return;
    }
    setLoading(true);
    const {data,error}=await supabase.functions.invoke('valorant-profile',{body:{}});
    setLoading(false);
    if(error){
      setStatus('Integração VALORANT indisponível no momento.');
      onLinkedChange?.(false);
      return;
    }
    setProfile(data);
    const linked=Boolean(data?.linked);
    onLinkedChange?.(linked);
    if(linked&&data?.account?.shard)setShard(data.account.shard);
  }

  useEffect(()=>{
    load();
    if(sessionStorage.getItem('zt_player_focus')==='valorant'){
      sessionStorage.removeItem('zt_player_focus');
      setTimeout(()=>document.getElementById('valorant-connect')?.scrollIntoView({behavior:'smooth',block:'center'}),80);
    }
    const params=new URLSearchParams(location.search);
    if(params.get('valorant')){
      params.delete('valorant');
      params.delete('reason');
      const q=params.toString();
      history.replaceState({},document.title,location.pathname+(q?'?'+q:'')+location.hash);
    }
  },[]);

  async function connect(){
    setStatus('');
    setLoading(true);
    const {data,error}=await supabase.functions.invoke('valorant-rso-start',{body:{shard}});
    setLoading(false);
    if(error||!data?.authorizationUrl){
      setStatus('RSO da Riot ainda não está disponível para este projeto.');
      return;
    }
    location.assign(data.authorizationUrl);
  }

  async function unlink(){
    if(!confirm('Desconectar VALORANT do seu Player 01?'))return;
    setLoading(true);
    const {error}=await supabase.functions.invoke('valorant-unlink',{body:{}});
    setLoading(false);
    if(error){
      setStatus('Não foi possível desconectar agora.');
      return;
    }
    setProfile({linked:false});
    onLinkedChange?.(false);
    setStatus('VALORANT desconectado.');
  }

  if(!RSO_ENABLED){
    return <div id="valorant-connect" className="connectedGame upcoming valorantIntegration">
      <GameBadge game="valorant"/>
      <div><small>VALORANT</small><b>RSO PREPARADO</b><em>AGUARDANDO ACESSO DE PRODUÇÃO DA RIOT</em></div>
      <span>EM PREPARAÇÃO</span>
    </div>;
  }

  if(profile?.linked){
    return <div id="valorant-connect" className="connectedGame active valorantIntegration linked">
      <GameBadge game="valorant"/>
      <div>
        <small>VALORANT // OPT-IN RSO</small>
        <b>{profile.account?.gameName}<i>#{profile.account?.tagLine}</i></b>
        <em>{String(profile.account?.shard||shard).toUpperCase()} · {profile.summary?.matches??0} PARTIDAS RECENTES</em>
        {profile.summary?.topAgents?.[0]&&<em>AGENTE RECENTE · {profile.summary.topAgents[0].name}</em>}
      </div>
      <div className="valorantInlineActions"><button onClick={load} disabled={loading}>{loading?'...':'ATUALIZAR'}</button><button onClick={unlink} disabled={loading}>DESCONECTAR</button></div>
    </div>;
  }

  return <div id="valorant-connect" className="connectedGame upcoming valorantIntegration ready">
    <GameBadge game="valorant"/>
    <div><small>VALORANT // RIOT SIGN ON</small><b>CONECTAR COM OPT-IN</b><em>SUAS ESTATÍSTICAS SÓ APARECEM DEPOIS DA AUTORIZAÇÃO RIOT</em>{status&&<em className="valorantStatus">{status}</em>}</div>
    <div className="valorantInlineActions"><select aria-label="Região do VALORANT" value={shard} onChange={e=>setShard(e.target.value)}>{SHARDS.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><button onClick={connect} disabled={loading}>{loading?'ABRINDO...':'CONECTAR RIOT'}</button></div>
  </div>;
}
