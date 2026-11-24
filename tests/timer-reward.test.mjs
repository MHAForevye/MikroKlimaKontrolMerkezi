import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

let DatabaseSync = null;
try { ({ DatabaseSync } = await import('node:sqlite')); } catch (_) {}
const skip = DatabaseSync ? false : 'node:sqlite yok (Node 22.5+ gerekir)';
const realNow = Date.now;

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
  return { DB, ADMIN_TOKEN: 'x'.repeat(24), ZP_ORIGIN: 'https://frovyes.github.io', db };
}
async function setup() {
  const mod = await import('../worker/index.js');
  const env = makeEnv();
  const call = async (path, body = {}, headers = {}) => {
    const r = await mod.default.fetch(new Request('https://worker.test' + path, {
      method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body)
    }), env);
    return { status: r.status, data: await r.json() };
  };
  return { env, call };
}
const bearer = a => ({ Authorization: `Bearer ${a.data.id}.${a.data.token}` });
const setNow = ms => { Date.now = () => ms; };
const pulseFor = async (call, auth, sessionId, seconds, startMs) => {
  let now = startMs;
  while (seconds > 0) {
    const step = Math.min(120, seconds);
    now += step * 1000; setNow(now);
    const r = await call('/api/timer-reward/pulse', { sessionId }, auth);
    assert.equal(r.status, 200);
    seconds -= step;
  }
  return now;
};

 test('günlük çark hesabı başına bir kez döner ve aynı hedefi tekrar verir', { skip }, async () => {
  try {
    const { call } = await setup();
    const account = await call('/api/init');
    const auth = bearer(account);
    const s = await call('/api/timer-reward/state', {}, auth);
    assert.equal(s.status, 200); assert.equal(s.data.task.spun, false);
    const first = await call('/api/timer-reward/spin', {}, auth);
    const second = await call('/api/timer-reward/spin', {}, auth);
    assert.equal(first.status, 200); assert.equal(second.status, 200);
    assert.equal(first.data.task.spun, true);
    assert.equal(second.data.task.targetSeconds, first.data.task.targetSeconds);
    assert.equal(second.data.repeated, true);
  } finally { Date.now = realNow; }
});

test('7 saatlik geri sayım 4 saatlik günlük hedefte en fazla 40 kristal verir', { skip }, async () => {
  try {
    const { env, call } = await setup();
    const startAt = Date.parse('2026-11-24T08:00:00.000Z'); setNow(startAt);
    const account = await call('/api/init'); const auth = bearer(account);
    await call('/api/timer-reward/spin', {}, auth);
    const daily = env.db.prepare('SELECT day FROM timer_reward_daily WHERE uid=?').get(account.data.id);
    env.db.prepare('UPDATE timer_reward_daily SET target_seconds=14400,reward=40 WHERE uid=? AND day=?').run(account.data.id, daily.day);
    const begun = await call('/api/timer-reward/start', { mode: 'countdown' }, auth);
    assert.equal(begun.status, 200);
    let now = await pulseFor(call, auth, begun.data.sessionId, 7 * 3600, startAt);
    const done = await call('/api/timer-reward/complete', { sessionId: begun.data.sessionId }, auth);
    assert.equal(done.status, 200);
    assert.equal(done.data.awarded, 0); // 4 saatlik hedef son heartbeat'te zaten otomatik ödendi.
    assert.equal(done.data.task.creditedSeconds, 14400);
    assert.equal(done.data.task.paid, true);
    assert.equal(done.data.task.balance, 70);
    const again = await call('/api/timer-reward/complete', {}, auth);
    assert.equal(again.data.awarded, 0);
    assert.equal(again.data.task.balance, 70);
  } finally { Date.now = realNow; }
});

test('1 dakikalık hedefin küsuratlı ödülü 0,1667 kristal olarak hesaba yazılır', { skip }, async () => {
  try {
    const { env, call } = await setup();
    const startAt = Date.parse('2026-11-24T08:00:00.000Z'); setNow(startAt);
    const account = await call('/api/init'); const auth = bearer(account);
    await call('/api/timer-reward/spin', {}, auth);
    const daily = env.db.prepare('SELECT day FROM timer_reward_daily WHERE uid=?').get(account.data.id);
    env.db.prepare('UPDATE timer_reward_daily SET target_seconds=60,reward=0.1667 WHERE uid=? AND day=?').run(account.data.id, daily.day);
    const begun = await call('/api/timer-reward/start', { mode: 'stopwatch' }, auth);
    await pulseFor(call, auth, begun.data.sessionId, 60, startAt);
    const done = await call('/api/timer-reward/complete', { sessionId: begun.data.sessionId }, auth);
    assert.equal(done.data.awarded, 0); // ödeme hedefe ulaşılan pulse'ta yapıldı.
    assert.equal(done.data.task.balance, 30.1667);
    assert.equal(done.data.task.paid, true);
  } finally { Date.now = realNow; }
});

test('Aralık modunda mola değil yalnızca iki çalışma fazı sayılır', { skip }, async () => {
  try {
    const { env, call } = await setup();
    const startAt = Date.parse('2026-11-24T08:00:00.000Z'); setNow(startAt);
    const account = await call('/api/init'); const auth = bearer(account);
    await call('/api/timer-reward/spin', {}, auth);
    const daily = env.db.prepare('SELECT day FROM timer_reward_daily WHERE uid=?').get(account.data.id);
    env.db.prepare('UPDATE timer_reward_daily SET target_seconds=3600,reward=10 WHERE uid=? AND day=?').run(account.data.id, daily.day);
    const first = await call('/api/timer-reward/start', { mode: 'interval-work' }, auth);
    let now = await pulseFor(call, auth, first.data.sessionId, 25 * 60, startAt);
    const pause = await call('/api/timer-reward/stop', { sessionId: first.data.sessionId }, auth);
    assert.equal(pause.data.task.creditedSeconds, 1500);
    now += 5 * 60 * 1000; setNow(now); // Mola: bu aralıkta oturum yok, süre sayılmaz.
    const second = await call('/api/timer-reward/start', { mode: 'interval-work' }, auth);
    await pulseFor(call, auth, second.data.sessionId, 35 * 60, now);
    const done = await call('/api/timer-reward/complete', { sessionId: second.data.sessionId }, auth);
    assert.equal(done.data.task.creditedSeconds, 3600);
    assert.equal(done.data.awarded, 0); // ödül hedefte otomatik yatırıldı.
    assert.equal(done.data.task.balance, 40);
  } finally { Date.now = realNow; }
});

test('kimlik doğrulaması olmadan günlük görev veya ödeme uçları kullanılamaz', { skip }, async () => {
  const { call } = await setup();
  const r = await call('/api/timer-reward/spin');
  assert.equal(r.status, 401);
});


test('Zamanlayıcı ödül API CORS yalnızca tanımlı Pages originine izin verir', async () => {
  const mod = await import('../worker/index.js');
  const env = makeEnv();
  const allowed = await mod.default.fetch(new Request('https://worker.test/api/timer-reward/state', {
    method: 'OPTIONS', headers: { Origin: 'https://frovyes.github.io', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' }
  }), env);
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get('Access-Control-Allow-Origin'), 'https://frovyes.github.io');
  const denied = await mod.default.fetch(new Request('https://worker.test/api/timer-reward/state', {
    method: 'OPTIONS', headers: { Origin: 'https://example.com', 'Access-Control-Request-Method': 'POST' }
  }), env);
  assert.equal(denied.status, 405);
});

test('4 saatlik hedefe ulaşınca 7 saatlik sayaç bitmeden 40 kristal anında yatırılır', { skip }, async () => {
  try {
    const { env, call } = await setup();
    const startAt = Date.parse('2026-11-24T08:00:00.000Z'); setNow(startAt);
    const account = await call('/api/init'); const auth = bearer(account);
    await call('/api/timer-reward/spin', {}, auth);
    const daily = env.db.prepare('SELECT day FROM timer_reward_daily WHERE uid=?').get(account.data.id);
    env.db.prepare('UPDATE timer_reward_daily SET target_seconds=14400,reward=40 WHERE uid=? AND day=?').run(account.data.id, daily.day);
    const begun = await call('/api/timer-reward/start', { mode: 'countdown' }, auth);
    await pulseFor(call, auth, begun.data.sessionId, 4 * 3600, startAt);
    const row = env.db.prepare('SELECT bal FROM users WHERE id=?').get(account.data.id);
    const segment = env.db.prepare('SELECT active FROM timer_reward_segments WHERE id=?').get(begun.data.sessionId);
    const task = env.db.prepare('SELECT credited_seconds,paid_at FROM timer_reward_daily WHERE uid=? AND day=?').get(account.data.id, daily.day);
    assert.equal(row.bal, 70);
    assert.equal(segment.active, 0);
    assert.equal(task.credited_seconds, 14400);
    assert.ok(task.paid_at);
    // Kalan üç saat aynı günlük ödülü büyütemez ya da ikinci ödeme üretemez.
    await pulseFor(call, auth, begun.data.sessionId, 3 * 3600, Date.now());
    assert.equal(env.db.prepare('SELECT bal FROM users WHERE id=?').get(account.data.id).bal, 70);
  } finally { Date.now = realNow; }
});


test('aynı kristal hesabında aynı anda yalnızca tek ödül zamanlayıcısı açılabilir', { skip }, async () => {
  try {
    const { call } = await setup();
    const account = await call('/api/init'); const auth = bearer(account);
    await call('/api/timer-reward/spin', {}, auth);
    const first = await call('/api/timer-reward/start', { mode: 'stopwatch' }, auth);
    const second = await call('/api/timer-reward/start', { mode: 'countdown' }, auth);
    assert.equal(first.status, 200);
    assert.equal(second.status, 409);
    assert.equal(second.data.code, 'already_running');
    await call('/api/timer-reward/stop', { sessionId: first.data.sessionId }, auth);
    const third = await call('/api/timer-reward/start', { mode: 'stopwatch' }, auth);
    assert.equal(third.status, 200);
  } finally { Date.now = realNow; }
});

test('Türkiye gece yarısında eski günün oturumu kapanır ve süre yeni güne taşınmaz', { skip }, async () => {
  try {
    const { env, call } = await setup();
    const startAt = Date.parse('2026-11-24T20:58:00.000Z'); setNow(startAt); // Türkiye 23:58
    const account = await call('/api/init'); const auth = bearer(account);
    await call('/api/timer-reward/spin', {}, auth);
    const old = env.db.prepare('SELECT day FROM timer_reward_daily WHERE uid=?').get(account.data.id);
    env.db.prepare('UPDATE timer_reward_daily SET target_seconds=3600,reward=10 WHERE uid=? AND day=?').run(account.data.id, old.day);
    const begun = await call('/api/timer-reward/start', { mode: 'stopwatch' }, auth);
    await pulseFor(call, auth, begun.data.sessionId, 60, startAt);
    setNow(Date.parse('2026-11-24T21:01:00.000Z')); // Türkiye 25 Kasım 00:01
    const afterMidnight = await call('/api/timer-reward/pulse', { sessionId: begun.data.sessionId }, auth);
    assert.equal(afterMidnight.data.active, false);
    assert.equal(afterMidnight.data.task.day, '2026-11-25');
    assert.equal(afterMidnight.data.task.spun, false);
    const oldRow = env.db.prepare('SELECT credited_seconds FROM timer_reward_daily WHERE uid=? AND day=?').get(account.data.id, old.day);
    assert.equal(oldRow.credited_seconds, 120); // son heartbeat aralığı da 120 sn ile sınırlanır
    const newSpin = await call('/api/timer-reward/spin', {}, auth);
    assert.equal(newSpin.status, 200);
    assert.equal(newSpin.data.task.day, '2026-11-25');
    assert.equal(newSpin.data.task.spun, true);
  } finally { Date.now = realNow; }
});


test('arka plana düşen veya açık kalan eski oturum en fazla 120 sn güvenli payla kapanır', { skip }, async () => {
  try {
    const { env, call } = await setup();
    const startAt = Date.parse('2026-11-24T08:00:00.000Z'); setNow(startAt);
    const account = await call('/api/init'); const auth = bearer(account);
    await call('/api/timer-reward/spin', {}, auth);
    const daily = env.db.prepare('SELECT day FROM timer_reward_daily WHERE uid=?').get(account.data.id);
    env.db.prepare('UPDATE timer_reward_daily SET target_seconds=3600,reward=10 WHERE uid=? AND day=?').run(account.data.id, daily.day);
    const begun = await call('/api/timer-reward/start', { mode: 'stopwatch' }, auth);
    setNow(startAt + 5 * 60 * 1000); // sekme/cihaz beş dakika boyunca heartbeat gönderemedi
    const stale = await call('/api/timer-reward/pulse', { sessionId: begun.data.sessionId }, auth);
    assert.equal(stale.data.active, false);
    assert.equal(stale.data.task.creditedSeconds, 120);
    const replacement = await call('/api/timer-reward/start', { mode: 'stopwatch' }, auth);
    assert.equal(replacement.status, 200);
  } finally { Date.now = realNow; }
});
