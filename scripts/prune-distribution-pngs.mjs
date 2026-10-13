// Keep original artwork in Git, but do not publish redundant PNG copies.
// This runs after Vite has generated dist/ and the WebP variants exist.
import { readFileSync, existsSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
const root = 'dist';
const art = join(root, 'assets', 'zerotwo');
if (!existsSync(art)) throw Error('Missing generated artwork directory in dist');
const files = readdirSync(art);
const pngs = files.filter(n => n.toLowerCase().endsWith('.png'));
if (!pngs.length) throw Error('Expected original PNG artwork before distribution cleanup');
const all = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.css$|\.html$/i.test(entry.name)) all.push(path);
  }
}
walk(root);
// CSS and HTML must never refer to the original artwork URLs in the
// release; the same source PNG files are retained in the repository.
const deployedText = all.map(file => readFileSync(file, 'utf8')).join('\n');
const legacy = /(?:\/assets\/zerotwo\/|\/zerotwo\.gg\/assets\/zerotwo\/)[^"'()\s]+\.png/gi;
const unsafe = [...deployedText.matchAll(legacy)].map(item => item[0]);
if (unsafe.length) throw Error('Release still references PNG: ' + unsafe.slice(0, 6).join(', '));
let removed = 0, originalBytes = 0;
for (const name of pngs) {
  const source = join(art, name);
  const candidate = join(art, name.replace(/\.png$/i, '.webp'));
  if (!existsSync(candidate) || !statSync(candidate).size) {
    throw Error('Cannot remove source PNG without a valid WebP counterpart: ' + name);
  }
  originalBytes += statSync(source).size;
  unlinkSync(source);
  removed++;
}
const remaining = readdirSync(art).filter(n => n.toLowerCase().endsWith('.png'));
if (remaining.length) throw Error('Original PNGs remain in public distribution');
const webpFiles = readdirSync(art).filter(name => name.toLowerCase().endsWith('.webp'));
const webpBytes = webpFiles.reduce((total, name) => total + statSync(join(art, name)).size, 0);
const WEBP_BUDGET = 30_000_000;
if (webpBytes > WEBP_BUDGET) {
  throw Error('Release image budget exceeded: ' + (webpBytes / 1e6).toFixed(1) + ' MB / 30 MB');
}
console.log('ZeroTwo release: excluded ' + removed + ' redundant PNGs (' + (originalBytes / 1e6).toFixed(1) + ' MB of unpacked files); WebP artwork ' + (webpBytes / 1e6).toFixed(1) + ' MB (max 30 MB). All originals remain versioned in Git.');
