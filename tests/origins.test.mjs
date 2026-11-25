/* İki GitHub hesabı (mhaforevye + frovyes) için CORS GARANTİSİ.
   Cloudflare panelindeki/wrangler.toml'daki değişkenler boş, yanlış ya da eski olsa bile FOREVYE ID çalışmalı. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PINNED_ORIGINS, cleanOrigin, parseOrigins, withPinned } from '../worker/origins.js';

let DatabaseSync = null;
try { ({ DatabaseSync } = await import('node:sqlite')); } catch (e) {}
const skip = DatabaseSync ? false : 'node:sqlite yok (Node 22.5+ gerekir)';

const MH = 'https://mhaforevye.github.io', FR = 'https://frovyes.github.io';

function makeEnv(extra = {}) {   // KASITLI OLARAK hiçbir *_ORIGIN değişkeni yok: panel boş/silinmiş senaryosu
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
  return { DB: D1, ADMIN_TOKEN: 'x'.repeat(24), NEXUS_SECRET: 'n'.repeat(32), ...extra };
}
const req = (mod, env, method, path, origin, body) => mod.default.fetch(new Request('https://t' + path, {
  method, headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '8.8.8.8', ...(origin ? { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } : {}) },
  body: method === 'GET' || method === 'OPTIONS' ? undefined : JSON.stringify(body || {})
}), env);

test('sabit liste: iki GitHub hesabı koda gömülü ve joker içermez', () => {
  assert.deepEqual([...PINNED_ORIGINS], [MH, FR]);
  for (const o of PINNED_ORIGINS) assert.match(o, /^https:\/\/[a-z0-9-]+\.github\.io$/);
});
test('origins yardımcıları: yola kaçmış/sonda / olan değer origin\'e indirgenir, tekrarlar atılır', () => {
  assert.equal(cleanOrigin('https://mhaforevye.github.io/forevye-id/'), MH);
  assert.equal(cleanOrigin(' https://frovyes.github.io/ '), FR);
  assert.deepEqual(parseOrigins('https://a.example/, ,https://b.example/x'), ['https://a.example', 'https://b.example']);
  assert.deepEqual(withPinned(MH + '/forevye-id/', 'https://c.example'), [MH, FR, 'https://c.example']);
  assert.deepEqual(withPinned(undefined, null, ''), [MH, FR]);
});

for (const origin of [MH, FR]) {
  test(`ID CORS: hiçbir ortam değişkeni yokken ${origin} için OPTIONS 204 ve doğru başlıklar`, { skip }, async () => {
    const mod = await import('../worker/index.js'), env = makeEnv();
    for (const path of ['/identity/login', '/identity/register', '/identity/me', '/identity/apps']) {
      const r = await req(mod, env, 'OPTIONS', path, origin);
      assert.equal(r.status, 204, path);
      assert.equal(r.headers.get('Access-Control-Allow-Origin'), origin);
      assert.match(r.headers.get('Access-Control-Allow-Methods'), /PATCH/); assert.match(r.headers.get('Access-Control-Allow-Methods'), /DELETE/);
      assert.match(r.headers.get('Access-Control-Allow-Headers'), /Authorization/); assert.match(r.headers.get('Access-Control-Allow-Headers'), /Content-Type/);
      assert.equal(r.headers.get('Vary'), 'Origin');
    }
  });
  test(`ID CORS: ${origin} için gerçek yanıtlar (200/4xx) okunabilir; panel değişkeni yanlış olsa da`, { skip }, async () => {
    const mod = await import('../worker/index.js');
    // Panel değişkenleri YANLIŞ: ID_ORIGIN/MARKET_ORIGIN/ZP_ORIGIN başka bir adrese ayarlı
    const env = makeEnv({ ID_ORIGIN: 'https://yanlis.example', MARKET_ORIGIN: 'https://yanlis.example', ZP_ORIGIN: 'https://yanlis.example' });
    const cfg = await req(mod, env, 'GET', '/identity/client-config', origin);
    assert.equal(cfg.status, 200); assert.equal(cfg.headers.get('Access-Control-Allow-Origin'), origin);
    const bad = await req(mod, env, 'POST', '/identity/login', origin, { email: 'x@y.co', password: 'Parola12345' });
    assert.ok(bad.status >= 400 && bad.status < 500, 'hatalı giriş 4xx');
    assert.equal(bad.headers.get('Access-Control-Allow-Origin'), origin, 'hata yanıtında da CORS başlığı olmalı');
  });
  test(`Mağaza/hesaplı uçlar: değişken yokken ${origin} okuyabilir`, { skip }, async () => {
    const mod = await import('../worker/index.js'), env = makeEnv();
    const pre = await req(mod, env, 'OPTIONS', '/api/sync', origin);
    assert.equal(pre.status, 204); assert.equal(pre.headers.get('Access-Control-Allow-Origin'), origin);
    const init = await req(mod, env, 'POST', '/api/init', origin);
    assert.equal(init.status, 200); assert.equal(init.headers.get('Access-Control-Allow-Origin'), origin);
  });
}

test('Zamanlayıcı açık uçları: ZP_ORIGIN yalnızca tek hesabı içerse bile iki hesap da okuyabilir; boşsa eskisi gibi *', { skip }, async () => {
  const mod = await import('../worker/index.js');
  const one = makeEnv({ ZP_ORIGIN: FR });
  for (const o of [MH, FR]) assert.equal((await req(mod, one, 'POST', '/api/zamanlayici/redeem', o)).headers.get('Access-Control-Allow-Origin'), o);
  assert.equal((await req(mod, makeEnv(), 'POST', '/api/zamanlayici/redeem', 'https://herhangi.example')).headers.get('Access-Control-Allow-Origin'), '*');
});

test('GÜVENLİK: sabit listede/ayarda olmayan origin reddedilir (joker ve alt alan adı eşleşmesi yok)', { skip }, async () => {
  const mod = await import('../worker/index.js'), env = makeEnv();
  for (const evil of ['https://kotu.example', 'https://evil.github.io', 'https://mhaforevye.github.io.kotu.example', 'http://mhaforevye.github.io', 'https://sub.mhaforevye.github.io']) {
    const pre = await req(mod, env, 'OPTIONS', '/identity/login', evil);
    assert.equal(pre.status, 403, evil);
    assert.equal(pre.headers.get('Access-Control-Allow-Origin'), null, evil);
    const r = await req(mod, env, 'POST', '/identity/login', evil, { email: 'x@y.co', password: 'Parola12345' });
    assert.equal(r.headers.get('Access-Control-Allow-Origin'), null, evil);
  }
});

test('panel değişkeni sabit listeye EK adres ekleyebilir', { skip }, async () => {
  const mod = await import('../worker/index.js'), env = makeEnv({ ID_ORIGIN: 'https://ek.example' });
  assert.equal((await req(mod, env, 'OPTIONS', '/identity/login', 'https://ek.example')).status, 204);
  assert.equal((await req(mod, env, 'OPTIONS', '/identity/login', MH)).status, 204);
});

test('wrangler.toml: ID_ORIGIN / MARKET_ORIGIN / ZP_ORIGIN iki GitHub hesabını da içerir (dosya ↔ kod tutarlı)', () => {
  const toml = readFileSync('wrangler.toml', 'utf8');
  const val = k => { const m = new RegExp('^' + k + '\\s*=\\s*"([^"]*)"', 'm').exec(toml); assert.ok(m, k + ' wrangler.toml içinde tanımlı olmalı'); return parseOrigins(m[1]); };
  for (const k of ['MARKET_ORIGIN', 'ZP_ORIGIN']) for (const o of PINNED_ORIGINS) assert.ok(val(k).includes(o), `${k} içinde ${o} yok`);
  assert.ok(val('ID_ORIGIN').includes(MH), 'ID_ORIGIN, FOREVYE ID Pages adresini (mhaforevye) içermeli');
});

test('Nexus ile aynı sabit liste (kardeş depo yanındaysa karşılaştırılır)', () => {
  let nx = null;
  for (const p of ['../forevye-nexus/src/lib/origins.js', '../forevye-nexus-main/src/lib/origins.js']) { try { nx = readFileSync(p, 'utf8'); break; } catch (e) {} }
  if (!nx) return;   // tek başına çalışırken atla
  for (const o of PINNED_ORIGINS) assert.ok(nx.includes(`'${o}'`), `Nexus origins.js içinde ${o} yok`);
});
