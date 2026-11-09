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
