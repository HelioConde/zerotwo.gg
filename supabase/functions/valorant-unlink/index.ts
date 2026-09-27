import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/http.ts';

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return json({error:'method_not_allowed'},405);

  const authorization=req.headers.get('Authorization');
  if(!authorization)return json({error:'unauthorized'},401);

  const supabaseUrl=Deno.env.get('SUPABASE_URL')!;
  const anonKey=Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const userClient=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:authorization}}});
  const {data:{user},error:userError}=await userClient.auth.getUser();
  if(userError||!user)return json({error:'unauthorized'},401);

  const admin=createClient(supabaseUrl,serviceKey);
  const {error}=await admin.from('valorant_accounts').delete().eq('user_id',user.id);
  if(error)return json({error:'valorant_unlink_failed'},500);

  return json({ok:true});
});
