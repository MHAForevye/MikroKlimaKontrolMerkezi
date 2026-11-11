/* Sürüm numaralarını dosya içeriğinden üretir: index.html ve sw.js içindeki ?v=... değerlerini ve önbellek adını (V) günceller.
   Kullanım:  node bump-version.mjs          → dosyaları günceller
              node bump-version.mjs --check  → güncel değilse hata kodu 1 ile çıkar (CI / deploy öncesi kontrol) */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const TRACKED = ['css/fonts.css', 'css/style.css', 'css/classic.css', 'css/sade.css', 'js/theme.js', 'js/core.js', 'js/app.js', 'js/kristal.js', 'js/seri.js'];
const hash = s => createHash('sha1').update(s).digest('hex').slice(0, 8);
const ver = {};
for (const p of TRACKED) ver[p] = hash(readFileSync(p));
const esc = p => p.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');

let changed = false;
function patch(file, fn) {
  const old = readFileSync(file, 'utf8'), neu = fn(old);
  if (neu !== old) { changed = true; if (!process.argv.includes('--check')) writeFileSync(file, neu); console.log((process.argv.includes('--check') ? 'GÜNCEL DEĞİL: ' : 'güncellendi: ') + file); }
}

patch('index.html', h => {
  for (const p of TRACKED) h = h.replace(new RegExp('((?:href|src)=")' + esc(p) + '(?:\\?v=[^"]*)?"', 'g'), `$1${p}?v=${ver[p]}"`);
  return h;
});
patch('sw.js', s => {
  for (const p of TRACKED) s = s.replace(new RegExp("'" + esc(p) + "(?:\\?v=[^']*)?'", 'g'), `'${p}?v=${ver[p]}'`);
  return s.replace(/const V = 'mk-[^']*'/, `const V = 'mk-${hash(TRACKED.map(p => ver[p]).join(''))}'`);
});

if (!changed) console.log('sürümler zaten güncel');
else if (process.argv.includes('--check')) process.exit(1);
