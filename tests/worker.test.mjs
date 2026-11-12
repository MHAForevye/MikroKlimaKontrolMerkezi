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
