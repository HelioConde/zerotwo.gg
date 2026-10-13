// Build-time WebP variants of final artwork. PNG originals remain untouched.
import sharp from 'sharp';
import {readdir,stat} from 'node:fs/promises';
import {join,parse} from 'node:path';
const root='public/assets/zerotwo';
const entries=(await readdir(root,{withFileTypes:true})).filter(e=>e.isFile()&&/\.png$/i.test(e.name));
let inputBytes=0,outputBytes=0,generated=0;
async function optimize(entry){
  const source=join(root,entry.name);
  const dest=join(root,parse(entry.name).name+'.webp');
  const original=await stat(source);
  inputBytes+=original.size;
  try{
    const existing=await stat(dest);
    if(existing.mtimeMs>=original.mtimeMs&&existing.size>0){
      outputBytes+=existing.size;generated++;return;
    }
  }catch{}
  await sharp(source,{limitInputPixels:80_000_000})
    .rotate().resize({width:1920,height:1080,fit:'inside',withoutEnlargement:true})
    .webp({quality:82,effort:4,smartSubsample:true}).toFile(dest);
  outputBytes+=(await stat(dest)).size;
  generated++;
}
for(let i=0;i<entries.length;i+=3)await Promise.all(entries.slice(i,i+3).map(optimize));
// A narrow hero composition for mobile — same art, fewer pixels/bytes.
const hero='0b338a39-32cd-48f5-abb0-b31ac6c926dd';
const sourceMobile=join(root,hero+'.png');
const targetMobile=join(root,hero+'-mobile.webp');
const mobileSourceStats=await stat(sourceMobile);
let generateMobile=true;
try {
  const m=await stat(targetMobile);
  if(m.mtimeMs>=mobileSourceStats.mtimeMs&&m.size>0)generateMobile=false;
}catch{}
if(generateMobile)await sharp(sourceMobile,{limitInputPixels:80_000_000})
  .rotate().resize({width:880,withoutEnlargement:true})
  .webp({quality:75,effort:4,smartSubsample:true}).toFile(targetMobile);
const mobileBytes=(await stat(targetMobile)).size;
console.log('ZeroTwo mobile hero: '+Math.round(mobileBytes/1024)+' KiB separate from the desktop hero.');
if(entries.length!==generated)throw Error('Missing generated WebP variant');
console.log('ZeroTwo final art:',generated,'WebP; original',Math.round(inputBytes/1e6),'MB, optimized',Math.round(outputBytes/1e6),'MB. Originals preserved.');
