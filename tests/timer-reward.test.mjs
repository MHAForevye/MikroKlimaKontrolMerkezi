import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash, createHmac } from 'node:crypto';

let DatabaseSync = null;
try { ({ DatabaseSync } = await import('node:sqlite')); } catch (_) {}
const skip = DatabaseSync ? false : 'node:sqlite yok (Node 22.5+ gerekir)';
const realNow = Date.now;
const realFetch = globalThis.fetch;
const BANK_SECRET = 'shared-giftcard-nexus-secret-for-tests';
let identitySeq = 1;

function makeEnv() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync('schema.sql', 'utf8'));
  const DB = {
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
    async batch(sts) { const out = []; for (const st of sts) out.push(await st.run()); return out; }
  };
  return { DB, ADMIN_TOKEN: 'x'.repeat(24), ZP_ORIGIN: 'https://frovyes.github.io,https://mhaforevye.github.io',
    NEXUS_SECRET: BANK_SECRET, NEXUS_BANK_API_URL: 'https://bank.test', db, fakeBank: new Map(), bankClaims: new Map() };
}
function installBankMock(env) {
  globalThis.fetch = async (input, init = {}) => {
    const req = input instanceof Request ? input : new Request(input, init);
    const raw = await req.clone().text();
    const ts = req.headers.get('x-nx-timestamp') || '';
    const sig = req.headers.get('x-nx-signature') || '';
    const expected = createHmac('sha256', BANK_SECRET).update(`${ts}.${raw}`).digest('hex');
    if (!ts || sig !== expected) return Response.json({ error: { code: 'bad_signature', message: 'bad signature' } }, { status: 401 });
    const body = JSON.parse(raw);
    if (body.email_verified !== true || !body.id_user_id) return Response.json({ error: { code: 'invalid_identity', message: 'invalid identity' } }, { status: 400 });
    const qty0 = env.fakeBank.get(body.id_user_id) ?? 300000;
    env.fakeBank.set(body.id_user_id, qty0);
    if (new URL(req.url).pathname.endsWith('/account')) {
      return Response.json({ ok: true, linked: true, qty: qty0, crystals: qty0 / 10000 });
    }
    if (new URL(req.url).pathname.endsWith('/credit')) {
      if (env.failNextCredit) { env.failNextCredit = false; return Response.json({ error: { code: 'bank_temporarily_unavailable', message: 'bank unavailable' } }, { status: 503 }); }
      const key = `${body.id_user_id}:${body.source}:${body.day}`;
      const previous = env.bankClaims.get(key);
      if (previous) {
        if (previous.qty !== body.qty || previous.ref !== body.ref) return Response.json({ error: { code: 'reward_replay_conflict', message: 'conflict' } }, { status: 409 });
        return Response.json({ ok: true, credited: false, replayed: true, qty: body.qty, balanceQty: env.fakeBank.get(body.id_user_id), crystals: env.fakeBank.get(body.id_user_id) / 10000, ref: body.ref });
      }
      env.fakeBank.set(body.id_user_id, qty0 + body.qty);
      env.bankClaims.set(key, { qty: body.qty, ref: body.ref });
      const balanceQty = env.fakeBank.get(body.id_user_id);
      return Response.json({ ok: true, credited: true, replayed: false, qty: body.qty, balanceQty, crystals: balanceQty / 10000, ref: body.ref });
    }
    return Response.json({ error: { code: 'not_found', message: 'not found' } }, { status: 404 });
  };
}
async function setup() {
  const mod = await import('../worker/index.js');
  const env = makeEnv(); installBankMock(env);
  const uid = `usr_${(identitySeq++).toString(16).padStart(16, '0')}`;
  const access = `timer_${uid}_access_token_1234567890`;
  const hash = createHash('sha256').update(access).digest('hex');
  const email = `id-${uid.slice(-4)}@example.test`;
  const created = Date.now();
  env.db.prepare('INSERT INTO id_users(id,email,salt,hash,verified,created,apps) VALUES(?,?,?,?,?,?,?)')
    .run(uid, email, 'salt', 'hash', 1, created, JSON.stringify({ zamanlayici: { connected: true } }));
  env.db.prepare('INSERT INTO id_app_sessions(id,uid,app,a_hash,r_hash,a_exp,r_exp,created,last,revoked) VALUES(?,?,?,?,?,?,?,?,?,0)')
    .run(`session_${uid}`, uid, 'zamanlayici', hash, 'refresh-hash-' + uid, 4102444800000, 4102444800000, created, created);
  const auth = { Authorization: `Bearer ${access}` };
  const call = async (path, body = {}, headers = {}) => {
    const r = await mod.default.fetch(new Request('https://worker.test' + path, {
      method: path === '/api/timer-reward/options' ? 'GET' : 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: path === '/api/timer-reward/options' ? undefined : JSON.stringify(body)
    }), env);
    return { status: r.status, data: await r.json() };
  };
  return { env, call, uid, email, access, auth };
}
const setNow = ms => { Date.now = () => ms; };
const pulseFor = async (call, auth, sessionId, seconds, startMs) => {
  let now = startMs;
  while (seconds > 0) {
    const step = Math.min(120, seconds);
    now += step * 1000; setNow(now);
    const r = await call('/api/timer-reward/pulse', { sessionId }, auth);
    assert.equal(r.status, 200, JSON.stringify(r.data));
    seconds -= step;
  }
  return now;
};

test('günlük çark FOREVYE ID hesabı başına bir kez döner ve hedefi sunucuda saklar', { skip }, async t => {
  try {
    const { call, auth } = await setup();
    const s = await call('/api/timer-reward/state', {}, auth);
    assert.equal(s.status, 200); assert.equal(s.data.task.spun, false);
    const first = await call('/api/timer-reward/spin', {}, auth);
    const second = await call('/api/timer-reward/spin', {}, auth);
    assert.equal(first.status, 200); assert.equal(second.status, 200);
    assert.equal(first.data.task.spun, true);
    assert.equal(second.data.task.targetSeconds, first.data.task.targetSeconds);
    assert.equal(second.data.repeated, true);
  } finally { Date.now = realNow; globalThis.fetch = realFetch; }
});

test('7 saatlik sayaçta 4 saatlik çark hedefi yalnızca 40 kristali doğrudan banka hesabına yatırır', { skip }, async () => {
  try {
    const { env, call, auth, uid } = await setup();
    const startAt = Date.parse('2026-11-24T08:00:00.000Z'); setNow(startAt);
    await call('/api/timer-reward/spin', {}, auth);
    const day = env.db.prepare('SELECT day FROM timer_reward_daily WHERE uid=?').get(uid).day;
    env.db.prepare('UPDATE timer_reward_daily SET target_seconds=14400,reward=40 WHERE uid=? AND day=?').run(uid, day);
    const begun = await call('/api/timer-reward/start', { mode: 'countdown' }, auth);
    assert.equal(begun.status, 200);
    await pulseFor(call, auth, begun.data.sessionId, 7 * 3600, startAt);
    const done = await call('/api/timer-reward/complete', { sessionId: begun.data.sessionId }, auth);
    assert.equal(done.status, 200);
    assert.equal(done.data.awarded, 0);
    assert.equal(done.data.task.creditedSeconds, 14400);
    assert.equal(done.data.task.paid, true);
    assert.equal(done.data.task.balance, 70);
    assert.equal(env.fakeBank.get(uid), 700000);
    assert.equal(env.bankClaims.size, 1);
  } finally { Date.now = realNow; globalThis.fetch = realFetch; }
});

test('1 dakikalık hedef 0,1667 küsurat kristali banka cüzdanına yatırır', { skip }, async () => {
  try {
    const { env, call, auth, uid } = await setup();
    const startAt = Date.parse('2026-11-24T08:00:00.000Z'); setNow(startAt);
    await call('/api/timer-reward/spin', {}, auth);
    const day = env.db.prepare('SELECT day FROM timer_reward_daily WHERE uid=?').get(uid).day;
    env.db.prepare('UPDATE timer_reward_daily SET target_seconds=60,reward=0.1667 WHERE uid=? AND day=?').run(uid, day);
    const begun = await call('/api/timer-reward/start', { mode: 'stopwatch' }, auth);
    await pulseFor(call, auth, begun.data.sessionId, 60, startAt);
    const done = await call('/api/timer-reward/complete', { sessionId: begun.data.sessionId }, auth);
    assert.equal(done.data.task.balance, 30.1667);
    assert.equal(done.data.task.paid, true);
    assert.equal(env.fakeBank.get(uid), 301667);
  } finally { Date.now = realNow; globalThis.fetch = realFetch; }
});

test('Aralık modunda mola değil yalnızca çalışma fazları sayılır', { skip }, async () => {
  try {
    const { env, call, auth, uid } = await setup();
    const startAt = Date.parse('2026-11-24T08:00:00.000Z'); setNow(startAt);
    await call('/api/timer-reward/spin', {}, auth);
    const day = env.db.prepare('SELECT day FROM timer_reward_daily WHERE uid=?').get(uid).day;
    env.db.prepare('UPDATE timer_reward_daily SET target_seconds=3600,reward=10 WHERE uid=? AND day=?').run(uid, day);
    const first = await call('/api/timer-reward/start', { mode: 'interval-work' }, auth);
    let now = await pulseFor(call, auth, first.data.sessionId, 25 * 60, startAt);
    const pause = await call('/api/timer-reward/stop', { sessionId: first.data.sessionId }, auth);
    assert.equal(pause.data.task.creditedSeconds, 1500);
    now += 5 * 60 * 1000; setNow(now);
    const second = await call('/api/timer-reward/start', { mode: 'interval-work' }, auth);
    await pulseFor(call, auth, second.data.sessionId, 35 * 60, now);
    const done = await call('/api/timer-reward/complete', { sessionId: second.data.sessionId }, auth);
    assert.equal(done.data.task.creditedSeconds, 3600);
    assert.equal(done.data.task.balance, 40);
    assert.equal(env.fakeBank.get(uid), 400000);
  } finally { Date.now = realNow; globalThis.fetch = realFetch; }
});

test('Banka geçici olarak kapalıysa tamamlanan ödül kaydı korunur ve sonraki durum isteğinde yeniden yatırılır', { skip }, async () => {
  try {
    const { env, call, auth, uid } = await setup();
    const startAt = Date.parse('2026-11-24T08:00:00.000Z'); setNow(startAt);
    await call('/api/timer-reward/spin', {}, auth);
    const day = env.db.prepare('SELECT day FROM timer_reward_daily WHERE uid=?').get(uid).day;
    env.db.prepare('UPDATE timer_reward_daily SET target_seconds=60,reward=0.1667 WHERE uid=? AND day=?').run(uid, day);
    const begun = await call('/api/timer-reward/start', { mode: 'stopwatch' }, auth);
    setNow(startAt + 60 * 1000);
    env.failNextCredit = true;
    const failed = await call('/api/timer-reward/pulse', { sessionId: begun.data.sessionId }, auth);
    assert.equal(failed.status, 503);
    const pending = env.db.prepare('SELECT paid_at,credited_seconds FROM timer_reward_daily WHERE uid=? AND day=?').get(uid, day);
    assert.equal(pending.paid_at, null);
    assert.equal(pending.credited_seconds, 60);
    const recovered = await call('/api/timer-reward/state', {}, auth);
    assert.equal(recovered.status, 200);
    assert.equal(recovered.data.task.paid, true);
    assert.equal(recovered.data.task.balance, 30.1667);
    assert.equal(env.fakeBank.get(uid), 301667);
  } finally { Date.now = realNow; globalThis.fetch = realFetch; }
});

test('FOREVYE ID app oturumu olmadan günlük görev uçları açılamaz', { skip }, async () => {
  try {
    const { call } = await setup();
    const r = await call('/api/timer-reward/spin');
    assert.equal(r.status, 401);
  } finally { Date.now = realNow; globalThis.fetch = realFetch; }
});

test('Zamanlayıcı API CORS iki GitHub Pages originini kabul eder, yabancı origin reddedilir', async () => {
  try {
    const { env } = await setup();
    const mod = await import('../worker/index.js');
    for (const origin of ['https://frovyes.github.io', 'https://mhaforevye.github.io']) {
      const allowed = await mod.default.fetch(new Request('https://worker.test/api/timer-reward/state', {
        method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' }
      }), env);
      assert.equal(allowed.status, 204);
      assert.equal(allowed.headers.get('Access-Control-Allow-Origin'), origin);
    }
    const denied = await mod.default.fetch(new Request('https://worker.test/api/timer-reward/state', {
      method: 'OPTIONS', headers: { Origin: 'https://example.com', 'Access-Control-Request-Method': 'POST' }
    }), env);
    assert.equal(denied.status, 405);
  } finally { Date.now = realNow; globalThis.fetch = realFetch; }
});

test('4 saatlik hedef dolar dolmaz banka kredisi verilir; sayaç uzasa da tekrar ödeme oluşmaz', { skip }, async () => {
  try {
    const { env, call, auth, uid } = await setup();
    const startAt = Date.parse('2026-11-24T08:00:00.000Z'); setNow(startAt);
    await call('/api/timer-reward/spin', {}, auth);
    const day = env.db.prepare('SELECT day FROM timer_reward_daily WHERE uid=?').get(uid).day;
    env.db.prepare('UPDATE timer_reward_daily SET target_seconds=14400,reward=40 WHERE uid=? AND day=?').run(uid, day);
    const begun = await call('/api/timer-reward/start', { mode: 'countdown' }, auth);
    await pulseFor(call, auth, begun.data.sessionId, 4 * 3600, startAt);
    assert.equal(env.fakeBank.get(uid), 700000);
    const segment = env.db.prepare('SELECT active FROM timer_reward_segments WHERE id=?').get(begun.data.sessionId);
    assert.equal(segment.active, 0);
    const claimCount = env.bankClaims.size;
    await call('/api/timer-reward/complete', { sessionId: begun.data.sessionId }, auth);
    assert.equal(env.fakeBank.get(uid), 700000);
    assert.equal(env.bankClaims.size, claimCount);
  } finally { Date.now = realNow; globalThis.fetch = realFetch; }
});

test('aynı FOREVYE ID için aynı anda yalnızca tek zamanlayıcı oturumu açılır', { skip }, async () => {
  try {
    const { call, auth } = await setup();
    await call('/api/timer-reward/spin', {}, auth);
    const first = await call('/api/timer-reward/start', { mode: 'stopwatch' }, auth);
    const second = await call('/api/timer-reward/start', { mode: 'countdown' }, auth);
    assert.equal(first.status, 200);
    assert.equal(second.status, 409);
    assert.equal(second.data.code, 'already_running');
    await call('/api/timer-reward/stop', { sessionId: first.data.sessionId }, auth);
    const third = await call('/api/timer-reward/start', { mode: 'stopwatch' }, auth);
    assert.equal(third.status, 200);
  } finally { Date.now = realNow; globalThis.fetch = realFetch; }
});

test('Türkiye gece yarısında eski gün oturumu kapanır; yeni güne süre taşınmaz', { skip }, async () => {
  try {
    const { env, call, auth, uid } = await setup();
    const startAt = Date.parse('2026-11-24T20:58:00.000Z'); setNow(startAt);
    await call('/api/timer-reward/spin', {}, auth);
    const oldDay = env.db.prepare('SELECT day FROM timer_reward_daily WHERE uid=?').get(uid).day;
    env.db.prepare('UPDATE timer_reward_daily SET target_seconds=3600,reward=10 WHERE uid=? AND day=?').run(uid, oldDay);
    const begun = await call('/api/timer-reward/start', { mode: 'stopwatch' }, auth);
    await pulseFor(call, auth, begun.data.sessionId, 60, startAt);
    setNow(Date.parse('2026-11-24T21:01:00.000Z'));
    const after = await call('/api/timer-reward/pulse', { sessionId: begun.data.sessionId }, auth);
    assert.equal(after.data.active, false);
    assert.equal(after.data.task.day, '2026-11-25');
    assert.equal(after.data.task.spun, false);
    const old = env.db.prepare('SELECT credited_seconds FROM timer_reward_daily WHERE uid=? AND day=?').get(uid, oldDay);
    assert.equal(old.credited_seconds, 120);
  } finally { Date.now = realNow; globalThis.fetch = realFetch; }
});

test('arka planda kalan oturum en fazla 120 saniye güvenli ek süreyle kapanır', { skip }, async () => {
  try {
    const { call, auth, env, uid } = await setup();
    const startAt = Date.parse('2026-11-24T08:00:00.000Z'); setNow(startAt);
    await call('/api/timer-reward/spin', {}, auth);
    const day = env.db.prepare('SELECT day FROM timer_reward_daily WHERE uid=?').get(uid).day;
    env.db.prepare('UPDATE timer_reward_daily SET target_seconds=3600,reward=10 WHERE uid=? AND day=?').run(uid, day);
    const begun = await call('/api/timer-reward/start', { mode: 'stopwatch' }, auth);
    setNow(startAt + 5 * 60 * 1000);
    const stale = await call('/api/timer-reward/pulse', { sessionId: begun.data.sessionId }, auth);
    assert.equal(stale.data.active, false);
    assert.equal(stale.data.task.creditedSeconds, 120);
    const replacement = await call('/api/timer-reward/start', { mode: 'stopwatch' }, auth);
    assert.equal(replacement.status, 200);
  } finally { Date.now = realNow; globalThis.fetch = realFetch; }
});

test('kimlik e-postası doğrulanmamışsa ödül cüzdanına erişim reddedilir', { skip }, async () => {
  try {
    const { env, call, uid, access } = await setup();
    env.db.prepare('UPDATE id_users SET verified=0 WHERE id=?').run(uid);
    const r = await call('/api/timer-reward/state', {}, { Authorization: `Bearer ${access}` });
    assert.equal(r.status, 403);
    assert.equal(r.data.code, 'id_email_unverified');
  } finally { Date.now = realNow; globalThis.fetch = realFetch; }
});

test('FOREVYE ID giriş sayfası iki GitHub Pages uygulamasında doğru şekilde sunulur', { skip }, async () => {
  try {
    const { env } = await setup();
    env.ID_ORIGIN = 'https://mhaforevye.github.io';
    const mod = await import('../worker/index.js');
    for (const origin of ['https://frovyes.github.io', 'https://mhaforevye.github.io']) {
      const r = await mod.default.fetch(new Request('https://worker.test/identity/client-config', { method: 'GET', headers: { Origin: origin } }), env);
      assert.equal(r.status, 200);
      assert.equal((await r.json()).idUrl, 'https://mhaforevye.github.io/forevye-id/');
    }
  } finally { Date.now = realNow; globalThis.fetch = realFetch; }
});
