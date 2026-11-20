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
  let n = 0;
  const call = async (path, body = {}, headers = {}, ip = '1.2.3.4') => {
    const r = await mod.default.fetch(new Request('https://t' + path, { method: 'POST', headers: { 'content-type': 'application/json', 'CF-Connecting-IP': ip, ...headers }, body: JSON.stringify(body) }), env);
    return { s: r.status, j: await r.json() };
  };
  const user = async (bal = 0) => {   // yeni hesap (30 kristal) + istenen bakiyeye tamamlar
    const a = await call('/api/init', {}, {}, '10.0.0.' + (++n));
    const h = { Authorization: 'Bearer ' + a.j.id + '.' + a.j.token };
    if (bal > 30) await call('/api/admin/add', { to: a.j.id, n: bal - 30 }, { 'X-MK-Admin': 'x'.repeat(24) });
    return { id: a.j.id, h, ip: '10.0.0.' + n };
  };
  const bal = async u => (await call('/api/sync', {}, u.h)).j.s.bal;
  return { env, call, user, bal };
}
const luhn = s => { let sum = 0; for (let i = 0; i < s.length; i++) { let d = +s[s.length - 1 - i]; if (i % 2) { d *= 2; if (d > 9) d -= 9; } sum += d; } return sum % 10 === 0; };
const realNow = Date.now;

test('kart oluşturma: tutar oluşturandan düşer; no 8 hane + Luhn, CVV 3 hane, SKT AA/YY', { skip }, async () => {
  const { call, user, bal } = await setup(); const a = await user(1000);
  const r = await call('/api/card/create', { n: 400, tpl: 7, msg: 'İyi ki doğdun', frm: 'Ahmet' }, a.h);
  assert.equal(r.s, 200); assert.equal(r.j.s.bal, 600); assert.equal(await bal(a), 600);
  const c = r.j.card;
  assert.match(c.no, /^[1-9]\d{7}$/); assert.ok(luhn(c.no)); assert.match(c.cvv, /^\d{3}$/); assert.match(c.ex, /^(0[1-9]|1[0-2])\/\d{2}$/);
  assert.equal(c.n, 400); assert.equal(c.tpl, 7); assert.equal(c.msg, 'İyi ki doğdun'); assert.equal(c.frm, 'Ahmet'); assert.equal(c.status, 'active');
});

test('kart oluşturma: yetersiz bakiye, geçersiz tutar/şablon reddedilir ve bakiye değişmez', { skip }, async () => {
  const { call, user, bal } = await setup(); const a = await user(100);
  assert.equal((await call('/api/card/create', { n: 101, tpl: 0 }, a.h)).s, 400);
  assert.equal((await call('/api/card/create', { n: 9, tpl: 0 }, a.h)).s, 400, 'alt sınır');
  assert.equal((await call('/api/card/create', { n: 100001, tpl: 0 }, a.h)).s, 400, 'üst sınır');
  assert.equal((await call('/api/card/create', { n: 50, tpl: 15 }, a.h)).s, 400, 'şablon 0-14');
  assert.equal((await call('/api/card/create', { n: '50; DROP', tpl: 0 }, a.h)).s, 400);
  assert.equal(await bal(a), 100);
  assert.equal((await call('/api/card/create', { n: 50, tpl: 0 })).s, 401, 'oturumsuz');
});

test('bozdurma: doğru no + CVV + SKT ile tutar alıcıya eklenir, kart tek kullanımlık', { skip }, async () => {
  const { call, user, bal } = await setup(); const a = await user(500), b = await user(0);
  const c = (await call('/api/card/create', { n: 300, tpl: 3 }, a.h)).j.card, before = await bal(b);
  const r = await call('/api/card/redeem', { no: c.no, cvv: c.cvv, ex: c.ex }, b.h);
  assert.equal(r.s, 200); assert.equal(r.j.added, 300); assert.equal(r.j.s.bal, before + 300); assert.equal(r.j.card.tpl, 3);
  assert.equal(r.j.s.gift, 300);
  const again = await call('/api/card/redeem', { no: c.no, cvv: c.cvv, ex: c.ex }, b.h);
  assert.equal(again.s, 400); assert.match(again.j.err, /kullanılmış/);
  const other = await call('/api/card/redeem', { no: c.no, cvv: c.cvv, ex: c.ex }, a.h);
  assert.match(other.j.err, /kullanılmış/); assert.equal(await bal(a), 200 + 0, 'oluşturan geri almaz');
  assert.equal(await bal(b), before + 300);
});

test('bozdurma: SKT farklı yazımlarla (1127, 11-27, 11 / 27) kabul edilir', { skip }, async () => {
  const { call, user } = await setup(); const a = await user(300), b = await user(0), c2 = await user(0);
  const c = (await call('/api/card/create', { n: 20, tpl: 0 }, a.h)).j.card;
  const noSlash = c.ex.replace('/', '');
  assert.equal((await call('/api/card/redeem', { no: c.no.slice(0, 4) + ' ' + c.no.slice(4), cvv: c.cvv, ex: noSlash }, b.h)).s, 200);
  const d = (await call('/api/card/create', { n: 20, tpl: 0 }, a.h)).j.card;
  assert.equal((await call('/api/card/redeem', { no: d.no, cvv: d.cvv, ex: d.ex.replace('/', ' / ') }, c2.h)).s, 200);
});

test('güvenlik: yanlış CVV, SKT, numara, Luhn hatası hep aynı cevabı verir; kartın var olduğu sızmaz', { skip }, async () => {
  const { call, user, bal } = await setup(); const a = await user(500), b = await user(0);
  const c = (await call('/api/card/create', { n: 100, tpl: 0 }, a.h)).j.card;
  const wrongCvv = String((+c.cvv + 1) % 1000).padStart(3, '0');
  const wrongEx = c.ex.slice(0, 3) + String((+c.ex.slice(3) + 1) % 100).padStart(2, '0');
  const msgs = new Set();
  for (const body of [{ no: c.no, cvv: wrongCvv, ex: c.ex }, { no: c.no, cvv: c.cvv, ex: wrongEx }, { no: '10000009', cvv: '123', ex: c.ex }, { no: '12345678', cvv: '123', ex: c.ex }, { no: 'abc', cvv: '1', ex: 'x' }]) {
    const r = await call('/api/card/redeem', body, b.h); assert.equal(r.s, 400); msgs.add(r.j.err);
  }
  assert.equal(msgs.size, 1, [...msgs].join(' | '));
  assert.equal(await bal(b), 30, 'hiçbir kristal eklenmedi');
});

test('güvenlik: 5 yanlış denemeden sonra kart kilitlenir, doğru bilgi de kilitliyken geçmez, süre sonra açılır', { skip }, async () => {
  try {
    const { call, user, bal } = await setup(); const a = await user(500), b = await user(0);
    const c = (await call('/api/card/create', { n: 100, tpl: 0 }, a.h)).j.card, wrong = String((+c.cvv + 1) % 1000).padStart(3, '0');
    for (let i = 0; i < 5; i++) await call('/api/card/redeem', { no: c.no, cvv: wrong, ex: c.ex }, b.h);
    const locked = await call('/api/card/redeem', { no: c.no, cvv: c.cvv, ex: c.ex }, b.h);
    assert.equal(locked.s, 400); assert.equal(await bal(b), 30, 'kilitliyken doğru bilgi geçmedi');
    const t0 = realNow(); Date.now = () => t0 + 16 * 60 * 1000;
    const ok = await call('/api/card/redeem', { no: c.no, cvv: c.cvv, ex: c.ex }, b.h);
    assert.equal(ok.s, 200); assert.equal(ok.j.added, 100);
  } finally { Date.now = realNow; }
});

test('hız sınırı: hesap başına 10 dakikada 20 deneme, IP başına 40', { skip }, async () => {
  const { call, user } = await setup(); const b = await user(0); let r;
  for (let i = 0; i < 21; i++) r = await call('/api/card/redeem', { no: '12345674', cvv: '111', ex: '01/30' }, b.h, b.ip);
  assert.equal(r.s, 429);
  const { call: call2, user: user2 } = await setup(); let last;
  for (let i = 0; i < 41; i++) { const u = await user2(0); last = await call2('/api/card/redeem', { no: '12345674', cvv: '111', ex: '01/30' }, u.h, '7.7.7.7'); }
  assert.equal(last.s, 429, 'aynı IP, farklı hesaplar');
});

test('iptal: kullanılmamış kart iptal edilir ve tutar geri gelir; kullanılmış ya da başkasının kartı iptal edilemez', { skip }, async () => {
  const { call, user, bal } = await setup(); const a = await user(500), b = await user(0);
  const c1 = (await call('/api/card/create', { n: 200, tpl: 0 }, a.h)).j.card, c2 = (await call('/api/card/create', { n: 100, tpl: 1 }, a.h)).j.card;
  assert.equal(await bal(a), 200);
  assert.equal((await call('/api/card/cancel', { no: c1.no }, b.h)).s, 404, 'başkasının kartı');
  const r = await call('/api/card/cancel', { no: c1.no }, a.h);
  assert.equal(r.s, 200); assert.equal(r.j.refunded, 200); assert.equal(r.j.s.bal, 400); assert.equal(r.j.s.spent, 100);
  assert.match((await call('/api/card/redeem', { no: c1.no, cvv: c1.cvv, ex: c1.ex }, b.h)).j.err, /geçerli değil/);
  await call('/api/card/redeem', { no: c2.no, cvv: c2.cvv, ex: c2.ex }, b.h);
  assert.equal((await call('/api/card/cancel', { no: c2.no }, a.h)).s, 400, 'kullanılmış kart');
  assert.equal((await call('/api/card/cancel', { no: c1.no }, a.h)).s, 400, 'çifte iptal iade etmez');
  assert.equal(await bal(a), 400);
});

test('süre dolumu: SKT geçen kart bozdurulamaz; oluşturan listeyi açınca tutar iade edilir (bir kez)', { skip }, async () => {
  try {
    const { env, call, user, bal } = await setup(); const a = await user(500), b = await user(0);
    const c = (await call('/api/card/create', { n: 250, tpl: 0 }, a.h)).j.card;
    assert.equal(await bal(a), 250);
    const t0 = realNow(); Date.now = () => t0 + 14 * 31 * 864e5;   // ~14 ay sonra
    const r = await call('/api/card/redeem', { no: c.no, cvv: c.cvv, ex: c.ex }, b.h);
    assert.equal(r.s, 400); assert.match(r.j.err, /geçmiş|geçerli değil/);
    const l = await call('/api/card/list', {}, a.h);
    assert.equal(l.j.s.bal, 500); assert.equal(l.j.cards[0].status, 'expired');
    assert.equal((await call('/api/card/list', {}, a.h)).j.s.bal, 500, 'ikinci listede tekrar iade yok');
    assert.equal(env.db.prepare('SELECT gift FROM users WHERE id=?').get(b.id).gift, 0, 'alıcıya kristal geçmedi');
  } finally { Date.now = realNow; }
});

test('liste: sadece kendi kartları, kullanım durumu görünür; aktif kart sınırı', { skip }, async () => {
  const { call, user } = await setup(); const a = await user(100000), b = await user(0);
  const c = (await call('/api/card/create', { n: 10, tpl: 2 }, a.h)).j.card;
  assert.deepEqual((await call('/api/card/list', {}, b.h)).j.cards, []);
  await call('/api/card/redeem', { no: c.no, cvv: c.cvv, ex: c.ex }, b.h);
  const l = (await call('/api/card/list', {}, a.h)).j.cards; assert.equal(l.length, 1); assert.equal(l[0].status, 'used'); assert.ok(l[0].used > 0); assert.equal(l[0].cvv, c.cvv);
});

test('aktif kart sınırı: 20 aktif karttan sonra yenisi reddedilir', { skip }, async () => {
  const { env, call, user } = await setup(); const a = await user(100000);
  for (let i = 0; i < 20; i++) env.db.prepare("INSERT INTO gcards(no,cvv,ex,exp,uid,n,tpl,t,created) VALUES(?,?,?,?,?,?,?,?,?)").run('1000000' + i, '111', '01/30', 4e9, a.id, 10, 0, 't', 1);
  const r = await call('/api/card/create', { n: 10, tpl: 0 }, a.h);
  assert.equal(r.s, 400); assert.match(r.j.err, /en fazla 20/);
});

test('metin alanları: HTML işaretleri ve kontrol karakterleri temizlenir, uzunluk sınırlanır', { skip }, async () => {
  const { call, user } = await setup(); const a = await user(500);
  const r = await call('/api/card/create', { n: 10, tpl: 0, frm: '<b>Ali</b>\n\tVeli' + 'x'.repeat(50), msg: '<script>alert(1)</script>' + 'y'.repeat(200) }, a.h);
  assert.ok(!/[<>\n\t]/.test(r.j.card.frm + r.j.card.msg)); assert.ok(r.j.card.frm.length <= 24); assert.ok(r.j.card.msg.length <= 80);
});

test('eşzamanlı bozdurma: aynı kart iki hesapta aynı anda denenirse yalnızca biri kristal alır', { skip }, async () => {
  const { call, user, bal } = await setup(); const a = await user(500), b = await user(0), c2 = await user(0);
  const c = (await call('/api/card/create', { n: 100, tpl: 0 }, a.h)).j.card;
  const [x, y] = await Promise.all([call('/api/card/redeem', { no: c.no, cvv: c.cvv, ex: c.ex }, b.h), call('/api/card/redeem', { no: c.no, cvv: c.cvv, ex: c.ex }, c2.h)]);
  assert.equal([x, y].filter(r => r.s === 200).length, 1);
  assert.equal((await bal(b)) + (await bal(c2)), 60 + 100, 'toplam: iki hesabın 30\'u + 100 kristal');
});

test('toplam kristal korunur: oluştur, bozdur ve iptal sonrası kristal yaratılmaz ya da kaybolmaz', { skip }, async () => {
  const { call, user, bal } = await setup(); const a = await user(1000), b = await user(0);
  const total = async () => (await bal(a)) + (await bal(b));
  const t0 = await total(), cs = [];
  for (const n of [100, 200, 300]) cs.push((await call('/api/card/create', { n, tpl: 0 }, a.h)).j.card);
  await call('/api/card/redeem', { no: cs[0].no, cvv: cs[0].cvv, ex: cs[0].ex }, b.h);
  await call('/api/card/cancel', { no: cs[1].no }, a.h);
  assert.equal(await total(), t0 - 300, 'hesaplarda yalnızca bekleyen kartın (300) tutarı eksik');
  await call('/api/card/cancel', { no: cs[2].no }, a.h);
  assert.equal(await total(), t0, 'son kart da iptal edilince toplam ilk haline döner');
});

test('cfg: kart ayarları (tutar sınırı, şablon sayısı) istemciye gider', { skip }, async () => {
  const { call, user } = await setup(); const a = await user(0);
  const r = await call('/api/sync', {}, a.h);
  assert.deepEqual(r.j.cfg.cards, { min: 10, max: 100000, templates: 15, validMonths: 12, maxActive: 20 });
});

test('eski veritabanı (gcards tablosu yok): kart uçları tabloyu kendisi kurar, kart oluşur ve bozdurulur', { skip }, async () => {
  const { call, user, env } = await setup();
  env.db.exec('DROP TABLE gcards');
  const a = await user(500), b = await user(0);
  const c = await call('/api/card/create', { n: 100, tpl: 0 }, a.h, a.ip);
  assert.equal(c.s, 200, JSON.stringify(c.j));
  assert.equal(c.j.s.bal, 400);
  const l = await call('/api/card/list', {}, a.h, a.ip);
  assert.equal(l.s, 200); assert.equal(l.j.cards.length, 1);
  const r = await call('/api/card/redeem', { no: c.j.card.no, cvv: c.j.card.cvv, ex: c.j.card.ex }, b.h, b.ip);
  assert.equal(r.s, 200, JSON.stringify(r.j)); assert.equal(r.j.added, 100);
});
