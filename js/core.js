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
/* ===== Giriş serisi (Duolingo tarzı, tamamen yerel; sunucuya hiçbir şey gitmez) =====
   Gün = cihazın yerel takvim günü ("YYYY-MM-DD"). Ardışık günde seri +1. Tek gün kaçırılırsa ve kalkan varsa seri korunur,
   yoksa 1'den başlar (en uzun seri saklanır). Her 7. günde 1 kalkan kazanılır (en fazla 1). */
const SERI_RE = /^\d{4}-\d{2}-\d{2}$/;
const SERI_EV = ['start', 'up', 'saved', 'reset'];
const seriDayNum = s => { const p = s.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2]) / 864e5; };
const seriDayDiff = (a, b) => Math.round(seriDayNum(b) - seriDayNum(a));
const seriAddDays = (s, k) => new Date((seriDayNum(s) + k) * 864e5).toISOString().slice(0, 10);
function seriClean(o) {
  if (!o || typeof o !== 'object' || !SERI_RE.test(String(o.last))) return null;
  const n = Math.floor(+o.n);
  if (!(n >= 1 && n <= 99999)) return null;
  const h = Array.isArray(o.h) ? o.h.filter(d => typeof d === 'string' && SERI_RE.test(d)) : [];
  return { n, best: Math.max(n, Math.min(99999, Math.floor(+o.best) || 0)), last: String(o.last), shield: o.shield ? 1 : 0, h: h.slice(-14), ev: SERI_EV.indexOf(o.ev) >= 0 ? o.ev : 'up' };
}
function seriNext(old, today) {
  const o = seriClean(old);
  if (!o) return { st: { n: 1, best: 1, last: today, shield: 0, h: [today], ev: 'start' }, ev: 'start', gotShield: false };
  const diff = seriDayDiff(o.last, today);
  if (diff <= 0) return { st: o, ev: 'same', gotShield: false };   // aynı gün ya da saat geri alınmış: dokunma
  const st = Object.assign({}, o, { h: o.h.slice() });
  let ev;
  if (diff === 1) { st.n++; ev = 'up'; }
  else if (diff === 2 && st.shield) { st.n++; st.shield = 0; st.h.push(seriAddDays(o.last, 1)); ev = 'saved'; }
  else { st.n = 1; ev = o.n > 1 ? 'reset' : 'start'; }
  st.last = today; st.h.push(today); st.h = st.h.slice(-14); st.ev = ev;
  if (st.n > st.best) st.best = st.n;
  const gotShield = ev !== 'reset' && st.n % 7 === 0 && !st.shield;
  if (gotShield) st.shield = 1;
  return { st, ev, gotShield };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { CATS, catOf, scoreOf, MEAN, MED, escHtml, esc, wmed, rtWhen, sadeText, seriNext, seriDayDiff, seriAddDays, seriClean };
