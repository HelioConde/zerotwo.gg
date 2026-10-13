// Post-build CSS tree shaking against every React view, guide, and test fixture.
// Guardrails preserve runtime/generated class names; keep keyframes and CSS vars.
import {PurgeCSS} from 'purgecss';
import {globSync,readFileSync,writeFileSync,statSync} from 'node:fs';
import {join} from 'node:path';

const glob=(await import('node:fs')).globSync;
const files=[...glob('dist/assets/*.css')];
if(!files.length)throw Error('No built CSS assets found');
const content=[
  ...glob('src/**/*.tsx'),...glob('src/**/*.ts'),...glob('src/**/*.jsx'),
  ...glob('src/**/*.js'),...glob('public/**/*.html'),
  'index.html',...glob('scripts/*.mjs')
];
// Runtime className values are sometimes constructed from API state, not literal TSX strings.
// Keep all core interaction states and story-related classes as a safety boundary.
const safeguards=[
  /^(active|inactive|is-|has-|open|closed|loading|loaded|visible|hidden|disabled|selected|expanded|collapsed|error|success|warning)$/,
  /^(riot|home|lookup|player|public|zt|gameNav|nav|siteFooter|authOverlay|connect|clientLoading|story|historyDepth|share|language|locale)/,
];
const original=files.reduce((n,f)=>n+statSync(f).size,0);
let final=0,selectorsRemoved=0;
for(const cssFile of files){
  const result=await new PurgeCSS().purge({
    css:[cssFile],
    content,
    defaultExtractor:(source)=>source.match(/[A-Za-z_][A-Za-z0-9_:/.%-]*/g)||[],
    safelist:{standard:safeguards,deep:safeguards},
    rejected:true,
    keyframes:false,
    variables:false,
    fontFace:false,
  });
  if(result.length!==1)throw Error('PurgeCSS produced unexpected output '+cssFile);
  if(!result[0].css.includes('.homeHero') && cssFile.includes('index-'))
    throw Error('PurgeCSS removed critical homepage styles');
  const originalSize=statSync(cssFile).size;
  const remaining=Buffer.byteLength(result[0].css);
  // If more than 40% disappears at once, our extractor probably missed a dynamic class.
  if(remaining<originalSize*.6)throw Error('Unsafe CSS purge removed over 40% of '+cssFile);
  writeFileSync(cssFile,result[0].css);
  final+=remaining;
  selectorsRemoved+=result[0].rejected?.length||0;
}
console.log('ZeroTwo CSS tree-shaking:',original,'->',final,'bytes;',
  (100*(1-final/original)).toFixed(1)+'% removed;',selectorsRemoved,'selectors dropped.');
