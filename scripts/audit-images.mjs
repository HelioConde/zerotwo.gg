// Inventory and URL checks for the artwork actually published by ZeroTwo.
// Run with "npm run audit:images". No image optimization occurs in this script.
import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';
import {strict as assert} from 'node:assert';

const publicRoot='public';
const activeRoot='public/assets/zerotwo';
const required=[
  'empty-state.webp',
  'connection-error.webp',
  'match-story-background.webp'
];
const imagesByComponent=[
  ['home/discover','Imagem do ChatGPT 1 de out. de 2026, 17_10_14-3.png'],
  ['home/remember','Imagem do ChatGPT 1 de out. de 2026, 17_10_13-2.png'],
  ['home/people','Imagem do ChatGPT 1 de out. de 2026, 17_10_15-4.png'],
  ['home/closing','Imagem do ChatGPT 1 de out. de 2026, 17_10_12-1.png'],
  ['landing','hero-player-01.png']
];
const errors=[];
function verify(path,label){
  if(!existsSync(path))errors.push(label+': '+path+' not found');
}
function walk(dir){
  return existsSync(dir)?readdirSync(dir,{withFileTypes:true}).flatMap(item=>{
    const path=join(dir,item.name);
    return item.isDirectory()?walk(path):[path];
  }):[];
}
for(const path of required){
  const full=join(publicRoot,path);
  verify(full,'Required UI state artwork');
  if(!existsSync(full))continue;
  const data=readFileSync(full);
  if(data.subarray(0,4).toString()!=='RIFF'||data.subarray(8,12).toString()!=='WEBP')
    errors.push('Invalid WebP signature: '+full);
  if(data.length>500_000)errors.push('UI-state image exceeds 500 KB: '+full);
}
for(const [section,file] of imagesByComponent)verify(join(activeRoot,file),section);
const componentPaths=[
  'src/features/public/RiotLifeExperience.tsx',
  'src/features/public/RiotArcade.tsx',
  'src/features/public/MyRiotPatch.tsx'
];
for(const component of componentPaths){
  const code=readFileSync(component,'utf8');
  // Every static z2Art/zerotwoArt call must resolve to a tracked file.
  const regex=/(?:z2Art|zerotwoArt)\(['"`]([^'"`]+)['"`]\)/g;
  for(const match of code.matchAll(regex))verify(join(activeRoot,match[1]),relative('.',component));
}
for(const folder of ['output-v2','review']){
  if(existsSync(join(activeRoot,folder)))
    errors.push('Historical image processing folder must not be shipped in public/: '+folder);
  verify(join('design-archive/zerotwo',folder),'Source artwork archive');
}
const active=walk(activeRoot);
const photos=active.filter(path=>/\.(png|webp|jpe?g|avif)$/i.test(path));
const icons=active.filter(path=>/\.svg$/i.test(path));
const countMB=files=>(files.reduce((n,path)=>n+statSync(path).size,0)/1e6).toFixed(1);
const large=photos.filter(path=>statSync(path).size>2_000_000);
console.log('ZeroTwo media audit: '+photos.length+' published raster images ('+countMB(photos)+' MB), '+icons.length+' SVG icons.');
console.log('Large original PNGs (>2 MB): '+large.length+'. Keep lazy loading enabled and optimize before promoting new images.');
console.log('Source/archive review files remain outside public/ to avoid shipping intermediate assets.');
if(errors.length){errors.forEach(error=>console.error('IMAGE AUDIT ERROR: '+error));process.exit(1);}
console.log('PASS: active artwork, WebP headers, all static story references, and archive separation.');
