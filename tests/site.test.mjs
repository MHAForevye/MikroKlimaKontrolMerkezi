import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const html = readFileSync('index.html', 'utf8'), app = readFileSync('js/app.js', 'utf8'), sw = readFileSync('sw.js', 'utf8');

test('CSP: satır içi olay yöneticisi ve satır içi betik yok (index.html)', () => {
  assert.deepEqual(html.match(/\son(?:click|change|input|keydown|keyup|load|error|submit|focus|blur)\s*=/g) || [], []);
  assert.deepEqual(html.match(/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>/g) || [], []);
  assert.ok(!/javascript:/i.test(html));
});
test('CSP: app.js/kristal.js HTML dizelerinde onclick yok', () => {
  for (const f of ['js/app.js', 'js/kristal.js']) assert.ok(!/\son(?:click|change|input|keydown)=\\?"/.test(readFileSync(f, 'utf8')), f);
});
test('data-act: HTML ve dizelerdeki her işlem ACT tablosunda var', () => {
  const used = new Set([...html.matchAll(/data-act="(\w+)"/g), ...app.matchAll(/data-act=\\?"(\w+)\\?"/g)].map(m => m[1]));
  const table = app.slice(app.indexOf('const ACT = {'), app.indexOf('};', app.indexOf('const ACT = {')));
  for (const a of used) assert.ok(new RegExp('\\b' + a + ':').test(table), 'ACT içinde yok: ' + a);
  assert.ok(used.size >= 15);
});
test('index.html: başvurulan yerel dosyaların hepsi var', () => {
  const refs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m => m[1]).filter(r => !/^(https?:|\/\/|mailto:)/.test(r));
  for (const r of refs) assert.ok(existsSync(r.split('?')[0]), 'eksik: ' + r);
});
test('sw.js: önbelleğe alınan her dosya var', () => {
  const shell = sw.match(/const SHELL = \[(.*?)\]\.concat/s)[1];
  for (const m of shell.matchAll(/'([^']+)'/g)) assert.ok(m[1] === './' || existsSync(m[1].split('?')[0]), 'eksik: ' + m[1]);
});
test('sürüm numaraları güncel (değilse: npm run bump)', () => {
  execFileSync('node', ['bump-version.mjs', '--check'], { stdio: 'pipe' });
});
test('.assetsignore: sunucu kodu ve ayarlar yayına girmiyor', () => {
  const ig = readFileSync('.assetsignore', 'utf8').split('\n').map(s => s.trim());
  for (const f of ['worker', 'schema.sql', 'wrangler.toml', '.github', 'tests', 'package.json', 'bump-version.mjs']) assert.ok(ig.includes(f), f + ' .assetsignore içinde olmalı');
});
test('ikonlar gerçekten bildirilen boyutta ve kare', () => {
  const dim = f => { const b = readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
  const want = { 'icon.png': 192, 'icon-512.png': 512, 'icon-maskable-512.png': 512, 'apple-touch-icon.png': 180 };
  for (const [f, n] of Object.entries(want)) assert.deepEqual(dim(f), [n, n], f);
  const man = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));
  for (const i of man.icons) assert.equal(dim(i.src).join('x'), i.sizes, 'manifest boyutu yanlış: ' + i.src);
});

test('erişilebilirlik: atlama bağlantısı, tablist, adlı grafikler, sekme sırası', () => {
  assert.match(html, /<a class="skip-link" href="#main"/); assert.match(html, /<main id="main"/);
  assert.match(html, /<nav class="tabbar" role="tablist"/);
  for (const id of ['weatherChart', 'metricChart']) assert.match(html, new RegExp('<canvas id="' + id + '" role="img" aria-label="[^"]+"'));
  for (const t of ['today', 'detail', 'karne', 'sources', 'settings']) assert.match(html, new RegExp('id="tab-' + t + '" role="tab"[^>]*aria-controls="panel-' + t + '"'));
  assert.match(app, /b\.tabIndex = on \? 0 : -1/);
});
test('erişilebilirlik: her <label for> var olan bir alana işaret eder', () => {
  for (const m of html.matchAll(/<label[^>]*for="([^"]+)"/g)) assert.ok(html.includes('id="' + m[1] + '"'), m[1]);
});
test('kontrast: Sade açık temada ana renk metin için >= 4.5:1', () => {
  const lum = c => { const v = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) / 255).map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
  const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
  const css = readFileSync('css/sade.css', 'utf8'), accent = css.match(/\[data-theme="light"\] \{ --accent: (#[0-9a-f]{6})/)[1];
  assert.ok(cr(accent, '#ffffff') >= 4.5 && cr(accent, '#f1f5f9') >= 4.5, accent);
});
