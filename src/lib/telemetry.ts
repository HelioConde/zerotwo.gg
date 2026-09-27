import { supabase } from '../supabase';

export const LOG_SESSION_ID=(()=>{const k='zt_log_session';let v=sessionStorage.getItem(k);if(!v){v=crypto.randomUUID();sessionStorage.setItem(k,v)}return v})();
const LOG_BLOCKED=/token|password|authorization|secret|cookie|puuid|api.?key|refresh|access/i;
const PRODUCT_BUFFER_KEY='zt_product_event_buffer';

type ProductEventOpts={area?:string,context?:any};
type LogOpts={level?:'debug'|'info'|'warn'|'error',area?:string,message?:string,context?:any,duration_ms?:number};

function safeLogContext(input:any,seen=new WeakSet()):any{
  if(input==null||typeof input!=='object')return typeof input==='string'?input.slice(0,180):input;
  if(seen.has(input))return '[circular]';
  seen.add(input);
  if(Array.isArray(input))return input.slice(0,20).map(v=>safeLogContext(v,seen));
  return Object.fromEntries(Object.entries(input).filter(([k])=>!LOG_BLOCKED.test(k)).map(([k,v])=>[k,safeLogContext(v,seen)]));
}

function safeLogMessage(v?:string){
  return String(v||'')
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi,'Bearer [redacted]')
    .replace(/(access_token|refresh_token|authorization|code)=([^&\s]+)/gi,'$1=[redacted]')
    .slice(0,300);
}

export async function ztLog(userId:string|undefined,event_name:string,opts:LogOpts={}){
  if(!userId)return;
  try{
    await supabase.from('client_event_logs').insert({
      user_id:userId,
      session_id:LOG_SESSION_ID,
      event_name,
      level:opts.level||'info',
      area:opts.area||'app',
      message:opts.message?safeLogMessage(opts.message):null,
      context:safeLogContext(opts.context||{}),
      page_path:location.pathname,
      app_version:'web-2026.09.1',
      duration_ms:opts.duration_ms??null
    });
  }catch{}
}

function bufferProductEvent(event_name:string,opts:ProductEventOpts={}){
  try{
    const old=JSON.parse(sessionStorage.getItem(PRODUCT_BUFFER_KEY)||'[]');
    const next=[
      ...(Array.isArray(old)?old:[]),
      {event_name,area:opts.area||'product',context:safeLogContext(opts.context||{}),occurred_at:Date.now()}
    ].slice(-30);
    sessionStorage.setItem(PRODUCT_BUFFER_KEY,JSON.stringify(next));
  }catch{}
}

export async function ztProductEvent(event_name:string,opts:ProductEventOpts={}){
  try{
    const {data}=await supabase.auth.getSession();
    const userId=data.session?.user?.id;
    if(userId){
      ztLog(userId,event_name,{area:opts.area||'product',context:opts.context});
      return;
    }
  }catch{}
  bufferProductEvent(event_name,opts);
}

export async function flushProductEvents(userId:string){
  let events:any[]=[];
  try{
    events=JSON.parse(sessionStorage.getItem(PRODUCT_BUFFER_KEY)||'[]');
    sessionStorage.removeItem(PRODUCT_BUFFER_KEY);
  }catch{}
  for(const e of Array.isArray(events)?events:[]){
    await ztLog(userId,String(e.event_name||'product.event'),{
      area:e.area||'product',
      context:{...(e.context||{}),buffered_before_auth:true,occurred_at:e.occurred_at||null}
    });
  }
}

export function ztLogOnce(userId:string,event_name:string,opts:ProductEventOpts={}){
  const key='zt_once_'+event_name;
  try{
    if(sessionStorage.getItem(key))return;
    sessionStorage.setItem(key,'1');
  }catch{}
  ztLog(userId,event_name,{area:opts.area||'product',context:opts.context});
}
