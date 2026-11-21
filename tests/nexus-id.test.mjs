import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';

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
  return { DB: D1, ADMIN_TOKEN: 'x'.repeat(24), NEXUS_SECRET: 'n'.repeat(32), __mail: [], MARKET_ORIGIN: 'https://pass.example', ID_ORIGIN: 'https://id.example', db };
}
async function setup() {
  const mod = await import('../worker/index.js'), env = makeEnv();
  let n = 0;
  const raw = (method, path, body, headers = {}) => mod.default.fetch(new Request('https://t' + path, { method, headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '9.9.9.' + (headers.__ip || 1), ...headers }, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) }), env);
  const call = async (path, body = {}, headers = {}, method = 'POST') => { const r = await raw(method, path, method === 'GET' ? undefined : body, headers); return { s: r.status, j: await r.json().catch(() => null) }; };
  const user = async (bal = 30) => {
    const a = await call('/api/init', {}, { __ip: ++n });
    const h = { Authorization: 'Bearer ' + a.j.id + '.' + a.j.token };
    if (bal > 30) await call('/api/admin/add', { to: a.j.id, n: bal - 30 }, { 'X-MK-Admin': 'x'.repeat(24) });
    return { id: a.j.id, h };
  };
  return { env, call, raw, user };
}

/* ===== Nexus Pass ===== */
test('npass: ürün listesi, yetersiz bakiye, başarılı alım, aynı anahtar tekrar, zaten aktif', { skip }, async () => {
  const { call, user } = await setup(); const u = await user(1000);
  const pl = await call('/api/npass/products'); assert.equal(pl.s, 200); assert.ok(pl.j.products.length >= 4); assert.ok(!pl.j.products.some(p => p.status === 'off'));
  assert.equal((await call('/api/npass/me')).s, 401);
  const poor = await user(30);
  const no = await call('/api/npass/purchase', { pid: 'p2', idem: 'idem-poor-0001' }, poor.h);
  assert.equal(no.j.ok, false); assert.equal(no.j.code, 'insufficient'); assert.equal(no.j.missing, 870);
  assert.equal((await call('/api/npass/me', {}, poor.h)).j.balance, 30, 'bakiye değişmedi');
  const ok = await call('/api/npass/purchase', { pid: 'p2', idem: 'idem-good-0001', price: 1 }, u.h);   // istemci fiyatı yok sayılır
  assert.equal(ok.j.ok, true); assert.equal(ok.j.purchase.price, 900); assert.equal(ok.j.entitlement.status, 'active');
  const me = await call('/api/npass/me', {}, u.h); assert.equal(me.j.balance, 100); assert.equal(me.j.entitlements.length, 1); assert.equal(me.j.entitlements[0].product.id, 'p2');
  const rep = await call('/api/npass/purchase', { pid: 'p2', idem: 'idem-good-0001' }, u.h);
  assert.equal(rep.j.repeat, true); assert.equal((await call('/api/npass/me', {}, u.h)).j.balance, 100, 'çift tahsilat yok');
  const act = await call('/api/npass/purchase', { pid: 'p2', idem: 'idem-good-0002' }, u.h); assert.equal(act.j.code, 'already_active');
  assert.equal((await call('/api/npass/purchase', { pid: 'p5', idem: 'idem-good-0003' }, u.h)).j.code, 'unavailable');
  const h = await call('/api/npass/purchases', { page: 0 }, u.h); assert.equal(h.j.items[0].status, 'failed'); assert.ok(h.j.items.some(x => x.status === 'success'));
});

/* ===== Nexus bankası: hediye kartı ===== */
const sign = (secret, ts, raw) => createHmac('sha256', secret).update(ts + '.' + raw).digest('hex');
test('ext hediye kartı: imza zorunlu; kart bozdurulur; aynı kullanıcı tekrarı aynı sonucu verir; başkası kullanamaz', { skip }, async () => {
  const { env, call, raw, user } = await setup(); const a = await user(500);
  const c = (await call('/api/card/create', { n: 200, tpl: 1 }, a.h)).j.card;
  const code = c.no + ' ' + c.cvv + ' ' + c.ex;
  const ext = async (obj, o = {}) => { const body = JSON.stringify(obj), ts = String(o.ts || Date.now()); const r = await raw('POST', '/api/ext/giftcard/redeem', body, { 'x-nx-timestamp': ts, 'x-nx-signature': o.sig || sign(env.NEXUS_SECRET, ts, body) }); return { s: r.status, j: await r.json() }; };
  assert.equal((await raw('GET', '/api/ext/giftcard/health')).status, 200);
  assert.equal((await ext({ user_id: 'nx_user_1', code }, { sig: 'a'.repeat(64) })).s, 401, 'yanlış imza');
  assert.equal((await ext({ user_id: 'nx_user_1', code }, { ts: Date.now() - 3600e3 })).s, 401, 'eski zaman damgası');
  assert.equal((await ext({ user_id: 'nx_user_1', code: c.no + ' 000 ' + c.ex })).j.error, 'invalid');
  const r1 = await ext({ user_id: 'nx_user_1', code }); assert.equal(r1.s, 200); assert.equal(r1.j.amount, 200); assert.equal(r1.j.reference, 'mkgc:' + c.no);
  const r2 = await ext({ user_id: 'nx_user_1', code }); assert.equal(r2.s, 200); assert.equal(r2.j.reference, r1.j.reference);
  const r3 = await ext({ user_id: 'nx_user_2', code }); assert.equal(r3.s, 400); assert.equal(r3.j.error, 'used');
  const b = await user(30); assert.equal((await call('/api/card/redeem', { no: c.no, cvv: c.cvv, ex: c.ex }, b.h)).s, 400, 'Mikro-Klima tarafında da kullanılmış');
});
test('ext hediye kartı: NEXUS_SECRET yoksa kapalıdır', { skip }, async () => {
  const { env, raw } = await setup(); delete env.NEXUS_SECRET;
  assert.equal((await raw('POST', '/api/ext/giftcard/redeem', '{}', { 'x-nx-timestamp': String(Date.now()), 'x-nx-signature': 'a' })).status, 503);
});

/* ===== FOREVYE ID ===== */
function b32dec(s) { const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = ''; for (const ch of s) bits += A.indexOf(ch).toString(2).padStart(5, '0'); const o = []; for (let i = 0; i + 8 <= bits.length; i += 8) o.push(parseInt(bits.slice(i, i + 8), 2)); return Buffer.from(o); }
const totp = secret => { const m = Buffer.alloc(8); m.writeUInt32BE(Math.floor(Date.now() / 30000), 4); const h = createHmac('sha1', b32dec(secret)).update(m).digest(), o = h[19] & 15; return String(((h.readUInt32BE(o) & 0x7fffffff) % 1000000)).padStart(6, '0'); };
const lastCode = env => /(\d{6})/.exec(env.__mail[env.__mail.length - 1].text)[1];

test('id: kayıt → e-posta kodu → giriş → profil, kullanıcı adı kuralları', { skip }, async () => {
  const { env, call } = await setup();
  assert.equal((await call('/identity/register', { email: 'a@b.co', password: 'kısa' })).j.code, 'VALIDATION');
  const r = await call('/identity/register', { email: 'A@B.co', password: 'Parola12345' }); assert.equal(r.s, 200); assert.equal(r.j.verificationRequired, true);
  assert.equal((await call('/identity/register', { email: 'a@b.co', password: 'Parola12345' })).j.code, 'EMAIL_TAKEN');
  assert.equal((await call('/identity/login', { email: 'a@b.co', password: 'Parola12345' })).j.code, 'EMAIL_NOT_VERIFIED');
  assert.equal((await call('/identity/email/verify', { email: 'a@b.co', code: '000000' })).j.code, 'CODE_INVALID');
  assert.equal((await call('/identity/email/verify', { email: 'a@b.co', code: lastCode(env) })).s, 200);
  assert.equal((await call('/identity/login', { email: 'a@b.co', password: 'yanlis12345' })).j.code, 'BAD_CREDENTIALS');
  const l = await call('/identity/login', { email: 'a@b.co', password: 'Parola12345' }); assert.ok(l.j.accessToken && l.j.refreshToken);
  const H = { Authorization: 'Bearer ' + l.j.accessToken };
  const p = await call('/identity/profile', undefined, H, 'GET'); assert.equal(p.s, 200); assert.equal(p.j.email, 'a@b.co'); assert.equal(p.j.username, null);
  assert.equal((await call('/identity/profile', undefined, {}, 'GET')).s, 401);
  assert.equal((await call('/identity/username', { username: 'kucuk' }, H, 'PATCH')).j.code, 'VALIDATION');
  const u1 = await call('/identity/username', { username: '#ABCD1234' }, H, 'PATCH'); assert.equal(u1.j.username, '#ABCD1234'); assert.equal(u1.j.usernameChangesLeftInWindow, 2);
  assert.equal((await call('/identity/username', { username: '#ABCD1235' }, H, 'PATCH')).s, 200);
  assert.equal((await call('/identity/username', { username: '#ABCD1236' }, H, 'PATCH')).s, 200);
  const u4 = await call('/identity/username', { username: '#ABCD1237' }, H, 'PATCH'); assert.equal(u4.s, 429); assert.equal(u4.j.code, 'COOLDOWN');
  const apps = await call('/identity/apps', undefined, H, 'GET'); assert.ok(apps.j.some(a => a.id === 'nexus-pass' && a.connected));
  assert.equal((await call('/identity/apps/nexus-pass', { displayName: 'Ali' }, H, 'PATCH')).s, 200);
  assert.equal((await call('/identity/apps/nexus-pass', {}, H, 'DELETE')).s, 200);
  assert.equal((await call('/identity/apps', undefined, H, 'GET')).j.find(a => a.id === 'nexus-pass').connected, false);
  assert.ok((await call('/identity/security-events', undefined, H, 'GET')).j.length >= 3);
});
test('id: yenileme jetonu, oturumlar, çıkış, parola sıfırlama tüm oturumları kapatır', { skip }, async () => {
  const { env, call } = await setup();
  await call('/identity/register', { email: 'c@d.co', password: 'Parola12345' }); await call('/identity/email/verify', { email: 'c@d.co', code: lastCode(env) });
  const l = await call('/identity/login', { email: 'c@d.co', password: 'Parola12345' }), H = { Authorization: 'Bearer ' + l.j.accessToken };
  const rf = await call('/identity/token/refresh', { refreshToken: l.j.refreshToken }); assert.ok(rf.j.accessToken && rf.j.accessToken !== l.j.accessToken);
  assert.equal((await call('/identity/profile', undefined, H, 'GET')).s, 401, 'eski erişim jetonu geçersiz');
  assert.equal((await call('/identity/token/refresh', { refreshToken: l.j.refreshToken })).s, 401, 'eski yenileme jetonu geçersiz');
  const H2 = { Authorization: 'Bearer ' + rf.j.accessToken };
  const ss = await call('/identity/sessions', undefined, H2, 'GET'); assert.equal(ss.j.length, 1); assert.equal(ss.j[0].current, true);
  await call('/identity/password/forgot', { email: 'c@d.co' });
  assert.equal((await call('/identity/password/reset', { email: 'c@d.co', code: lastCode(env), password: 'YeniParola99' })).s, 200);
  assert.equal((await call('/identity/profile', undefined, H2, 'GET')).s, 401, 'sıfırlama oturumları kapattı');
  assert.equal((await call('/identity/login', { email: 'c@d.co', password: 'YeniParola99' })).s, 200);
  assert.equal((await call('/identity/password/forgot', { email: 'yok@yok.co' })).s, 200, 'hesap var/yok sızmaz');
});
test('id: TOTP 2FA kurulum ve iki adımlı giriş; fotoğraf yükleme/24 saat kuralı; hesap silme', { skip }, async () => {
  const { env, call, raw } = await setup();
  await call('/identity/register', { email: 'e@f.co', password: 'Parola12345' }); await call('/identity/email/verify', { email: 'e@f.co', code: lastCode(env) });
  const l = await call('/identity/login', { email: 'e@f.co', password: 'Parola12345' }), H = { Authorization: 'Bearer ' + l.j.accessToken };
  assert.equal((await call('/identity/2fa/enable', { method: 'totp', password: 'yanlis' }, H)).s, 401);
  const st = await call('/identity/2fa/enable', { method: 'totp', password: 'Parola12345' }, H); assert.match(st.j.uri, /^otpauth:\/\/totp\//);
  assert.equal((await call('/identity/2fa/enable', { code: '123456' }, H)).j.code, 'CODE_INVALID');
  assert.equal((await call('/identity/2fa/enable', { code: totp(st.j.secret) }, H)).j.twoFactor.method, 'totp');
  const c1 = await call('/identity/login', { email: 'e@f.co', password: 'Parola12345' }); assert.equal(c1.j.twoFactorRequired, true); assert.ok(!c1.j.accessToken);
  assert.equal((await call('/identity/login', { email: 'e@f.co', challengeId: c1.j.challengeId, code: '000000' })).j.code, 'CODE_INVALID');
  const c2 = await call('/identity/login', { email: 'e@f.co', challengeId: c1.j.challengeId, code: totp(st.j.secret) }); assert.ok(c2.j.accessToken);
  // fotoğraf: 1x1 PNG
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const up = async (bytes, name) => { const fd = new FormData(); fd.append('photo', new Blob([bytes]), name); return env_fetch('POST', '/identity/profile/photo', fd, H); };
  const mod = await import('../worker/index.js');
  const env_fetch = async (m, p, body, h) => { const r = await mod.default.fetch(new Request('https://t' + p, { method: m, headers: { 'CF-Connecting-IP': '1.1.1.1', ...h }, body }), env); return { s: r.status, r }; };
  assert.equal((await up(Buffer.from('GIF89a-not-allowed'), 'x.gif')).s, 400, 'imza kontrolü');
  const ok = await up(png, 'profil.webp'); assert.equal(ok.s, 200); const pj = await ok.r.json(); assert.match(pj.photo, /\/identity\/photo\/usr_/);
  assert.equal((await up(png, 'profil.png')).s, 429, '24 saat kuralı');
  const img = await raw('GET', pj.photo.replace('https://t', '')); assert.equal(img.status, 200); assert.equal(img.headers.get('content-type'), 'image/png');
  assert.equal((await call('/identity/account', { password: 'yanlis' }, H, 'DELETE')).s, 401);
  assert.equal((await call('/identity/account', { password: 'Parola12345' }, H, 'DELETE')).s, 200);
  assert.equal((await call('/identity/login', { email: 'e@f.co', password: 'Parola12345' })).j.code, 'BAD_CREDENTIALS');
});
test('id: CORS yalnızca ID_ORIGIN/MARKET_ORIGIN adreslerine; e-posta servisi yoksa kayıt kapalı', { skip }, async () => {
  const { env, raw } = await setup();
  const ok = await raw('OPTIONS', '/identity/login', undefined, { Origin: 'https://id.example' }); assert.equal(ok.status, 204); assert.equal(ok.headers.get('access-control-allow-origin'), 'https://id.example');
  assert.equal((await raw('OPTIONS', '/identity/login', undefined, { Origin: 'https://kotu.example' })).status, 403);
  delete env.__mail;
  const r = await raw('POST', '/identity/register', { email: 'z@z.co', password: 'Parola12345' }); assert.equal(r.status, 503); assert.equal((await r.json()).code, 'MAIL_UNAVAILABLE');
});
