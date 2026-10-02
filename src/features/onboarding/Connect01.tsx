import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabase';
import { ztLog, ztProductEvent } from '../../lib/telemetry';
import { GameBadge, Icon } from '../../components/ZeroTwoUI';
import { ValorantConnect } from '../valorant/ValorantConnect';

export function Connect01({session:externalSession,onSessionChange,onProfileComplete}:{session?:any,onSessionChange?:(s:any)=>void,onProfileComplete?:()=>void}={}){
 const [mode,setMode]=useState<'signup'|'login'>('signup');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [riotId,setRiotId]=useState(()=>sessionStorage.getItem('zt_pending_riot_id')||'');
 const [riotPlatform,setRiotPlatform]=useState(()=>sessionStorage.getItem('zt_pending_platform')||'br1');
 const [session,setSession]=useState<any>(externalSession||null);
 const [status,setStatus]=useState('');
 const [player,setPlayer]=useState<any>(null);
 const [nickname,setNickname]=useState('');
 const [savedIntent,setSavedIntent]=useState('Riot Life');
 const [savedAvailability,setSavedAvailability]=useState('');
 const valorantIntent=sessionStorage.getItem('zt_pending_action')==='valorant';
 const valorantFinalized=useRef(false);

 useEffect(()=>{
  if(!externalSession?.user?.id)return;
  (async()=>{
   const {data:p}=await supabase.from('profiles').select('nickname,intent,availability').eq('user_id',externalSession.user.id).maybeSingle();
   if(p){
    setNickname(p.nickname||'');
    setSavedIntent(p.intent||'Riot Life');
    setSavedAvailability(p.availability||'');
   }
  })();
 },[externalSession?.user?.id]);

 useEffect(()=>{
  const cleanAuthHash=()=>{
   if(/(?:access_token|refresh_token|error_description)=/.test(window.location.hash)){
    window.history.replaceState({},document.title,window.location.pathname+window.location.search);
   }
  };
  supabase.auth.getSession().then(({data})=>{
   setSession(data.session);
   onSessionChange?.(data.session);
   if(data.session)cleanAuthHash();
  });
  const {data}=supabase.auth.onAuthStateChange((_e,x)=>{
   setSession(x);
   onSessionChange?.(x);
   if(x)setTimeout(cleanAuthHash,0);
  });
  return()=>data.subscription.unsubscribe();
 },[]);

 async function google(){
  ztProductEvent('auth_started',{area:'product_funnel',context:{provider:'google',intent:'riot_life'}});
  setStatus('Abrindo Google...');
  const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});
  if(error)setStatus(error.message);
 }

 async function emailAuth(){
  ztProductEvent('auth_started',{area:'product_funnel',context:{provider:'email',mode,intent:'riot_life'}});
  setStatus(mode==='signup'?'Criando sua conta...':'Entrando...');
  const result=mode==='signup'
   ?await supabase.auth.signUp({email,password})
   :await supabase.auth.signInWithPassword({email,password});
  setStatus(result.error
   ?result.error.message
   :mode==='signup'&&!result.data.session
    ?'Conta criada. Confira seu e-mail para confirmar.'
    :'Conta conectada. Preparando sua Riot Life...');
 }

 async function lookup(){
  const cut=riotId.lastIndexOf('#');
  if(cut<1||cut===riotId.length-1){
   setStatus('Use o formato Nome#TAG.');
   return;
  }
  const gameName=riotId.slice(0,cut).trim();
  const tagLine=riotId.slice(cut+1).trim();
  const region=['br1','na1','la1','la2'].includes(riotPlatform)?'americas':['kr','jp1'].includes(riotPlatform)?'asia':['ph2','sg2','th2','tw2','vn2'].includes(riotPlatform)?'sea':'europe';

  if(session?.user?.id)ztLog(session.user.id,'riot_id_submitted',{area:'onboarding',context:{server:riotPlatform,source:'riot_life_setup'}});
  setStatus('Localizando seu Riot ID...');
  setPlayer(null);

  const {data,error}=await supabase.functions.invoke('riot-lol-player',{body:{gameName,tagLine,region,platform:riotPlatform,includeSummoner:true}});
  if(error){setStatus('Não foi possível consultar o jogador agora. Tente novamente.');return}
  if(data?.error){setStatus(data.message||data.error);return}
  if(data?.summonerLookup?.status==='not_found'){setStatus(data.summonerLookup.message);return}
  if(!session){setStatus('Sua sessão expirou. Entre novamente.');return}

  setPlayer(data);
  ztLog(session.user.id,'riot_player_found',{area:'onboarding',context:{server:riotPlatform,source:'riot_life_setup'}});

  const profileName=(nickname||data.account.gameName||'Player').trim();
  const {error:profileError}=await supabase.from('profiles').upsert({
   user_id:session.user.id,
   nickname:profileName,
   primary_game:'League of Legends',
   intent:savedIntent||'Riot Life',
   availability:savedAvailability||null,
   onboarding_complete:false,
   updated_at:new Date().toISOString()
  },{onConflict:'user_id'});
  if(profileError){setStatus('Jogador encontrado, mas não foi possível preparar sua Riot Life.');return}

  const {error:riotSaveError}=await supabase.from('riot_accounts').upsert({
   user_id:session.user.id,
   puuid:data.account.puuid,
   game_name:data.account.gameName,
   tag_line:data.account.tagLine,
   region,
   platform:riotPlatform,
   summoner_level:data.lol?.summoner?.summonerLevel??null,
   verified_at:new Date().toISOString(),
   updated_at:new Date().toISOString()
  },{onConflict:'user_id'});
  if(riotSaveError){setStatus('Jogador encontrado, mas não foi possível salvar os dados.');return}

  await supabase.from('profiles').update({onboarding_complete:true,updated_at:new Date().toISOString()}).eq('user_id',session.user.id);
  sessionStorage.removeItem('zt_pending_riot_id');
  sessionStorage.removeItem('zt_pending_platform');
  sessionStorage.removeItem('zt_pending_action');
  setStatus('Tudo pronto. Abrindo sua Riot Life...');
  onProfileComplete?.();
 }

 async function finishValorant(linked:boolean,valorantProfile?:any){
  if(!linked||!session?.user?.id||valorantFinalized.current)return;
  const account=valorantProfile?.account;
  if(!account?.gameName)return;
  valorantFinalized.current=true;
  setStatus('Conta Riot autorizada. Preparando sua Riot Life de VALORANT...');
  const {error}=await supabase.from('profiles').upsert({
   user_id:session.user.id,
   nickname:(nickname||account.gameName||'Player').trim(),
   primary_game:'VALORANT',
   intent:savedIntent||'Riot Life',
   availability:savedAvailability||null,
   onboarding_complete:true,
   updated_at:new Date().toISOString()
  },{onConflict:'user_id'});
  if(error){
   valorantFinalized.current=false;
   setStatus('VALORANT conectado, mas não foi possível concluir seu perfil agora.');
   return;
  }
  sessionStorage.removeItem('zt_pending_action');
  sessionStorage.setItem('zt_active_game','valorant');
  sessionStorage.setItem('zt_player_focus','valorant');
  setStatus('Tudo pronto. Abrindo sua Riot Life de VALORANT...');
  onProfileComplete?.();
 }

 const signedIn=Boolean(session);
 if(signedIn&&valorantIntent){
  return <section id="connect01" className="connect01 riotLifeOnboarding isSetup valorantOnboarding">
   <div className="connectIntro">
    <div className="connectBrandLine"><span className="connectMiniMark"><img src="/zerotwo.gg/assets/zerotwo/zerotwo-mark.svg" alt=""/></span><small>ZEROTWO // RIOT LIFE // VALORANT</small></div>
    <h2>CONECTE SUA <em>CONTA RIOT.</em></h2>
    <p>No VALORANT, a Riot Life começa com autorização do próprio jogador. Você entra na Riot, concede o acesso aprovado e volta para o ZeroTwo com o histórico pós-partida.</p>
    <div className="connectBenefits">
     <span><Icon name="riot"/><b>LOGIN RIOT</b><small>autorização oficial via RSO</small></span>
     <span><Icon name="status"/><b>OPT-IN</b><small>somente a sua própria conta</small></span>
     <span><Icon name="dna"/><b>20 CAPÍTULOS</b><small>mira, mapas, agentes e evolução</small></span>
    </div>
   </div>
   <div className="connectCard valorantConnectCard">
    <div className="connectStepHead"><small>PASSO 02</small><b>AUTORIZAR VALORANT</b><span>Riot Sign On</span></div>
    <div className="connectGameIdentity"><GameBadge game="valorant"/><div><small>CONTA AUTORIZADA</small><b>VALORANT</b><em>Escolha sua região e continue no login oficial da Riot.</em></div></div>
    <div className="valorantFlowSteps">
     <span><i>01</i><b>REGIÃO</b><small>BR, LATAM, NA, EU, KR ou AP</small></span>
     <span><i>02</i><b>RIOT SIGN ON</b><small>login e consentimento na Riot</small></span>
     <span><i>03</i><b>RIOT LIFE</b><small>retorno automático ao ZeroTwo</small></span>
    </div>
    <ValorantConnect onLinkedChange={finishValorant}/>
    {status&&<p className="status" role="status" aria-live="polite">{status}</p>}
   </div>
  </section>;
 }

 return <section id="connect01" className={'connect01 riotLifeOnboarding '+(signedIn?'isSetup':'isAuth')}>
  <div className="connectIntro">
   <div className="connectBrandLine"><span className="connectMiniMark"><img src="/zerotwo.gg/assets/zerotwo/zerotwo-mark.svg" alt=""/></span><small>ZEROTWO // RIOT LIFE</small></div>
   <h2>{signedIn?'CONECTE SEU ':valorantIntent?'ENTRE PARA CONECTAR ':'CRIE SUA '}<em>{valorantIntent?'VALORANT.':'RIOT LIFE.'}</em></h2>
   <p>{signedIn?'League é a primeira fonte da sua história. Informe seu Riot ID para começar com partidas, campeões, eras e mudanças observadas.':valorantIntent?'Primeiro entre no ZeroTwo. Em seguida você será levado ao Riot Sign On para autorizar sua própria conta de VALORANT.':'Pesquise jogadores sem conta. Crie a sua somente quando quiser manter memória, conectar jogos e construir sua própria história.'}</p>
   <div className="connectBenefits">
    <span><Icon name="spark"/><b>RESUMO PESSOAL</b><small>Wrapped e sinais relevantes</small></span>
    <span><Icon name="dna"/><b>HISTÓRIA</b><small>Eras e mudanças ao longo do tempo</small></span>
    <span><Icon name="sync"/><b>MEMÓRIA</b><small>Continue de onde parou</small></span>
   </div>
  </div>

  <div className="connectCard">
   {!signedIn?<>
    <div className="connectStepHead"><small>PASSO 01</small><b>ENTRE NO ZEROTWO</b><span>{valorantIntent?'antes do login Riot':'leva poucos segundos'}</span></div>
    <button className="social google" onClick={google}><b>G</b><span>Continuar com Google<small>Mais rápido</small></span><Icon name="arrow"/></button>
    <div className="or"><span>ou use e-mail</span></div>
    <details className="authMore">
     <summary>Entrar ou criar conta com e-mail</summary>
     <div className="authTabs"><button className={mode==='signup'?'active':''} onClick={()=>setMode('signup')}>Criar conta</button><button className={mode==='login'?'active':''} onClick={()=>setMode('login')}>Entrar</button></div>
     <label>E-mail</label>
     <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com"/>
     <label>Senha</label>
     <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"/>
     <button className="authPrimary" onClick={emailAuth}>{mode==='signup'?'CRIAR MINHA RIOT LIFE →':'ENTRAR →'}</button>
    </details>
    <p className="connectPrivacy"><Icon name="status"/> {valorantIntent?'Depois deste login, você continuará para a autorização oficial da Riot.':'Sua conta serve para memória e integrações. A busca pública de League continua disponível sem login.'}</p>
   </>:<>
    <div className="connectStepHead"><small>PASSO 02</small><b>CONECTE LEAGUE</b><span>Riot ID público</span></div>
    <div className="connectGameIdentity"><GameBadge game="lol"/><div><small>PRIMEIRA FONTE</small><b>LEAGUE OF LEGENDS</b><em>VALORANT poderá ser conectado separadamente via RSO</em></div></div>
    <label>Seu Riot ID <em>Nome#TAG</em></label>
    <div className="riotInput">
     <input aria-label="Seu Riot ID" autoFocus value={riotId} onChange={e=>setRiotId(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')lookup()}} placeholder="Ex.: AlchemyFlames#BR1"/>
     <select aria-label="Servidor do League" value={riotPlatform} onChange={e=>setRiotPlatform(e.target.value)}>
      <option value="br1">BR</option><option value="na1">NA</option><option value="la1">LAN</option><option value="la2">LAS</option><option value="euw1">EUW</option><option value="eun1">EUNE</option><option value="kr">KR</option><option value="jp1">JP</option>
     </select>
    </div>
    <div className="riotHelpGrid">
     <span><Icon name="search"/><b>DADOS PÚBLICOS</b><small>Nome#TAG localiza seu perfil de League.</small></span>
     <span><Icon name="status"/><b>NÃO É LOGIN RIOT</b><small>Isso não comprova propriedade da conta.</small></span>
    </div>
    <button className="authPrimary setupPrimary" onClick={lookup}>LOCALIZAR E CRIAR MINHA RIOT LIFE →</button>
   </>}

   {status&&<p className="status" role="status" aria-live="polite">{status}</p>}
   {player?.account&&<div className="riotResult">
    <span className="riotResultCheck"><Icon name="check"/></span>
    <div><small>RIOT ID LOCALIZADO</small><h3>{player.account.gameName}<span>#{player.account.tagLine}</span></h3><p>Conexão pronta. Sua história começa com os dados disponíveis agora.</p></div>
   </div>}
  </div>
 </section>;
}
