/**
 * Create a small social-sharing preview from existing ZeroTwo artwork.
 * The original PNG remains unchanged. This JPEG is generated before Vite's
 * dev server, SEO audit and production build so it is always present in dist.
 */
import sharp from 'sharp';
import {mkdirSync,statSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const input=join('public','assets','zerotwo','0b338a39-32cd-48f5-abb0-b31ac6c926dd.png');
const output=join('public','seo','og-zerotwo.jpg');
const targetBytes=450_000;
mkdirSync(join('public','seo'),{recursive:true});

for(const quality of [80,73,66,58]){
  // No new copyrighted artwork or synthetic characters; a lighter,
  // correctly proportioned derivative of the existing preview.
  const buffer=await sharp(input)
    .rotate()
    .resize(1200,630,{fit:'cover',position:sharp.strategy.attention})
    .jpeg({quality,mozjpeg:true,progressive:true})
    .toBuffer();
  if(buffer.length<=targetBytes||quality===58){
    const info=await sharp(buffer).metadata();
    if(info.width!==1200||info.height!==630||info.format!=='jpeg'||buffer.length>500_000){
      throw new Error('SEO share image invalid size, dimensions or encoding');
    }
    writeFileSync(output,buffer);
    console.log('OG image generated: '+output+', '+info.width+'×'+info.height+', '+Math.round(statSync(output).size/1024)+' KB');
    break;
  }
}
