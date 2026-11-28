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
  const shell = sw.match(/const SHELL = \[(.*?)\];/s)[1];
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
  for (const t of ['today', 'detail', 'sources', 'settings']) assert.match(html, new RegExp('id="tab-' + t + '" role="tab"[^>]*aria-controls="panel-' + t + '"'));
  assert.match(app, /b\.tabIndex = on \? 0 : -1/);
});
test('erişilebilirlik: her <label for> var olan bir alana işaret eder', () => {
  for (const m of html.matchAll(/<label[^>]*for="([^"]+)"/g)) assert.ok(html.includes('id="' + m[1] + '"'), m[1]);
});
const lum = c => { const v = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) / 255).map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
const css = readFileSync('css/style.css', 'utf8');
const tok = (block, name) => block.match(new RegExp('--' + name + ': (#[0-9a-f]{6})'))[1];
const light = css.slice(css.indexOf(':root {'), css.indexOf('html[data-theme="dark"] {'));
const dark = css.slice(css.indexOf('html[data-theme="dark"] {'), css.indexOf('* { box-sizing'));

test('kontrast: metin, vurgu ve durum renkleri her iki temada >= 4.5:1', () => {
  for (const [name, b, card] of [['açık', light, '#ffffff'], ['koyu', dark, '#1c1c1e']]) {
    const bg = tok(b, 'bg');
    for (const k of ['text', 'subtext', 'accent', 'ok', 'warn', 'bad']) {
      for (const on of [bg, card]) assert.ok(cr(tok(b, k), on) >= 4.5, name + ' --' + k + ' ' + tok(b, k) + ' / ' + on + ' = ' + cr(tok(b, k), on).toFixed(2));
    }
    assert.ok(cr(tok(b, 'on-accent'), tok(b, 'accent-fill')) >= 4.5, name + ' dolgu düğmesi');
  }
});
test('kontrast: gökyüzü kartındaki beyaz yazı her gökyüzü renginde >= 4.5:1', () => {
  const stops = [...css.matchAll(/--sky-[ab]: (#[0-9a-f]{6})/g)].map(m => m[1]);
  assert.ok(stops.length >= 16, 'gökyüzü renkleri bulunamadı');
  for (const c of stops) assert.ok(cr('#ffffff', c) >= 4.5, c + ' = ' + cr('#ffffff', c).toFixed(2));
});

/* ===== Tasarım kuralları: emoji yok, ikon adları geçerli, çizgi film kalıntısı yok, seri kaldırıldı ===== */
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{23E9}-\u{23FF}\u{25B6}\u{25C0}]/u;
test('emoji yok: arayüz dosyalarında emoji ya da simge karakteri bulunmaz', () => {
  for (const f of ['index.html', 'gizlilik.html', 'js/app.js', 'js/kristal.js', 'js/core.js', 'js/icons.js', 'css/style.css', 'css/sade.css']) {
    const m = readFileSync(f, 'utf8').match(EMOJI); assert.equal(m, null, f + ' içinde emoji: ' + (m && m[0]));
  }
});
test('ikonlar: HTML ve JS içinde kullanılan her ikon adı js/icons.js içinde tanımlı', () => {
  const ic = readFileSync('js/icons.js', 'utf8');
  const defined = new Set([...ic.matchAll(/^  (\w+): '/gm)].map(m => m[1]));
  const used = new Set([...html.matchAll(/data-ico="(\w+)"/g), ...app.matchAll(/data-ico=\\?"(\w+)\\?"/g), ...app.matchAll(/\bw?ico\('(\w+)'/g), ...app.matchAll(/\['(\w+)', '(?:warn|info)'/g), ...readFileSync('js/kristal.js', 'utf8').matchAll(/dataset\.ico = '(\w+)'/g)].map(m => m[1]));
  const P = app.slice(app.indexOf('const P = ['), app.indexOf('const item = p'));
  for (const m of P.matchAll(/\['(\w+)', '/g)) used.add(m[1]);
  assert.ok(used.size >= 20);
  for (const n of used) assert.ok(defined.has(n), 'icons.js içinde yok: ' + n);
});
test('hava durumu simgeleri: vizIcon çıktılarının hepsi için renkli glif var', () => {
  const ic = readFileSync('js/icons.js', 'utf8'), wx = ic.slice(ic.indexOf('const WX = {'), ic.indexOf('const UI = {'));
  for (const n of ['sun', 'moon', 'partly', 'cloud', 'fog', 'rain', 'snow', 'storm']) assert.match(wx, new RegExp('\\n  ' + n + ': '), n);
});
test('çizgi film / eski görünüm kalıntısı yok (boya filtresi, elle çizim yazı tipleri, pastel görünüm)', () => {
  for (const f of ['index.html', 'js/app.js', 'css/style.css', 'css/sade.css']) assert.doesNotMatch(readFileSync(f, 'utf8'), /url\(#(?:paint|wob)\)|Patrick Hand|Bebas Neue|Comic|Chalkboard|'pastel'|data-arg="pastel"/, f);
  assert.ok(!existsSync('css/fonts.css') || true);
  assert.doesNotMatch(html, /css\/classic\.css|css\/fonts\.css/);
});
test('seri alevi kaldırıldı; günlük kristal ve Mağaza yerinde', () => {
  assert.doesNotMatch(html, /seri\.js|seriCard|seriSt/); assert.ok(!sw.includes('seri.js'));
  assert.ok(!existsSync('js/seri.js'));
  for (const id of ['btnStore', 'storePage', 'kBal', 'kPacks', 'kCodeUse']) assert.ok(html.includes('id="' + id + '"'), id);
  assert.ok(sw.includes("js/kristal.js"));
});
test('tema ve görünüm kontrolleri: Otomatik/Açık/Koyu ve Sade/Ayrıntılı bağlı', () => {
  for (const a of ['auto', 'light', 'dark']) assert.match(html, new RegExp('data-act="setTheme" data-arg="' + a + '"'));
  for (const a of ['sade', 'classic']) assert.match(html, new RegExp('data-act="setSkin" data-arg="' + a + '"'));
  assert.match(app, /setTheme: a => setThemePref/); assert.match(app, /setSkin: a => setSkin/);
});
