// Disposable-account integration test. Run only in isolated GitHub Actions.
// No real user account, PUUID, Riot key or persistent test data is touched.
import {createClient} from '@supabase/supabase-js';
import {randomUUID,randomBytes} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const secret=process.env.SUPABASE_TEST_ADMIN_KEY;
assert.ok(secret&&(secret.startsWith('sb_secret_')||secret.startsWith('eyJ')),'Server-side admin key required');
const endpoint='https://bieihhaobdztjyoweewa.supabase.co';
const pub=readFileSync('src/supabase.ts','utf8').match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0];
assert.ok(pub);
const admin=createClient(endpoint,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const player=createClient(endpoint,pub,{auth:{persistSession:false,autoRefreshToken:false}});
const email='zt-disposable-'+randomUUID().replaceAll('-','')+'@example.invalid';
const password=randomBytes(24).toString('base64url')+'Aa1!';
let id=null,ticket=null;
const passed={snapshot:false,privateTicket:false,account:false,cleanup:false};
const snapshots=async()=>{
  const r=await admin.from('riot_life_snapshots').select('id').eq('user_id',id);
  if(r.error)throw Error('Cannot inspect snapshots: '+r.error.code);
  return r.data.length;
};
async function addSnapshot(suffix){
  const r=await player.from('riot_life_snapshots').insert({
    user_id:id,player_key:'test-'+suffix,platform:'br1',
    game_name:'Disposable',tag_line:'TEST',
    captured_day:new Date().toISOString().slice(0,10),
    snapshot:{at:Date.now(),mainContext:'RANKED',avgKda:1.4,winRate:50,topChampion:'Ahri',rank:null}
  });
  if(r.error)throw Error('Failed to seed test snapshot: '+r.error.code);
}
try{
  const created=await admin.auth.admin.createUser({email,password,email_confirm:true});
  if(created.error||!created.data?.user)throw Error('Disposable signup failed');
  id=created.data.user.id;
  const signed=await player.auth.signInWithPassword({email,password});
  assert.equal(signed.data.user?.id,id,'Test account login failed');
  await addSnapshot('first');
  assert.equal(await snapshots(),1);
  const wiped=await player.functions.invoke('privacy-manage',{body:{action:'delete_riot_life_snapshots'}});
  assert.ok(!wiped.error&&wiped.data?.ok===true,'Snapshot deletion failed');
  assert.equal(await snapshots(),0);
  passed.snapshot=true;

  const asked=await player.functions.invoke('privacy-manage',{body:{action:'create_privacy_request',
    kind:'access',message:'Disposable test only; no human information.'}});
  assert.ok(!asked.error&&asked.data?.ok===true,'Private request was rejected');
  ticket=asked.data.request_id;
  const stored=await admin.from('zerotwo_privacy_requests').select('id').eq('id',ticket).single();
  assert.equal(stored.data?.id,ticket,'Ticket absent from private inbox');
  passed.privateTicket=true;
  await addSnapshot('second');
  const removed=await player.functions.invoke('privacy-manage',{body:{
    action:'delete_account',confirmation:'DELETE MY ZEROTWO ACCOUNT'}});
  if(removed.error||removed.data?.ok!==true)
    throw Error('Account deletion failed after: '+String(removed.data?.completed||[]));
  assert.equal(await snapshots(),0);
  const gone=await admin.auth.admin.getUserById(id);
  assert.ok(gone.error||!gone.data?.user,'Deleted Auth account still exists');
  passed.account=true;
  const orphan=await admin.from('zerotwo_privacy_requests').select('user_id').eq('id',ticket).single();
  assert.equal(orphan.data?.user_id,null,'Ticket should not retain deleted user ID');
}finally{
  if(id)await admin.auth.admin.deleteUser(id).catch(()=>{});
  if(ticket){const r=await admin.from('zerotwo_privacy_requests').delete().eq('id',ticket);passed.cleanup=!r.error}
  await player.auth.signOut({scope:'local'}).catch(()=>{});
  mkdirSync('privacy-e2e-artifacts',{recursive:true});
  writeFileSync('privacy-e2e-artifacts/summary.json',JSON.stringify({at:new Date().toISOString(),...passed},null,2)+'\n');
}
assert.ok(Object.values(passed).every(Boolean),'Disposable cleanup verification incomplete');
console.log('PRIVACY E2E PASSED — disposable auth account, private ticket, snapshots and deletion');
