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
  return { DB: D1, NEXUS_SECRET: 'n'.repeat(32), __mail: [], ADMIN_TOKEN: 'x'.repeat(24) };
}
const SECRET = 'n'.repeat(32);
const sign = (ts, raw, secret = SECRET) => createHmac('sha256', secret).update(ts + '.' + raw).digest('hex');

async function setup() {
  const mod = await import('../worker/index.js'), env = makeEnv();
  const mail = async (body, { secret = SECRET, ts = String(Date.now()), ip = '7.7.7.7' } = {}) => {
    const raw = typeof body === 'string' ? body : JSON.stringify(body);
    const r = await mod.default.fetch(new Request('https://t/api/ext/mail', { method: 'POST', headers: { 'content-type': 'application/json', 'x-nx-timestamp': ts, 'x-nx-signature': sign(ts, raw, secret), 'CF-Connecting-IP': ip }, body: raw }), env);
    return { s: r.status, j: await r.json().catch(() => null) };
  };
  const gold = async () => { const r = await mod.default.fetch(new Request('https://t/api/ext/gold', { method: 'GET', headers: { 'CF-Connecting-IP': '8.8.8.8' } }), env); return { s: r.status, j: await r.json().catch(() => null) }; };
  return { env, mail, gold };
}

test('ext/mail: imzasız veya yanlış imzalı istek reddedilir, posta gitmez', { skip }, async () => {
  const { env, mail } = await setup();
  const bad = await mail({ to: 'a@b.co', subject: 'x', text: 'y' }, { secret: 'z'.repeat(32) });
  assert.equal(bad.s, 401); assert.equal(env.__mail.length, 0);
  const old = await mail({ to: 'a@b.co', subject: 'x', text: 'y' }, { ts: String(Date.now() - 10 * 60e3) });
  assert.equal(old.s, 401, 'eski zaman damgası');
});

test('ext/mail: geçerli istek ortak posta modülüyle gönderilir; geçersiz alıcı/konu reddedilir', { skip }, async () => {
  const { env, mail } = await setup();
  const ok = await mail({ to: 'Oyuncu@Example.com', subject: 'FOREVYE NEXUS doğrulama kodu', text: 'Kodunuz: 123456' });
  assert.equal(ok.s, 200); assert.equal(ok.j.ok, true);
  assert.deepEqual(env.__mail[0], { to: 'oyuncu@example.com', subject: 'FOREVYE NEXUS doğrulama kodu', text: 'Kodunuz: 123456' });
  for (const body of [{ to: 'yok', subject: 's', text: 't' }, { to: 'a@b.co', subject: 'a\nBcc: x@y.z', text: 't' }, { to: 'a@b.co', subject: '', text: 't' }, { to: 'a@b.co', subject: 's', text: 'x'.repeat(2001) }, { to: 'a@b.co,c@d.ef', subject: 's', text: 't' }]) {
    const r = await mail(body); assert.equal(r.s, 400, JSON.stringify(body).slice(0, 40)); assert.equal(r.j.error, 'invalid');
  }
  assert.equal(env.__mail.length, 1);
});

test('ext/mail: aynı alıcıya 10 dakikada en fazla 5 posta', { skip }, async () => {
  const { env, mail } = await setup();
  for (let i = 0; i < 5; i++) assert.equal((await mail({ to: 'sik@example.com', subject: 's' + i, text: 't' })).s, 200);
  const r = await mail({ to: 'sik@example.com', subject: 's6', text: 't' });
  assert.equal(r.s, 429); assert.equal(r.j.error, 'rate_limited'); assert.equal(env.__mail.length, 5);
});

test('ext/mail: posta servisi ayarlı değilse 503 (sessizce başarılı sayılmaz)', { skip }, async () => {
  const { env, mail } = await setup();
  delete env.__mail;
  const r = await mail({ to: 'a@b.co', subject: 's', text: 't' });
  assert.equal(r.s, 503); assert.equal(r.j.error, 'unavailable');
});

test('ext/gold: dış kaynak 60 sn önbelleklenir; kaynak çökünce bayat fiyat işaretlenir', { skip }, async () => {
  const { env, gold } = await setup();
  const realFetch = globalThis.fetch; let calls = 0, price = 2650.5, down = false;
  globalThis.fetch = async (u) => { calls++; if (down) return new Response('x', { status: 500 }); return new Response(JSON.stringify({ price }), { status: 200 }); };
  try {
    const a = await gold(); assert.equal(a.s, 200); assert.equal(a.j.price, 2650.5); assert.equal(calls, 1);
    price = 9999; const b = await gold(); assert.equal(b.j.price, 2650.5, 'önbellekten'); assert.equal(calls, 1);
    await env.DB.prepare("UPDATE ext_cache SET t = t - 120000 WHERE k='gold'").run();   // önbelleği eskit
    const c = await gold(); assert.equal(c.j.price, 9999); assert.equal(calls, 2);
    await env.DB.prepare("UPDATE ext_cache SET t = t - 120000 WHERE k='gold'").run(); down = true;
    const d = await gold(); assert.equal(d.s, 200); assert.equal(d.j.stale, true); assert.equal(d.j.price, 9999);
    await env.DB.prepare("UPDATE ext_cache SET t = t - 3600000 WHERE k='gold'").run();   // 15 dakikadan eski
    assert.equal((await gold()).s, 503);
  } finally { globalThis.fetch = realFetch; }
});

test('ext/gold: saçma fiyat (örn. 5) kabul edilmez', { skip }, async () => {
  const { gold } = await setup();
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ price: 5 }), { status: 200 });
  try { assert.equal((await gold()).s, 503); } finally { globalThis.fetch = realFetch; }
});
