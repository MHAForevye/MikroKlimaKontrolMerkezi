/* Saf hesap fonksiyonları (DOM'a, ağa, global duruma dokunmaz): skor, medyan/ortalama, kaçış, yağış başlangıç/bitiş.
   app.js bunları global olarak kullanır; tests/core.test.mjs Node'da aynı dosyayı test eder. */

/* ===== Mikro-Klima Skoru: yağış potansiyeli / atmosferik gerilim (0-10), formül bilgi penceresinde ===== */
const CATS = [[2, 'Açık, kuru ve kararlı hava'], [4, 'Sakin ve hafif nemli hava'], [6, 'Sınırda: bulutlu, potansiyel dönem'], [8, 'Yüksek yağış potansiyeli'], [11, 'Kritik eşik: fırtına / şiddetli yağış riski']];
const catOf = s => CATS.find(c => s < c[0])[1];
function scoreOf(h) {
  const cl = (v, a, b) => Math.max(0, Math.min(1, (v - a) / (b - a)));
  const n = v => v == null ? 0 : v;
  const spread = (h.temp != null && h.dew != null) ? h.temp - h.dew : 8;
  let s = 0.30 * cl(n(h.hum), 50, 100) * 10 + 0.25 * (1 - cl(spread, 0, 8)) * 10 + 0.25 * n(h.cloud) / 10 + 0.20 * n(h.pop) / 10 + Math.min(2, n(h.cape) / 1000);
  let add = 0;
  if (h.ptr != null) add += h.ptr <= -4 ? 1 : h.ptr <= -2 ? 0.5 : 0;
  if (h.rh7 != null && h.rh7 >= 80) add += 0.5;
  if (h.pw != null && h.pw >= 35) add += 0.5;
  if (h.li != null && h.li <= -4 && n(h.cape) >= 300) add += 0.5;
  s += Math.min(2, add);
  const p = n(h.precip);
  if (p >= 0.1) s = Math.max(s, 6);
  if (p >= 1) s = Math.max(s, 7.5);
  if (p >= 4 || h.code >= 95 || (n(h.cape) >= 2500 && (p >= 0.1 || n(h.pop) >= 30))) s = Math.max(s, 9);
  return +Math.max(0, Math.min(10, s)).toFixed(1);
}

const MEAN = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const MED = a => { a = a.slice().sort((x, y) => x - y); if (!a.length) return null; const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
const escHtml = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const esc = escHtml;

/* Ağırlıklı medyan: p = [[değer, ağırlık], ...] */
function wmed(p) {
  p = p.slice().sort((a, b) => a[0] - b[0]);
  const tot = p.reduce((a, x) => a + x[1], 0); let c = 0;
  for (const x of p) { c += x[1]; if (c >= tot / 2) return x[0]; }
  return p.length ? p[p.length - 1][0] : null;
}

/* Saatlik yağış dizisinden (T: unix saniye, P: mm) önümüzdeki 12 saatte başlangıç/bitiş */
function rtWhen(T, P, nowS) {
  const i = T.findIndex(t => t >= Math.floor(nowS / 3600) * 3600); if (i < 0) return null;
  const a = []; for (let j = i; j < Math.min(i + 12, T.length); j++) a.push({ t: T[j], w: (P[j] || 0) >= 0.1 });
  const s = a.findIndex(x => x.w); if (s < 0) return { s: -1 };
  const e = a.findIndex((x, k) => k > s && !x.w);
  return { s, st: a[s].t, et: e < 0 ? null : a[e].t };
}

/* Sade görünümün tek cümlesi: önümüzdeki saatlerde yağmur var mı. Sadece olgu söyler, öğüt vermez.
   rows: [{ hh: '14', pop: 0-100, precip: mm }, ...] (şu andan başlayarak en çok 12 saat) */
function sadeText(rows) {
  if (!rows || !rows.length) return '';
  const wet = rows.findIndex(r => (r.precip || 0) >= 0.1);
  const maxPop = Math.round(Math.max.apply(null, rows.map(r => r.pop || 0)));
  if (wet === 0) return 'Şu an yağmur yağıyor.';
  if (wet > 0) return 'Saat ' + rows[wet].hh + ':00 civarında yağmur bekleniyor.';
  if (maxPop >= 50) return 'Yağmur ihtimali %' + maxPop + '.';
  return 'Önümüzdeki saatlerde yağmur beklenmiyor.';
}
if (typeof module !== 'undefined' && module.exports) module.exports = { CATS, catOf, scoreOf, MEAN, MED, escHtml, esc, wmed, rtWhen, sadeText };
