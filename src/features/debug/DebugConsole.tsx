import { LOG_SESSION_ID } from '../../lib/telemetry';

type DebugConsoleProps={
  debugOpen:boolean;
  setDebugOpen:(value:boolean)=>void;
  debugLogs:any[];
  openDebug:()=>void;
  debugLoading:boolean;
};

export function DebugConsole({debugOpen,setDebugOpen,debugLogs,openDebug,debugLoading}:DebugConsoleProps){
  return <>{debugOpen&&<div className="debugOverlay" onClick={()=>setDebugOpen(false)}><section className="debugConsole" onClick={e=>e.stopPropagation()}><header><div><small>ZEROTWO // INTERNAL</small><h3>DIAGNÓSTICO</h3><p>Últimos eventos sanitizados desta conta.</p></div><button onClick={()=>setDebugOpen(false)}>×</button></header><div className="debugSummary"><span><small>SESSÃO</small><b>{LOG_SESSION_ID.slice(0,8)}</b></span><span><small>EVENTOS</small><b>{debugLogs.length}</b></span><span><small>ERROS</small><b>{debugLogs.filter(x=>x.level==='error').length}</b></span></div><div className="debugToolbar"><button onClick={openDebug}>ATUALIZAR</button><small>Tokens, senhas e identificadores sensíveis são bloqueados pelo logger.</small></div><div className="debugStream">{debugLoading?<div className="clientLoading">CARREGANDO LOGS...</div>:debugLogs.length?debugLogs.map(x=><article className={`debugEvent ${x.level}`} key={x.id}><time>{new Date(x.created_at).toLocaleTimeString('pt-BR')}</time><span><small>{x.area} // {x.level}</small><b>{x.event_name}</b>{x.message&&<p>{x.message}</p>}<em>{x.duration_ms!=null?`${x.duration_ms} ms`:''}</em></span></article>):<div className="debugEmpty">NENHUM EVENTO REGISTRADO AINDA.</div>}</div></section></div>}</>;
}
