// ZeroTwo SEO preflight: validates the HTML actually available to crawlers
// without running client-side JavaScript. No network or paid API required.
import {readFileSync,existsSync} from 'node:fs';
import {strict as assert} from 'node:assert';
import {join} from 'node:path';

const site='https://helioconde.github.io/zerotwo.gg/';
const directories=[
  'guias','estatisticas-lol','riot-id','maestria-lol','historico-lol',
  'como-funciona','rank-lol','arena-lol','lol-stats-tracker',
  'sobre','glossario-lol'
];
const pages=['',...directories];
const urls=new Set();
const titles=new Set();
const errors=[];
const check=(condition,message)=>{if(!condition)errors.push(message);};
const match=(html,expression)=>html.match(expression)?.[1]||'';
function pathFor(href){
  try{
    const url=new URL(href,site);
    if(url.origin!==new URL(site).origin)return null;
    if(!url.pathname.startsWith('/zerotwo.gg/'))return null;
    const sub=url.pathname.slice('/zerotwo.gg/'.length);
    if(!sub)return 'index.html';
    return sub.endsWith('/')?join('public',sub,'index.html'):join('public',sub);
  }catch{return null}
}

for(const dir of pages){
  const path=dir?join('public',dir,'index.html'):'index.html';
  const html=readFileSync(path,'utf8');
  const location=site+(dir?dir+'/':'');
  const prefix=dir||'home';
  check(/<html lang="pt-BR">/.test(html),prefix+': missing pt-BR language');
  const title=match(html,/<title>([^<]+)<\/title>/i).trim();
  const description=match(html,/<meta name="description" content="([^"]+)"/i);
  const canonical=match(html,/<link rel="canonical" href="([^"]+)"/i);
  const ogurl=match(html,/<meta property="og:url" content="([^"]+)"/i);
  const ogimage=match(html,/<meta property="og:image" content="([^"]+)"/i);
  check(title.length>=28&&title.length<=75,prefix+': title length '+title.length);
  check(!titles.has(title),prefix+': duplicate title '+title);
  titles.add(title);
  check(description.length>=85&&description.length<=190,prefix+': description length '+description.length);
  check(canonical===location,prefix+': canonical '+canonical+' != '+location);
  check(ogurl===location,prefix+': social URL differs from canonical');
  check(/<meta name="robots" content="index,follow/.test(html),prefix+': not indexable');
  check(/<h1(?:\s|>)/i.test(html),prefix+': no h1 in response HTML');
  check(/<meta name="twitter:card"/.test(html),prefix+': Twitter/X metadata missing');
  check(/<meta property="og:image:alt"/.test(html),prefix+': social image alt missing');
  check(/rel="sitemap"[^>]*href="\/zerotwo.gg\/sitemap.xml"/.test(html),prefix+': missing sitemap hint');
  check(ogimage.startsWith(site),prefix+': OG image must use absolute site URL');
  if(ogimage.startsWith(site))check(existsSync(pathFor(ogimage)),prefix+': missing OG image '+ogimage);
  const scripts=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  check(scripts.length>0,prefix+': no structured data');
  for(const script of scripts)try{const value=JSON.parse(script[1]);check(value['@context']==='https://schema.org',prefix+': invalid Schema.org context')}catch(e){errors.push(prefix+': invalid JSON-LD '+e.message)}
  const links=[...html.matchAll(/<a[^>]*href="([^"]+)"/gi)].map(m=>m[1]);
  check(links.some(href=>href.startsWith('/zerotwo.gg/')),prefix+': no crawlable internal links');
  for(const link of links){
    const local=pathFor(link);
    if(local)check(existsSync(local),prefix+': broken link to '+link);
  }
  if(!dir){
    check(links.filter(href=>href.startsWith('/zerotwo.gg/')).length>=10,'home: at least ten crawlable guide links needed in HTML');
    check(/class="ztSeoFallback"/.test(html),'home: no static no-JavaScript fallback');
    check(/<script type="module" src="\/src\/main.tsx"/.test(html),'home: Vite SPA entry missing');
  }
  urls.add(location);
}

const sitemap=readFileSync('public/sitemap.xml','utf8');
const entries=[...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>([\s\S]*?)<\/url>/g)];
check(entries.length===pages.length,'sitemap: expected '+pages.length+' entries, found '+entries.length);
const listed=new Set();
for(const [,url,details] of entries){
  check(urls.has(url),'sitemap: unpublished or noncanonical URL '+url);
  check(!listed.has(url),'sitemap: duplicate '+url);
  listed.add(url);
  const lastmod=match(details,/<lastmod>([^<]+)<\/lastmod>/);
  check(/^\d{4}-\d{2}-\d{2}$/.test(lastmod),'sitemap: invalid lastmod for '+url);
  check(!url.includes('?')&&!url.includes('#'),'sitemap: no player profile parameters or fragments');
}
for(const url of urls)check(listed.has(url),'sitemap missing '+url);
check(sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'),'sitemap namespace missing');
const robots=readFileSync('public/robots.txt','utf8');
check(robots.includes(site+'sitemap.xml'),'project-level robots: sitemap hint must be correct');
console.log('SEO audit: '+pages.length+' static pages, '+titles.size+' unique titles, '+listed.size+' sitemap URLs.');
if(errors.length){for(const error of errors)console.error('SEO ERROR: '+error);process.exit(1)}
console.log('PASS: titles, HTML h1, descriptions, canonicals, structured data, links, OG/Twitter cards and sitemap.');
console.log('NOTE: GitHub Pages project /robots.txt is not the host-root robots file. Submit sitemap in Google Search Console.');
