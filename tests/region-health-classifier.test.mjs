import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyRegionResult, isTransientFailure, shouldStopRegionChecks
} from '../scripts/region-health-classifier.mjs';

test('classifies Riot rejected credentials and stops repeated calls',()=>{
  const reason=classifyRegionResult({httpStatus:503,riotStatus:403,errorCode:'player',rateLimited:false});
  assert.equal(reason,'riot_credentials_rejected');
  assert.equal(shouldStopRegionChecks(reason),true);
  assert.equal(isTransientFailure(reason),false);
});
test('classifies an edge configuration problem',()=>{
  const reason=classifyRegionResult({httpStatus:503,riotStatus:null,errorCode:'unavailable'});
  assert.equal(reason,'edge_configuration_missing');
  assert.equal(shouldStopRegionChecks(reason),true);
});
test('distinguishes a transient upstream 503 from invalid auth',()=>{
  const reason=classifyRegionResult({httpStatus:503,riotStatus:503,errorCode:'player'});
  assert.equal(reason,'riot_player_lookup_unavailable');
  assert.equal(isTransientFailure(reason),true);
  assert.equal(shouldStopRegionChecks(reason),false);
});
test('rate limit is not retried or amplified',()=>{
  const reason=classifyRegionResult({httpStatus:429,riotStatus:429,errorCode:'matches'});
  assert.equal(reason,'rate_limited');
  assert.equal(isTransientFailure(reason),false);
  assert.equal(shouldStopRegionChecks(reason),true);
});
test('success, network errors and missing accounts are distinct',()=>{
  assert.equal(classifyRegionResult({httpStatus:200,errorCode:''}),'ok');
  assert.equal(classifyRegionResult({httpStatus:0,errorCode:'network'}),'network_or_timeout');
  assert.equal(classifyRegionResult({httpStatus:404,errorCode:'player'}),'riot_account_not_found');
});
