// Audit the files actually published in dist/ (not the original PNG source files).
import {readdirSync,statSync,writeFileSync} from 'node:fs';
import {join,extname} from 'node:path';
import {strict as assert} from 'node:assert';
const totals={js:0,css:0,webp:0,other:0}, files=[];
function walk(directory){
  for(const entry of readdirSync(directory,{withFileTypes:true})){
    const path=join(directory,entry.name);
    if(entry.isDirectory()){walk(path);continue}
    const bytes=statSync(path).size, ext=extname(path).toLowerCase();
    const category=ext==='.js'?'js':ext==='.css'?'css':ext==='.webp'?'webp':'other';
    totals[category]+=bytes;
    files.push({path,bytes,category});
  }
}
walk('dist');
const total=Object.values(totals).reduce((a,b)=>a+b,0);
const limits={js:1_200_000,css:700_000,webp:30_000_000,total:42_000_000};
const toMB=bytes=>(bytes/1e6).toFixed(2)+' MB';
const issues=Object.entries(limits).filter(([name,limit])=>(name==='total'?total:totals[name])>limit);
assert.ok(files.length,'No production files generated');
assert.ok(!files.some(f=>f.path.startsWith(join('dist','assets','zerotwo'))&&f.path.endsWith('.png')),
 'Source PNG artwork must not be shipped in dist/');
console.log('ZeroTwo release sizes:',JSON.stringify({totals,total,limits}));
writeFileSync('/tmp/zerotwo-bundle-budget.json',JSON.stringify({totals,total,limits,largest:files.sort((a,b)=>b.bytes-a.bytes).slice(0,15)},null,2));
if(issues.length)throw Error('Published bundle budget exceeded: '+issues.map(([k,b])=>k+' > '+toMB(b)).join(', '));
console.log('PASS: JS, CSS, images and total bundle remain within release size limits.');
