// Visual smoke tests against the local Vite build. Fixture data is synthetic.
// Screenshots are for layout regression only, not proof of live Riot availability.
import {chromium} from 'playwright';
import {strict as assert} from 'node:assert';
import {mkdirSync} from 'node:fs';

mkdirSync('visual-qa-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});
const match=(i)=>({
  id:'BR1_FAKE_'+i,playedAt:Date.now()-i*86400000,context:i%5===0?'ARAM':'RANKED',
  queue:'RANKED SOLO/DUO',eligible:true,win:i%2===0,champion:'Ahri',
  championId:103,position:'MID',duration:28,kills:6,deaths:3,assists:8,
  kda:4.67,cs:190,csPerMin:6.8,vision:23,visionPerMin:.82,damage:19500,
  damagePerMin:696,damageTaken:14000,gold:11600,goldSpent:11000,
  goldPerMin:414,killParticipation:55,items:[],augments:[],teamChampions:[],enemyChampions:[]
});
const response=(limit)=>({
  player:{gameName:'ZeroTwo Fixture',tagLine:'BR1',level:140,profileIconId:null,platform:'BR1'},
  ranked:[{queue:'SOLO/DUO',tier:'GOLD',rank:'II',lp:45,wins:40,losses:35,winRate:53}],
  mastery:[{championId:103,championName:'Ahri',level:18,points:125000,lastPlayTime:Date.now()}],
  matches:Array.from({length:limit},(_,i)=>match(i)),
  modeSummaries:[{name:'RANKED',games:Math.round(limit*.8),wins:Math.round(limit*.4),losses:Math.round(limit*.4),winRate:50,avgKda:4.67,avgDamagePerMin:696,avgCsPerMin:6.8,avgVisionPerMin:.82,primaryPosition:'MID',topChampions:[{name:'Ahri',games:limit}]}],
  championSummaries:[{name:'Ahri',games:limit,wins:limit/2,winRate:50,avgKda:4.67,avgDamagePerMin:696,contexts:['RANKED','ARAM']}],
  summary:{matches:limit,recentMatches:limit,wins:limit/2,losses:limit/2,winRate:50,
    avgKda:4.67,avgCsPerMin:6.8,avgVisionPerMin:.82,avgDamagePerMin:696,
    primaryPosition:'MID',mainContext:'RANKED',topChampions:[{name:'Ahri',games:limit}],confidence:'BOA',contexts:[{name:'RANKED',games:limit}]},
  analysis:{headline:'MOMENTO RECENTE: RANKED',signals:['Seu KDA médio é 4,67.','Ranked é o modo mais frequente.','A amostra apresenta resultados equilibrados.']},
  cache:{requested:limit,availableIds:limit,matchesLoaded:limit,cached:limit,fetched:0,pending:0,rateLimited:false},
  status:{ranked:'ok',mastery:'ok',history:'ok'}
});

const errors=[];
try{
  for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]){
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
    const page=await context.newPage();
    page.on('pageerror',err=>errors.push(name+': '+err.message));
    await page.route('**/functions/v1/public-lol-profile',async route=>{
      if(route.request().method()==='OPTIONS'){
        await route.fulfill({status:204,headers:{
          'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS',
          'Access-Control-Allow-Headers':'apikey, authorization, content-type, x-client-info'
        }});return;
      }
      const body=route.request().postDataJSON()||{};
      const limit=Math.min(100,Math.max(1,Number(body.limit||20)));
      if(limit===100)await new Promise(resolve=>setTimeout(resolve,850)); // Cold-request UX fixture
      await route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(response(limit))});
    });
    await page.goto('http://127.0.0.1:4173/zerotwo.gg/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('input[aria-label="Riot ID para buscar jogador"]').waitFor({timeout:15000});
    await page.screenshot({path:'visual-qa-artifacts/'+name+'-home.png',fullPage:true,animations:'disabled'});
    await page.locator('input[aria-label="Riot ID para buscar jogador"]').fill('ZeroTwo Fixture#BR1');
    await page.getByRole('button',{name:/VER RIOT LIFE/}).click();
    await page.locator('.historyDepthPanel').waitFor({timeout:25000});
    await page.locator('#riot-life-story .riotStoryIntroWithArt').waitFor({state:'visible',timeout:25000});
    assert.match(await page.locator('.historyDepthPanel').innerText(),/20 partidas carregadas/);
    const inlineLocale=page.locator('.playerLocaleActions');
    assert.equal(await inlineLocale.isVisible(),true,name+': language picker must be visible next to profile actions');
    assert.equal(await page.locator('.ztLanguageSwitcher').isVisible(),false,name+': legacy floating language picker must not cover chapters');
    await inlineLocale.getByRole('button',{name:'EN'}).click();
    assert.equal(await inlineLocale.getByRole('button',{name:'EN'}).getAttribute('aria-pressed'),'true',name+': English picker toggles');
    await inlineLocale.getByRole('button',{name:'PT-BR'}).click();
    assert.equal(await inlineLocale.getByRole('button',{name:'PT-BR'}).getAttribute('aria-pressed'),'true',name+': Portuguese picker toggles');
    if(name==='mobile'){
      const fontSize=await page.locator('#riot-life-story .riotStoryIntroWithArt h2').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
      assert.ok(fontSize<=31,'Mobile Riot Life opening title too large: '+fontSize);
      const h=await page.locator('#riot-life-story .riotStoryIntroWithArt h2').boundingBox();
      assert.ok(h&&h.height<=175,'Mobile chapter introduction wraps excessively: '+h?.height);
    }
    const story=page.locator('#riot-life-story');
    const readingBar=story.locator('.riotReadingBar');
    await readingBar.waitFor({state:'visible',timeout:15000});
    assert.equal(await story.getAttribute('data-reading-mode'),name==='mobile'?'compact':'full',name+': default chapter reading mode');
    const deepChapter=story.locator('#riot-trend');
    if(name==='mobile'){
      assert.equal(await deepChapter.isVisible(),false,'Mobile quick summary hides deep chapters until requested');
      const compactHeight=await page.evaluate(()=>document.documentElement.scrollHeight);
      await page.screenshot({path:'visual-qa-artifacts/'+name+'-quick-summary.png',fullPage:true,animations:'disabled'});
      await readingBar.getByRole('button',{name:'HISTÓRIA COMPLETA'}).click();
      const fullHeight=await page.evaluate(()=>document.documentElement.scrollHeight);
      assert.ok(compactHeight<fullHeight*.75,
        'Mobile quick summary should be materially shorter than 20 chapters: '+compactHeight+' / '+fullHeight);
      assert.equal(await deepChapter.isVisible(),true,'Full story switch should reveal deep chapters');
      await readingBar.getByRole('button',{name:'RESUMO RÁPIDO'}).click();
      assert.equal(await deepChapter.isVisible(),false,'Quick summary switch should hide deep chapters again');
    }
    // Click the actual chapter rail (rather than relying on the URL hash).
    // Verify navigation changes scroll position and reveals the target below
    // the sticky nav on both desktop and mobile. Regressions here were reported.
    for(const chapter of ['riot-mastery','riot-change','riot-trend','riot-next','riot-now']){
      const link=page.locator('.riotStoryNav a[href="#'+chapter+'"]');
      await link.click({timeout:10000});
      await page.waitForTimeout(100);
      const position=await page.evaluate(id=>{
        const target=document.getElementById(id);
        const nav=document.querySelector('.riotStoryNav');
        if(!target||!nav)return null;
        const rect=target.getBoundingClientRect();
        return {
          targetTop:rect.top,
          targetBottom:rect.bottom,
          stickyNavBottom:nav.getBoundingClientRect().bottom,
          hash:location.hash,
          scrollY:window.scrollY,
          focused:document.activeElement===target
        };
      },chapter);
      assert.ok(position,name+': chapter '+chapter+' must exist');
      if(chapter==='riot-trend')assert.equal(await story.getAttribute('data-reading-mode'),'full',name+': clicking a deep chapter reveals the whole story');
      assert.equal(position.hash,'#'+chapter,name+': chapter deep link must update');
      assert.equal(position.focused,true,name+': chapter must receive keyboard focus');
      assert.ok(position.scrollY>80,name+': chapter '+chapter+' did not scroll');
      assert.ok(position.targetTop>=position.stickyNavBottom-12&&position.targetTop<=position.stickyNavBottom+70,
        name+': '+chapter+' is not visible below the sticky nav: '+JSON.stringify(position));
      assert.ok(position.targetBottom>position.stickyNavBottom,name+': '+chapter+' is obstructed');
    }
    await page.screenshot({path:'visual-qa-artifacts/'+name+'-chapter-nav.png',fullPage:false,animations:'disabled'});
    await page.screenshot({path:'visual-qa-artifacts/'+name+'-profile-fixture-20.png',fullPage:false,animations:'disabled'});
    await page.getByRole('button',{name:/ANALISAR ATÉ 100 PARTIDAS/}).click();
    await page.locator('.historyDepthProgress').waitFor({state:'visible',timeout:3000});
    assert.match(await page.locator('.historyDepthProgress').innerText(),/pode levar cerca de um minuto/);
    await page.locator('.historyDepthPanel').getByText('100 partidas carregadas').waitFor({timeout:25000});
    await page.screenshot({path:'visual-qa-artifacts/'+name+'-profile-fixture-100.png',fullPage:true,animations:'disabled'});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+3);
    assert.equal(overflow,false,name+' has horizontal document overflow');
    await context.close();
  }
  assert.deepEqual(errors,[], 'No uncaught browser errors');
  console.log('PASS: desktop/mobile home, synthetic Riot profile and progressive loading.');
} finally {await browser.close();}
