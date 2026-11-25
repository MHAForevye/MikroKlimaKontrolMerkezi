/* Kristal sunucusu (Cloudflare Worker + D1).
   Bakiye, günlük ödül, satın alma, hediye kodu: hepsi burada hesaplanır; tarayıcı sadece ister ve gösterir.
   Fiyatları ya da günlük ödülü değiştirmek için sadece CFG bloğunu düzenle. */

import { makeNexus } from './nexus.js';
import { makeIdentity } from './identity.js';
import { makeTimerRewards } from './timer-rewards.js';
import { withPinned } from './origins.js';

const CFG = {
  daily: 30,
  streakEvery: 7,         // seri her bu kadar günde bir ödül verir
  streakBonus: 60,        // seri ödülü (kristal)
  packs: [
    { name: '3 Günlük Paket',            short: '3 günlük', cost: 500 },
    { name: '7 Günlük Paket (Haftalık)', short: '7 günlük', cost: 1000 }
  ],
  // Mantar Pano geçişleri: kristalle alınır, kod ile açılır. Süre kod ilk kullanıldığında başlar.
  mantar: {
    days: 7,                // her geçişin süresi (gün)
    maxDevices: 2,          // bir kod en fazla kaç cihaza bağlanır (ör. telefon + bilgisayar); süre uzamaz, aynı bitiş tarihi döner
    tiers: [
      { id: 'pro', name: 'Mantar Pano Pro', short: 'Pro', cost: 120 },
      { id: 'unl', name: 'Mantar Pano Sınırsız', short: 'Sınırsız', cost: 250 }
    ]
  },
  // Retro Camera fiyatları ürün sahibi tarafından belirlenir; boş plan listesi satışın kapalı olduğu anlamına gelir.
  retro: {
    tiers: [{ id: 'premium', name: 'Retro Camera Premium', short: 'Premium' }],
    plans: [] // Örn. { tier: 'premium', days: 7, cost: GERCEK_KRS_FIYATI } — fiyat uydurulmaz.
  },
  // Zamanlayıcı geçişleri: Plus / Premium, 3 ya da 7 gün. Fiyatlar BURADA ve sadece burada belirlenir; tarayıcının gönderdiği tutar hiç kullanılmaz.
  zaman: {
    maxDevices: 2,          // bir kod en fazla kaç cihaza bağlanır
    tiers: [
      { id: 'plus', name: 'Zamanlayıcı Plus', short: 'Plus' },
      { id: 'premium', name: 'Zamanlayıcı Premium', short: 'Premium' }
    ],
    plans: [
      { tier: 'plus', days: 3, cost: 100 }, { tier: 'plus', days: 7, cost: 200 },
      { tier: 'premium', days: 3, cost: 250 }, { tier: 'premium', days: 7, cost: 500 }
    ]
  },
  // Hediye kartı: kristal kartla başka hesaba/cihaza taşınır. Tutar, şablon sayısı ve güvenlik ayarları sadece burada belirlenir.
  cards: {
    min: 10, max: 100000,   // bir kartın tutarı (kristal)
    templates: 15,          // geçerli şablon numaraları 0..14 (tasarımlar kart uygulamasında)
    validMonths: 12,        // SKT: oluşturulduğu aydan kaç ay sonra (o ayın sonuna kadar geçerli)
    maxActive: 20,          // bir hesabın aynı anda en fazla kaç aktif kartı olur
    failLock: 5,            // bir karta art arda bu kadar yanlış denemeden sonra kart kilitlenir
    lockMin: 15,            // kilit süresi (dakika)
    tryPerIp10m: 40         // aynı IP'den 10 dakikada en fazla kaç kart deneme
  },
  maxNewPerIp: 20,        // aynı IP'den günde en fazla kaç yeni hesap (operatörler tek IP'yi yüzlerce kişiyle paylaşır, o yüzden cömert)
  adminFailPer10m: 30,    // aynı IP'den 10 dakikada en fazla kaç yanlış yönetici anahtarı denemesi
  redeemPer10m: 20,       // bir hesabın 10 dakikada en fazla kaç kod denemesi
  buyPer10m: 10,          // bir hesabın 10 dakikada en fazla kaç satın alma isteği
  passActPer10m: 40,      // aynı IP'den 10 dakikada en fazla kaç Mantar Pano kod bozdurma denemesi
  passVerPer10m: 300      // aynı IP'den 10 dakikada en fazla kaç Mantar Pano yenileme kontrolü (ortak ağlar için geniş)
};

const AB = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/* Zamanlayıcı: 7 günlük paket, 3 günlük fiyatla günlük hesaplanınca yüzde kaç ucuz (sunucu hesaplar, ekran bunu gösterir) */
const zPlan = (tier, days) => CFG.zaman.plans.find(p => p.tier === tier && p.days === days) || null;
const zSave7 = () => { const o = {}; CFG.zaman.tiers.forEach(t => { const a = zPlan(t.id, 3), b = zPlan(t.id, 7); o[t.id] = a && b ? Math.round((1 - b.cost / (a.cost * 7 / 3)) * 100) : 0; }); return o; };   // 0/O ve 1/I karışmasın
const te = new TextEncoder();

/* ===== Yardımcılar ===== */
const json = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});
const fail = (msg, s = 400, extra) => json(Object.assign({ err: msg }, extra || {}), s);

async function sha256hex(s) {
  const d = await crypto.subtle.digest('SHA-256', te.encode(s));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function b64url(bytes) {
  let s = ''; bytes.forEach(b => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function rndInt(max) {                       // taraflı olmayan rastgele sayı [0, max)
  const lim = Math.floor(0x100000000 / max) * max;
  const a = new Uint32Array(1);
  do { crypto.getRandomValues(a); } while (a[0] >= lim);
  return a[0] % max;
}
function rndStr(n, alphabet) { let r = ''; for (let i = 0; i < n; i++) r += alphabet.charAt(rndInt(alphabet.length)); return r; }
function eq(a, b) {                          // sabit süreli karşılaştırma
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
const trNow = () => new Date(Date.now() + 3 * 3600e3).toISOString();   // Türkiye saati (UTC+3, yaz/kış saati yok)
const today = () => trNow().slice(0, 10);
const stamp = () => { const s = trNow(); return s.slice(0, 10) + ' ' + s.slice(11, 16); };
const nowSec = () => Math.floor(Date.now() / 1000);

/* ===== Hız sınırı (ipc tablosu: anahtar özetlenir, 10 dakikalık dilim) ===== */
const slot = () => trNow().slice(0, 15);             // örn. 2026-11-09T12:3 → 10 dakikalık dilim
async function rlKey(name, who) { return sha256hex('rl|' + name + '|' + slot() + '|' + who); }
async function rlCount(env, name, who) {
  const h = await rlKey(name, who);
  const r = await env.DB.prepare('SELECT c FROM ipc WHERE h=? AND d=?').bind(h, slot()).first();
  return r ? r.c : 0;
}
async function rlBump(env, name, who) {
  const h = await rlKey(name, who);
  await env.DB.prepare('INSERT INTO ipc(h,d,c) VALUES(?,?,1) ON CONFLICT(h,d) DO UPDATE SET c=c+1').bind(h, slot()).run();
  if (rndInt(60) === 0) await gcIpc(env);
}
async function gcIpc(env) {                           // iki günden eski sayaçları sil (tarih karşılaştırması metin olarak çalışır)
  await env.DB.prepare('DELETE FROM ipc WHERE d < ?').bind(new Date(Date.now() + 3 * 3600e3 - 2 * 86400e3).toISOString().slice(0, 10)).run();
}
const tooMany = () => fail('Çok fazla deneme. Birkaç dakika sonra tekrar dene.', 429);
const normCode = v => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const toInt = (v, min, max) => { const n = Math.floor(Number(String(v).replace(/\s/g, '').replace(',', '.'))); return isFinite(n) && n >= min && n <= max ? n : null; };

async function body(req) {
  const len = +req.headers.get('content-length') || 0;
  if (len > 20000) return null;
  try { const o = await req.json(); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; }
}

/* ===== Kimlik doğrulama ===== */
async function auth(req, env) {
  const m = /^Bearer (\d{8})\.([A-Za-z0-9_-]{20,64})$/.exec(req.headers.get('Authorization') || '');
  if (!m) return null;
  const u = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(m[1]).first();
  if (!u) return null;
  return eq(await sha256hex(m[2]), u.token_hash) ? u : null;
}
async function isAdmin(req, env) {
  const t = req.headers.get('X-MK-Admin') || '';
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 16 || !t) return false;
  return eq(await sha256hex(t), await sha256hex(env.ADMIN_TOKEN));
}

/* ===== Durum ===== */
async function state(env, id, extra) {
  const u = await env.DB.prepare('SELECT id,bal,earned,gift,spent,days,first,last,cam,pending FROM users WHERE id=?').bind(id).first();
  const reqs = (await env.DB.prepare('SELECT no,pack,cost,t,cam,status FROM reqs WHERE uid=? ORDER BY created DESC LIMIT 20').bind(id).all()).results || [];
  const codes = (await env.DB.prepare('SELECT code AS c, n, t FROM codes WHERE to_id=? AND used_at IS NOT NULL ORDER BY used_at DESC LIMIT 30').bind(id).all()).results || [];
  const sk = await env.DB.prepare('SELECT n,best,shield,paid,last FROM streak WHERE uid=?').bind(id).first();
  const passes = (await env.DB.prepare('SELECT code AS c, tier, days, cost, t, used_at AS used, exp FROM passes WHERE uid=? ORDER BY created DESC LIMIT 20').bind(id).all()).results || [];
  const zpasses = (await env.DB.prepare('SELECT code AS c, tier, days, cost, t, used_at AS used, exp FROM zpasses WHERE uid=? ORDER BY created DESC LIMIT 20').bind(id).all()).results || [];
  return Object.assign({
    ok: 1, s: Object.assign({}, u, { reqs: reqs.reverse(), codes, passes, zpasses, streak: sk || { n: 0, best: 0, shield: 0, paid: 0, last: '' } }),
    cfg: { daily: CFG.daily, packs: CFG.packs, streak: { every: CFG.streakEvery, bonus: CFG.streakBonus }, mantar: { days: CFG.mantar.days, tiers: CFG.mantar.tiers }, zaman: { tiers: CFG.zaman.tiers, plans: CFG.zaman.plans, save7: zSave7() }, cards: { min: CFG.cards.min, max: CFG.cards.max, templates: CFG.cards.templates, validMonths: CFG.cards.validMonths, maxActive: CFG.cards.maxActive } }, today: today(), now: nowSec()
  }, extra || {});
}
async function addLog(env, uid, kind, delta, ref) {
  try { await env.DB.prepare('INSERT INTO log(uid,kind,delta,ref,t) VALUES(?,?,?,?,?)').bind(uid, kind, delta, ref || '', stamp()).run(); } catch (e) {}
}

/* ===== Uçlar ===== */
async function init(req, env) {
  const ip = req.headers.get('CF-Connecting-IP') || 'x', d = today();
  const h = await sha256hex('ip|' + d + '|' + ip);
  if (rndInt(40) === 0) await gcIpc(env);   // eski sayaçları ara sıra temizle (her seferinde taramak okuma harcar)
  await env.DB.prepare('INSERT INTO ipc(h,d,c) VALUES(?,?,1) ON CONFLICT(h,d) DO UPDATE SET c=c+1').bind(h, d).run();
  const c = await env.DB.prepare('SELECT c FROM ipc WHERE h=? AND d=?').bind(h, d).first();
  if (c && c.c > CFG.maxNewPerIp) return fail('Bu ağdan bugün çok fazla yeni hesap açıldı. Yarın tekrar dene.', 429);
  for (let i = 0; i < 6; i++) {
    const id = String(10000000 + rndInt(90000000));
    const token = b64url(crypto.getRandomValues(new Uint8Array(24)));
    try {
      await env.DB.prepare('INSERT INTO users(id,token_hash,created) VALUES(?,?,?)').bind(id, await sha256hex(token), nowSec()).run();
    } catch (e) { continue; }   // aynı ID varsa yeniden dene
    return json(Object.assign(await state(env, id, await claimDaily(env, id)), { id, token }));
  }
  return fail('Hesap oluşturulamadı, tekrar dene.', 500);
}

/* ===== Giriş serisi: sunucu hesaplar (tarayıcıdaki sayı ödülü etkilemez) =====
   Ardışık günde +1. Tek gün kaçırılırsa ve kalkan varsa seri korunur, yoksa 1'den başlar. Her 7. günde 1 kalkan (en fazla 1).
   Her CFG.streakEvery. günde CFG.streakBonus kristal. core.js'teki seriNext ile aynı kurallar (testte birlikte denenir). */
const dayNum = s => { const p = s.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2]) / 864e5; };
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
export function streakNext(old, t, every) {
  every = every || 7;
  if (!old || !DAY_RE.test(String(old.last))) return { st: { n: 1, best: 1, shield: 0, paid: 0, last: t }, ev: 'start', bonus: false };
  const diff = Math.round(dayNum(t) - dayNum(old.last));
  if (diff <= 0) return { st: old, ev: 'same', bonus: false };
  const st = Object.assign({}, old); let ev;
  if (diff === 1) { st.n++; ev = 'up'; }
  else if (diff === 2 && st.shield) { st.n++; st.shield = 0; ev = 'saved'; }
  else { st.n = 1; st.paid = 0; ev = old.n > 1 ? 'reset' : 'start'; }
  st.last = t; if (st.n > st.best) st.best = st.n;
  if (ev !== 'reset' && st.n % 7 === 0 && !st.shield) st.shield = 1;
  const bonus = st.n % every === 0 && st.n > st.paid;
  if (bonus) st.paid = st.n;
  return { st, ev, bonus };
}
async function streakStep(env, id, t, days0, hint) {
  const row = await env.DB.prepare('SELECT n,best,shield,paid,last FROM streak WHERE uid=?').bind(id).first();
  let st, bonus = false;
  if (!row && hint && typeof hint === 'object' && DAY_RE.test(String(hint.last)) && Math.abs(dayNum(String(hint.last)) - dayNum(t)) <= 1) {
    // eski (yerel) seriyi bir kez devral: ama sunucudaki giriş günü sayısını aşamaz, devralınan günler için ödül verilmez
    const cap = Math.max(1, days0 + 1), n = Math.max(1, Math.min(cap, Math.floor(+hint.n) || 1));
    st = { n, best: Math.max(n, Math.min(cap, Math.floor(+hint.best) || 0)), shield: 0, paid: Math.floor(n / CFG.streakEvery) * CFG.streakEvery, last: t };
  } else {
    const r = streakNext(row, t, CFG.streakEvery); st = r.st; bonus = r.bonus;
    if (r.ev === 'same') return 0;
  }
  const ops = [env.DB.prepare('INSERT INTO streak(uid,n,best,shield,paid,last) VALUES(?,?,?,?,?,?) ON CONFLICT(uid) DO UPDATE SET n=excluded.n,best=excluded.best,shield=excluded.shield,paid=excluded.paid,last=excluded.last')
    .bind(id, st.n, st.best, st.shield, st.paid, st.last)];
  if (bonus) ops.push(env.DB.prepare('UPDATE users SET bal=bal+?, earned=earned+? WHERE id=?').bind(CFG.streakBonus, CFG.streakBonus, id));
  await env.DB.batch(ops);
  if (bonus) await addLog(env, id, 'streak', CFG.streakBonus, String(st.n));
  return bonus ? CFG.streakBonus : 0;
}

async function claimDaily(env, id, hint) {
  const t = today();
  const u0 = await env.DB.prepare('SELECT days FROM users WHERE id=?').bind(id).first();
  const r = await env.DB.prepare("UPDATE users SET bal=bal+?, earned=earned+?, days=days+1, last=?, first=CASE WHEN first='' THEN ? ELSE first END WHERE id=? AND last<?")
    .bind(CFG.daily, CFG.daily, t, t, id, t).run();
  if (!r.meta.changes) return { rewarded: 0 };
  await addLog(env, id, 'daily', CFG.daily, t);
  let streakBonus = 0;
  try { streakBonus = await streakStep(env, id, t, u0 ? u0.days : 0, hint); } catch (e) { console.error('seri hatası', e && e.stack || e); }
  return { rewarded: CFG.daily, streakBonus };
}

async function sync(req, env, u, b) { return json(await state(env, u.id, await claimDaily(env, u.id, b && b.hint))); }

async function buy(req, env, u, b) {
  await rlBump(env, 'buy', u.id);
  if ((await rlCount(env, 'buy', u.id)) > CFG.buyPer10m) return tooMany();
  const pk = CFG.packs[toInt(b.pack, 0, CFG.packs.length - 1)];
  if (!pk) return fail('Geçersiz paket.');
  const cam = String(b.cam || '').trim().slice(0, 60);
  if (cam.length < 3) return fail("Önce Astrophoto Cam ID'ni yaz.");
  const no = rndStr(6, AB), t = stamp();
  // bakiye kontrolü ve düşüm tek atomik komutta: yetersizse hiçbir şey değişmez
  const up = await env.DB.prepare('UPDATE users SET bal=bal-?, spent=spent+?, cam=?, pending=? WHERE id=? AND bal>=?')
    .bind(pk.cost, pk.cost, cam, no, u.id, pk.cost).run();
  if (!up.meta.changes) return fail('Yetersiz kristal! Günlük giriş yaparak kristal biriktirmeye devam et.', 400, await state(env, u.id));
  try {
    await env.DB.batch([
      env.DB.prepare('INSERT INTO reqs(no,uid,pack,cost,cam,t,created) VALUES(?,?,?,?,?,?,?)').bind(no, u.id, pk.short, pk.cost, cam, t, nowSec()),
      env.DB.prepare('INSERT INTO log(uid,kind,delta,ref,t) VALUES(?,?,?,?,?)').bind(u.id, 'buy', -pk.cost, no, t)
    ]);
  } catch (e) {   // talep yazılamadıysa kristali iade et
    await env.DB.prepare("UPDATE users SET bal=bal+?, spent=spent-?, pending='' WHERE id=?").bind(pk.cost, pk.cost, u.id).run();
    return fail('Talep kaydedilemedi, kristalin iade edildi. Tekrar dene.', 500);
  }
  return json(await state(env, u.id, { req: { no, pack: pk.short, cost: pk.cost, t, cam } }));
}

async function redeem(req, env, u, b) {
  await rlBump(env, 'redeem', u.id);
  if ((await rlCount(env, 'redeem', u.id)) > CFG.redeemPer10m) return tooMany();
  const c = normCode(b.code);
  if (!/^[A-Z2-9]{13}$/.test(c)) return fail('Kod XXXX-XXXX-XXXXX biçiminde (13 harf/rakam).');
  const row = await env.DB.prepare('SELECT code,to_id,n,used_at FROM codes WHERE code=?').bind(c).first();
  if (!row || row.to_id !== u.id) return fail("Kod geçersiz ya da bu ID'ye ait değil.");
  if (row.used_at) return fail('Bu kod daha önce kullanılmış.');
  // ikisi tek işlemde: kod kullanılmamışsa kristal eklenir ve kod kapanır
  const res = await env.DB.batch([
    env.DB.prepare('UPDATE users SET bal=bal+?, gift=gift+? WHERE id=? AND EXISTS (SELECT 1 FROM codes WHERE code=? AND used_at IS NULL)').bind(row.n, row.n, u.id, c),
    env.DB.prepare('UPDATE codes SET used_at=? WHERE code=? AND used_at IS NULL').bind(nowSec(), c)
  ]);
  if (!res[0].meta.changes) return fail('Bu kod daha önce kullanılmış.');
  await addLog(env, u.id, 'redeem', row.n, c);
  return json(await state(env, u.id, { added: row.n }));
}

/* ===== Hediye kartı =====
   Oluştururken tutar oluşturanın bakiyesinden atomik düşer. Bozdururken 8 haneli no + CVV + SKT'nin üçü de tutmalı.
   Yanlış denemeler hesap ve IP başına sınırlanır, karta art arda yanlış deneme kartı geçici kilitler.
   Kart bilgileri yanlışsa cevap hep aynıdır (kartın var olup olmadığı sızmaz). Kart tek kullanımlıktır.
   Süresi dolan kart, oluşturanın bir sonraki /api/card/list çağrısında tutarı iade edilerek kapanır. */
const luhnOk = s => { let sum = 0; for (let i = 0; i < s.length; i++) { let d = +s[s.length - 1 - i]; if (i % 2) { d *= 2; if (d > 9) d -= 9; } sum += d; } return sum % 10 === 0; };
function newCardNo() {                       // 7 rastgele hane (ilki 0 değil) + Luhn sağlama hanesi
  const body = String(1 + rndInt(9)) + rndStr(6, '0123456789');
  for (let c = 0; c < 10; c++) if (luhnOk(body + c)) return body + c;
}
const cardOk = no => /^\d{8}$/.test(no) && luhnOk(no);
const cardEx = (months) => {                 // SKT etiketi ve bitiş anı (TR saatiyle ayın son anı)
  const d = new Date(Date.now() + 3 * 3600e3), t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const end = Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 1) / 1000 - 3 * 3600 - 1;
  return { ex: String(t.getUTCMonth() + 1).padStart(2, '0') + '/' + String(t.getUTCFullYear() % 100).padStart(2, '0'), exp: end };
};
const normEx = v => { const d = String(v || '').replace(/\D/g, ''); return d.length === 4 && +d.slice(0, 2) >= 1 && +d.slice(0, 2) <= 12 ? d.slice(0, 2) + '/' + d.slice(2) : ''; };
const cleanTxt = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const CARD_BAD = 'Kart bilgileri tutmuyor. Numara, SKT ve CVV\'yi kontrol et.';
const CARD_COLS = 'no,cvv,ex,exp,n,tpl,msg,frm,t,status,used_at,created';

/* Kart tablosu eski bir veritabanında yoksa ilk kart isteğinde kendisi kurulur (schema.sql'i unutmak "Sunucu hatası" yapmasın).
   schema.sql'deki gcards ile aynıdır; zaten varsa hiçbir şey değişmez. */
const GCARDS_SQL = [
  `CREATE TABLE IF NOT EXISTS gcards (
    no TEXT PRIMARY KEY, cvv TEXT NOT NULL, ex TEXT NOT NULL, exp INTEGER NOT NULL, uid TEXT NOT NULL, n INTEGER NOT NULL,
    tpl INTEGER NOT NULL DEFAULT 0, msg TEXT NOT NULL DEFAULT '', frm TEXT NOT NULL DEFAULT '', t TEXT NOT NULL, created INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', to_id TEXT, used_at INTEGER, bad INTEGER NOT NULL DEFAULT 0, lock_until INTEGER NOT NULL DEFAULT 0)`,
  'CREATE INDEX IF NOT EXISTS gcards_uid ON gcards(uid, created)'
];
const cardsReady = new WeakSet();
async function ensureCards(env) {
  if (cardsReady.has(env.DB)) return;
  for (const q of GCARDS_SQL) await env.DB.prepare(q).run();
  cardsReady.add(env.DB);
}

async function cardSweep(env, uid) {         // süresi dolan aktif kartların tutarını oluşturana iade et
  const rows = (await env.DB.prepare("SELECT no,n FROM gcards WHERE uid=? AND status='active' AND exp<=? LIMIT 20").bind(uid, nowSec()).all()).results || [];
  for (const r of rows) {
    const res = await env.DB.batch([
      env.DB.prepare("UPDATE users SET bal=bal+?, spent=spent-? WHERE id=? AND EXISTS (SELECT 1 FROM gcards WHERE no=? AND status='active' AND exp<=?)").bind(r.n, r.n, uid, r.no, nowSec()),
      env.DB.prepare("UPDATE gcards SET status='expired' WHERE no=? AND status='active' AND exp<=?").bind(r.no, nowSec())
    ]);
    if (res[0].meta.changes) await addLog(env, uid, 'card_refund', r.n, r.no);
  }
}
async function cardList(env, uid) {
  await cardSweep(env, uid);
  return (await env.DB.prepare('SELECT ' + CARD_COLS + ' FROM gcards WHERE uid=? ORDER BY created DESC, rowid DESC LIMIT 30').bind(uid).all()).results || [];
}
const cardOut = r => ({ no: r.no, cvv: r.cvv, ex: r.ex, exp: r.exp, n: r.n, tpl: r.tpl, msg: r.msg, frm: r.frm, t: r.t, status: r.status, used: r.used_at || 0 });

async function cardCreate(req, env, u, b) {
  const K = CFG.cards;
  await ensureCards(env);
  await rlBump(env, 'cnew', u.id);
  if ((await rlCount(env, 'cnew', u.id)) > CFG.buyPer10m) return tooMany();
  const n = toInt(b.n, K.min, K.max), tpl = toInt(b.tpl == null ? 0 : b.tpl, 0, K.templates - 1);
  if (n === null) return fail('Tutar ' + K.min + ' ile ' + K.max + ' kristal arasında olmalı.');
  if (tpl === null) return fail('Geçersiz kart tasarımı.');
  await cardSweep(env, u.id);
  const act = await env.DB.prepare("SELECT COUNT(*) AS c FROM gcards WHERE uid=? AND status='active'").bind(u.id).first();
  if (act && act.c >= K.maxActive) return fail('Aynı anda en fazla ' + K.maxActive + ' aktif kartın olabilir. Birini iptal et ya da kullanılmasını bekle.');
  const msg = cleanTxt(b.msg, 80), frm = cleanTxt(b.frm, 24), t = stamp(), { ex, exp } = cardEx(K.validMonths), cvv = rndStr(3, '0123456789');
  // bakiye kontrolü ve düşüm tek atomik komutta: yetersizse hiçbir şey değişmez
  const up = await env.DB.prepare('UPDATE users SET bal=bal-?, spent=spent+? WHERE id=? AND bal>=?').bind(n, n, u.id, n).run();
  if (!up.meta.changes) return fail('Yetersiz kristal! Günlük giriş yaparak kristal biriktirmeye devam et.', 400, await state(env, u.id));
  let no = '';
  for (let i = 0; i < 6 && !no; i++) {
    const c = newCardNo();
    try { await env.DB.prepare('INSERT INTO gcards(no,cvv,ex,exp,uid,n,tpl,msg,frm,t,created) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(c, cvv, ex, exp, u.id, n, tpl, msg, frm, t, nowSec()).run(); no = c; } catch (e) {}   // aynı numara varsa yeniden dene
  }
  if (!no) {   // kart yazılamadıysa kristali iade et
    await env.DB.prepare('UPDATE users SET bal=bal+?, spent=spent-? WHERE id=?').bind(n, n, u.id).run();
    return fail('Kart oluşturulamadı, kristalin iade edildi. Tekrar dene.', 500);
  }
  await addLog(env, u.id, 'card_new', -n, no);
  return json(await state(env, u.id, { card: cardOut({ no, cvv, ex, exp, n, tpl, msg, frm, t, status: 'active', used_at: 0 }) }));
}

async function cardListEp(req, env, u) { await ensureCards(env); return json(await state(env, u.id, { cards: (await cardList(env, u.id)).map(cardOut) })); }

async function cardCancel(req, env, u, b) {   // kullanılmamış kartı iptal et, tutar geri gelir
  await ensureCards(env);
  await rlBump(env, 'ccan', u.id);
  if ((await rlCount(env, 'ccan', u.id)) > CFG.buyPer10m) return tooMany();
  const no = String(b.no || '').replace(/\D/g, '');
  const row = await env.DB.prepare('SELECT no,n,status FROM gcards WHERE no=? AND uid=?').bind(no, u.id).first();
  if (!row) return fail('Kart bulunamadı.', 404);
  if (row.status !== 'active') return fail(row.status === 'used' ? 'Bu kart kullanılmış, iptal edilemez.' : 'Bu kart zaten kapalı.');
  const res = await env.DB.batch([
    env.DB.prepare("UPDATE users SET bal=bal+?, spent=spent-? WHERE id=? AND EXISTS (SELECT 1 FROM gcards WHERE no=? AND uid=? AND status='active')").bind(row.n, row.n, u.id, no, u.id),
    env.DB.prepare("UPDATE gcards SET status='cancelled' WHERE no=? AND uid=? AND status='active'").bind(no, u.id)
  ]);
  if (!res[0].meta.changes) return fail('Bu kart kullanılmış, iptal edilemez.');
  await addLog(env, u.id, 'card_cancel', row.n, no);
  return json(await state(env, u.id, { cancelled: no, refunded: row.n, cards: (await cardList(env, u.id)).map(cardOut) }));
}

async function cardRedeem(req, env, u, b) {
  await ensureCards(env);
  const K = CFG.cards, ip = req.headers.get('CF-Connecting-IP') || 'x';
  await rlBump(env, 'cuse', u.id); await rlBump(env, 'cip', ip);
  if ((await rlCount(env, 'cuse', u.id)) > CFG.redeemPer10m || (await rlCount(env, 'cip', ip)) > K.tryPerIp10m) return tooMany();
  const no = String(b.no || '').replace(/\D/g, ''), cvv = String(b.cvv || '').replace(/\D/g, ''), ex = normEx(b.ex);
  if (!cardOk(no) || !/^\d{3}$/.test(cvv) || !ex) return fail(CARD_BAD);   // biçim ya da Luhn hatası: karta dokunmaz, sayaç artmaz
  const row = await env.DB.prepare('SELECT no,cvv,ex,exp,n,tpl,msg,frm,status,lock_until,bad FROM gcards WHERE no=?').bind(no).first();
  if (!row) return fail(CARD_BAD);
  const now = nowSec();
  if (row.lock_until > now) return fail(CARD_BAD);   // kilitliyken doğru bilgi de geçmez (kaba kuvveti durdurur); neden söylenmez
  const good = eq(row.cvv, cvv) & eq(row.ex, ex);    // iki karşılaştırma da yapılır (erken çıkış yok)
  if (!good) {
    const bad = row.bad + 1, lock = bad >= K.failLock;
    await env.DB.prepare('UPDATE gcards SET bad=?, lock_until=? WHERE no=?').bind(lock ? 0 : bad, lock ? now + K.lockMin * 60 : 0, no).run();
    return fail(CARD_BAD);
  }
  if (row.status === 'used') return fail('Bu kart daha önce kullanılmış.');
  if (row.status !== 'active') return fail('Bu kart artık geçerli değil.');
  if (row.exp <= now) return fail('Bu kartın son kullanma tarihi geçmiş.');
  // ikisi tek işlemde: kart kullanılmamışsa kristal eklenir ve kart kapanır
  const res = await env.DB.batch([
    env.DB.prepare("UPDATE users SET bal=bal+?, gift=gift+? WHERE id=? AND EXISTS (SELECT 1 FROM gcards WHERE no=? AND status='active' AND exp>?)").bind(row.n, row.n, u.id, no, now),
    env.DB.prepare("UPDATE gcards SET status='used', to_id=?, used_at=?, bad=0 WHERE no=? AND status='active' AND exp>?").bind(u.id, now, no, now)
  ]);
  if (!res[0].meta.changes) return fail('Bu kart daha önce kullanılmış.');
  await addLog(env, u.id, 'card_use', row.n, no);
  return json(await state(env, u.id, { added: row.n, card: { no: row.no, ex: row.ex, n: row.n, tpl: row.tpl, msg: row.msg, frm: row.frm } }));
}

/* ===== Mantar Pano geçişleri =====
   Satın alma (Mikro Klima'dan, hesapla): kristal atomik düşer, 13 harflik tek kod üretilir.
   Doğrulama (Mantar Pano'dan, hesapsız): kod ilk kullanıldığında süre başlar; bitiş tarihini sunucu verir.
   Aynı kod başka cihazda tekrar doğrulanabilir (en fazla CFG.mantar.maxUses), bitiş tarihi uzamaz. */
const tierOf = id => CFG.mantar.tiers.find(t => t.id === id) || null;
async function passBuy(req, env, u, b) {
  await rlBump(env, 'pbuy', u.id);
  if ((await rlCount(env, 'pbuy', u.id)) > CFG.buyPer10m) return tooMany();
  const tr = tierOf(String(b.tier || ''));
  if (!tr) return fail('Geçersiz paket.');
  const code = rndStr(13, AB), t = stamp();
  const up = await env.DB.prepare('UPDATE users SET bal=bal-?, spent=spent+? WHERE id=? AND bal>=?').bind(tr.cost, tr.cost, u.id, tr.cost).run();
  if (!up.meta.changes) return fail('Yetersiz kristal! Günlük giriş yaparak kristal biriktirmeye devam et.', 400, await state(env, u.id));
  try {
    await env.DB.batch([
      env.DB.prepare('INSERT INTO passes(code,uid,tier,days,cost,t,created) VALUES(?,?,?,?,?,?,?)').bind(code, u.id, tr.id, CFG.mantar.days, tr.cost, t, nowSec()),
      env.DB.prepare('INSERT INTO log(uid,kind,delta,ref,t) VALUES(?,?,?,?,?)').bind(u.id, 'pass', -tr.cost, tr.id + ':' + code, t)
    ]);
  } catch (e) {   // kod yazılamadıysa kristali iade et
    await env.DB.prepare('UPDATE users SET bal=bal+?, spent=spent-? WHERE id=?').bind(tr.cost, tr.cost, u.id).run();
    return fail('Kod oluşturulamadı, kristalin iade edildi. Tekrar dene.', 500);
  }
  return json(await state(env, u.id, { pass: { c: code, tier: tr.id, days: CFG.mantar.days, cost: tr.cost, t } }));
}

/* ===== Mantar Pano sözleşmesi (mantarpano/BAGLANTI.md ile birebir) =====
   POST /api/mantarpano/redeem  {code, app:'mantarpano', device, v:1}  → ilk kullanımda süre başlar, kod cihaza bağlanır
   POST /api/mantarpano/verify  aynı gövde → süre başlatmaz/cihaz bağlamaz, sadece "hâlâ geçerli mi" der (iptal/yenileme)
   Başarı: {ok:true, app, plan:'pro'|'unlimited', expiresAt: ms, token?}   Hata: {ok:false, error:'invalid_code'|'used'|'expired'|'wrong_app'|'rate_limited'}
   Hesapsız uç: Mantar Pano başka alan adından çağırır → CORS (MP_ORIGIN ayarlıysa sadece o adres, yoksa *). Kodun kendisi anahtardır. */
/* Açık uçlar (hesapsız, kodun kendisi anahtar): her uygulamanın kendi tablosu, adı, izin verilen adresi ve imza anahtarı var. */
const APPS = {
  mp: { app: 'mantarpano', label: 'Mantar Pano', table: 'passes', rl: ['pact', 'pver'], plan: id => id === 'unl' ? 'unlimited' : 'pro', origin: 'MP_ORIGIN', key: 'MP_SIGN_KEY', maxDev: () => CFG.mantar.maxDevices },
  zp: { app: 'zamanlayici', label: 'Zamanlayıcı', table: 'zpasses', rl: ['zact', 'zver'], plan: id => id, origin: 'ZP_ORIGIN', key: 'ZP_SIGN_KEY', maxDev: () => CFG.zaman.maxDevices }
};
const OPEN = { '/api/mantarpano/redeem': APPS.mp, '/api/mantarpano/verify': APPS.mp, '/api/zamanlayici/redeem': APPS.zp, '/api/zamanlayici/verify': APPS.zp };
const openOf = path => OPEN[path] || null;
/* İzin verilen adres: tek değer ya da virgülle liste (sadece alan adı). Boşsa *. Listede istekteki adres varsa o, yoksa ilki. */
function pickOrigin(val, reqOrigin) {
  const l = String(val || '').split(',').map(x => x.trim().replace(/\/+$/, '')).filter(Boolean);
  if (!l.length) return '*';
  return l.length > 1 && l.includes(reqOrigin) ? reqOrigin : l[0];
}
/* Zamanlayıcı ZP_ORIGIN doluysa: panel değeri + koda gömülü iki GitHub hesabı (worker/origins.js). Boşsa eskisi gibi * (açık uç). */
const specOrigins = (env, spec) => spec === APPS.zp && String(env.ZP_ORIGIN || '').trim() ? withPinned(env.ZP_ORIGIN).join(',') : (spec && env[spec.origin]);
const corsOf = (env, spec, reqOrigin) => ({ 'Access-Control-Allow-Origin': pickOrigin(specOrigins(env, spec), reqOrigin), 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-MK-Admin', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' });
const withCors = (r, h) => { Object.entries(h).forEach(([k, v]) => r.headers.set(k, v)); return r; };

/* Mağaza ayrı bir sitede (başka alan adı). Hesaplı uçlar (init, sync, buy, redeem, admin...) yalnızca env.MARKET_ORIGIN listesindeki
   adreslerden okunabilir: virgülle ayrılmış, sadece alan adı (https://KULLANICI.github.io). İki GitHub hesabı (worker/origins.js) her zaman dahildir;
   MARKET_ORIGIN yalnızca EK adres ekler. Listede olmayan adrese CORS başlığı eklenmez.
   Kimlik başlıkla (Authorization) gider, çerez yok; bu yüzden izin verilen adres dışında kimse yanıtı okuyamaz. */
const marketOrigins = env => withPinned(env.MARKET_ORIGIN);   // koda gömülü iki GitHub hesabı HER ZAMAN dahil (worker/origins.js)
function corsHeaders(req, env, spec) {
  const o = req.headers.get('Origin') || '';
  if (spec) return corsOf(env, spec, o);
  const allowed = withPinned(env.MARKET_ORIGIN, env.ZP_ORIGIN);
  return o && allowed.includes(o) ? Object.assign({}, corsOf(env, null, o), { 'Access-Control-Allow-Origin': o }) : null;
}
const mpFail = (error, status, message) => json({ ok: false, error, message }, status);

/* İsteğe bağlı imza (ECDSA P-256): her uygulamanın kendi anahtarı (MP_SIGN_KEY / ZP_SIGN_KEY, wrangler secret). Yoksa token eklenmez.
   Yük içinde uygulama adı da imzalıdır: bir uygulamanın jetonu ötekinde geçmez. */
async function mpToken(env, row, device, spec) {
  const raw = env[spec.key];
  if (!raw) return null;
  try {
    const jwk = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    const enc = new TextEncoder();
    const p = b64url(enc.encode(JSON.stringify({ app: spec.app, plan: spec.plan(row.tier), exp: row.exp * 1000, dev: device })));
    const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(p));
    return p + '.' + b64url(new Uint8Array(sig));
  } catch (e) { return null; }
}

async function mantarRedeem(req, env, b, verify, spec) {
  spec = spec || APPS.mp;
  const ip = req.headers.get('CF-Connecting-IP') || 'x', name = spec.rl[verify ? 1 : 0], max = verify ? CFG.passVerPer10m : CFG.passActPer10m;
  await rlBump(env, name, ip);
  // yenileme kontrolünde sınır aşımı 503 döner: istemci 5xx'i "ağ sorunu" sayar ve premium'u kapatmaz
  if ((await rlCount(env, name, ip)) > max) return mpFail('rate_limited', verify ? 503 : 429, 'Çok fazla deneme. Birkaç dakika sonra tekrar dene.');
  if (b.app !== spec.app) return mpFail('wrong_app', 400, 'Bu kod ' + spec.label + ' için değil.');
  const device = String(b.device || ''), c = normCode(b.code);
  if (!/^[A-Za-z0-9_.-]{4,64}$/.test(device) || !/^[A-Z2-9]{13}$/.test(c)) return mpFail('invalid_code', 400, 'Kod geçersiz. Yazımı kontrol et.');
  const T = spec.table;   // sabit tablo adı (APPS'ten), kullanıcı girdisi değil
  const SEL = 'SELECT code,tier,days,used_at,exp,devs FROM ' + T + ' WHERE code=?';
  let row = await env.DB.prepare(SEL).bind(c).first();
  if (!row) return mpFail('invalid_code', 404, 'Kod geçersiz. Yazımı kontrol et.');
  const now = nowSec();
  if (!row.used_at) {
    if (verify) return mpFail('invalid_code', 404, 'Bu kod henüz etkinleştirilmemiş.');
    // ilk kullanım: süre şimdi başlar, kod bu cihaza bağlanır (tek atomik komut; iki cihaz aynı anda denerse biri kazanır)
    await env.DB.prepare('UPDATE ' + T + ' SET used_at=?, exp=?, devs=? WHERE code=? AND used_at IS NULL').bind(now, now + row.days * 86400, device, c).run();
    row = await env.DB.prepare(SEL).bind(c).first();
  }
  const devs = row.devs ? row.devs.split(',') : [];
  if (row.exp <= now) return mpFail('expired', 410, 'Kodun süresi dolmuş.');
  if (!devs.includes(device)) {
    if (verify || devs.length >= spec.maxDev()) return mpFail('used', 409, 'Bu kod başka bir cihazda kullanılmış.');
    devs.push(device);
    await env.DB.prepare('UPDATE ' + T + ' SET devs=? WHERE code=?').bind(devs.join(','), c).run();
  }
  const out = { ok: true, app: spec.app, plan: spec.plan(row.tier), expiresAt: row.exp * 1000 }, tok = await mpToken(env, row, device, spec);
  if (tok) out.token = tok;
  return json(out);
}

/* ===== Zamanlayıcı: satın alma (Mağaza'dan, hesapla). Kod kristalle alınır; fiyat ve süre sadece CFG.zaman'dan okunur. ===== */
async function zBuy(req, env, u, b) {
  await rlBump(env, 'zbuy', u.id);
  if ((await rlCount(env, 'zbuy', u.id)) > CFG.buyPer10m) return tooMany();
  const pl = /^\d{1,3}$/.test(String(b.days)) ? zPlan(String(b.tier || ''), Number(b.days)) : null;   // 3 ya da 7; "3.5", "3; x" gibi değerler geçmez
  if (!pl) return fail('Geçersiz paket.');
  const code = rndStr(13, AB), t = stamp();
  const up = await env.DB.prepare('UPDATE users SET bal=bal-?, spent=spent+? WHERE id=? AND bal>=?').bind(pl.cost, pl.cost, u.id, pl.cost).run();
  if (!up.meta.changes) return fail('Yetersiz kristal! Günlük giriş yaparak kristal biriktirmeye devam et.', 400, await state(env, u.id));
  try {
    await env.DB.batch([
      env.DB.prepare('INSERT INTO zpasses(code,uid,tier,days,cost,t,created) VALUES(?,?,?,?,?,?,?)').bind(code, u.id, pl.tier, pl.days, pl.cost, t, nowSec()),
      env.DB.prepare('INSERT INTO log(uid,kind,delta,ref,t) VALUES(?,?,?,?,?)').bind(u.id, 'zpass', -pl.cost, pl.tier + ':' + pl.days + ':' + code, t)
    ]);
  } catch (e) {   // kod yazılamadıysa kristali iade et
    await env.DB.prepare('UPDATE users SET bal=bal+?, spent=spent-? WHERE id=?').bind(pl.cost, pl.cost, u.id).run();
    return fail('Kod oluşturulamadı, kristalin iade edildi. Tekrar dene.', 500);
  }
  return json(await state(env, u.id, { zpass: { c: code, tier: pl.tier, days: pl.days, cost: pl.cost, t } }));
}
async function adminZPass(env, b) {
  const tr = CFG.zaman.tiers.find(t => t.id === String(b.tier || '')), days = toInt(b.days == null || b.days === '' ? 7 : b.days, 1, 365);
  if (!tr) return fail('Paket: plus ya da premium olmalı.');
  if (days === null) return fail('Gün sayısı 1 ile 365 arasında olmalı.');
  const code = rndStr(13, AB);
  await env.DB.prepare("INSERT INTO zpasses(code,uid,tier,days,cost,t,created) VALUES(?,?,?,?,0,?,?)").bind(code, '', tr.id, days, stamp(), nowSec()).run();
  return json({ ok: 1, code, tier: tr.id, name: tr.name, days });
}
async function adminZPasses(env) {
  const rows = (await env.DB.prepare("SELECT code AS c, tier, days, t, used_at AS used, exp FROM zpasses WHERE uid='' ORDER BY created DESC LIMIT 30").all()).results || [];
  return json({ ok: 1, passes: rows });
}

async function adminPass(env, b) {
  const tr = tierOf(String(b.tier || '')), days = toInt(b.days == null || b.days === '' ? CFG.mantar.days : b.days, 1, 365);
  if (!tr) return fail('Paket: pro ya da unl olmalı.');
  if (days === null) return fail('Gün sayısı 1 ile 365 arasında olmalı.');
  const code = rndStr(13, AB);
  await env.DB.prepare("INSERT INTO passes(code,uid,tier,days,cost,t,created) VALUES(?,?,?,?,0,?,?)").bind(code, '', tr.id, days, stamp(), nowSec()).run();
  return json({ ok: 1, code, tier: tr.id, name: tr.name, days });
}

async function adminPasses(env) {   // yöneticinin ürettiği (hesapsız) Mantar Pano kodlarının son listesi: kayıp kodu tekrar bulmak için
  const rows = (await env.DB.prepare("SELECT code AS c, tier, days, t, used_at AS used, exp FROM passes WHERE uid='' ORDER BY created DESC LIMIT 30").all()).results || [];
  return json({ ok: 1, passes: rows });
}

async function mailDone(req, env, u) {
  await env.DB.prepare("UPDATE users SET pending='' WHERE id=?").bind(u.id).run();
  return json(await state(env, u.id));
}

/* ===== Sadece sahibi (ADMIN_TOKEN gerekir) ===== */
async function adminGift(env, b) {
  const to = String(b.to || '').replace(/\D/g, ''), n = toInt(b.n, 1, 100000);
  if (!/^\d{8}$/.test(to)) return fail("Arkadaşının Site ID'si 8 haneli bir sayı olmalı.");
  if (n === null) return fail('1 ile 100000 arasında bir sayı yaz.');
  if (!(await env.DB.prepare('SELECT 1 AS x FROM users WHERE id=?').bind(to).first())) return fail('Bu ID sunucuda kayıtlı değil. ID doğru mu?');
  const code = rndStr(13, AB);
  await env.DB.prepare('INSERT INTO codes(code,to_id,n,t,created) VALUES(?,?,?,?,?)').bind(code, to, n, stamp(), nowSec()).run();
  const recent = (await env.DB.prepare('SELECT code AS c, to_id AS "to", n, t FROM codes ORDER BY created DESC LIMIT 5').all()).results || [];
  return json({ ok: 1, code, to, n, recent });
}
async function adminAdd(env, b) {
  const to = String(b.to || '').replace(/\D/g, ''), n = toInt(b.n, 1, 100000);
  if (!/^\d{8}$/.test(to)) return fail('8 haneli bir Site ID yaz.');
  if (n === null) return fail('1 ile 100000 arasında bir sayı yaz.');
  const r = await env.DB.prepare('UPDATE users SET bal=bal+?, gift=gift+? WHERE id=?').bind(n, n, to).run();
  if (!r.meta.changes) return fail('Bu ID sunucuda kayıtlı değil.');
  await addLog(env, to, 'admin_add', n, '');
  const u = await env.DB.prepare('SELECT bal FROM users WHERE id=?').bind(to).first();
  return json({ ok: 1, to, n, bal: u.bal });
}
async function adminVerify(env, b) {
  const text = String(b.text || '');
  const no = (/Talep no:\s*([A-Z0-9]{6})/.exec(text) || /#([A-Z0-9]{6})/.exec(text) || [])[1];
  if (!no) return json({ ok: 1, out: 'ŞÜPHELİ: Mailde talep numarası bulunamadı.' });
  const r = await env.DB.prepare('SELECT r.no,r.uid,r.pack,r.cost,r.cam,r.t,r.status,u.bal,u.earned,u.gift,u.spent,u.days FROM reqs r JOIN users u ON u.id=r.uid WHERE r.no=?').bind(no).first();
  if (!r) return json({ ok: 1, no, out: 'ŞÜPHELİ: #' + no + ' numaralı talep sunucuda yok. Mail uydurulmuş olabilir.' });
  const bad = [], mid = (/sitemdeki ID'm:\s*(\d{8})/.exec(text) || [])[1], mcost = (/Mağazadan\s+(\d+)\s+kristal/.exec(text) || [])[1];
  const mcam = ((/Cam ID'm:\s*(.+)/.exec(text) || [])[1] || '').trim();
  if (mid !== r.uid) bad.push('Maildeki ID (' + (mid || 'yok') + ') sunucudaki ID (' + r.uid + ') ile farklı');
  if (mcost && +mcost !== r.cost) bad.push('Maildeki tutar (' + mcost + ') sunucudaki tutar (' + r.cost + ') ile farklı');
  if (mcam && mcam !== r.cam) bad.push('Maildeki Cam ID (' + mcam + ') sunucudakinden (' + r.cam + ') farklı');
  if (r.status === 'done') bad.push('Bu talep daha önce TAMAMLANDI olarak işaretlenmiş (çifte kod gönderme)');
  const info = 'ID ' + r.uid + ' · talep #' + r.no + ' · ' + r.pack + ' · ' + r.cost + ' kristal · ' + r.t + '\n' +
    'Astrophoto Cam ID: ' + r.cam + '\nGiriş günü ' + r.days + ', giriş ödülü ' + r.earned + ', hediye ' + r.gift + ', harcanan ' + r.spent + ', kalan ' + r.bal;
  return json({ ok: 1, no, out: (bad.length ? 'ŞÜPHELİ:\n- ' + bad.join('\n- ') : 'TEMİZ: talep sunucuda kayıtlı, bilgiler tutuyor.') + '\n\n' + info });
}
async function adminDone(env, b) {
  const no = String(b.no || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const r = await env.DB.prepare("UPDATE reqs SET status='done' WHERE no=?").bind(no).run();
  return r.meta.changes ? json({ ok: 1, no }) : fail('Talep bulunamadı.', 404);
}


/* ===== Hesaba bağlı KRS abonelikleri =====
   Abonelikler eski aktivasyon kodlarından bağımsız olarak Kristal Borsası hesabına bağlanır.
   Satın alma KRS bakiyesinden atomik düşer; aynı ürünün yeni dönemi mevcut bitişe eklenir.
   Otomatik yenileme scheduled() cron ile uygulama kapalıyken de yürütülür. */
const SUBS_SQL = [
 `CREATE TABLE IF NOT EXISTS subscriptions (
   id TEXT PRIMARY KEY, uid TEXT NOT NULL, product_id TEXT NOT NULL, app TEXT NOT NULL,
   tier TEXT NOT NULL, name TEXT NOT NULL, unit_cost INTEGER NOT NULL, duration_sec INTEGER NOT NULL,
   starts_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, auto_renew INTEGER NOT NULL DEFAULT 0,
   status TEXT NOT NULL DEFAULT 'active', renew_count INTEGER NOT NULL DEFAULT 0,
   updated_at INTEGER NOT NULL, UNIQUE(uid, product_id))`,
 `CREATE INDEX IF NOT EXISTS subscriptions_due ON subscriptions(auto_renew,status,expires_at)`,
 `CREATE TABLE IF NOT EXISTS subscription_orders (
   id TEXT PRIMARY KEY, uid TEXT NOT NULL, product_id TEXT NOT NULL, periods INTEGER NOT NULL,
   cost INTEGER NOT NULL, idem TEXT NOT NULL, created_at INTEGER NOT NULL, UNIQUE(uid,idem))`,
 `CREATE INDEX IF NOT EXISTS subscription_orders_uid ON subscription_orders(uid,created_at DESC)`
];
const SUBS_READY = new WeakSet();
async function ensureSubscriptions(env) {
 if (SUBS_READY.has(env.DB)) return;
 for (const q of SUBS_SQL) await env.DB.prepare(q).run();
 SUBS_READY.add(env.DB);
}
function subscriptionCatalog() {
 const out=[];
 for (const t of CFG.mantar.tiers) out.push({
  id:'mantar-'+t.id, app:'mantarpano', appName:'Mantar Pano', tier:t.id,
  name:t.name, price:t.cost, durationSec:CFG.mantar.days*86400,
  durationLabel:CFG.mantar.days+' gün', image:t.id==='pro'?'/assets/subscriptions/mantar-pro.png':'/assets/subscriptions/mantar-unlimited.png',
  description:t.id==='pro'?'Gelişmiş pano araçları ve Pro içerikler':'Sınırsız pano deneyimi'
 });
 for (const p of CFG.zaman.plans) {
  const tier=CFG.zaman.tiers.find(x=>x.id===p.tier);
  out.push({id:'timer-'+p.tier+'-'+p.days,app:'zamanlayici',appName:'Zamanlayıcı',
   tier:p.tier,name:(tier?.name||'Zamanlayıcı')+' · '+p.days+' gün',price:p.cost,
   durationSec:p.days*86400,durationLabel:p.days+' gün',
   image:'/assets/subscriptions/zamanlayici.png',description:'Premium zamanlayıcı özellikleri'});
 }
 for (const p of (CFG.retro?.plans || [])) {
  const tier=CFG.retro.tiers.find(x=>x.id===p.tier);
  if (!tier || !Number.isInteger(p.days) || p.days<1 || !Number.isSafeInteger(p.cost) || p.cost<1) continue;
  out.push({id:'retro-'+p.tier+'-'+p.days,app:'retro',appName:'Retro Camera',tier:p.tier,
   name:(tier.name||'Retro Camera Premium')+' · '+p.days+' gün',price:p.cost,
   durationSec:p.days*86400,durationLabel:p.days+' gün',
   image:'/assets/subscriptions/retro-camera.png',description:'Retro Camera Premium özellikleri'});
 }
 return out;
}
async function subscriptionState(env, uid) {
 await ensureSubscriptions(env);
 const rows=(await env.DB.prepare(`SELECT s.*,COALESCE((SELECT SUM(o.periods) FROM subscription_orders o WHERE o.uid=s.uid AND o.product_id=s.product_id),0) AS purchased_periods
  FROM subscriptions s WHERE s.uid=? ORDER BY s.expires_at DESC`).bind(uid).all()).results||[];
 const now=nowSec();
 return rows.map(r=>({...r,active:r.status==='active'&&r.expires_at>now,
  remainingSec:Math.max(0,r.expires_at-now),autoRenew:!!r.auto_renew}));
}
async function subscriptionApi(req,env,u,path,b) {
 await ensureSubscriptions(env);
 if(path==='/api/subscriptions/catalog') return json({products:subscriptionCatalog()});
 if(path==='/api/subscriptions/state') return json({balance:u.bal,subscriptions:await subscriptionState(env,u.id)});
 if(path==='/api/subscriptions/purchase') {
  await rlBump(env,'subbuy',u.id);
  if((await rlCount(env,'subbuy',u.id))>CFG.buyPer10m) return tooMany();
  const pid=String(b.product_id||''), periods=toInt(b.periods,1,99), idem=String(b.idem||'');
  if(!/^[A-Za-z0-9_-]{12,80}$/.test(idem)||periods===null) return fail('Geçersiz satın alma isteği.');
  const p=subscriptionCatalog().find(x=>x.id===pid);
  if(!p) return fail('Ürün satışta değil.',404);
  const prior=await env.DB.prepare('SELECT * FROM subscription_orders WHERE uid=? AND idem=?').bind(u.id,idem).first();
  if(prior) return json({ok:true,replayed:true,balance:(await state(env,u.id)).s.bal,subscriptions:await subscriptionState(env,u.id)});
  const cost=p.price*periods;
  if(!Number.isSafeInteger(cost)||cost<=0||cost>100000000) return fail('Tutar geçersiz.');
  const id='SUB'+rndStr(18,AB), now=nowSec();
  // changes() koşulu, bakiye yetersizse sipariş ve üyelik kaydı üretmez.
  try {
   await env.DB.batch([
    env.DB.prepare('UPDATE users SET bal=bal-?,spent=spent+? WHERE id=? AND bal>=?').bind(cost,cost,u.id,cost),
    env.DB.prepare(`INSERT INTO subscription_orders(id,uid,product_id,periods,cost,idem,created_at)
      SELECT ?,?,?,?,?,?,? WHERE changes()=1`).bind(id,u.id,p.id,periods,cost,idem,now),
    env.DB.prepare(`INSERT INTO subscriptions(id,uid,product_id,app,tier,name,unit_cost,duration_sec,starts_at,expires_at,auto_renew,status,updated_at)
      SELECT ?,?,?,?,?,?,?,?,?,?,0,'active',? WHERE EXISTS(SELECT 1 FROM subscription_orders WHERE id=?) 
      ON CONFLICT(uid,product_id) DO UPDATE SET
       starts_at=CASE WHEN subscriptions.expires_at>? THEN subscriptions.starts_at ELSE ? END,
       expires_at=MAX(subscriptions.expires_at,?)+excluded.duration_sec*?,
       status='active',unit_cost=excluded.unit_cost,updated_at=excluded.updated_at`)
      .bind(id,u.id,p.id,p.app,p.tier,p.name,p.price,p.durationSec,now,now+p.durationSec*periods,now, id,now,now,now,periods),
    env.DB.prepare('INSERT INTO log(uid,kind,delta,ref,t) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM subscription_orders WHERE id=?)')
      .bind(u.id,'subscription',-cost,id,stamp(),id)
   ]);
  } catch(e) {
   if(String(e.message||e).includes('UNIQUE')) {
    const old=await env.DB.prepare('SELECT id FROM subscription_orders WHERE uid=? AND idem=?').bind(u.id,idem).first();
    if(old) return json({ok:true,replayed:true,balance:(await state(env,u.id)).s.bal,subscriptions:await subscriptionState(env,u.id)});
   }
   throw e;
  }
  const fresh=await state(env,u.id);
  if(!fresh || fresh.s.bal===u.bal) return fail('Yetersiz KRS bakiyesi.',400,fresh);
  return json({ok:true,balance:fresh.s.bal,subscriptions:await subscriptionState(env,u.id),order:{id,product:p.name,periods,cost}},201);
 }
 if(path==='/api/subscriptions/auto-renew') {
  const pid=String(b.product_id||''), enabled=b.enabled===true?1:0;
  const r=await env.DB.prepare("UPDATE subscriptions SET auto_renew=?,status=CASE WHEN ?=1 AND status='payment_failed' THEN 'active' ELSE status END,updated_at=? WHERE uid=? AND product_id=? AND status IN ('active','payment_failed')")
   .bind(enabled,enabled,nowSec(),u.id,pid).run();
  if(!r.meta.changes) return fail('Aktif üyelik bulunamadı.',404);
  return json({ok:true,subscriptions:await subscriptionState(env,u.id)});
 }
 return fail('Bulunamadı.',404);
}
async function processSubscriptionRenewals(env) {
 await ensureSubscriptions(env);
 const now=nowSec();
 const due=(await env.DB.prepare("SELECT * FROM subscriptions WHERE auto_renew=1 AND status='active' AND expires_at<=? ORDER BY expires_at LIMIT 100").bind(now).all()).results||[];
 let renewed=0,failed=0;
 for(const x of due) {
  const ref='REN'+rndStr(16,AB), next=x.expires_at+x.duration_sec;
  const result=await env.DB.batch([
   env.DB.prepare(`UPDATE users SET bal=bal-?,spent=spent+? WHERE id=? AND bal>=?
    AND EXISTS(SELECT 1 FROM subscriptions WHERE id=? AND auto_renew=1 AND status='active' AND expires_at<=?)`).bind(x.unit_cost,x.unit_cost,x.uid,x.unit_cost,x.id,now),
   env.DB.prepare(`UPDATE subscriptions SET expires_at=?,renew_count=renew_count+1,updated_at=?
    WHERE id=? AND auto_renew=1 AND status='active' AND expires_at<=? AND EXISTS(SELECT 1 FROM users WHERE id=? AND bal>=0) AND changes()=1`)
    .bind(next,now,x.id,now,x.uid),
   env.DB.prepare("INSERT INTO log(uid,kind,delta,ref,t) SELECT ?,?,?,?,? WHERE changes()=1")
    .bind(x.uid,'subscription_renew',-x.unit_cost,ref,stamp())
  ]);
  // Wallet UPDATE changes=0 => subscription untouched; turn off renewal to avoid a tight retry loop.
  if(result[0]?.meta?.changes) renewed++;
  else {
   await env.DB.prepare("UPDATE subscriptions SET auto_renew=0,status='payment_failed',updated_at=? WHERE id=? AND auto_renew=1 AND expires_at<=?")
    .bind(now,x.id,now).run();
   failed++;
  }
 }
 return {renewed,failed};
}

/* ===== Yönlendirme ===== */
async function route(req, env) {
  const path = new URL(req.url).pathname.replace(/\/+$/, '');
  const open = openOf(path);   // Mantar Pano / Zamanlayıcı'dan, başka alan adından çağrılır
  if (req.method === 'OPTIONS' && path.startsWith('/identity/')) {
    const ch = idCors(req, env);
    return new Response(null, { status: ch ? 204 : 403, headers: ch || {} });
  }
  if (req.method === 'OPTIONS' && path.startsWith('/api/')) {
    const ch = corsHeaders(req, env, open);
    if (ch) return new Response(null, { status: 204, headers: ch });
  }
  // FOREVYE ID: her yöntem (GET/PATCH/DELETE dahil); kendi CORS ve hata biçimi var
  if (path.startsWith('/identity/')) {
    const photo = path === '/identity/profile/photo' && req.method === 'POST';
    const bb = (req.method === 'GET' || photo) ? {} : await body(req);
    if (bb === null) return json({ code: 'TOO_LARGE', message: 'İstek çok büyük.' }, 413);
    return IDENT.handle(req, env, path, bb);
  }
  // Nexus bankası: sunucudan sunucuya hediye kartı bozdurma (HMAC imzalı; ham gövde imzalanır)
  if (path === '/api/ext/giftcard/health' && req.method === 'GET') return json({ ok: true });
  if (path === '/api/ext/giftcard/redeem' && req.method === 'POST') {
    const raw = await req.text();
    return raw.length > 4000 ? json({ ok: false, error: 'invalid' }, 413) : NEX.extRedeem(req, env, raw);
  }
  // Ortak servisler (Nexus'un yükünü alır): posta (imzalı) ve altın fiyatı (açık, 60 sn önbellekli)
  if (path === '/api/ext/mail' && req.method === 'POST') {
    const raw = await req.text();
    return raw.length > 6000 ? json({ ok: false, error: 'invalid' }, 413) : NEX.extMail(req, env, raw);
  }
  if (path === '/api/ext/gold' && req.method === 'GET') return NEX.extGold(req, env);
  if (req.method !== 'POST') return fail('Sadece POST.', 405);
  const b = await body(req);
  if (b === null) return fail('İstek çok büyük.', 413);
  if (open) return mantarRedeem(req, env, b, path.endsWith('/verify'), open);

  if (path.startsWith('/api/npass/')) return NEX.handle(path, req, env, b);
  if (path.startsWith('/api/timer-reward/')) {
    // Tek kimlik kaynağı FOREVYE ID'dir. Ödül hesabı doğrudan Nexus Banka'nın
    // id_links -> crystal_holdings tablolarına bağlanır; yedek anahtar/np_links kullanılmaz.
    const appSession = await IDENT.appAuth(env, req, 'zamanlayici');
    if (!appSession) return fail('FOREVYE ID oturumu geçersiz veya süresi dolmuş. Yeniden giriş yap.', 401, { code: 'id_session_required' });
    const idUser = await env.DB.prepare('SELECT id,email,verified FROM id_users WHERE id=?').bind(appSession.uid).first();
    if (!idUser || !idUser.verified || !idUser.email) return fail('FOREVYE ID e-posta doğrulaması gerekli.', 403, { code: 'id_email_unverified' });
    const identity = { idUserId: idUser.id, email: idUser.email, emailVerified: true };
    return TIMER_REWARDS.handle(path, req, env, appSession.uid, b, identity);
  }
  if (path === '/api/init') return init(req, env);
  if (path.startsWith('/api/admin/')) {
    const ip = req.headers.get('CF-Connecting-IP') || 'x';
    if ((await rlCount(env, 'adm', ip)) >= CFG.adminFailPer10m) return tooMany();
    if (!(await isAdmin(req, env))) { await rlBump(env, 'adm', ip); return fail('Yönetici anahtarı yanlış.', 403); }
    switch (path) {
      case '/api/admin/gift': return adminGift(env, b);
      case '/api/admin/add': return adminAdd(env, b);
      case '/api/admin/verify': return adminVerify(env, b);
      case '/api/admin/done': return adminDone(env, b);
      case '/api/admin/pass': return adminPass(env, b);
      case '/api/admin/passes': return adminPasses(env);
      case '/api/admin/zpass': return adminZPass(env, b);
      case '/api/admin/zpasses': return adminZPasses(env);
    }
    return fail('Bulunamadı.', 404);
  }
  const u = await auth(req, env);
  if (!u) return fail('Oturum geçersiz.', 401);
  switch (path) {
    case '/api/sync': return sync(req, env, u, b);
    case '/api/buy': return buy(req, env, u, b);
    case '/api/pass/buy': return passBuy(req, env, u, b);
    case '/api/zpass/buy': return zBuy(req, env, u, b);
    case '/api/subscriptions/catalog':
    case '/api/subscriptions/state':
    case '/api/subscriptions/purchase':
    case '/api/subscriptions/auto-renew': return subscriptionApi(req, env, u, path, b);
    case '/api/redeem': return redeem(req, env, u, b);
    case '/api/card/create': return cardCreate(req, env, u, b);
    case '/api/card/list': return cardListEp(req, env, u);
    case '/api/card/cancel': return cardCancel(req, env, u, b);
    case '/api/card/redeem': return cardRedeem(req, env, u, b);
    case '/api/mail-done': return mailDone(req, env, u);
  }
  return fail('Bulunamadı.', 404);
}

/* ===== Modüller (Nexus Pass, Nexus hediye kartı, FOREVYE ID) ===== */
const CTX = { today, appAuth: (...a) => IDENT.appAuth(...a), json, fail, sha256hex, rndStr, rndInt, eq, nowSec, addLog, rlBump, rlCount, tooMany, toInt, auth, AB, CFG, stamp, cardOk, ensureCards };
const NEX = makeNexus(CTX), IDENT = makeIdentity(CTX), TIMER_REWARDS = makeTimerRewards(CTX);
/* FOREVYE ID'ye erişebilen adresler: koda gömülü iki GitHub hesabı (worker/origins.js, HER ZAMAN) + ID_ORIGIN/MARKET_ORIGIN/ZP_ORIGIN (virgülle, ek adresler).
   Panel değişkenleri boş/yanlış olsa bile FOREVYE ID çalışır. Çerez yok, kimlik Authorization başlığında. */
function idCors(req, env) {
  const o = req.headers.get('Origin') || '', ok = withPinned(env.ID_ORIGIN, env.MARKET_ORIGIN, env.ZP_ORIGIN);
  if (!o || !ok.includes(o)) return null;
  return { 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' };
}

// CORS: açık uçlar (Mantar Pano: MP_ORIGIN, Zamanlayıcı: ZP_ORIGIN, ikisi de boşsa *) ve Mağaza sitesi (MARKET_ORIGIN); her yanıta (hatalar dahil) eklenir
const isOpen = req => openOf(new URL(req.url).pathname.replace(/\/+$/, ''));

export default {
  async scheduled(event, env, ctx) { ctx.waitUntil(processSubscriptionRenewals(env)); },
  async fetch(req, env) {
    const ip = new URL(req.url).pathname.startsWith('/identity/'), ch = ip ? idCors(req, env) : corsHeaders(req, env, isOpen(req));
    try {
      const r = await route(req, env);
      return ch ? withCors(r, ch) : r;
    } catch (e) {
      console.error(e && e.stack || e);
      const r = fail('Sunucu hatası.', 500);
      return ch ? withCors(r, ch) : r;
    }
  }
};
