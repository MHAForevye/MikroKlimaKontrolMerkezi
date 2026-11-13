import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

let DatabaseSync = null;
try { ({ DatabaseSync } = await import('node:sqlite')); } catch (e) {}
const skip = DatabaseSync ? false : 'node:sqlite yok (Node 22.5+ gerekir)';

function makeEnv() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync('schema.sql', 'utf8'));
  const D1 = {
    prepare(sql) {
      let args = [];
      const st = {
        bind(...a) { args = a; return st; },
        async first() { return db.prepare(sql).get(...args) ?? null; },
        async all() { return { results: db.prepare(sql).all(...args) }; },
        async run() { const r = db.prepare(sql).run(...args); return { meta: { changes: Number(r.changes) } }; }
      };
      return st;
    },
    async batch(sts) { const out = []; for (const s of sts) out.push(await s.run()); return out; }
  };
  return { DB: D1, ADMIN_TOKEN: 'x'.repeat(24), db };
}

async function setup() {
  const mod = await import('../worker/index.js');
  const env = makeEnv();
  const call = async (path, body = {}, headers = {}, ip = '1.2.3.4') => {
    const r = await mod.default.fetch(new Request('https://t' + path, { method: 'POST', headers: { 'content-type': 'application/json', 'CF-Connecting-IP': ip, ...headers }, body: JSON.stringify(body) }), env);
    return { s: r.status, j: await r.json() };
  };
  return { env, call };
}
const bearer = a => ({ Authorization: 'Bearer ' + a.j.id + '.' + a.j.token });

test('init: yeni hesap açar, ilk gün ödülü verir; aynı gün ikinci sync ödül vermez', { skip }, async () => {
  const { call } = await setup();
  const a = await call('/api/init');
  assert.equal(a.s, 200); assert.equal(a.j.s.bal, 30);
  const sy = await call('/api/sync', {}, bearer(a));
  assert.equal(sy.j.s.bal, 30); assert.equal(sy.j.rewarded, 0);
});

test('buy: yetersiz bakiyede reddeder ve bakiyeyi değiştirmez', { skip }, async () => {
  const { call } = await setup();
  const a = await call('/api/init');
  const by = await call('/api/buy', { pack: 0, cam: 'cam123' }, bearer(a));
  assert.equal(by.s, 400); assert.equal(by.j.s.bal, 30);
});

test('hız sınırı: kod denemesi 20, satın alma 10 (hesap başına, 10 dakikada)', { skip }, async () => {
  const { call } = await setup();
  const a = await call('/api/init');
  let r; for (let i = 0; i < 21; i++) r = await call('/api/redeem', { code: 'ABCD-EFGH-JKLMN' }, bearer(a));
  assert.equal(r.s, 429);
  let b; for (let i = 0; i < 11; i++) b = await call('/api/buy', { pack: 0, cam: 'cam123' }, bearer(a));
  assert.equal(b.s, 429);
});

test('admin: 30 yanlış denemeden sonra o IP kilitlenir, başka IP etkilenmez', { skip }, async () => {
  const { call } = await setup();
  const a = await call('/api/init');
  const wrong = { 'X-MK-Admin': 'yanlis-anahtar-yanlis-anahtar' }, right = { 'X-MK-Admin': 'x'.repeat(24) };
  let last; for (let i = 0; i < 30; i++) last = await call('/api/admin/add', { to: a.j.id, n: 5 }, wrong);
  assert.equal(last.s, 403);
  assert.equal((await call('/api/admin/add', { to: a.j.id, n: 5 }, right)).s, 429, 'kilitliyken doğru anahtar da geçmez');
  const other = await call('/api/admin/add', { to: a.j.id, n: 5 }, right, '9.9.9.9');
  assert.equal(other.s, 200); assert.equal(other.j.bal, 35);
});

test('yeni hesap sınırı: IP başına günde 20, 21. reddedilir', { skip }, async () => {
  const { call } = await setup();
  let r; for (let i = 0; i < 21; i++) r = await call('/api/init');
  assert.equal(r.s, 429);
});

test('eski hız sınırı sayaçları temizlenir', { skip }, async () => {
  const { env, call } = await setup();
  env.db.prepare("INSERT INTO ipc(h,d,c) VALUES('old','2026-01-01T00:0',3)").run();
  for (let i = 0; i < 500; i++) await call('/api/admin/add', { to: '1', n: 1 }, { 'X-MK-Admin': 'y'.repeat(24) }, '5.5.5.' + (i % 250));
  assert.equal(env.db.prepare("SELECT 1 FROM ipc WHERE h='old'").get(), undefined);
});

/* ===== Giriş serisi ve 7 günde bir 60 kristal ===== */
const realNow = Date.now;
const at = d => { Date.now = () => Date.parse(d + 'T09:00:00Z'); };   // 09:00 UTC = 12:00 Türkiye
const days = (a, n) => new Date(Date.parse(a + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);

test('seri: her gün açan 7. günde +60 alır; sonraki ödül 14. günde', { skip }, async () => {
  try {
    const { call } = await setup(); at('2026-03-01');
    const a = await call('/api/init'); let r = a;
    const bals = [];
    for (let i = 1; i < 14; i++) { at(days('2026-03-01', i)); r = await call('/api/sync', {}, bearer(a)); bals.push(r.j.s.bal); }
    // gün 1: 30 ... gün 7: 7*30 + 60
    assert.equal(bals[5], 30 * 7 + 60, '7. gün');
    assert.equal(bals[5] - bals[4], 90, '7. gün: günlük 30 + seri 60');
    assert.equal(bals[12] - bals[11], 90, '14. gün');
    assert.equal(r.j.s.streak.n, 14);
    assert.equal(r.j.cfg.streak.bonus, 60);
  } finally { Date.now = realNow; }
});

test('seri: aynı gün ikinci sync ödül vermez; tek gün kaçırınca kalkan yoksa seri 1 olur ve ödül tekrar verilmez', { skip }, async () => {
  try {
    const { call } = await setup(); at('2026-03-01');
    const a = await call('/api/init');
    for (let i = 1; i < 6; i++) { at(days('2026-03-01', i)); await call('/api/sync', {}, bearer(a)); }   // 6. gün
    const s6 = await call('/api/sync', {}, bearer(a)); assert.equal(s6.j.rewarded, 0); assert.equal(s6.j.s.streak.n, 6);
    at(days('2026-03-01', 7));                                                                          // 1 gün atladı (kalkan yok)
    const r = await call('/api/sync', {}, bearer(a)); assert.equal(r.j.s.streak.n, 1); assert.equal(r.j.streakBonus, 0);
    assert.equal(r.j.s.streak.best, 6);
  } finally { Date.now = realNow; }
});

test('seri: 7. günde kazanılan kalkan tek günlük boşluğu korur, ödül yinelenmez', { skip }, async () => {
  try {
    const { call } = await setup(); at('2026-03-01');
    const a = await call('/api/init');
    for (let i = 1; i < 7; i++) { at(days('2026-03-01', i)); await call('/api/sync', {}, bearer(a)); }   // 7. gün: kalkan kazanıldı
    at(days('2026-03-01', 8));                                                                           // 1 gün atladı
    const r = await call('/api/sync', {}, bearer(a));
    assert.equal(r.j.s.streak.n, 8); assert.equal(r.j.s.streak.shield, 0); assert.equal(r.j.streakBonus, 0);
  } finally { Date.now = realNow; }
});

test('seri: yerel seri bir kez devralınır ama giriş günü sayısını aşamaz (yeni hesap hile yapamaz)', { skip }, async () => {
  try {
    const { call } = await setup(); at('2026-03-01');
    const a = await call('/api/init');
    at('2026-03-02');
    const r = await call('/api/sync', { hint: { n: 6, best: 6, last: '2026-03-02' } }, bearer(a));
    assert.ok(r.j.s.streak.n <= 2, 'devralınan seri ' + r.j.s.streak.n);
    assert.equal(r.j.streakBonus, 0);
  } finally { Date.now = realNow; }
});

test('seri: sunucu kuralları core.js seriNext ile aynı sonucu verir (rastgele giriş dizisi)', async () => {
  const { streakNext } = await import('../worker/index.js');
  const core = (await import('../js/core.js')).default;
  let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  let day = '2026-01-01', a = null, b = null;
  for (let i = 0; i < 400; i++) {
    day = days(day, rnd() < .7 ? 1 : rnd() < .6 ? 2 : 4);
    const x = core.seriNext(a, day); a = x.st;
    const y = streakNext(b, day, 7); b = y.st;
    assert.equal(b.n, a.n, 'gün ' + day); assert.equal(b.shield, a.shield, 'kalkan ' + day);
  }
});

/* ===== Mantar Pano geçişleri (Pro 120 / Sınırsız 250, 7 gün) ===== */
const ADM = { 'X-MK-Admin': 'x'.repeat(24) };
async function mpSetup() {
  const s = await setup(), mod = await import('../worker/index.js');
  const a = await s.call('/api/init');
  await s.call('/api/admin/add', { to: a.j.id, n: 1000 }, ADM);
  const redeem = (code, device = 'dev-aaaa1', extra = {}, path = '/api/mantarpano/redeem', ip = '5.5.5.5') =>
    s.call(path, { code, app: 'mantarpano', device, v: 1, ...extra }, {}, ip);
  return { ...s, mod, a, redeem };
}

test('pass/buy: yetersiz bakiyede reddeder, yeterliyse kristali düşer ve 13 harflik kod verir', { skip }, async () => {
  const { call, a } = await mpSetup();
  const b = await call('/api/init'); // 30 kristalli başka hesap
  const no = await call('/api/pass/buy', { tier: 'pro' }, bearer(b));
  assert.equal(no.s, 400); assert.equal(no.j.s.bal, 30); assert.equal(no.j.s.passes.length, 0);
  assert.equal((await call('/api/pass/buy', { tier: 'altin' }, bearer(a))).s, 400);
  const ok = await call('/api/pass/buy', { tier: 'pro' }, bearer(a));
  assert.equal(ok.s, 200); assert.equal(ok.j.s.bal, 1030 - 120); assert.match(ok.j.pass.c, /^[A-Z2-9]{13}$/);
  assert.equal(ok.j.pass.tier, 'pro'); assert.equal(ok.j.s.passes.length, 1); assert.equal(ok.j.s.passes[0].used, null);
  const u = await call('/api/pass/buy', { tier: 'unl' }, bearer(a));
  assert.equal(u.j.s.bal, 910 - 250);
  assert.deepEqual(u.j.cfg.mantar.tiers.map(t => t.cost), [120, 250]);
});

test('mantarpano/redeem: ilk kullanımda 7 gün başlar, aynı cihaz aynı bitişi alır, tire ve küçük harf kabul', { skip }, async () => {
  const { call, a, redeem } = await mpSetup();
  const code = (await call('/api/pass/buy', { tier: 'pro' }, bearer(a))).j.pass.c;
  const t0 = Date.now(), r1 = await redeem(code.slice(0, 4).toLowerCase() + '-' + code.slice(4, 8) + '-' + code.slice(8));
  assert.equal(r1.s, 200); assert.equal(r1.j.ok, true); assert.equal(r1.j.app, 'mantarpano'); assert.equal(r1.j.plan, 'pro');
  assert.ok(Math.abs(r1.j.expiresAt - (t0 + 7 * 864e5)) < 5000);
  const r2 = await redeem(code);
  assert.equal(r2.j.expiresAt, r1.j.expiresAt, 'aynı cihaz: aynı bitiş (idempotent)');
  const st = await call('/api/sync', {}, bearer(a));
  assert.ok(st.j.s.passes[0].used > 0 && st.j.s.passes[0].exp * 1000 === r1.j.expiresAt);
});

test('mantarpano/redeem: ikinci cihaz bağlanır, üçüncü reddedilir; Sınırsız plan "unlimited" döner', { skip }, async () => {
  const { call, a, redeem } = await mpSetup();
  const code = (await call('/api/pass/buy', { tier: 'unl' }, bearer(a))).j.pass.c;
  const r1 = await redeem(code, 'dev-aaaa1'); assert.equal(r1.j.plan, 'unlimited');
  const r2 = await redeem(code, 'dev-bbbb2'); assert.equal(r2.s, 200); assert.equal(r2.j.expiresAt, r1.j.expiresAt);
  const r3 = await redeem(code, 'dev-cccc3'); assert.equal(r3.s, 409); assert.equal(r3.j.error, 'used'); assert.equal(r3.j.ok, false);
  assert.equal((await redeem(code, 'dev-aaaa1')).s, 200, 'bağlı cihaz yine girebilir');
});

test('mantarpano/redeem: hatalar (yanlış uygulama, bozuk/bilinmeyen kod, cihaz yok, süresi dolmuş)', { skip }, async () => {
  const { call, a, env, redeem } = await mpSetup();
  const code = (await call('/api/pass/buy', { tier: 'pro' }, bearer(a))).j.pass.c;
  assert.equal((await redeem(code, 'dev-aaaa1', { app: 'astrocam' })).j.error, 'wrong_app');
  assert.equal((await redeem('KISA')).j.error, 'invalid_code');
  const unknown = await redeem('ABCDEFGHJKLMN'); assert.equal(unknown.s, 404); assert.equal(unknown.j.error, 'invalid_code');
  assert.equal((await redeem(code, '')).s, 400);
  // hediye kristal kodu Mantar Pano'da geçmez
  const g = await call('/api/admin/gift', { to: a.j.id, n: 5 }, ADM);
  assert.equal((await redeem(g.j.code)).j.error, 'invalid_code');
  assert.equal((await redeem(code)).s, 200);
  env.db.prepare('UPDATE passes SET exp=? WHERE code=?').run(Math.floor(Date.now() / 1000) - 10, code);
  const ex = await redeem(code); assert.equal(ex.s, 410); assert.equal(ex.j.error, 'expired');
});

test('mantarpano/verify: etkinleştirmez ve cihaz bağlamaz; bağlı cihaz için geçerliyse ok, değilse hata', { skip }, async () => {
  const { call, a, redeem } = await mpSetup();
  const code = (await call('/api/pass/buy', { tier: 'pro' }, bearer(a))).j.pass.c, V = '/api/mantarpano/verify';
  assert.equal((await redeem(code, 'dev-aaaa1', {}, V)).j.error, 'invalid_code', 'henüz etkinleştirilmemiş kod verify ile başlamaz');
  const r = await redeem(code, 'dev-aaaa1');
  const v = await redeem(code, 'dev-aaaa1', {}, V); assert.equal(v.s, 200); assert.equal(v.j.expiresAt, r.j.expiresAt);
  const other = await redeem(code, 'dev-zzzz9', {}, V); assert.equal(other.s, 409); assert.equal(other.j.error, 'used');
  assert.equal((await call('/api/pass/buy', { tier: 'pro' }, bearer(a))).j.s.passes.length, 2);
});

test('CORS: OPTIONS 204, yanıtlarda Access-Control-Allow-Origin; MP_ORIGIN ayarlıysa sadece o adres', { skip }, async () => {
  const { mod, env } = await mpSetup();
  const pre = await mod.default.fetch(new Request('https://t/api/mantarpano/redeem', { method: 'OPTIONS', headers: { Origin: 'https://x.github.io' } }), env);
  assert.equal(pre.status, 204); assert.equal(pre.headers.get('Access-Control-Allow-Origin'), '*');
  assert.match(pre.headers.get('Access-Control-Allow-Headers'), /Content-Type/);
  env.MP_ORIGIN = 'https://x.github.io';
  const r = await mod.default.fetch(new Request('https://t/api/mantarpano/redeem', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }), env);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), 'https://x.github.io');
  const other = await mod.default.fetch(new Request('https://t/api/sync', { method: 'OPTIONS' }), env);
  assert.equal(other.status, 405, 'hesaplı uçlarda CORS açılmaz');
});

test('imzalı jeton: MP_SIGN_KEY varsa yanıta ECDSA token eklenir; istemci (premium.js) ile aynı yöntemle doğrulanır', { skip }, async () => {
  const { call, a, env, redeem } = await mpSetup();
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  env.MP_SIGN_KEY = JSON.stringify(await crypto.subtle.exportKey('jwk', kp.privateKey));
  const code = (await call('/api/pass/buy', { tier: 'unl' }, bearer(a))).j.pass.c;
  const r = await redeem(code, 'dev-aaaa1'); assert.ok(r.j.token);
  const [p, s] = r.j.token.split('.'), b64 = x => Uint8Array.from(atob(x.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(x.length / 4) * 4, '=')), c => c.charCodeAt(0));
  assert.ok(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, kp.publicKey, b64(s), new TextEncoder().encode(p)));
  assert.deepEqual(JSON.parse(new TextDecoder().decode(b64(p))), { app: 'mantarpano', plan: 'unlimited', exp: r.j.expiresAt, dev: 'dev-aaaa1' });
  const noKey = await mpSetup(); const c2 = (await noKey.call('/api/pass/buy', { tier: 'pro' }, bearer(noKey.a))).j.pass.c;
  assert.equal((await noKey.redeem(c2)).j.token, undefined, 'anahtar yoksa token eklenmez');
});

test('hız sınırı: kod bozdurma IP başına 40 (429 rate_limited), yenileme kontrolü 300 sonra 503 (premium kapanmaz)', { skip }, async () => {
  const { redeem } = await mpSetup();
  let r; for (let i = 0; i < 41; i++) r = await redeem('ABCDEFGHJKLMN');
  assert.equal(r.s, 429); assert.equal(r.j.error, 'rate_limited');
  const ok = await redeem('ABCDEFGHJKLMN', 'dev-aaaa1', {}, '/api/mantarpano/redeem', '8.8.8.8'); assert.equal(ok.s, 404, 'başka IP etkilenmez');
  let v; for (let i = 0; i < 301; i++) v = await redeem('ABCDEFGHJKLMN', 'dev-aaaa1', {}, '/api/mantarpano/verify', '7.7.7.7');
  assert.equal(v.s, 503);
});

test('admin/pass: yönetici ücretsiz kod üretir (gün ayarlı), kod bozdurulur; anahtarsız reddedilir', { skip }, async () => {
  const { call, redeem } = await mpSetup();
  assert.equal((await call('/api/admin/pass', { tier: 'pro' }, { 'X-MK-Admin': 'yanlis-anahtar-yanlis-anahtar' })).s, 403);
  assert.equal((await call('/api/admin/pass', { tier: 'altin' }, ADM)).s, 400);
  const g = await call('/api/admin/pass', { tier: 'unl', days: 30 }, ADM);
  assert.equal(g.s, 200); assert.match(g.j.code, /^[A-Z2-9]{13}$/);
  const t0 = Date.now(), r = await redeem(g.j.code);
  assert.equal(r.j.plan, 'unlimited'); assert.ok(Math.abs(r.j.expiresAt - (t0 + 30 * 864e5)) < 5000);
});
