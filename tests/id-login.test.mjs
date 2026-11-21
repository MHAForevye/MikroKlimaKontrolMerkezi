import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac, createHash, generateKeyPairSync, sign, randomBytes } from 'node:crypto';

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
  return { DB: D1, ADMIN_TOKEN: 'x'.repeat(24), NEXUS_SECRET: 'n'.repeat(32), __mail: [], MARKET_ORIGIN: 'https://pass.example', ID_ORIGIN: 'https://id.example', GOOGLE_CLIENT_ID: 'cid.apps.googleusercontent.com', ID_REDIRECTS: 'sanal-banka=https://nx.example/api/auth/id/callback,nexus-pass=https://pass.example/nexus-pass/', db };
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


const b64u = b => Buffer.from(b).toString('base64url');
const lastCode = env => /(\d{6})/.exec(env.__mail[env.__mail.length - 1].text)[1];
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const KID = 'k1', jwk = { ...publicKey.export({ format: 'jwk' }), kid: KID, alg: 'RS256', use: 'sig' };
function gToken(over = {}, key = privateKey) {
  const h = b64u(JSON.stringify({ alg: 'RS256', kid: KID, typ: 'JWT' }));
  const p = b64u(JSON.stringify({ iss: 'https://accounts.google.com', aud: 'cid.apps.googleusercontent.com', sub: 'g-111', email: 'gu@gmail.com', email_verified: true, exp: Math.floor(Date.now() / 1000) + 600, ...over }));
  return h + '.' + p + '.' + b64u(sign('RSA-SHA256', Buffer.from(h + '.' + p), key));
}
const realFetch = globalThis.fetch;
const stubGoogle = () => { globalThis.fetch = async u => String(u).includes('googleapis.com/oauth2/v3/certs') ? new Response(JSON.stringify({ keys: [jwk] })) : realFetch(u); };
async function mkUser(env, call, email = 'p@q.co') {
  await call('/identity/register', { email, password: 'Parola12345' }); await call('/identity/email/verify', { email, code: lastCode(env) });
  const l = await call('/identity/login', { email, password: 'Parola12345' }); return { H: { Authorization: 'Bearer ' + l.j.accessToken }, l };
}

test('google: yeni hesap açar, ikinci girişte aynı hesabı verir; sahte/yanlış hedefli/süresi geçmiş jeton reddedilir', { skip }, async () => {
  const { call } = await setup(); stubGoogle();
  try {
    const r = await call('/identity/oauth/google', { credential: gToken() }); assert.ok(r.j.accessToken, JSON.stringify(r.j));
    const H = { Authorization: 'Bearer ' + r.j.accessToken };
    const me = await call('/identity/profile', undefined, H, 'GET'); assert.equal(me.j.email, 'gu@gmail.com'); assert.equal(me.j.emailVerified, true); assert.equal(me.j.google.linked, true);
    const r2 = await call('/identity/oauth/google', { credential: gToken() }); const me2 = await call('/identity/profile', undefined, { Authorization: 'Bearer ' + r2.j.accessToken }, 'GET'); assert.equal(me2.j.userId, me.j.userId);
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
    assert.equal((await call('/identity/oauth/google', { credential: gToken({}, other) })).j.code, 'GOOGLE_INVALID', 'yanlış imza');
    assert.equal((await call('/identity/oauth/google', { credential: gToken({ aud: 'baska' }) })).j.code, 'GOOGLE_INVALID', 'yanlış client id');
    assert.equal((await call('/identity/oauth/google', { credential: gToken({ exp: 1 }) })).j.code, 'GOOGLE_INVALID', 'süresi geçmiş');
    assert.equal((await call('/identity/oauth/google', { credential: gToken({ email_verified: false, sub: 'g-2', email: 'x@gmail.com' }) })).j.code, 'GOOGLE_INVALID');
    assert.equal((await call('/identity/oauth/google', { credential: gToken({ iss: 'https://evil.example' }) })).j.code, 'GOOGLE_INVALID');
    // parolası olmayan hesap: bağlantı kaldırılamaz, ama oturumla silinebilir
    assert.equal((await call('/identity/oauth/google', {}, H, 'DELETE')).j.code, 'NEEDS_PASSWORD');
  } finally { globalThis.fetch = realFetch; }
});
test('google: GOOGLE_CLIENT_ID yoksa kapalı; aynı e-postalı doğrulanmış hesaba bağlanır; doğrulanmamış hesabın eski parolası geçersizleşir', { skip }, async () => {
  const { env, call } = await setup(); stubGoogle();
  try {
    const { H } = await mkUser(env, call, 'gu@gmail.com');
    const r = await call('/identity/oauth/google', { credential: gToken() }); assert.ok(r.j.accessToken);
    assert.equal((await call('/identity/profile', undefined, H, 'GET')).j.google.linked, true, 'aynı hesaba bağlandı');
    assert.equal((await call('/identity/login', { email: 'gu@gmail.com', password: 'Parola12345' })).s, 200, 'doğrulanmış hesabın parolası geçerli kalır');
    // doğrulanmamış ön-kayıt (hesap ele geçirme denemesi)
    await call('/identity/register', { email: 'victim@gmail.com', password: 'Saldirgan12345' });
    const v = await call('/identity/oauth/google', { credential: gToken({ sub: 'g-victim', email: 'victim@gmail.com' }) }); assert.ok(v.j.accessToken);
    assert.equal((await call('/identity/login', { email: 'victim@gmail.com', password: 'Saldirgan12345' })).j.code, 'BAD_CREDENTIALS', 'saldırganın parolası öldü');
    delete env.GOOGLE_CLIENT_ID;
    assert.equal((await call('/identity/oauth/google', { credential: gToken() })).j.code, 'GOOGLE_UNAVAILABLE');
  } finally { globalThis.fetch = realFetch; }
});
test('google: giriş yapmış kullanıcı Google bağlar; başkasının Google hesabı bağlanamaz; 2FA açıksa Google girişi de kod ister', { skip }, async () => {
  const { env, call } = await setup(); stubGoogle();
  try {
    const a = await mkUser(env, call, 'a1@x.co'), b = await mkUser(env, call, 'b1@x.co');
    assert.equal((await call('/identity/oauth/google/link', { credential: gToken({ sub: 'g-A', email: 'ga@gmail.com' }) }, a.H)).j.google.email, 'ga@gmail.com');
    assert.equal((await call('/identity/oauth/google/link', { credential: gToken({ sub: 'g-A', email: 'ga@gmail.com' }) }, b.H)).j.code, 'GOOGLE_CONFLICT');
    assert.equal((await call('/identity/oauth/google', {}, a.H, 'DELETE')).j.google.linked, false, 'parolalı hesapta bağlantı kaldırılır');
    await call('/identity/oauth/google/link', { credential: gToken({ sub: 'g-A', email: 'ga@gmail.com' }) }, a.H);
    const st = await call('/identity/2fa/enable', { method: 'email', password: 'Parola12345' }, a.H); assert.equal(st.j.method, 'email');
    await call('/identity/2fa/enable', { code: lastCode(env) }, a.H);
    const g = await call('/identity/oauth/google', { credential: gToken({ sub: 'g-A', email: 'ga@gmail.com' }) });
    assert.equal(g.j.twoFactorRequired, true); assert.equal(g.j.email, 'a1@x.co'); assert.ok(!g.j.accessToken);
    const fin = await call('/identity/login', { email: g.j.email, challengeId: g.j.challengeId, code: lastCode(env) }); assert.ok(fin.j.accessToken);
  } finally { globalThis.fetch = realFetch; }
});

/* ===== Uygulama girişi (kod + PKCE) ===== */
const verifier = () => randomBytes(32).toString('base64url');
const chal = v => createHash('sha256').update(v).digest('base64url');
const PASSAPP = { app: 'nexus-pass', redirect: 'https://pass.example/nexus-pass/' };
async function authorize(call, H, app = PASSAPP, v = verifier(), state = 'state-12345678') {
  const r = await call('/identity/authorize', { ...app, state, challenge: chal(v) }, H);
  return { r, v, code: r.j.redirect && new URL(r.j.redirect).searchParams.get('code'), state };
}
test('uygulama girişi: yetkilendirme → kod → PKCE ile değişim; kod tek kullanımlık; yanlış verifier/redirect/app reddedilir', { skip }, async () => {
  const { env, call } = await setup(); const u = await mkUser(env, call);
  assert.equal((await call('/identity/authorize/info', { app: 'nexus-pass', redirect: 'https://evil.example/' }, u.H)).j.code, 'BAD_REDIRECT');
  assert.equal((await call('/identity/authorize/info', { app: 'yok', redirect: PASSAPP.redirect }, u.H)).j.code, 'BAD_APP');
  assert.equal((await call('/identity/authorize', { ...PASSAPP, state: 'state-12345678', challenge: 'kisa' }, u.H)).j.code, 'VALIDATION');
  assert.equal((await call('/identity/authorize', { ...PASSAPP, state: 'state-12345678', challenge: chal('x'.repeat(43)) })).s, 401, 'oturumsuz');
  const a = await authorize(call, u.H); assert.equal(a.r.s, 200); assert.ok(a.r.j.redirect.startsWith(PASSAPP.redirect + '?code=')); assert.match(a.r.j.redirect, /&state=state-12345678$/);
  assert.equal((await call('/identity/token/exchange', { code: a.code, verifier: verifier(), ...PASSAPP })).j.code, 'CODE_INVALID', 'yanlış verifier');
  assert.equal((await call('/identity/token/exchange', { code: a.code, verifier: a.v, app: 'sanal-banka', redirect: PASSAPP.redirect })).j.code, 'CODE_INVALID', 'yanlış app');
  const ex = await call('/identity/token/exchange', { code: a.code, verifier: a.v, ...PASSAPP }); assert.equal(ex.s, 200);
  assert.equal(ex.j.user.email, 'p@q.co'); assert.equal(ex.j.user.emailVerified, true); assert.ok(ex.j.accessToken && ex.j.refreshToken);
  assert.equal((await call('/identity/token/exchange', { code: a.code, verifier: a.v, ...PASSAPP })).j.code, 'CODE_INVALID', 'kod ikinci kez kullanılamaz');
  // uygulama jetonu ID profiline erişemez
  assert.equal((await call('/identity/profile', undefined, { Authorization: 'Bearer ' + ex.j.accessToken }, 'GET')).s, 401);
  // tokens:false → yalnızca kimlik (Nexus gibi kendi oturumunu açan siteler)
  const b = await authorize(call, u.H, { app: 'sanal-banka', redirect: 'https://nx.example/api/auth/id/callback' });
  const ex2 = await call('/identity/token/exchange', { code: b.code, verifier: b.v, app: 'sanal-banka', redirect: 'https://nx.example/api/auth/id/callback', tokens: false });
  assert.equal(ex2.j.user.userId.startsWith('usr_'), true); assert.ok(!ex2.j.accessToken);
});
test('uygulama girişi: süresi geçen kod reddedilir; bağlantı kaldırılınca jetonlar ölür; yenileme', { skip }, async () => {
  const { env, call } = await setup(); const u = await mkUser(env, call);
  const a = await authorize(call, u.H); env.db.exec("UPDATE id_authcodes SET exp=1");
  assert.equal((await call('/identity/token/exchange', { code: a.code, verifier: a.v, ...PASSAPP })).j.code, 'CODE_INVALID', 'süre doldu');
  const b = await authorize(call, u.H), ex = await call('/identity/token/exchange', { code: b.code, verifier: b.v, ...PASSAPP });
  const rf = await call('/identity/app/refresh', { refreshToken: ex.j.refreshToken }); assert.ok(rf.j.accessToken && rf.j.accessToken !== ex.j.accessToken);
  assert.equal((await call('/identity/app/refresh', { refreshToken: ex.j.refreshToken })).s, 401, 'eski yenileme jetonu geçersiz');
  assert.equal((await call('/api/npass/me', {}, { Authorization: 'Bearer ' + ex.j.accessToken })).s, 401, 'eski erişim jetonu geçersiz');
  assert.equal((await call('/api/npass/link/status', {}, { Authorization: 'Bearer ' + rf.j.accessToken })).s, 200);
  await call('/identity/apps/nexus-pass', {}, u.H, 'DELETE');
  assert.equal((await call('/api/npass/link/status', {}, { Authorization: 'Bearer ' + rf.j.accessToken })).s, 401, 'bağlantı kaldırıldı → jeton ölür');
  assert.equal((await call('/identity/app/refresh', { refreshToken: rf.j.refreshToken })).s, 401);
  const c = await authorize(call, u.H); assert.equal(c.r.s, 200, 'izin verince uygulama yeniden bağlanır');
  assert.equal((await call('/identity/apps', undefined, u.H, 'GET')).j.find(x => x.id === 'nexus-pass').connected, true);
});

/* ===== Nexus Pass: FOREVYE ID ile giriş + kristal hesabı bağı ===== */
test('npass ↔ ID: bağsız hesap 409; kristal hesabı bağlanınca bakiye ve alım ID jetonuyla çalışır; başkası aynı kristal hesabını bağlayamaz', { skip }, async () => {
  const { env, call, user } = await setup(); const u = await mkUser(env, call), u2 = await mkUser(env, call, 'z@z.co');
  const tok = async (U) => { const a = await authorize(call, U.H); const ex = await call('/identity/token/exchange', { code: a.code, verifier: a.v, ...PASSAPP }); return { Authorization: 'Bearer ' + ex.j.accessToken }; };
  const T = await tok(u), T2 = await tok(u2);
  assert.equal((await call('/api/npass/link/status', {}, T)).j.linked, false);
  const me0 = await call('/api/npass/me', {}, T); assert.equal(me0.s, 409); assert.equal(me0.j.code, 'no_crystal_account');
  const cr = await user(1000), pair = cr.h.Authorization.slice(7);
  assert.equal((await call('/api/npass/link', { hesap: '12345678.' + 'a'.repeat(30) }, T)).s, 400, 'yanlış anahtar');
  assert.equal((await call('/api/npass/link', { hesap: pair }, T)).j.linked, true);
  assert.equal((await call('/api/npass/link', { hesap: pair }, T2)).s, 409, 'aynı kristal hesabı ikinci ID\'ye bağlanamaz');
  assert.equal((await call('/api/npass/me', {}, T)).j.balance, 1000);
  const buy = await call('/api/npass/purchase', { pid: 'p1', idem: 'idem-via-id-01' }, T); assert.equal(buy.j.ok, true);
  assert.equal((await call('/api/npass/me', {}, cr.h)).j.balance, 850, 'doğrudan kristal hesabıyla da aynı bakiye');
  assert.equal((await call('/api/npass/unlink', {}, T)).j.linked, false);
  assert.equal((await call('/api/npass/me', {}, T)).s, 409);
  assert.equal((await call('/api/npass/link', { hesap: pair }, T2)).j.linked, true, 'ayrılınca başkası bağlayabilir');
});
