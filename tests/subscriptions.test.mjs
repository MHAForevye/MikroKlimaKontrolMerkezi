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


test('abonelik: KRS bakiyesi ile satın alma, dönemleri kuyruğa ekleme ve tekrar isteğinde çift düşmeme', { skip }, async () => {
 const { env, call } = await setup();
 const a=await call('/api/init');
 await call('/api/admin/add',{to:a.j.id,n:1000},{'X-MK-Admin':'x'.repeat(24)});
 const h=bearer(a);
 const cat=await call('/api/subscriptions/catalog',{},h);
 assert.equal(cat.s,200);
 const p=cat.j.products.find(x=>x.id==='mantar-pro');
 assert.ok(p);
 const buy=await call('/api/subscriptions/purchase',{product_id:p.id,periods:2,idem:'test_idem_123456789'},h);
 assert.equal(buy.s,201);
 assert.equal(buy.j.balance,1030-2*p.price);
 const sub=buy.j.subscriptions.find(x=>x.product_id===p.id);
 assert.equal(sub.expires_at-sub.starts_at,2*p.durationSec);
 const replay=await call('/api/subscriptions/purchase',{product_id:p.id,periods:2,idem:'test_idem_123456789'},h);
 assert.equal(replay.j.replayed,true);
 assert.equal(replay.j.balance,buy.j.balance);
});

test('abonelik: otomatik yenileme süresi dolunca sunucu göreviyle KRS düşer; bakiye yetmezse durur', { skip }, async () => {
 const { env, call } = await setup();
 const a=await call('/api/init');
 await call('/api/admin/add',{to:a.j.id,n:1000},{'X-MK-Admin':'x'.repeat(24)});
 const h=bearer(a), cat=await call('/api/subscriptions/catalog',{},h);
 const p=cat.j.products.find(x=>x.id==='mantar-pro');
 await call('/api/subscriptions/purchase',{product_id:p.id,periods:1,idem:'renew_idem_1234567'},h);
 await call('/api/subscriptions/auto-renew',{product_id:p.id,enabled:true},h);
 env.db.prepare('UPDATE subscriptions SET expires_at=1 WHERE uid=? AND product_id=?').run(a.j.id,p.id);
 const mod=await import('../worker/index.js');
 await mod.default.scheduled({scheduledTime:Date.now(),cron:'*/5 * * * *'},{...env},{waitUntil:p=>p});
 const st=await call('/api/subscriptions/state',{},h);
 const sub=st.j.subscriptions.find(x=>x.product_id===p.id);
 assert.ok(sub.expires_at>1);
 assert.equal(sub.autoRenew,true);
});


test('abonelik: yenileme anında KRS yetmezse ödeme başarısız olur ve otomatik yenileme kapanır', { skip }, async () => {
 const { env, call } = await setup();
 const a=await call('/api/init');
 await call('/api/admin/add',{to:a.j.id,n:1000},{'X-MK-Admin':'x'.repeat(24)});
 const h=bearer(a), cat=await call('/api/subscriptions/catalog',{},h);
 const p=cat.j.products.find(x=>x.id==='mantar-pro');
 await call('/api/subscriptions/purchase',{product_id:p.id,periods:1,idem:'renew_fail_1234567'},h);
 await call('/api/subscriptions/auto-renew',{product_id:p.id,enabled:true},h);
 env.db.prepare('UPDATE users SET bal=0 WHERE id=?').run(a.j.id);
 env.db.prepare('UPDATE subscriptions SET expires_at=1 WHERE uid=? AND product_id=?').run(a.j.id,p.id);
 const mod=await import('../worker/index.js');
 await mod.default.scheduled({scheduledTime:Date.now(),cron:'*/5 * * * *'},{...env},{waitUntil:p=>p});
 const st=await call('/api/subscriptions/state',{},h);
 const sub=st.j.subscriptions.find(x=>x.product_id===p.id);
 assert.equal(sub.status,'payment_failed');
 assert.equal(sub.autoRenew,false);
});
