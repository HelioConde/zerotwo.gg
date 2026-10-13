import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { productAnalyticsEnabled, setProductAnalyticsEnabled } from '../lib/telemetry';

type Props = {signedIn:boolean; onClose:()=>void};
function localKeys() {
  const keys:{storage:Storage;key:string}[]=[];
  for (const storage of [localStorage,sessionStorage]) {
    for (let index=0;index<storage.length;index++) {
      const key=storage.key(index);
      if (key?.startsWith('zt_')) keys.push({storage,key});
    }
  }
  return keys;
}
function clearLocalData() {
  // Never erase Supabase authentication tokens or data from other apps.
  for (const {storage,key} of localKeys()) storage.removeItem(key);
}

export function PrivacyCenter({signedIn,onClose}:Props) {
  const closeRef=useRef<HTMLButtonElement>(null);
  const [analytics,setAnalytics]=useState(productAnalyticsEnabled);
  const [localCount,setLocalCount]=useState(()=>localKeys().length);
  const [status,setStatus]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    const previouslyFocused=document.activeElement instanceof HTMLElement?document.activeElement:null;
    closeRef.current?.focus();
    const handleKeys=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();onClose();return}
      if(event.key!=='Tab')return;
      const dialog=closeRef.current?.closest('[role="dialog"]');
      if(!dialog)return;
      const controls=[...dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled])')]
        .filter(el=>el.getClientRects().length>0);
      if(!controls.length)return;
      if(event.shiftKey&&(document.activeElement===controls[0]||!dialog.contains(document.activeElement))){
        event.preventDefault();controls[controls.length-1].focus();
      }else if(!event.shiftKey&&(document.activeElement===controls[controls.length-1]||!dialog.contains(document.activeElement))){
        event.preventDefault();controls[0].focus();
      }
    };
    document.addEventListener('keydown',handleKeys);
    return()=>{document.removeEventListener('keydown',handleKeys);previouslyFocused?.focus({preventScroll:true})};
  },[onClose]);

  function clearBrowser(){
    if(!window.confirm('Apagar as buscas, memórias e preferências locais do ZeroTwo? Sua conta continuará conectada.'))return;
    clearLocalData();
    setAnalytics(false);setLocalCount(0);
    setStatus('Dados locais apagados. A sessão permanece ativa. O perfil aberto pode continuar visível até a próxima navegação.');
  }

  async function clearCloud(){
    if(!signedIn||busy)return;
    if(!window.confirm('Excluir permanentemente suas memórias Riot Life sincronizadas? Isso não exclui a conta, os dados públicos da Riot nem caches técnicos do servidor.'))return;
    setBusy(true);setStatus('');
    try{
      const {data:auth}=await supabase.auth.getSession();
      if(!auth.session){setStatus('Sessão expirada. Entre novamente para excluir os dados em nuvem.');return}
      const {data,error}=await supabase.functions.invoke('privacy-manage',{body:{action:'delete_riot_life_snapshots'}});
      if(error||data?.ok!==true){
        setStatus('Não foi possível confirmar a exclusão em nuvem. Tente novamente mais tarde.');
        return;
      }
      clearLocalData();
      setAnalytics(false);setLocalCount(0);
      setStatus('Memórias Riot Life sincronizadas e dados locais apagados. A conta continua ativa; novas consultas podem criar novos registros.');
    }catch{
      setStatus('Falha de conexão. A exclusão em nuvem não foi confirmada.');
    }finally{setBusy(false)}
  }

  return <div className="ztPrivacyOverlay" role="dialog" aria-modal="true" aria-labelledby="zt-privacy-title" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div className="ztPrivacyPanel">
      <button ref={closeRef} className="ztPrivacyClose" type="button" aria-label="Fechar central de privacidade" onClick={onClose}>×</button>
      <small>ZEROTWO // SEUS DADOS</small>
      <h2 id="zt-privacy-title">CENTRAL DE <span>PRIVACIDADE.</span></h2>
      <p>Gerencie preferências opcionais e memórias do ZeroTwo sem desconectar sua conta.</p>
      <section>
        <label className="ztPrivacyToggle">
          <span><b>Estatísticas opcionais de uso</b><small>Permite registrar interações com funcionalidades para melhorar o site. Desativado por padrão. Eventos operacionais de login podem continuar sendo registrados.</small></span>
          <input type="checkbox" checked={analytics} onChange={e=>{
            setProductAnalyticsEnabled(e.target.checked);
            setAnalytics(e.target.checked);
            setLocalCount(localKeys().length);
            setStatus(e.target.checked?'Estatísticas opcionais ativadas.':'Estatísticas opcionais desativadas.');
          }}/>
        </label>
      </section>
      <section>
        <h3>Dados deste navegador</h3>
        <p>Exclui buscas recentes, memórias locais e preferências do ZeroTwo. Registros locais detectados: {localCount}.</p>
        <button className="ztPrivacyAction" type="button" onClick={clearBrowser}>Limpar dados locais</button>
      </section>
      <section>
        <h3>Memórias sincronizadas em nuvem</h3>
        <p>Exclui apenas os snapshots Riot Life vinculados à sua conta. Não exclui a conta, perfis públicos, dados da Riot ou logs técnicos.</p>
        <button className="ztPrivacyDanger" type="button" disabled={!signedIn||busy} onClick={()=>void clearCloud()}>
          {busy?'Excluindo memórias…':'Excluir memórias em nuvem'}
        </button>
        {!signedIn&&<small>Entre na sua conta para habilitar a exclusão das memórias sincronizadas.</small>}
      </section>
      <div className="ztPrivacyLinks">
        <a href="/zerotwo.gg/privacidade/">Política de Privacidade</a>
        <a href="/zerotwo.gg/termos/">Termos de uso</a>
      </div>
      {status&&<p className="ztPrivacyStatus" role="status" aria-live="polite">{status}</p>}
    </div>
  </div>;
}
