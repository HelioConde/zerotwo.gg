// ZeroTwo live smoke: public Riot account, not a simulated fixture.
// This script only reads the project's publishable browser API key.
// Never print tokens, PUUIDs, response bodies, or Supabase service-role credentials.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const sample = readFileSync('src/supabase.ts','utf8');
const key = sample.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0];
assert.ok(key,'Missing frontend publishable Supabase key');
const base = 'https://bieihhaobdztjyoweewa.supabase.co/functions/v1';
const riotId = 'AlchemyFlames#BR1';
const observations = {checkedAt:new Date().toISOString(),riotId,platform:'br1',profile:{},teammates:{},browser:[]};
mkdirSync('live-qa-artifacts',{recursive:true});
const writeReport=()=>writeFileSync('live-qa-artifacts/report.json',JSON.stringify(observations,null,2)+'\n');

async function invoke(slug,body){
  const started=Date.now();
  let response;
  try{
    response=await fetch(base+'/'+slug,{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':key,'Authorization':'Bearer '+key},
      body:JSON.stringify(body),
      signal:AbortSignal.timeout(90000)
    });
  }catch(e){return {status:0,elapsedMs:Date.now()-started,error:e?.name==='TimeoutError'?'request_timeout':'network_error'};}
  let result;
  try{result=await response.json()}catch{result=null;}
  return {status:response.status,elapsedMs:Date.now()-started,result};
}

let failed=false;
const req={gameName:'AlchemyFlames',tagLine:'BR1',platform:'br1',region:'americas',limit:20};
const profile=await invoke('public-lol-profile',req);
const p=profile.result||{};
observations.profile={
  httpStatus:profile.status,
  elapsedMs:profile.elapsedMs,
  errorCode:String(p.error||profile.error||'').slice(0,65),
  message:String(p.message||'').slice(0,160),
  identityMatched:String(p.player?.gameName||'').toLowerCase()==='alchemyflames'&&String(p.player?.tagLine||'').toLowerCase()==='br1',
  matchesLoaded:Array.isArray(p.matches)?p.matches.length:null,
  sampleRequested:p.cache?.requested??null,
  pending:p.cache?.pending??null,
  rateLimited:p.cache?.rateLimited??null,
  rankRows:Array.isArray(p.ranked)?p.ranked.length:null,
  masteryRows:Array.isArray(p.mastery)?p.mastery.length:null,
  rankedStatus:p.status?.ranked??'unknown',
  masteryStatus:p.status?.mastery??'unknown',
  backendVersionVerified:p.status?.ranked==='ok'&&p.status?.mastery==='ok'
};
if(profile.status!==200||!observations.profile.identityMatched||!Array.isArray(p.matches)){
  failed=true;
  console.error('LIVE PROFILE FAILED',JSON.stringify(observations.profile));
}else{
  console.log('LIVE PROFILE OK',JSON.stringify(observations.profile));
  if(!observations.profile.backendVersionVerified){
    failed=true;
    console.error('BACKEND VERSION DRIFT: public profile returns real data, but lacks the latest upstream availability fields. Deploy updated Edge Functions.');
  }
  const matchIds=p.matches.slice(0,5).map(x=>x.id).filter(Boolean);
  if(matchIds.length){
    const teammates=await invoke('public-lol-teammates',{gameName:'AlchemyFlames',tagLine:'BR1',region:'americas',matchIds});
    const t=teammates.result||{};
    observations.teammates={httpStatus:teammates.status,elapsedMs:teammates.elapsedMs,errorCode:t.error||'',message:String(t.message||'').slice(0,160),matchesAnalyzed:t.matchesAnalyzed??null,recurringCount:Array.isArray(t.teammates)?t.teammates.filter(x=>x.games>=2).length:null,partial:t.partial??null};
    if(teammates.status!==200)failed=true;
    console.log('LIVE TEAMMATES',JSON.stringify(observations.teammates));
  }
  // A genuine deep-history request is made once, not once per viewport.
  // Rate-limit failures remain visible in the report and block 9.5 sign-off.
  const extended=await invoke('public-lol-profile',{...req,limit:100});
  const deep=extended.result||{};
  observations.expandedHistory={
    httpStatus:extended.status,
    elapsedMs:extended.elapsedMs,
    matchesLoaded:Array.isArray(deep.matches)?deep.matches.length:null,
    requested:deep.cache?.requested??null,
    pending:deep.cache?.pending??null,
    rateLimited:deep.cache?.rateLimited??null,
    errorCode:deep.error||extended.error||''
  };
  if(extended.status!==200||!Array.isArray(deep.matches)||deep.matches.length<observations.profile.matchesLoaded){
    failed=true;
    console.error('LIVE DEEP HISTORY NOT READY',JSON.stringify(observations.expandedHistory));
  } else console.log('LIVE DEEP HISTORY',JSON.stringify(observations.expandedHistory));
}

try {
  const {chromium}=await import('playwright');
  const browser=await chromium.launch({headless:true});
  try{
    for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]){
      const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
      const browserErrors=[];
      const apiStatuses=[];
      page.on('pageerror',err=>browserErrors.push(String(err.message).slice(0,180)));
      page.on('response',response=>{if(response.url().includes('/functions/v1/public-lol-profile'))apiStatuses.push(response.status());});
      try{
        await page.goto('http://127.0.0.1:4173/zerotwo.gg/?player=AlchemyFlames%23BR1&server=br1',{waitUntil:'domcontentloaded',timeout:30000});
        await page.locator('.publicPlayerResult, .lookupError').first().waitFor({timeout:110000});
        const loaded=await page.locator('.publicPlayerResult').count()>0;
        if(loaded)await page.locator('#riot-life-story .riotStoryIntroWithArt').waitFor({state:'visible',timeout:30000});
        const analysisRendered=loaded&&await page.locator('#riot-life-story .riotStoryIntroWithArt').isVisible();
        const inlineLocale=loaded?await page.locator('.playerLocaleActions').isVisible():false;
        const floatingLocale=loaded?await page.locator('.ztLanguageSwitcher').isVisible():true;
        let localeTogglePassed=false;
        if(inlineLocale){
          await page.locator('.playerLocaleActions').getByRole('button',{name:'EN'}).click();
          const enActive=await page.locator('.playerLocaleActions').getByRole('button',{name:'EN'}).getAttribute('aria-pressed');
          await page.locator('.playerLocaleActions').getByRole('button',{name:'PT-BR'}).click();
          const ptActive=await page.locator('.playerLocaleActions').getByRole('button',{name:'PT-BR'}).getAttribute('aria-pressed');
          localeTogglePassed=enActive==='true'&&ptActive==='true';
        }
        const titleSize=loaded?await page.locator('#riot-life-story .riotStoryIntroWithArt h2').evaluate(el=>Math.round(parseFloat(getComputedStyle(el).fontSize))):null;
        const errorText=loaded?'':((await page.locator('.lookupError').innerText()).replace(/\s+/g,' ').slice(0,180));
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+3);
        await page.screenshot({path:'live-qa-artifacts/'+name+'-alchemyflames.png',fullPage:false,animations:'disabled'});
        const outcome={viewport:name,profileLoaded:loaded,analysisRendered,inlineLocale,floatingLocale,localeTogglePassed,titleSize,errorText,apiStatuses,horizontalOverflow:overflow,uncaughtErrors:browserErrors};
        observations.browser.push(outcome);
        if(!loaded||!analysisRendered||!inlineLocale||floatingLocale||!localeTogglePassed||overflow||browserErrors.length||(name==='mobile'&&Number(titleSize)>31))failed=true;
        console.log('LIVE BROWSER',JSON.stringify(outcome));
      }catch(e){failed=true;observations.browser.push({viewport:name,error:String(e?.message||e).slice(0,220),apiStatuses});console.error('LIVE BROWSER FAILED',name,String(e?.message||e).slice(0,220));}
      await page.close();
    }
  }finally{await browser.close();}
}catch(e){
  failed=true;
  observations.browser.push({error:'browser_runner_unavailable',detail:String(e?.message||e).slice(0,200)});
}
writeReport();
if(failed){console.error('LIVE ACCOUNT GATE FAILED: check sanitized report and screenshots');process.exitCode=1;}
else console.log('LIVE ACCOUNT GATE PASSED: AlchemyFlames#BR1 profile + teammates + desktop/mobile verified');
