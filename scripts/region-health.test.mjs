import test from 'node:test';
import assert from 'node:assert/strict';
import {classify,summarize,stopLive,explanation} from './region-health-core.mjs';
const profile={region:'americas',platform:'br1',name:'ExamplePlayer',tag:'BR1'};
test('401/403 translated to Edge 503 stops all regions and provides actionable diagnostics',()=>{
  const row=summarize(profile,{status:503,elapsedMs:19,data:{error:'player',riotStatus:403}});
  assert.equal(row.failureType,'riot_auth_rejected');
  assert.equal(row.upstreamRiotStatus,403);
  assert.equal(stopLive(row),true);
  assert.match(explanation(row),/RIOT_API_KEY/);
});
test('plain 503 is a real outage, not an assertion of expired credentials',()=>{
  const row=summarize(profile,{status:503,elapsedMs:12,data:{error:'unavailable'}});
  assert.equal(row.failureType,'service_unavailable');
  assert.equal(stopLive(row),false);
});
test('429 stops live calls even when Edge error is generic',()=>{
  const row=summarize(profile,{status:429,elapsedMs:17,data:{riotStatus:429,error:'matches'}});
  assert.equal(row.failureType,'riot_rate_limited');
  assert.equal(stopLive(row),true);
});
test('sanitized logs contain no PUUID, token or untrusted messages',()=>{
  const row=summarize(profile,{status:200,elapsedMs:23,data:{
    player:{gameName:'EXAMPLEPLAYER',tagLine:'br1',puuid:'PRIVATE-PUUID'},
    error:'PRIVATE-TOKEN',matches:[],status:{ranked:'ok',mastery:'ok'},otherSecret:'PRIVATE'
  }});
  assert.equal(row.accountMatched,true);
  assert.equal(row.matchesLoaded,0);
  assert.equal(row.failureType,'ok');
  assert.equal(row.errorCode,'unknown');
  assert.doesNotMatch(JSON.stringify(row),/PRIVATE/);
});
test('404 not-found allows checks of other regions',()=>{
  const row=summarize(profile,{status:404,elapsedMs:5,data:{error:'player',riotStatus:404}});
  assert.equal(row.failureType,'riot_id_not_found');
  assert.equal(stopLive(row),false);
});
test('noninteger status and negative duration safely normalized',()=>{
  const row=summarize(profile,{status:0,elapsedMs:-42,data:{riotStatus:'401',error:'PRIVATE'}});
  assert.equal(row.failureType,'network_or_timeout');
  assert.equal(row.upstreamRiotStatus,null);
  assert.equal(row.elapsedMs,0);
});
