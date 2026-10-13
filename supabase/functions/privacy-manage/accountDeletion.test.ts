import {assert,assertEquals} from 'jsr:@std/assert@1.0.14';
import {eraseAccountData,ZEROTWO_USER_TABLES,SHARED_APP_TABLES} from './accountDeletion.ts';
function fixture(shared=false,failedTable=''){
  const calls:string[]=[];
  const client={
    from(table:string){return {
      select(){return {eq(_column:string,id:string){calls.push('inspect:'+table+':'+id);
        return Promise.resolve({count:shared&&table===SHARED_APP_TABLES[0]?1:0,
          error:table===failedTable?{code:'unavailable'}:null});
      }}},
      delete(){return {eq(_column:string,id:string){calls.push('delete:'+table+':'+id);
        return Promise.resolve({error:table===failedTable?{code:'unavailable'}:null});
      }}}
    }},
    auth:{admin:{deleteUser(id:string){calls.push('auth:'+id);return Promise.resolve({error:null})}}}
  };
  return {client,calls};
}
Deno.test('disposable identity: delete ZeroTwo data and only then Auth',async()=>{
  const {client,calls}=fixture();
  const r=await eraseAccountData(client,'disposable-id');
  assert(r.ok);assertEquals(r.authDeleted,true);
  assertEquals(calls.filter(x=>x.startsWith('delete:')).length,ZEROTWO_USER_TABLES.length);
  assertEquals(calls.at(-1),'auth:disposable-id');
  assert(!calls.some(x=>x.startsWith('delete:chibi_')||x.startsWith('delete:tft_')));
});
Deno.test('shared Chibi identity keeps global Auth and all other product data',async()=>{
  const {client,calls}=fixture(true);
  const r=await eraseAccountData(client,'shared-id');
  assert(r.ok);assertEquals(r.sharedAuthRetained,true);
  assert(!calls.some(x=>x.startsWith('auth:')));
  assert(!calls.some(x=>x.startsWith('delete:chibi_')||x.startsWith('delete:tft_')));
});
Deno.test('failed ZeroTwo erasure halts before Auth deletion',async()=>{
  const {client,calls}=fixture(false,'client_event_logs');
  const r=await eraseAccountData(client,'id');
  assertEquals(r.ok,false);assert(!calls.some(x=>x.startsWith('auth:')));
});
Deno.test('failed shared-product preflight must not delete ANYTHING',async()=>{
  const {client,calls}=fixture(false,SHARED_APP_TABLES[0]);
  const r=await eraseAccountData(client,'id');
  assertEquals(r.ok,false);
  assertEquals(calls.filter(x=>x.startsWith('delete:')).length,0);
  assert(!calls.some(x=>x.startsWith('auth:')));
});
