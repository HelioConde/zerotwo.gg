// Production smoke across three Riot routing clusters. Read-only API requests,
// shallow sample (one match per profile), no user credentials, no PUUID logs.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const src=readFileSync('src/supabase.ts','utf8');
const key=src.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0];
if(!key)throw Error('Public Supabase publishable key missing');
const api='https://bieihhaobdztjyoweewa.supabase.co/functions/v1/public-lol-profile';
const cases=[
  {region:'americas',platform:'br1',name:'AlchemyFlames',tag:'BR1'},
  {region:'americas',platform:'na1',name:'Doublelift',tag:'NA01'},
  {region:'europe',platform:'euw1',name:'Thebausffs',tag:'COOL'},
  {region:'asia',platform:'kr',name:'Hide on bush',tag:'KR1'}
];
async function check(body){
  const begin=Date.now();
  try{
    const response=await fetch(api,{method:'POST',headers:{
      'Content-Type':'application/json',apikey:key,Authorization:'Bearer '+key
    },body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
    let data;
    try{data=await response.json()}catch{data={}}
    return {status:response.status,data,elapsedMs:Date.now()-begin};
  }catch(e){return {status:0,data:{error:e?.name==='TimeoutError'?'timeout':'network'},elapsedMs:Date.now()-begin};}
}
const report={timestamp:new Date().toISOString(),kind:'Shallow real Riot multi-region smoke (one match each)',regions:[],guards:{}};
let fail=false;
for(const test of cases){
  const result=await check({gameName:test.name,tagLine:test.tag,platform:test.platform,region:test.region,limit:1});
  const row={region:test.region,platform:test.platform,httpStatus:result.status,elapsedMs:result.elapsedMs,
    accountMatched:String(result.data?.player?.gameName||'').toLowerCase()===test.name.toLowerCase() &&
      String(result.data?.player?.tagLine||'').toLowerCase()===test.tag.toLowerCase(),
    matchesLoaded:Array.isArray(result.data?.matches)?result.data.matches.length:null,
    rankedStatus:result.data?.status?.ranked||null,
    masteryStatus:result.data?.status?.mastery||null,
    rateLimited:result.data?.cache?.rateLimited||false,
    errorCode:String(result.data?.error||'').slice(0,40)};
  // A Riot account ID is global; check account AND region result, not arbitrary PUUID values.
  report.regions.push(row);
  if(result.status!==200||!row.accountMatched||row.rateLimited)fail=true;
  console.log('REGION GATE',JSON.stringify(row));
  if(row.rateLimited||result.status===429){console.error('Riot rate limit reached; stop live checks to avoid amplification');break;}
  await new Promise(resolve=>setTimeout(resolve,800));
}
// Validation guard must return 400 without hitting Riot upstream.
const bad=await check({gameName:'Fixture',tagLine:'INVALID',platform:'br1',region:'nonsense',limit:1});
report.guards.invalidRegion={status:bad.status,errorCode:String(bad.data?.error||'')};
if(bad.status!==400||report.guards.invalidRegion.errorCode!=='routing')fail=true;
console.log('REGION VALIDATION',JSON.stringify(report.guards.invalidRegion));
mkdirSync('region-health-artifacts',{recursive:true});
writeFileSync('region-health-artifacts/regions.json',JSON.stringify(report,null,2)+'\n');
if(fail){console.error('REGION HEALTH FAILED — see sanitized report');process.exitCode=1;}
else console.log('REGION HEALTH PASSED — BR1, NA1, EUW1 and KR / three routing clusters');
