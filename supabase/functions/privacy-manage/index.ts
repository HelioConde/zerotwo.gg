// Owner-authenticated privacy controls. Service-role access NEVER reaches the browser.
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { eraseAccountData } from './accountDeletion.ts';

function allowedOrigin(origin:string|null){
  return !origin || origin==='https://helioconde.github.io' ||
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}
const cors=(origin:string|null)=>({
  'Access-Control-Allow-Origin':origin||'https://helioconde.github.io',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info',
  'Vary':'Origin',
});
Deno.serve(async req=>{
  const origin=req.headers.get('origin');
  if(!allowedOrigin(origin))return new Response(null,{status:403});
  const headers=cors(origin);
  const reply=(status:number,payload:Record<string,unknown>)=>
    new Response(JSON.stringify(payload),{status,headers:{...headers,'Content-Type':'application/json','Cache-Control':'no-store'}});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});

  const token=req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if(!token)return reply(401,{error:'authentication_required'});
  const url=Deno.env.get('SUPABASE_URL');
  const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return reply(503,{error:'service_unavailable'});
  const admin=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:{user},error:authError}=await admin.auth.getUser(token);
  if(authError||!user)return reply(401,{error:'invalid_session'});
  let payload:unknown;
  try{payload=await req.json()}catch{return reply(400,{error:'invalid_json'})}
  if(!payload||typeof payload!=='object'||Array.isArray(payload))return reply(400,{error:'invalid_payload'});
  const body=payload as Record<string,unknown>;

  if(body.action==='delete_riot_life_snapshots'){
    if(Object.keys(body).some(k=>k!=='action'))return reply(400,{error:'invalid_parameters'});
    const {error}=await admin.from('riot_life_snapshots').delete().eq('user_id',user.id);
    if(error){console.error('privacy-manage: snapshot erase failed',error.code||'db_error');return reply(503,{error:'deletion_unavailable'})}
    return reply(200,{ok:true,scope:'riot_life_snapshots'});
  }

  if(body.action==='create_privacy_request'){
    if(Object.keys(body).some(k=>!['action','kind','message'].includes(k)) ||
       !['access','correction','deletion','other'].includes(String(body.kind)) ||
       typeof body.message!=='string' || body.message.trim().length<15 || body.message.length>1200)
      return reply(400,{error:'invalid_request'});
    if(!user.email)return reply(400,{error:'email_required'});
    const since=new Date(Date.now()-24*60*60*1000).toISOString();
    const {count,error:countError}=await admin.from('zerotwo_privacy_requests')
      .select('id',{count:'exact',head:true}).eq('user_id',user.id).gte('created_at',since);
    if(countError)return reply(503,{error:'request_inbox_unavailable'});
    if((count||0)>=3)return reply(429,{error:'request_limit'});
    const {data,error}=await admin.from('zerotwo_privacy_requests').insert({
      user_id:user.id,reply_email:user.email,
      request_type:body.kind,message:body.message.trim()
    }).select('id').single();
    if(error)return reply(503,{error:'request_inbox_unavailable'});
    return reply(200,{ok:true,request_id:data.id,status:'received'});
  }

  if(body.action==='delete_account'){
    if(body.confirmation!=='DELETE MY ZEROTWO ACCOUNT'||
       Object.keys(body).some(k=>k!=='action'&&k!=='confirmation'))
      return reply(400,{error:'confirmation_required'});
    const result=await eraseAccountData(admin,user.id);
    if(!result.ok){
      console.error('privacy-manage: incomplete deletion',result.error,('table' in result ? result.table : 'auth'));
      // Account remains active on failures; the user can retry or request assistance.
      return reply(503,{ok:false,error:result.error,scope:'partial',completed:result.completed});
    }
    return reply(200,result);
  }

  return reply(400,{error:'unsupported_action'});
});
