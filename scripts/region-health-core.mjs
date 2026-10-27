// Region health classification with no network access and no secrets.
const codes=new Set(['player','matches','unavailable','routing','riot_id','rate_limit']);
const states=new Set(['ok','unavailable','partial']);
const status=v=>Number.isInteger(v)&&v>=100&&v<=599?v:null;
export function classify(response){
  const http=status(response?.status)||0,riot=status(response?.data?.riotStatus);
  if(riot===401||riot===403)return 'riot_auth_rejected';
  if(http===429||riot===429||response?.data?.cache?.rateLimited===true)return 'riot_rate_limited';
  if(http===404||riot===404)return 'riot_id_not_found';
  if(http===0)return 'network_or_timeout';
  if(http>=500)return 'service_unavailable';
  if(http>=400)return 'client_error';
  return http===200?'ok':'unexpected_status';
}
export function summarize(test,result){
  const data=result?.data||{};
  return {
    region:test.region,platform:test.platform,httpStatus:status(result?.status)||0,
    upstreamRiotStatus:status(data.riotStatus),
    elapsedMs:Math.max(0,Math.round(Number(result.elapsedMs)||0)),
    accountMatched:typeof data.player?.gameName==='string'&&typeof data.player?.tagLine==='string'&&data.player.gameName.toLowerCase()===test.name.toLowerCase()&&data.player.tagLine.toLowerCase()===test.tag.toLowerCase(),
    matchesLoaded:Array.isArray(data.matches)?data.matches.length:null,
    rankedStatus:states.has(data.status?.ranked)?data.status.ranked:null,
    masteryStatus:states.has(data.status?.mastery)?data.status.mastery:null,
    rateLimited:data.cache?.rateLimited===true,
    errorCode:codes.has(data.error)?data.error:'unknown',
    failureType:classify(result)
  };
}
export function stopLive(row){return row.failureType==='riot_auth_rejected'||row.failureType==='riot_rate_limited';}
export function explanation(row){
  if(row.failureType==='riot_auth_rejected')return 'Riot refused upstream authentication (401/403); check RIOT_API_KEY in Supabase Edge secrets and Riot Developer Portal. Stop repeated live probes.';
  if(row.failureType==='riot_rate_limited')return 'Riot rate limit encountered; remaining probes stopped to avoid amplification.';
  if(row.failureType==='service_unavailable')return 'Upstream or Supabase temporarily unavailable. HTTP 503 alone does not prove invalid credentials.';
  return '';
}
