import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { GameBadge, Icon } from '../../components/ZeroTwoUI';
import { ValorantLifeExperience } from './ValorantLifeExperience';

const RSO_ENABLED=import.meta.env.VITE_VALORANT_RSO_ENABLED==='true';
const SHARDS=[
  ['br','BR'],['latam','LATAM'],['na','NA'],['eu','EU'],['kr','KR'],['ap','AP']
] as const;

export function ValorantConnect({onLinkedChange,expanded=false,onUseLeague}:{onLinkedChange?:(linked:boolean,profile?:any)=>void,expanded?:boolean,onUseLeague?:()=>void}){
 const [profile,setProfile]=useState<any>(null);
 const [loading,setLoading]=useState(false);
 const [status,setStatus]=useState('');
 const [shard,setShard]=useState('br');

 async function load(){
  if(!RSO_ENABLED){
   onLinkedChange?.(false,null);
   return;
  }
  setLoading(true);
  const {data,error}=await supabase.functions.invoke('valorant-profile',{body:{}});
  setLoading(false);
  if(error){
   setStatus('Integração VALORANT indisponível no momento.');
   onLinkedChange?.(false,null);
   return;
  }
  setProfile(data);
  const linked=Boolean(data?.linked);
  onLinkedChange?.(linked,data);
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
  if(!confirm('Desconectar VALORANT da sua Riot Life?'))return;
  setLoading(true);
  const {error}=await supabase.functions.invoke('valorant-unlink',{body:{}});
  setLoading(false);
  if(error){
   setStatus('Não foi possível desconectar agora.');
   return;
  }
  setProfile({linked:false});
  onLinkedChange?.(false,{linked:false});
  setStatus('VALORANT desconectado.');
 }

 if(expanded){
  if(!RSO_ENABLED){
   return <section id="valorant-connect" className="valorantLife valorantLifeUnavailable">
    <header className="valorantLifeHero">
     <div><GameBadge game="valorant"/><small>RIOT LIFE // VALORANT</small><h2>INTEGRAÇÃO PRONTA.<br/><span>ACESSO AINDA NÃO.</span></h2><p>A experiência foi preparada para usar Riot Sign On e dados autorizados pelo próprio jogador. A ativação depende das credenciais de produção da Riot.</p></div>
     <em>PRODUCTION ACCESS</em>
    </header>
    <div className="valorantLifePrinciples">
     <article><Icon name="riot"/><small>IDENTIDADE</small><b>RIOT SIGN ON</b><p>A conta só é conectada quando o próprio jogador autoriza.</p></article>
     <article><Icon name="dna"/><small>ANÁLISE</small><b>PÓS-PARTIDA</b><p>Agentes, filas e resultados entram como história depois das partidas.</p></article>
     <article><Icon name="status"/><small>SEPARAÇÃO</small><b>LEAGUE ≠ VALORANT</b><p>Cada jogo mantém seu próprio contexto; não misturamos métricas incompatíveis.</p></article>
    </div>
    <footer className="valorantLifeFooter">{onUseLeague&&<button onClick={onUseLeague}>← VOLTAR AO LEAGUE</button>}<span>AGUARDANDO RIOT PRODUCTION / RSO</span></footer>
   </section>;
  }

  if(profile?.linked){
   return <section id="valorant-connect" className="valorantLife valorantLifeLinked">
    <header className="valorantLifeHero">
     <div><GameBadge game="valorant"/><small>RIOT LIFE // VALORANT CONECTADO</small><h2>{profile.account?.gameName}<span>#{profile.account?.tagLine}</span></h2><p>Dados autorizados do seu histórico recente de VALORANT, tratados separadamente do League.</p></div>
     <em>{String(profile.account?.shard||shard).toUpperCase()} // OPT-IN</em>
    </header>
    <div className="valorantLifeStats">
     <span><small>PARTIDAS</small><b>{profile.summary?.matches??0}</b><em>história acumulada</em></span>
     <span><small>RESULTADO</small><b>{profile.summary?.winRate!=null?profile.summary.winRate+'%':'—'}</b><em>win rate</em></span>
     <span><small>ACS</small><b>{profile.summary?.avgScorePerRound??'—'}</b><em>score / round</em></span>
     <span><small>ADR</small><b>{profile.summary?.avgDamagePerRound??'—'}</b><em>dano / round</em></span>
     <span><small>HEADSHOT</small><b>{profile.summary?.avgHeadshotRate!=null?profile.summary.avgHeadshotRate+'%':'—'}</b><em>impactos</em></span>
    </div>
    <ValorantLifeExperience profile={profile}/>
    <footer className="valorantLifeFooter"><div><button onClick={load} disabled={loading}>{loading?'ATUALIZANDO...':'ATUALIZAR DADOS'}</button><button className="secondary" onClick={unlink} disabled={loading}>DESCONECTAR</button></div><span>FONTE AUTORIZADA PELO PRÓPRIO JOGADOR</span></footer>
   </section>;
  }

  return <section id="valorant-connect" className="valorantLife valorantLifeReady">
   <header className="valorantLifeHero">
    <div><GameBadge game="valorant"/><small>RIOT LIFE // VALORANT</small><h2>CONECTE COM <span>RIOT SIGN ON.</span></h2><p>Autorize sua própria conta para liberar somente os dados permitidos de VALORANT e começar uma história separada do League.</p></div>
    <em>OPT-IN</em>
   </header>
   <div className="valorantLifeConnect">
    <div><small>ANTES DE CONTINUAR</small><h3>VOCÊ CONTROLA O ACESSO.</h3><p>O ZeroTwo não usa busca pública arbitrária de perfis VALORANT. A conexão acontece através da autorização da sua conta Riot.</p></div>
    <label>REGIÃO<select aria-label="Região do VALORANT" value={shard} onChange={e=>setShard(e.target.value)}>{SHARDS.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
    <button onClick={connect} disabled={loading}>{loading?'ABRINDO RIOT...':'CONECTAR COM RIOT →'}</button>
   </div>
   {status&&<p className="valorantStatus">{status}</p>}
   <footer className="valorantLifeFooter">{onUseLeague&&<button className="secondary" onClick={onUseLeague}>← VOLTAR AO LEAGUE</button>}<span>SEM BUSCA PÚBLICA DE JOGADORES</span></footer>
  </section>;
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
   <div><small>VALORANT // OPT-IN RSO</small><b>{profile.account?.gameName}<i>#{profile.account?.tagLine}</i></b><em>{String(profile.account?.shard||shard).toUpperCase()} · {profile.summary?.matches??0} PARTIDAS RECENTES</em>{profile.summary?.topAgents?.[0]&&<em>AGENTE RECENTE · {profile.summary.topAgents[0].name}</em>}</div>
   <div className="valorantInlineActions"><button onClick={load} disabled={loading}>{loading?'...':'ATUALIZAR'}</button><button onClick={unlink} disabled={loading}>DESCONECTAR</button></div>
  </div>;
 }

 return <div id="valorant-connect" className="connectedGame upcoming valorantIntegration ready">
  <GameBadge game="valorant"/>
  <div><small>VALORANT // RIOT SIGN ON</small><b>CONECTAR COM OPT-IN</b><em>SUAS ESTATÍSTICAS SÓ APARECEM DEPOIS DA AUTORIZAÇÃO RIOT</em>{status&&<em className="valorantStatus">{status}</em>}</div>
  <div className="valorantInlineActions"><select aria-label="Região do VALORANT" value={shard} onChange={e=>setShard(e.target.value)}>{SHARDS.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><button onClick={connect} disabled={loading}>{loading?'ABRINDO...':'CONECTAR RIOT'}</button></div>
 </div>;
}
