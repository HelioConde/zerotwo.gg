import React, { Suspense, lazy, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './ux-polish.css';
import './redesign-2026.css';
import { supabase } from './supabase';
import { ztLog, flushProductEvents } from './lib/telemetry';
import { Icon } from './components/ZeroTwoUI';
import { I18nProvider, useLanguage } from './i18n';
import { PublicPlayerLookup } from './features/public/PublicPlayerLookup';

const Connect01=lazy(()=>import('./features/onboarding/Connect01').then(module=>({default:module.Connect01})));

type OwnRiotAccount={
  game_name:string;
  tag_line:string;
  platform?:string|null;
};

function App(){
  useLanguage();

  const [session,setSession]=useState<any>(null);
  const [authReady,setAuthReady]=useState(false);
  const [needsOnboarding,setNeedsOnboarding]=useState(false);
  const [ownRiot,setOwnRiot]=useState<OwnRiotAccount|null>(null);
  const [authOpen,setAuthOpen]=useState(false);
  const [publicReset,setPublicReset]=useState(0);
  function showPublicRoute(url:string){
    window.history.pushState({},document.title,url);
    setAuthOpen(false);
    setPublicReset(v=>v+1);
    requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'smooth'}));
  }

  function openOwnRiotLife(account:OwnRiotAccount|null=ownRiot){
    if(!account?.game_name||!account?.tag_line){
      setNeedsOnboarding(true);
      setAuthOpen(true);
      return;
    }
    const params=new URLSearchParams();
    params.set('player',account.game_name+'#'+account.tag_line);
    params.set('server',account.platform||'br1');
    showPublicRoute(location.pathname+'?'+params.toString());
  }

  async function routePlayer(s:any,{autoOpen=false}:{autoOpen?:boolean}={}){
    if(!s){
      setNeedsOnboarding(false);
      setOwnRiot(null);
      setAuthReady(true);
      return;
    }

    const [{data:p,error:pe},{data:r,error:re}]=await Promise.all([
      supabase.from('profiles').select('onboarding_complete').eq('user_id',s.user.id).maybeSingle(),
      supabase.from('riot_accounts').select('game_name,tag_line,platform').eq('user_id',s.user.id).maybeSingle()
    ]);

    if(pe||re){
      console.error('ZeroTwo route authorization:',pe||re);
      setNeedsOnboarding(true);
      setOwnRiot(null);
      setAuthReady(true);
      return;
    }

    const account=(r||null) as OwnRiotAccount|null;
    const complete=Boolean(p?.onboarding_complete&&account?.game_name&&account?.tag_line);
    setOwnRiot(account);
    setNeedsOnboarding(!complete);
    setAuthReady(true);

    // The old authenticated dashboard is retired. After a fresh sign-in or
    // onboarding completion, open the same public Riot Life experience used
    // everywhere else instead of sending the player to PlayerHome.
    if(complete&&autoOpen&&!new URL(location.href).searchParams.has('player')){
      openOwnRiotLife(account);
    }
  }

  function goHome(target?:'experience'){
    window.history.pushState({},document.title,location.pathname);
    setAuthOpen(false);
    setPublicReset(v=>v+1);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(target==='experience')document.getElementById('experience')?.scrollIntoView({behavior:'smooth'});
      else window.scrollTo({top:0,behavior:'smooth'});
    }));
  }

  useEffect(()=>{
    const onPop=()=>{
        setPublicReset(v=>v+1);
    };
    window.addEventListener('popstate',onPop);
    return()=>window.removeEventListener('popstate',onPop);
  },[]);

  useEffect(()=>{
    sessionStorage.removeItem('zt_player_focus');
    sessionStorage.setItem('zt_active_game','lol');
    if(sessionStorage.getItem('zt_pending_action')==='valorant')sessionStorage.removeItem('zt_pending_action');

    const openAuth=()=>setAuthOpen(true);
    const goPublicHome=()=>goHome();
    window.addEventListener('zt:open-auth',openAuth);
    window.addEventListener('zt:go-home',goPublicHome);
    return()=>{
      window.removeEventListener('zt:open-auth',openAuth);
      window.removeEventListener('zt:go-home',goPublicHome);
    };
  },[]);

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{
      setSession(data.session);
      if(data.session?.user?.id)flushProductEvents(data.session.user.id);
      // Returning signed-in users stay on the URL they intentionally opened.
      routePlayer(data.session,{autoOpen:false});
    });

    const {data}=supabase.auth.onAuthStateChange((event,x)=>{
      setSession(x);
      if(x?.user?.id){
        flushProductEvents(x.user.id);
        if(event==='SIGNED_IN'){
          ztLog(x.user.id,'auth_completed',{
            area:'product_funnel',
            context:{
              provider:x.user.app_metadata?.provider||'unknown',
              intent:sessionStorage.getItem('zt_pending_action')||'account'
            }
          });
        }
      }
      routePlayer(x,{autoOpen:event==='SIGNED_IN'});
    });

    return()=>data.subscription.unsubscribe();
  },[]);

  return <main className="gamingLanding">
    <nav className="gameNav">
      <button className="brand brandButton" onClick={()=>goHome()}>
        <b className="brandMark"><img src="/zerotwo.gg/assets/zerotwo/zerotwo-mark.svg" alt=""/></b>
        ZERO<span>TWO</span><small>.GG</small>
      </button>

      <div className="navlinks">
        <button className="navLinkButton" onClick={()=>goHome()}><Icon name="search"/> Buscar</button>
        <button className="navLinkButton" onClick={()=>goHome('experience')}><Icon name="dna"/> Riot Life</button>

        {session?<>
          <button className="accountNav" onClick={()=>openOwnRiotLife()}>
            <span className="accountDot"/> MINHA RIOT LIFE
          </button>
          <button className="logoutNav" onClick={async()=>{
            await supabase.auth.signOut();
            setSession(null);
            setOwnRiot(null);
            goHome();
          }}>Sair</button>
        </>:<>
          <button className="navLinkButton" onClick={()=>setAuthOpen(true)}><Icon name="login"/> Entrar</button>
          <button className="navCta navCtaButton" onClick={()=>setAuthOpen(true)}><Icon name="spark"/> Criar minha Riot Life</button>
        </>}
      </div>
    </nav>

    <PublicPlayerLookup key={publicReset}/>

    {authOpen&&(!session||needsOnboarding||!authReady)&&
      <div
        className="authOverlay"
        role="dialog"
        aria-modal="true"
        aria-label="Entrar no ZeroTwo"
        onMouseDown={e=>{if(e.target===e.currentTarget)setAuthOpen(false)}}
      >
        <div className="authOverlayPanel">
          <button className="authOverlayClose" aria-label="Fechar" onClick={()=>setAuthOpen(false)}>×</button>
          <Suspense fallback={<div className="clientLoading">ABRINDO LOGIN<span>...</span></div>}>
            <Connect01
              session={session}
              onSessionChange={setSession}
              onProfileComplete={()=>routePlayer(session,{autoOpen:true})}
            />
          </Suspense>
        </div>
      </div>
    }

    <footer className="siteFooter">
      <div className="siteFooterIdentity">
        <button className="brand brandButton" onClick={()=>goHome()}>
          <b className="brandMark"><img src="/zerotwo.gg/assets/zerotwo/zerotwo-mark.svg" alt=""/></b>
          ZERO<span>TWO</span><small>.GG</small>
        </button>
        <p>Sua história Riot, viva.</p>
        <span>League of Legends por Riot ID, com contexto em vez de uma parede de números.</span>
      </div>

      <nav className="siteFooterNav" aria-label="Informações e guias do ZeroTwo">
        <section>
          <small>ZEROTWO</small>
          <a href="/zerotwo.gg/sobre/">Sobre</a>
          <a href="/zerotwo.gg/como-funciona/">Como funciona</a>
        </section>
        <section>
          <small>GUIAS</small>
          <a href="/zerotwo.gg/lol-stats-tracker/">LoL Stats Tracker</a>
          <a href="/zerotwo.gg/maestria-lol/">Maestria LoL</a>
          <a href="/zerotwo.gg/historico-lol/">Histórico LoL</a>
          <a href="/zerotwo.gg/rank-lol/">Rank LoL</a>
        </section>
        <section>
          <small>RECURSOS</small>
          <a href="/zerotwo.gg/glossario-lol/">Glossário LoL</a>
          <a href="/zerotwo.gg/arena-lol/">Arena LoL</a>
          <a href="/zerotwo.gg/sitemap.xml">Sitemap</a>
          <a href="https://github.com/HelioConde/zerotwo.gg" target="_blank" rel="noreferrer">GitHub ↗</a>
        </section>
      </nav>

      <small className="siteFooterLegal">
        ZeroTwo.gg is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone
        officially involved in producing or managing Riot Games properties. Riot Games and all associated properties
        are trademarks or registered trademarks of Riot Games, Inc.
      </small>
    </footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider><App/></I18nProvider>
  </React.StrictMode>
);
