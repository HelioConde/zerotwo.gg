// Parse Lighthouse CLI's lab reports; keep raw HTML/JSON for investigation.
// No real-user Core Web Vitals are asserted from simulated lab results.
import {readFileSync,writeFileSync,existsSync,appendFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const folder='performance-artifacts',profiles=['mobile','desktop'];
const targets={performance:90,accessibility:90,'best-practices':90,seo:90};
const data={generatedAt:new Date().toISOString(),type:'Lighthouse synthetic lab, not real-user Core Web Vitals',profiles:{}};
const table=[];
const metric=(num,decimals=2)=>Number.isFinite(num)?num.toFixed(decimals):'n/a';
for(const profile of profiles){
  const file=folder+'/'+profile+'.report.json';
  assert.ok(existsSync(file),'Missing Lighthouse report: '+file);
  const report=JSON.parse(readFileSync(file,'utf8'));
  assert.ok(!report.runtimeError,profile+' audit failed: '+(report.runtimeError?.message||'unknown'));
  assert.ok(report.finalUrl?.startsWith('https://helioconde.github.io/zerotwo.gg/'),profile+': wrong target URL');
  const score={};
  for(const key of Object.keys(targets)){
    const number=report.categories?.[key]?.score;
    assert.ok(typeof number==='number'&&number>=0,profile+' missing '+key+' score');
    score[key]=Math.round(number*100);
  }
  const value=(id)=>report.audits?.[id]?.numericValue??null;
  const vitals={lcpMs:value('largest-contentful-paint'),cls:value('cumulative-layout-shift'),
    fcpMs:value('first-contentful-paint'),tbtMs:value('total-blocking-time'),speedIndexMs:value('speed-index')};
  const opportunities=Object.values(report.audits||{})
    .filter(item=>item?.details?.type==='opportunity'&&Number.isFinite(item.details.overallSavingsMs)&&item.details.overallSavingsMs>100)
    .map(item=>({title:item.title,id:item.id,savedMs:Math.round(item.details.overallSavingsMs)}))
    .sort((a,b)=>b.savedMs-a.savedMs).slice(0,6);
  const warnings=Object.entries(targets).filter(([name,min])=>score[name]<min).map(([name,min])=>name+' '+score[name]+' (< '+min+')');
  data.profiles[profile]={score,vitals,opportunities,warnings};
  table.push('| '+profile+' | '+Object.keys(targets).map(k=>score[k]).join(' | ')+' | '+metric(vitals.lcpMs/1000)+' s | '+metric(vitals.cls,3)+' | '+metric(vitals.tbtMs)+' ms |');
  if(warnings.length)console.log('::warning title=Lighthouse '+profile+'::'+warnings.join(', '));
  console.log(profile,JSON.stringify({score,vitals,opportunities:opportunities.slice(0,3)}));
}
const output=[
  '# ZeroTwo — Lighthouse (laboratório)',
  '',
  'Data da medição: '+data.generatedAt,
  '',
  '**São medidas simuladas de laboratório, não Core Web Vitals reais de visitantes.**',
  '',
  '| Dispositivo | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |',
  '|:---|---:|---:|---:|---:|---:|---:|---:|',
  ...table,
  '',
  'Metas iniciais: 90/100 por categoria. Abaixo disso geramos avisos; não bloqueamos o deploy por flutuação de pontuação.',
  'INP e p75 de usuários reais precisam de dados de campo como CrUX ou RUM consentido; TBT não equivale a INP.',
  '',
  ...profiles.flatMap(name=>[
    '### '+name+' — oportunidades de melhoria',
    ...(data.profiles[name].opportunities.length?data.profiles[name].opportunities.map(o=>'- '+o.title+' (~'+o.savedMs+' ms estimados)'):['- Nenhuma oportunidade estimada acima de 100 ms']),
    ''
  ])
].join('\n');
writeFileSync(folder+'/SUMMARY.md',output+'\n');
writeFileSync(folder+'/summary.json',JSON.stringify(data,null,2)+'\n');
if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,output+'\n');
console.log('Lighthouse reports summarized.');
