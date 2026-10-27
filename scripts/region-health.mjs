// Production cross-region Riot monitor. Only read-only calls and redacted metrics.
// A failed edge/upstream response remains a failed QA run, never a false success.
import {readFileSync,mkdirSync,writeFileSync,appendFileSync} from 'node:fs';
import {
  classifyRegionResult, isTransientFailure, shouldStopRegionChecks
} from './region-health-classifier.mjs';

const source=readFileSync('src/supabase.ts','utf8');
const key=source.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0];
if(!key)throw Error('Public frontend Supabase key missing');
const api='https://bieihhaobdztjyoweewa.supabase.co/functions/v1/public-lol-profile';
const cases=[
  {region:'americas',platform:'br1',name:'AlchemyFlames',tag:'BR1'},
  {region:'americas',platform:'na1',name:'Doublelift',tag:'NA01'},
  {region:'europe',platform:'euw1',name:'Thebausffs',tag:'COOL'},
  {region:'asia',platform:'kr',name:'Hide on bush',tag:'KR1'}
];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function check(body){
  const started=Date.now();
  try {
    const response=await fetch(api,{method:'POST',headers:{
      'Content-Type':'application/json',apikey:key,Authorization:'Bearer '+key
    },body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
    let data={};
    try{data=await response.json()}catch{}
    return {status:response.status,data,elapsedMs:Date.now()-started};
  }catch(error){
    return {status:0,data:{error:error?.name==='TimeoutError'?'timeout':'network'},elapsedMs:Date.now()-started};
  }
}
function sanitize(test,result,attempts){
  const data=result.data||{};
  const row={
    region:test.region,platform:test.platform,httpStatus:result.status,
    riotStatus:Number.isInteger(data.riotStatus)?data.riotStatus:null,
    elapsedMs:result.elapsedMs,attempts,
    accountMatched:String(data.player?.gameName||'').toLowerCase()===test.name.toLowerCase() &&
      String(data.player?.tagLine||'').toLowerCase()===test.tag.toLowerCase(),
    matchesLoaded:Array.isArray(data.matches)?data.matches.length:null,
    rankedStatus:typeof data.status?.ranked==='string'?data.status.ranked.slice(0,30):null,
    masteryStatus:typeof data.status?.mastery==='string'?data.status.mastery.slice(0,30):null,
    rateLimited:!!data.cache?.rateLimited,
    errorCode:['player','matches','unavailable','routing','riot_id','rate_limit'].includes(data.error)?data.error:'unknown'
  };
  row.reason=classifyRegionResult(row);
  return row;
}
const report={
  timestamp:new Date().toISOString(),kind:'Read-only Riot regional health (minimal data)',
  regions:[],guards:{},outcome:'pending'
};
let failed=false;
for(const test of cases){
  const body={gameName:test.name,tagLine:test.tag,platform:test.platform,region:test.region,limit:1};
  let result=await check(body);
  let row=sanitize(test,result,1);
  // Exactly one bounded retry for transient network/edge errors, not auth or rate limits.
  if(isTransientFailure(row.reason)&&![401,403,429].includes(row.riotStatus)){
    await sleep(2200);
    result=await check(body);
    row=sanitize(test,result,2);
  }
  report.regions.push(row);
  if(row.httpStatus!==200||!row.accountMatched||row.rateLimited)failed=true;
  console.log('REGION GATE',JSON.stringify(row));
  if(shouldStopRegionChecks(row.reason)){
    report.stoppedEarly=row.reason;
    console.error('Further Riot lookups skipped: '+row.reason);
    break;
  }
  await sleep(800);
}

// The guard must reject invalid routing before contacting Riot upstream.
const guard=await check({gameName:'Fixture',tagLine:'INVALID',platform:'br1',region:'nonsense',limit:1});
report.guards.invalidRegion={status:guard.status,errorCode:String(guard.data?.error||'').slice(0,30)};
if(guard.status!==400||report.guards.invalidRegion.errorCode!=='routing')failed=true;
console.log('REGION VALIDATION',JSON.stringify(report.guards.invalidRegion));
if(report.regions.length!==cases.length)failed=true;
report.outcome=failed?'failed':'passed';
mkdirSync('region-health-artifacts',{recursive:true});
writeFileSync('region-health-artifacts/regions.json',JSON.stringify(report,null,2)+'\n');
const rows=report.regions.map(r=>
  '| '+[r.region,r.platform,r.httpStatus,r.riotStatus??'—',r.reason,r.attempts,
    r.accountMatched?'yes':'no'].join(' | ')+' |'
);
const summary=[
  '# ZeroTwo — Riot regional health', '',
  '| Region | Platform | Edge HTTP | Riot HTTP | Category | Attempts | ID matched |',
  '|---|---|---:|---:|---|---:|---|',
  ...rows,'',
  'Routing validation HTTP: '+report.guards.invalidRegion.status,
  'Result: **'+report.outcome.toUpperCase()+'**',
  '',
  'This check does not expose Riot tokens, PUUIDs or response bodies.',
  'Riot HTTP 401/403 requires validating the RIOT_API_KEY secret in Supabase; it cannot be fixed by suppressing alerts.',
  'For missing profile/error 404, verify the fixture Riot ID and region; for network 502/503, inspect Edge Function logs.'
].join('\n');
writeFileSync('region-health-artifacts/report.md',summary+'\n');
if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
if(failed){
  console.error('REGION HEALTH FAILED — sanitized report includes upstream status and remediation category');
  process.exitCode=1;
} else console.log('REGION HEALTH PASSED — all four regional checks + routing guard');
