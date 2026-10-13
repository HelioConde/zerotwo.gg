import {assertEquals,assert} from 'jsr:@std/assert@1.0.14';
import {eraseAccountData,USER_SCOPED_TABLES} from './accountDeletion.ts';

Deno.test('self-erasure never targets an arbitrary request-supplied identity',async()=>{
  const calls:string[]=[];
  const fake={
    from(table:string){return {delete(){return {async eq(column:string,id:string){
      calls.push(table+':'+column+':'+id);return {error:null};
    }}}}},
    auth:{admin:{async deleteUser(id:string){calls.push('auth:'+id);return {error:null}}}},
  };
  const r=await eraseAccountData(fake,'test-user-id');
  assert(r.ok);
  assertEquals(calls.length,USER_SCOPED_TABLES.length+1);
  assert(calls.every(x=>x.includes('test-user-id')));
  assertEquals(calls[calls.length-1],'auth:test-user-id');
  assert(!calls.some(x=>x.includes('match_cache')),'Shared public Riot caches must be preserved');
});

Deno.test('database failure halts erasure BEFORE deleting the auth account',async()=>{
  const calls:string[]=[];
  const fake={
    from(table:string){return {delete(){return {async eq(_column:string,id:string){
      calls.push(table+':'+id);
      return {error:table==='client_event_logs'?{code:'denied'}:null};
    }}}}},
    auth:{admin:{async deleteUser(_id:string){calls.push('auth');return {error:null}}}},
  };
  const r=await eraseAccountData(fake,'owner');
  assertEquals(r.ok,false);
  assertEquals(r.error,'user_data_cleanup_failed');
  assert(!calls.includes('auth'));
});

Deno.test('auth failure reports incomplete erasure instead of success',async()=>{
  const fake={
    from(_table:string){return {delete(){return {async eq(){return {error:null}}}}}},
    auth:{admin:{async deleteUser(){return {error:{code:'unexpected'}}}}},
  };
  const r=await eraseAccountData(fake,'owner');
  assertEquals(r.ok,false);
  assertEquals(r.error,'account_deletion_failed');
});
