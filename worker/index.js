/* Kristal sunucusu (Cloudflare Worker + D1).
   Bakiye, günlük ödül, satın alma, hediye kodu: hepsi burada hesaplanır; tarayıcı sadece ister ve gösterir.
   Fiyatları ya da günlük ödülü değiştirmek için sadece CFG bloğunu düzenle. */

const CFG = {
  daily: 30,
  streakEvery: 7,         // seri her bu kadar günde bir ödül verir
  streakBonus: 60,        // seri ödülü (kristal)
  packs: [
    { name: '3 Günlük Paket',            short: '3 günlük', cost: 500 },
    { name: '7 Günlük Paket (Haftalık)', short: '7 günlük', cost: 1000 }
  ],
  maxNewPerIp: 20,        // aynı IP'den günde en fazla kaç yeni hesap (operatörler tek IP'yi yüzlerce kişiyle paylaşır, o yüzden cömert)
  adminFailPer10m: 30,    // aynı IP'den 10 dakikada en fazla kaç yanlış yönetici anahtarı denemesi
  redeemPer10m: 20,       // bir hesabın 10 dakikada en fazla kaç kod denemesi
  buyPer10m: 10           // bir hesabın 10 dakikada en fazla kaç satın alma isteği
};

const AB = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // 0/O ve 1/I karışmasın
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
  return Object.assign({
    ok: 1, s: Object.assign({}, u, { reqs: reqs.reverse(), codes, streak: sk || { n: 0, best: 0, shield: 0, paid: 0, last: '' } }),
    cfg: { daily: CFG.daily, packs: CFG.packs, streak: { every: CFG.streakEvery, bonus: CFG.streakBonus } }, today: today()
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

/* ===== Yönlendirme ===== */
async function route(req, env) {
  const path = new URL(req.url).pathname.replace(/\/+$/, '');
  if (req.method !== 'POST') return fail('Sadece POST.', 405);
  const b = await body(req);
  if (b === null) return fail('İstek çok büyük.', 413);

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
    }
    return fail('Bulunamadı.', 404);
  }
  const u = await auth(req, env);
  if (!u) return fail('Oturum geçersiz.', 401);
  switch (path) {
    case '/api/sync': return sync(req, env, u, b);
    case '/api/buy': return buy(req, env, u, b);
    case '/api/redeem': return redeem(req, env, u, b);
    case '/api/mail-done': return mailDone(req, env, u);
  }
  return fail('Bulunamadı.', 404);
}

export default {
  async fetch(req, env) {
    try { return await route(req, env); }
    catch (e) { console.error(e && e.stack || e); return fail('Sunucu hatası.', 500); }
  }
};
