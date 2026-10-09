import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabase';
import { ztProductEvent } from '../../lib/telemetry';
import { Icon, GameBadge } from '../../components/ZeroTwoUI';
import { fmtStatNumber } from '../../lib/format';
import { getLocale, useLanguage } from '../../i18n';

const RiotLifeExperience=lazy(()=>import('./RiotLifeExperience').then(module=>({default:module.RiotLifeExperience})));

function HomeExperience(){
 return <section className="homeJourney" id="experience">
  <section className="homeJourneyChapter homeJourneyDiscover">
   <img className="homeJourneyArt" loading="lazy" decoding="async" src="/zerotwo.gg/assets/zerotwo/Imagem%20do%20ChatGPT%201%20de%20out.%20de%202026,%2017_10_14-3.png" alt="" aria-hidden="true"/>
   <span className="homeJourneyNo">01</span>
   <div><small>DESCUBRA</small><h2>UM NÚMERO BOM É ÚTIL.<br/><span>UMA HISTÓRIA É MEMORÁVEL.</span></h2><p>O ZeroTwo não abre com uma parede de estatísticas. Primeiro ele escolhe o que realmente marcou a janela disponível e transforma isso em uma leitura curta.</p></div>
   <aside><Icon name="spark"/><b>UMA DESCOBERTA POR VEZ</b><small>sem repetir o mesmo KDA em cinco cards</small></aside>
  </section>
  <section className="homeJourneyChapter homeJourneyRemember">
   <img className="homeJourneyArt" loading="lazy" decoding="async" src="/zerotwo.gg/assets/zerotwo/Imagem%20do%20ChatGPT%201%20de%20out.%20de%202026,%2017_10_13-2.png" alt="" aria-hidden="true"/>
   <span className="homeJourneyNo">02</span>
   <div><small>LEMBRE</small><h2>SUA CONTA <span>MUDA DE FASE.</span></h2><p>Quando campeão, modo, ritmo ou frequência mudam, isso vira um novo capítulo. A memória cresce conforme você volta ao site.</p></div>
   <aside><Icon name="sync"/><b>TIME MACHINE + ERAS</b><small>comparação só quando existe mudança</small></aside>
  </section>
  <section className="homeJourneyChapter homeJourneyPeople">
   <img className="homeJourneyArt" loading="lazy" decoding="async" src="/zerotwo.gg/assets/zerotwo/Imagem%20do%20ChatGPT%201%20de%20out.%20de%202026,%2017_10_15-4.png" alt="" aria-hidden="true"/>
   <span className="homeJourneyNo">03</span>
   <div><small>RECONHEÇA</small><h2>ALGUNS NOMES <span>VOLTAM A APARECER.</span></h2><p>Jogadores recorrentes entram como parte da história social da sua amostra — sem chamar isso de amizade, química ou compatibilidade.</p></div>
   <aside><Icon name="user"/><b>PLAYERS TIMELINE</b><small>quem entrou, ficou ou deixou de aparecer</small></aside>
  </section>
  <section className="homeSeoIntent" aria-labelledby="seo-lol-title">
   <header>
    <small>LEAGUE OF LEGENDS // PERFIL DE JOGADOR</small>
    <h2 id="seo-lol-title">ESTATÍSTICAS DE LOL POR <span>RIOT ID.</span></h2>
    <p>Pesquise um jogador pelo formato <strong>Nome#TAG</strong> para consultar dados públicos de League of Legends e transformar o histórico recente em uma leitura mais fácil de entender.</p>
   </header>
   <div>
    <article><Icon name="game"/><h3>Rank e histórico de partidas</h3><p>Veja rank publicado, LP, resultados recentes, KDA, dano, ouro e contextos como Ranked, Normal, ARAM e Arena.</p></article>
    <article><Icon name="spark"/><h3>Maestria de campeões</h3><p>Compare os campeões com maior maestria da conta com os que realmente aparecem na fase recente do jogador.</p></article>
    <article><Icon name="dna"/><h3>Tendências e Riot Life</h3><p>O ZeroTwo organiza até 100 partidas em capítulos para destacar mudanças, sequências, horários, impacto e padrões sem inventar um MMR paralelo.</p></article>
    <nav className="homeSeoGuides" aria-label="Guias de League of Legends">
     <a href="/zerotwo.gg/lol-stats-tracker/"><b>LoL Stats Tracker 2026</b><small>Buscar jogador por Riot ID, rank e histórico →</small></a>
     <a href="/zerotwo.gg/estatisticas-lol/"><b>Estatísticas LoL</b><small>Rank, histórico, campeões e tendências →</small></a>
     <a href="/zerotwo.gg/riot-id/"><b>Buscar por Riot ID</b><small>Como usar Nome#TAG e servidor →</small></a>
     <a href="/zerotwo.gg/maestria-lol/"><b>Maestria LoL</b><small>Pontos, nível e fase recente →</small></a>
     <a href="/zerotwo.gg/historico-lol/"><b>Histórico LoL</b><small>Como interpretar partidas recentes →</small></a>
     <a href="/zerotwo.gg/rank-lol/"><b>Rank LoL</b><small>Elo, divisão, LP e win rate →</small></a>
     <a href="/zerotwo.gg/arena-lol/"><b>Arena LoL</b><small>Top 4, colocações e histórico →</small></a>
    </nav>
   </div>
  </section>
  <section className="homeTransparency">
   <header><small>TRANSPARÊNCIA // DADOS RIOT</small><h2>O QUE O ZEROTWO FAZ — <span>E O QUE NÃO FAZ.</span></h2><p>A Riot Life organiza dados permitidos em uma história pós-partida. A interpretação nunca substitui os dados oficiais.</p></header>
   <div>
    <article><Icon name="check"/><small>01 // FONTE</small><b>DADOS RIOT</b><p>Riot ID, partidas, rank e maestria vêm das APIs e fontes oficiais usadas pelo produto.</p></article>
    <article><Icon name="status"/><small>02 // MOMENTO</small><b>PÓS-PARTIDA</b><p>O ZeroTwo não fornece orientação competitiva em tempo real nem informação oculta do adversário.</p></article>
    <article><Icon name="game"/><small>03 // CONTEXTO</small><b>MODOS SEPARADOS</b><p>Ranked, Normal, ARAM e Arena não são tratados como se fossem o mesmo tipo de partida.</p></article>
    <article><Icon name="dna"/><small>04 // LIMITE</small><b>SEM MMR PARALELO</b><p>Não criamos ELO/MMR alternativo nem uma nota única para definir a habilidade do jogador.</p></article>
   </div>
   <a className="homeMethodologyLink" href="/zerotwo.gg/como-funciona/">COMO O ZEROTWO CALCULA E ORGANIZA OS DADOS →</a>
  </section>
  <section className="homeJourneyEnd">
   <img className="homeJourneyArt homeJourneyEndArt" loading="lazy" decoding="async" src="/zerotwo.gg/assets/zerotwo/Imagem%20do%20ChatGPT%201%20de%20out.%20de%202026,%2017_10_12-1.png" alt="" aria-hidden="true"/>
   <div><small>ZEROTWO // RIOT LIFE</small><h2>MENOS DASHBOARD.<br/><span>MAIS DESCOBERTA.</span></h2></div>
   <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>PESQUISAR UM RIOT ID ↑</button>
  </section>
 </section>
}

function normalizeRiotId(value:string){
  const cleaned=String(value||'').replace(/\s*#\s*/g,'#').replace(/^\s+|\s+$/g,'');
  const cut=cleaned.lastIndexOf('#');
  if(cut<0)return cleaned;
  return cleaned.slice(0,cut).trim()+'#'+cleaned.slice(cut+1).trim();
}

export function PublicPlayerLookup(){
 const {language,setLanguage}=useLanguage();
 const ddragonLocale=language==='en'?'en_US':'pt_BR';
 const initialParams=new URLSearchParams(location.search);const [q,setQ]=useState(()=>initialParams.get('player')||''),[platform,setPlatform]=useState(()=>initialParams.get('server')||'br1'),[loading,setLoading]=useState(false),[error,setError]=useState(''),[data,setData]=useState<any>(null),[champions,setChampions]=useState<any>({}),[ddv,setDdv]=useState('16.17.1'),[matchFilter,setMatchFilter]=useState('ALL'),[openMatch,setOpenMatch]=useState<string|null>(null),[changes,setChanges]=useState<any>(null),[shareStatus,setShareStatus]=useState(''),[recentPlayers,setRecentPlayers]=useState<Array<{riotId:string,platform:string,searchedAt:number}>>(()=>{try{const v=JSON.parse(localStorage.getItem('zt_recent_players')||'[]');return Array.isArray(v)?v.slice(0,5):[]}catch{return[]}}),[showMomentExplanation,setShowMomentExplanation]=useState(false),[profileView,setProfileView]=useState<'moment'|'dna'|'champions'|'matches'>('moment'),[championView,setChampionView]=useState<'recent'|'mastery'>('recent'),[matchLimit,setMatchLimit]=useState(5);
 const publicSearchStarted=useRef(false);
 const lookupSequence=useRef(0);
 const [depthLoading,setDepthLoading]=useState(false);
 const [depthError,setDepthError]=useState('');
 const [depthElapsed,setDepthElapsed]=useState(0);
 useEffect(()=>{
  if(!depthLoading)return;
  const timer=window.setInterval(()=>setDepthElapsed(value=>value+1),1000);
  return()=>window.clearInterval(timer);
 },[depthLoading]);
 useEffect(()=>{ztProductEvent('landing_view',{area:'product_funnel',context:{has_shared_player:initialParams.has('player')}})},[]);
 useEffect(()=>{
  let cancelled=false;
  let idleId:number|undefined;
  let timeoutId:number|undefined;
  const load=()=>fetch('https://ddragon.leagueoflegends.com/api/versions.json')
   .then(r=>r.json())
   .then(async(v:any[])=>{
    const ver=v?.[0]||'16.17.1';
    if(cancelled)return;
    setDdv(ver);
    const j=await fetch('https://ddragon.leagueoflegends.com/cdn/'+ver+'/data/'+ddragonLocale+'/champion.json').then(r=>r.json());
    if(cancelled)return;
    const x:any={};
    Object.values(j.data||{}).forEach((c:any)=>{
     const value={name:c.name,id:c.id};
     x[String(c.key)]=value;x[String(c.name)]=value;x[String(c.id)]=value;
    });
    setChampions(x);
   }).catch(()=>{});
  const w=window as any;
  if(typeof w.requestIdleCallback==='function')idleId=w.requestIdleCallback(load,{timeout:1800});
  else timeoutId=window.setTimeout(load,900);
  return()=>{
   cancelled=true;
   if(idleId!==undefined&&typeof w.cancelIdleCallback==='function')w.cancelIdleCallback(idleId);
   if(timeoutId!==undefined)window.clearTimeout(timeoutId);
  };
 },[ddragonLocale]);
 function apiMessage(error:any,response:any){
  if(response?.message)return String(response.message);
  const code=Number(error?.context?.status||0);
  if(code===429)return 'A Riot atingiu o limite temporário de consultas. Tente novamente em instantes.';
  if(code===401||code===403)return 'O serviço de dados Riot não autorizou esta consulta. Tente novamente mais tarde.';
  if(code===404)return 'Jogador ou dados não encontrados. Confira o Riot ID e o servidor.';
  if(code>=500)return 'Os dados da Riot estão temporariamente indisponíveis. Tente novamente.';
  return 'Não foi possível completar a pesquisa. Verifique a conexão e tente novamente.';
 }
 const regionFor=(p:string)=>['br1','na1','la1','la2'].includes(p)?'americas':['kr','jp1'].includes(p)?'asia':['ph2','sg2','th2','tw2','vn2'].includes(p)?'sea':'europe';
 useEffect(()=>{const p=initialParams.get('player');if(p)search(p,initialParams.get('server')||platform,true)},[]); async function shareProfile(){const url=location.href;try{if(navigator.share)await navigator.share({title:(data?.player?.gameName||'Player')+' // ZeroTwo.gg',url});else await navigator.clipboard.writeText(url);setShareStatus('LINK COPIADO');setTimeout(()=>setShareStatus(''),1800)}catch{}}
 async function search(queryOverride?:any,platformOverride?:string,silentUrl=false){const query=normalizeRiotId(typeof queryOverride==='string'?queryOverride:q),p=platformOverride||platform;setQ(query);setPlatform(p);const cut=query.lastIndexOf('#');if(cut<1||cut===query.length-1){setError('Use o formato Nome#TAG.');return}const gameName=query.slice(0,cut).trim(),tagLine=query.slice(cut+1).trim();ztProductEvent('riot_id_submitted',{area:'product_funnel',context:{server:p,source:silentUrl?'shared_link':'search'}});const lookupId=++lookupSequence.current;setDepthError('');setDepthElapsed(0);setDepthLoading(false);setLoading(true);setError('');setData(null);setChanges(null);setOpenMatch(null);setMatchFilter('ALL');setProfileView('moment');setShowMomentExplanation(false);setChampionView('recent');setMatchLimit(5);const {data:r,error:e}=await supabase.functions.invoke('public-lol-profile',{body:{gameName,tagLine,platform:p,region:regionFor(p),limit:20}});if(lookupId!==lookupSequence.current)return;setLoading(false);if(e||r?.error){setError(apiMessage(e,r));return}const key='zt_public_'+p+'_'+(gameName+'#'+tagLine).toLowerCase();let prev:any=null;try{prev=JSON.parse(localStorage.getItem(key)||'null')}catch{}const latestAt=Number(r.matches?.[0]?.playedAt||0),newMatches=prev?.lastSeenPlayedAt?(r.matches||[]).filter((m:any)=>Number(m.playedAt||0)>Number(prev.lastSeenPlayedAt)).length:0,kdaDelta=prev?.avgKda!=null&&r.summary?.avgKda!=null?+(Number(r.summary.avgKda)-Number(prev.avgKda)).toFixed(2):null;setChanges(prev?{newMatches,modeChanged:!!prev.mainContext&&prev.mainContext!==r.summary?.mainContext,previousMode:prev.mainContext,kdaDelta}:null);try{localStorage.setItem(key,JSON.stringify({lastSeenPlayedAt:latestAt,mainContext:r.summary?.mainContext,avgKda:r.summary?.avgKda,searchedAt:Date.now()}));const riotId=r.player.gameName+'#'+r.player.tagLine;const recent=[{riotId,platform:p,searchedAt:Date.now()},...recentPlayers.filter(x=>x.riotId.toLowerCase()!==riotId.toLowerCase()||x.platform!==p)].slice(0,5);localStorage.setItem('zt_recent_players',JSON.stringify(recent));setRecentPlayers(recent)}catch{}ztProductEvent('riot_player_found',{area:'product_funnel',context:{server:p,source:silentUrl?'shared_link':'search',matches:r.summary?.matches||0,main_context:r.summary?.mainContext||null}});setData(r);if(!silentUrl){const nextUrl=location.pathname+'?player='+encodeURIComponent(r.player.gameName+'#'+r.player.tagLine)+'&server='+encodeURIComponent(p);if(location.pathname+location.search!==nextUrl)window.history.pushState({},document.title,nextUrl)}if(!silentUrl||!location.hash.startsWith('#riot-'))setTimeout(()=>document.querySelector('.publicPlayerResult')?.scrollIntoView({behavior:'smooth',block:'start'}),80)}
 async function extendHistory(){
  if(!data?.player||depthLoading)return;
  const requestId=lookupSequence.current;
  setDepthElapsed(0);setDepthLoading(true);setDepthError('');
  const gameName=String(data.player.gameName),tagLine=String(data.player.tagLine);
  const {data:extended,error}=await supabase.functions.invoke('public-lol-profile',{body:{gameName,tagLine,platform,region:regionFor(platform),limit:100}});
  if(requestId!==lookupSequence.current)return;
  setDepthLoading(false);
  if(error||extended?.error){setDepthError(apiMessage(error,extended));return}
  if((extended?.matches?.length||0)<(data.matches?.length||0)){setDepthError('A atualização retornou uma amostra menor. Os dados atuais foram preservados.');return}
  setData(extended);
  if(extended?.cache?.pending>0)setDepthError('Parte do histórico ainda não está disponível. Você pode tentar completar a análise depois.');
 }
 function jumpToProfileSection(id:string){
  const element=document.getElementById(id);
  if(!element)return;
  const top=Math.max(0,window.scrollY+element.getBoundingClientRect().top-84);
  window.scrollTo({top,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 }
 function openEvidence(view:'moment'|'champions'|'matches'|'dna'){
  const details=document.getElementById('riot-evidence') as HTMLDetailsElement|null;
  if(!details)return;
  setProfileView(view);
  details.open=true;
  window.requestAnimationFrame(()=>{
   jumpToProfileSection('riot-evidence');
   (details.querySelector('summary') as HTMLElement|null)?.focus({preventScroll:true});
  });
 }
 const shown=data?(data.matches||[]).filter((m:any)=>matchFilter==='ALL'||(matchFilter==='OTHER'?!['RANKED','NORMAL','ARAM','ARENA'].includes(m.context):m.context===matchFilter)):[];
 return <section className={'publicLookup homeLookup'+(data?' hasResult':'')+' game-lol'}><a className="skipToContent" href={data?'#profile-overview':'#experience'}>PULAR PARA O CONTEÚDO PRINCIPAL</a><div className="homeHero"><div className="homeHeroBackdrop" aria-hidden="true"><span className="heroZero">ZT</span><i/><i/></div><div className="lookupIntro homeHeroCopy"><small>ESTATÍSTICAS LOL POR RIOT ID // LEAGUE OF LEGENDS</small><h1>SUA HISTÓRIA RIOT.<br/><span>VALE MAIS QUE UM KDA.</span></h1><p>Digite um Riot ID. O ZeroTwo procura sessões, mudanças, momentos e padrões dentro dos dados que a Riot realmente disponibiliza. <b>Sem cadastro.</b></p><div className="lookupSearch"><div><Icon name="search"/><input aria-label="Riot ID para buscar jogador" aria-describedby="riot-id-help" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="search" autoComplete="off" value={q} onFocus={()=>{if(!publicSearchStarted.current){publicSearchStarted.current=true;ztProductEvent('riot_id_started',{area:'product_funnel',context:{source:'public_search'}})}}} onChange={e=>setQ(e.target.value.replace(/\s*#\s*/g,'#'))} onBlur={()=>setQ(normalizeRiotId(q))} onPaste={e=>{const pasted=e.clipboardData.getData('text');if(pasted.includes('#')){e.preventDefault();setQ(normalizeRiotId(pasted))}}} onKeyDown={e=>e.key==='Enter'&&!loading&&search()} placeholder="Nome#TAG  ·  Ex.: AlchemyFlames#BR1"/>{q&&<button type="button" className="lookupClear" aria-label="Limpar Riot ID" onClick={()=>{setQ('');setError('')}}>×</button>}</div><select aria-label="Servidor da busca" title="Servidor da busca" value={platform} onChange={e=>setPlatform(e.target.value)}><option value="br1">BR</option><option value="na1">NA</option><option value="la1">LAN</option><option value="la2">LAS</option><option value="euw1">EUW</option><option value="eun1">EUNE</option><option value="kr">KR</option><option value="jp1">JP</option><option value="oc1">OCE</option><option value="tr1">TR</option></select><button onClick={search} disabled={loading} aria-busy={loading}>{loading?'LENDO RIOT LIFE...':'VER RIOT LIFE →'}</button></div><div id="riot-id-help" className="lookupHelp"><span>Formato: <b>Nome#TAG</b> · dados públicos da Riot</span><span>{loading?'Buscando perfil, histórico e capítulos…':'As primeiras 20 partidas aparecem rapidamente. Você pode ampliar para até 100.'}</span></div>{error&&<p className="lookupError" role="alert"><b>NÃO CONSEGUIMOS CONCLUIR A BUSCA.</b><span>{error}</span><button onClick={()=>search()} disabled={loading}>TENTAR NOVAMENTE</button></p>}<div className="lookupTrust"><span><Icon name="check"/> SEM CADASTRO</span><span><Icon name="game"/> DADOS RIOT</span><span><Icon name="dna"/> HISTÓRIA + DNA</span></div><div className="homeHeroFacts" aria-label="Resumo do que a Riot Life analisa"><span><b>20</b><small>CAPÍTULOS</small></span><span><b>20 → 100</b><small>HISTÓRICO SOB DEMANDA</small></span><span><b>4+</b><small>CONTEXTOS SEPARADOS</small></span></div>{!data&&recentPlayers.length>0&&<div className="recentPlayerSearches"><div><small>BUSCAS RECENTES</small><button onClick={()=>{localStorage.removeItem('zt_recent_players');setRecentPlayers([])}}>LIMPAR</button></div><section>{recentPlayers.map(x=><button key={x.platform+'-'+x.riotId} onClick={()=>search(x.riotId,x.platform)}><span><b>{x.riotId}</b><small>{x.platform.toUpperCase()}</small></span><Icon name="arrow"/></button>)}</section></div>}</div></div>{!data&&!loading&&<HomeExperience/>}{loading&&<div className="lookupLoading" role="status" aria-live="polite"><Icon name="search"/><b>LENDO A RIOT LIFE</b><span>Histórico, rank, maestria e padrões recentes...</span><i/></div>}{data&&<div className="publicPlayerResult publicPlayerV4">
 <button className="publicBackHome" onClick={()=>window.dispatchEvent(new CustomEvent('zt:go-home'))}>← NOVA BUSCA</button>
 <section id="profile-overview" className="playerIdentityStrip">
  <div className="playerIdentityMain">
   <div className="publicPlayerBadge">{data.player.profileIconId?<img src={'https://ddragon.leagueoflegends.com/cdn/'+ddv+'/img/profileicon/'+data.player.profileIconId+'.png'} alt={'Ícone de perfil de '+data.player.gameName}/>:'ZT'}</div>
   <div><small>RIOT ID // {data.player.platform}</small><h2>{data.player.gameName}<span>#{data.player.tagLine}</span></h2><p>Nível {data.player.level??'—'} · League of Legends</p></div>
  </div>
  <div className="playerIdentityRanks">
   {data.ranked?.length>0?data.ranked.slice(0,2).map((r:any)=><span key={r.queue}><small>{r.queue}</small><b>{r.tier} {r.rank}</b><em>{r.lp} LP · {r.winRate}% WR</em></span>):<span><small>RANK OFICIAL</small><b>{data.status?.ranked==='unavailable'?'INDISPONÍVEL':'SEM RANK'}</b><em>{data.status?.ranked==='unavailable'?'Falha temporária da Riot':'nesta consulta'}</em></span>}
  </div>
  <div className="playerIdentityActions"><a className="playerQuickPrimary" href="#riot-life-story">LER RIOT LIFE ↓</a><button type="button" className="playerEvidenceAction" onClick={()=>openEvidence('moment')}>EVIDÊNCIAS</button><button className="playerShare" aria-live="polite" aria-label={shareStatus?'Link do perfil copiado':'Compartilhar esta Riot Life'} onClick={shareProfile}><Icon name={shareStatus?'check':'arrow'}/> {shareStatus||'COMPARTILHAR'}</button><div className="playerLocaleActions" role="group" aria-label="Idioma da Riot Life">
     <button type="button" title="Português (Brasil)" onClick={()=>setLanguage('pt-BR')} aria-pressed={language==='pt-BR'} className={language==='pt-BR'?'active':''}>PT-BR</button>
     <button type="button" title="English" onClick={()=>setLanguage('en')} aria-pressed={language==='en'} className={language==='en'?'active':''}>EN</button>
   </div></div>
 </section>
 <nav className="profileQuickNav" aria-label="Atalhos do perfil">
   <span>ACESSO RÁPIDO</span>
   <button type="button" onClick={()=>jumpToProfileSection('riot-life-story')}><Icon name="dna"/> HISTÓRIA</button>
   <button type="button" onClick={()=>openEvidence('matches')}><Icon name="game"/> PARTIDAS</button>
   <button type="button" onClick={()=>openEvidence('champions')}><Icon name="status"/> CAMPEÕES</button>
   <button type="button" onClick={()=>openEvidence('dna')}><Icon name="arrow"/> DNA</button>
 </nav>
 <section className="historyDepthPanel" aria-label="Profundidade do histórico" aria-live="polite">
  <div><small>HISTÓRICO OBSERVADO</small><b>{data.matches?.length||0} partidas carregadas</b><p>Começamos com uma amostra menor para preservar velocidade e limites da API. Os dados da Riot podem ser expandidos para até 100 partidas.</p>
   {data.status?.mastery==='unavailable'&&<p className="historyDepthWarning">A maestria não pôde ser consultada agora; isso não significa que o jogador não tenha maestria.</p>}
   {data.status?.history==='partial'&&<p className="historyDepthWarning">A Riot retornou apenas parte das partidas solicitadas.</p>}
   {depthLoading&&<div className="historyDepthProgress" role="status" aria-live="polite">
    <span className="historyDepthSpinner" aria-hidden="true"/>
    <span><b>Ampliando análise · {Math.floor(depthElapsed/60)}:{String(depthElapsed%60).padStart(2,'0')}</b>
      <small>{depthElapsed<15?'Conectando os registros recentes...':depthElapsed<35?'Consultando e organizando partidas adicionais...':'Ainda trabalhando com a Riot. O histórico que você já abriu continua disponível.'}</small>
      <small>Na primeira consulta, a expansão pode levar cerca de um minuto. Este relógio indica tempo decorrido, não porcentagem concluída.</small>
    </span>
   </div>}
   {depthError&&<p className="historyDepthWarning" role="alert">{depthError}</p>}
  </div>
  {((Number(data.cache?.requested||20)<100&&Number(data.cache?.availableIds||0)>=Number(data.cache?.requested||20))||Number(data.cache?.pending||0)>0)&&<button onClick={extendHistory} disabled={depthLoading} aria-busy={depthLoading}>{depthLoading?'AMPLIANDO HISTÓRICO...':Number(data.cache?.requested||20)>=100?'TENTAR COMPLETAR HISTÓRICO':'ANALISAR ATÉ 100 PARTIDAS →'}</button>}
 </section>
 <Suspense fallback={<div className="riotLifeDeferredLoading">CARREGANDO ANÁLISE COMPLETA<span>...</span></div>}><RiotLifeExperience data={data} platform={platform} champions={champions} ddv={ddv}/></Suspense>
 <details id="riot-evidence" className="gameDataVault">
  <summary><span><small>EVIDÊNCIAS DA ANÁLISE</small><b>VER PARTIDAS E DADOS</b><em>{data.matches.length} partidas · {(data.mastery||[]).length} maestrias · {data.modeSummaries?.length||0} contextos</em></span><Icon name="arrow"/></summary>
  <div className="gameDataVaultBody">
 <section className="gameDataExplorer">
  <header><div><small>EVIDÊNCIAS // DADOS RIOT + CÁLCULOS ZEROTWO</small><h3>CONFIRA O QUE SUSTENTA A LEITURA.</h3><p>Partidas e dados oficiais ficam separados das interpretações calculadas pelo ZeroTwo para você poder conferir a evidência quando quiser.</p></div><Icon name="dna"/></header>
  <nav className="profileViewNav" aria-label="Dados técnicos do jogador">
   <button data-view="moment" className={profileView==='moment'?'active':''} aria-pressed={profileView==='moment'} onClick={()=>setProfileView('moment')}><small>01</small><b>SINAIS</b><span>Como lemos o momento</span></button>
   <button data-view="champions" className={profileView==='champions'?'active':''} aria-pressed={profileView==='champions'} onClick={()=>setProfileView('champions')}><small>02</small><b>CAMPEÕES</b><span>Forma e maestria</span></button>
   <button data-view="matches" className={profileView==='matches'?'active':''} aria-pressed={profileView==='matches'} onClick={()=>setProfileView('matches')}><small>03</small><b>PARTIDAS</b><span>Histórico completo</span></button>
   <button data-view="dna" className={profileView==='dna'?'active':''} aria-pressed={profileView==='dna'} onClick={()=>setProfileView('dna')}><small>04</small><b>DNA</b><span>Contextos comparáveis</span></button>
  </nav>
 </section>
 {profileView==='moment'&&<div className="momentView">
  {changes&&(changes.newMatches>0||changes.modeChanged||(changes.kdaDelta!=null&&Math.abs(changes.kdaDelta)>=.1))&&<section className="visitChanges"><small>DESDE SUA ÚLTIMA CONSULTA</small>{changes.newMatches>0&&<b>+{changes.newMatches} {changes.newMatches===1?'NOVA PARTIDA':'NOVAS PARTIDAS'}</b>}<div>{changes.modeChanged&&<span>Modo predominante: {changes.previousMode} → <strong>{data.summary.mainContext}</strong></span>}{changes.kdaDelta!=null&&Math.abs(changes.kdaDelta)>=.1&&<span>KDA recente {changes.kdaDelta>0?'subiu':'caiu'} <strong>{changes.kdaDelta>0?'+':''}{changes.kdaDelta}</strong></span>}</div></section>}
  <button className="momentExplainToggle" aria-expanded={showMomentExplanation} onClick={()=>setShowMomentExplanation(v=>!v)}><span><Icon name="dna"/> COMO CHEGAMOS NESSA LEITURA?</span><b>{showMomentExplanation?'FECHAR':'VER SINAIS'}</b></button>{showMomentExplanation&&<section className="momentExplanation"><div><small>EVIDÊNCIAS DO PERÍODO RECENTE</small><h3>OS DADOS QUE SUSTENTAM ESSA LEITURA.</h3>{data.analysis.signals.slice(0,3).map((x:string)=><p key={x}><Icon name="check"/> {x}</p>)}</div><aside><small>QUER APROFUNDAR?</small><button onClick={()=>setProfileView('dna')}>ENTENDER O DNA →</button><button onClick={()=>setProfileView('matches')}>ABRIR PARTIDAS →</button></aside></section>}
  <section className="momentNext"><div><small>CONTINUE INVESTIGANDO</small><h3>OS SINAIS ESTÃO EXPLICADOS.<br/><span>AGORA ABRA A EVIDÊNCIA.</span></h3></div><div><button onClick={()=>setProfileView('champions')}>EXPLORAR CAMPEÕES</button><button className="primary" onClick={()=>setProfileView('matches')}>ABRIR PARTIDAS →</button></div></section>
 </div>} {profileView==='dna'&&<div className="profileViewPanel dnaViewPanel"><div className="viewIntro"><small>02 // GAMING DNA</small><h3>SEU JEITO DE JOGAR DEPENDE DO CONTEXTO.</h3><p>Não existe uma nota única para definir você. Cada modo mostra sinais diferentes.</p></div>{data.modeSummaries?.length>0?<div className="dnaContexts">{data.modeSummaries.map((m:any)=><article className="dnaContextCard" key={m.name}><header><div><small>CONTEXTO</small><h4>{m.name}</h4></div><span>{m.games} {m.games===1?'partida':'partidas'}</span></header><div className="dnaContextLead">{m.name==='ARENA'?<><span><small>SEU SINAL PRINCIPAL</small><b>{m.top4Rate!=null?m.top4Rate+'% TOP 4':'—'}</b><em>colocação média {m.avgPlacement??'—'}</em></span><span><small>RITMO</small><b>{fmtStatNumber(m.avgDamagePerMin)}</b><em>dano por minuto</em></span></>:<><span><small>SEU SINAL PRINCIPAL</small><b>{m.winRate!=null?m.winRate+'% WR':'—'}</b><em>KDA {m.avgKda??'—'}</em></span><span><small>RITMO</small><b>{fmtStatNumber(m.avgDamagePerMin)}</b><em>dano por minuto</em></span></>}</div>{m.primaryPosition&&<p>Função mais frequente: <b>{m.primaryPosition}</b></p>}<div className="dnaContextChampions"><small>CAMPEÕES MAIS PRESENTES</small><div>{m.topChampions?.map((c:any)=><span key={c.name}>{c.name}<em>{c.games}x</em></span>)}</div></div></article>)}</div>:<div className="empty02"><b>AINDA NÃO HÁ CONTEXTO SUFICIENTE.</b><p>Precisamos de mais partidas comparáveis para construir esta leitura.</p></div>}</div>} {profileView==='champions'&&<div className="profileViewPanel championsViewPanel"><div className="viewIntro"><small>03 // CAMPEÕES</small><h3>VOCÊ QUER VER O AGORA OU SUA EXPERIÊNCIA?</h3><p>Forma recente e maestria respondem perguntas diferentes. Escolha uma de cada vez.</p></div><div className="championViewTabs"><button className={championView==='recent'?'active':''} onClick={()=>setChampionView('recent')}><b>AGORA</b><small>Quem aparece nas partidas recentes</small></button><button className={championView==='mastery'?'active':''} onClick={()=>setChampionView('mastery')}><b>MAESTRIA</b><small>Em quem você acumulou experiência</small></button></div>{championView==='recent'&&<div className="championFocusGrid">{(data.championSummaries||[]).slice(0,6).map((c:any)=>{const ci=champions[c.name];return <article key={c.name}>{ci&&<img src={'https://ddragon.leagueoflegends.com/cdn/'+ddv+'/img/champion/'+ci.id+'.png'} alt=""/>}<div><small>{c.contexts.join(' · ')}</small><b>{c.name}</b><p>{c.games} {c.games===1?'partida':'partidas'} · {c.avgPlacement!=null?(c.top4Rate!=null?c.top4Rate+'% Top 4':'—'):(c.winRate!=null?c.winRate+'% WR':'—')} · KDA {c.avgKda}</p></div></article>})}</div>}{championView==='mastery'&&<div className="masteryFocusGrid">{(data.mastery||[]).slice(0,6).map((m:any)=>{const c=champions[String(m.championId)];return <article key={m.championId}>{c&&<img src={'https://ddragon.leagueoflegends.com/cdn/'+ddv+'/img/champion/'+c.id+'.png'} alt=""/>}<div><small>MAESTRIA {m.level}</small><b>{c?.name||('Campeão '+m.championId)}</b><p>{Number(m.points).toLocaleString(getLocale())} pontos</p></div></article>})}</div>}</div>} {profileView==='matches'&&<div className="profileViewPanel matchesViewPanel"><div className="viewIntro"><small>04 // PARTIDAS</small><h3>AGORA SIM, OS DETALHES.</h3><p>Abra uma partida quando quiser investigar. O resumo não precisa disputar atenção com cada número ao mesmo tempo.</p></div> <section id="profile-matches" className="recentMatches"><header><div><small>HISTÓRICO RECENTE</small><h3>ÚLTIMAS PARTIDAS</h3></div><span>{shown.length} de {data.matches.length}</span></header><div className="matchFilters">{['ALL','RANKED','NORMAL','ARAM','ARENA','OTHER'].map(x=><button className={matchFilter===x?'active':''} onClick={()=>setMatchFilter(x)} key={x}>{x==='ALL'?'TODAS':x==='OTHER'?'OUTROS':x}</button>)}</div><div>{shown.slice(0,matchLimit).map((m:any)=><div className="matchEntry" key={m.id}><article className={((m.context==='ARENA'&&m.placement!=null)?(m.placement<=4?'win':'loss'):(m.win?'win':'loss'))+(m.eligible?' dnaEligible':'')}><i/><div className="matchChampion"><b>{m.champion}</b><small>{m.queue}{m.position?' · '+m.position:(m.queue!==m.context?' · '+m.context:'')} · {m.duration} min</small></div><strong>{m.context==='ARENA'?(m.placement!=null?m.placement+'º LUGAR':'ARENA'):(m.win?'VITÓRIA':'DERROTA')}</strong><div><b>{m.kills} / {m.deaths} / {m.assists}</b><small>KDA {m.kda}</small></div><div><b>{m.context==='RANKED'||m.context==='NORMAL'?m.csPerMin:'—'}</b><small>{m.context==='RANKED'||m.context==='NORMAL'?'CS / MIN':m.context}</small></div><div><b>{Math.round(m.damage/100)/10}k</b><small>DANO</small></div><button className="matchExpand" onClick={()=>setOpenMatch(openMatch===m.id?null:m.id)}>{openMatch===m.id?'FECHAR':'DETALHES'}</button></article>{openMatch===m.id&&<section className="matchDetail"><div className="matchDetailStats">{m.context==='ARENA'&&<span><small>COLOCAÇÃO</small><b>{m.placement!=null?m.placement+'º':'—'}</b></span>}<span><small>OURO</small><b>{Number(m.gold).toLocaleString(getLocale())}</b></span><span><small>OURO / MIN</small><b>{m.goldPerMin?Math.round(m.goldPerMin).toLocaleString(getLocale()):'—'}</b></span><span><small>DANO DO TIME</small><b>{m.teamDamageShare!=null?m.teamDamageShare+'%':'—'}</b></span><span><small>DANO RECEBIDO</small><b>{Math.round(m.damageTaken/100)/10}k</b></span><span><small>MITIGADO</small><b>{m.damageMitigated?Math.round(m.damageMitigated/100)/10+'k':'—'}</b></span><span><small>CC</small><b>{m.ccSeconds!=null?Math.round(m.ccSeconds)+'s':'—'}</b></span><span><small>CURA</small><b>{Math.round(m.healing/100)/10}k</b></span><span><small>ALIADOS</small><b>{Math.round(((m.healsOnTeammates||0)+(m.shieldOnTeammates||0))/100)/10}k</b></span><span><small>SOLO KILLS</small><b>{m.soloKills??0}</b></span><span><small>MULTIKILLS</small><b>{(m.doubleKills||0)+(m.tripleKills||0)+(m.quadraKills||0)+(m.pentaKills||0)}</b></span><span><small>OBJETIVOS</small><b>{(m.dragonKills||0)+(m.baronKills||0)+(m.riftHeraldTakedowns||0)+(m.objectivesStolen||0)}</b></span><span><small>VISÃO</small><b>{m.wardsPlaced??0}/{m.wardsKilled??0}</b></span><span><small>TORRES</small><b>{Math.round(m.turretDamage/100)/10}k</b></span><span><small>PARTICIPAÇÃO</small><b>{m.killParticipation!=null?m.killParticipation+'%':'—'}</b></span></div>{m.context==='ARENA'&&m.augments?.length>0&&<div className="matchAugments"><small>AUMENTOS</small><div>{m.augments.map((id:number)=><span key={id}>#{id}</span>)}</div></div>}{m.items?.length>0&&<div className="matchItems"><small>ITENS</small><div>{m.items.map((id:number)=><img key={id} src={'https://ddragon.leagueoflegends.com/cdn/'+ddv+'/img/item/'+id+'.png'} alt={'Item '+id}/>)}</div></div>}<div className="matchTeams"><div><small>SEU TIME</small><p>{m.teamChampions?.join(' · ')}</p></div><div><small>ADVERSÁRIOS</small><p>{m.enemyChampions?.join(' · ')}</p></div></div><div className="matchRead"><Icon name="dna"/><p><b>ZEROTWO //</b> Esta partida entra no contexto <strong>{m.context}</strong>. Ela contribui somente para métricas comparáveis a esse modo.</p></div>{shown.length>matchLimit&&<button className="showMoreMatches" onClick={()=>setMatchLimit(x=>Math.min(shown.length,x+5))}>MOSTRAR MAIS {Math.min(5,shown.length-matchLimit)} PARTIDAS ↓</button>}</section>}</div>)}</div></section>
</div>}   </div>
 </details>
 </div>}</section>
}
