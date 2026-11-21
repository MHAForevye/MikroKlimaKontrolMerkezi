/* Nexus Pass (kristalle üyelik) + Nexus bankası için sunucudan sunucuya hediye kartı bozdurma.
   index.js'ten `makeNexus(ctx)` ile bağlanır (ctx: ortak yardımcılar). Fiyatlar/süreler sadece NP bloğunda belirlenir. */

export const NP = {
  // dur: saniye, price: kristal. Tarayıcının gönderdiği tutar HİÇ kullanılmaz.
  products: [
    { id: 'p1', app: 'FOREVYE Photos', name: 'Premium 3 Gün', desc: 'Sınırsız yedekleme ve reklamsız kullanım.', features: ['Sınırsız yedekleme', 'Reklamsız kullanım'], dur: 72 * 3600, price: 150, status: 'on', version: 1 },
    { id: 'p2', app: 'FOREVYE Photos', name: 'Premium 30 Gün', desc: 'Sınırsız yedekleme ve gelişmiş düzenleme.', features: ['Sınırsız yedekleme', 'Gelişmiş düzenleme', 'Reklamsız kullanım'], dur: 30 * 86400, price: 900, status: 'on', version: 1 },
    { id: 'p3', app: 'FOREVYE Notes', name: 'Premium 7 Gün', desc: 'Sınırsız not defteri ve etiketler.', features: ['Sınırsız not defteri', 'Etiketler'], dur: 168 * 3600, price: 300, status: 'on', version: 1 },
    { id: 'p4', app: 'FOREVYE Vault', name: 'Premium 30 Gün', desc: 'Genişletilmiş şifreli depolama.', features: ['Genişletilmiş depolama', 'Şifreli paylaşım'], dur: 30 * 86400, price: 1200, status: 'on', version: 1 },
    { id: 'p5', app: 'FOREVYE Notes', name: 'Premium Eski Paket', desc: 'Satıştan kaldırıldı.', features: [], dur: 86400, price: 50, status: 'off', version: 1 }
  ],
  perPage: 5, maxPage: 200
};
const prod = id => NP.products.find(p => p.id === String(id)) || null;

export function makeNexus(c) {
  const { json, fail, sha256hex, rndStr, eq, nowSec, addLog, rlBump, rlCount, tooMany, toInt, auth, AB, CFG, stamp } = c;
  const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  const nowMs = () => Date.now();

  const entOut = (e, p, snap) => ({ id: e.id, pid: e.pid, status: e.expires <= nowMs() ? 'expired' : 'active', starts: e.starts, expires: e.expires, purchaseId: e.purchase_id, product: p || null, snap: snap || null });
  const purOut = r => ({ id: r.id, pid: r.pid, app: r.app, name: r.name, price: r.price, dur: r.dur, status: r.status, at: r.at, ledger: r.ledger || undefined });

  async function me(env, u) {
    const bal = await env.DB.prepare('SELECT bal FROM users WHERE id=?').bind(u.id).first();
    const ents = (await env.DB.prepare('SELECT * FROM np_ents WHERE uid=? ORDER BY starts DESC LIMIT 100').bind(u.id).all()).results || [];
    const out = [];
    for (const e of ents) {
      const snap = await env.DB.prepare('SELECT * FROM np_purchases WHERE id=?').bind(e.purchase_id).first();
      out.push(entOut(e, prod(e.pid), snap ? purOut(snap) : null));
    }
    return json({ ok: 1, balance: bal ? bal.bal : 0, entitlements: out });
  }
  const products = () => json({ ok: 1, products: NP.products.filter(p => p.status === 'on') });
  const product = b => json({ ok: 1, product: prod(b.id) });
  async function purchases(env, u, b) {
    const page = toInt(b.page == null ? 0 : b.page, 0, NP.maxPage) ?? 0, size = NP.perPage;
    const rows = (await env.DB.prepare('SELECT * FROM np_purchases WHERE uid=? ORDER BY at DESC, rowid DESC LIMIT ? OFFSET ?').bind(u.id, size + 1, page * size).all()).results || [];
    return json({ ok: 1, items: rows.slice(0, size).map(purOut), more: rows.length > size });
  }

  async function purchase(env, u, b) {
    await rlBump(env, 'npbuy', u.id);
    if ((await rlCount(env, 'npbuy', u.id)) > CFG.buyPer10m) return tooMany();
    const idem = String(b.idem || '');
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(idem)) return fail('Geçersiz işlem anahtarı.');
    const old = await env.DB.prepare('SELECT * FROM np_purchases WHERE uid=? AND idem=?').bind(u.id, idem).first();
    if (old) return json({ ok: true, repeat: true, purchase: purOut(old) });
    const p = prod(b.pid), t = nowMs(), pid = String(b.pid || '').slice(0, 40);
    const failed = async (code, extra) => {
      const id = 'tx_' + rndStr(10, AB).toLowerCase();
      await env.DB.prepare("INSERT INTO np_purchases(id,uid,pid,app,name,price,dur,status,idem,at) VALUES(?,?,?,?,?,?,?,'failed',?,?)")
        .bind(id, u.id, pid, p ? p.app : '-', p ? p.name : '-', p ? p.price : 0, p ? p.dur : 0, 'f:' + id, t).run();
      return json(Object.assign({ ok: false, code }, extra || {}), 200);
    };
    if (!p || p.status !== 'on') return failed('unavailable');
    const act = await env.DB.prepare('SELECT 1 AS x FROM np_ents WHERE uid=? AND pid=? AND expires>?').bind(u.id, p.id, t).first();
    if (act) return failed('already_active');
    const bal = await env.DB.prepare('SELECT bal FROM users WHERE id=?').bind(u.id).first();
    // bakiye kontrolü ve düşüm tek atomik komutta
    const up = await env.DB.prepare('UPDATE users SET bal=bal-?, spent=spent+? WHERE id=? AND bal>=?').bind(p.price, p.price, u.id, p.price).run();
    if (!up.meta.changes) return failed('insufficient', { missing: p.price - (bal ? bal.bal : 0), balance: bal ? bal.bal : 0 });
    const id = 'tx_' + rndStr(10, AB).toLowerCase(), eid = 'ent_' + rndStr(10, AB).toLowerCase(), ledger = 'ldg_' + rndStr(10, AB).toLowerCase();
    try {
      await env.DB.batch([
        env.DB.prepare("INSERT INTO np_purchases(id,uid,pid,app,name,price,dur,status,idem,at,ledger) VALUES(?,?,?,?,?,?,?,'success',?,?,?)").bind(id, u.id, p.id, p.app, p.name, p.price, p.dur, idem, t, ledger),
        env.DB.prepare('INSERT INTO np_ents(id,uid,pid,starts,expires,purchase_id) VALUES(?,?,?,?,?,?)').bind(eid, u.id, p.id, t, t + p.dur * 1000, id),
        env.DB.prepare('INSERT INTO log(uid,kind,delta,ref,t) VALUES(?,?,?,?,?)').bind(u.id, 'npass', -p.price, p.id + ':' + id, stamp())
      ]);
    } catch (e) {   // yazılamadıysa (aynı idem yarışı dahil) kristali iade et
      await env.DB.prepare('UPDATE users SET bal=bal+?, spent=spent-? WHERE id=?').bind(p.price, p.price, u.id).run();
      const again = await env.DB.prepare('SELECT * FROM np_purchases WHERE uid=? AND idem=?').bind(u.id, idem).first();
      if (again) return json({ ok: true, repeat: true, purchase: purOut(again) });
      return fail('İşlem kaydedilemedi, kristalin iade edildi. Tekrar dene.', 500);
    }
    const pur = await env.DB.prepare('SELECT * FROM np_purchases WHERE id=?').bind(id).first();
    return json({ ok: true, purchase: purOut(pur), entitlement: { id: eid, pid: p.id, status: 'active', starts: t, expires: t + p.dur * 1000, purchaseId: id } });
  }

  async function handle(path, req, env, b) {
    if (path === '/api/npass/products') return products();
    if (path === '/api/npass/product') return product(b);
    const u = await auth(req, env);
    if (!u) return fail('Oturum geçersiz.', 401);
    switch (path) {
      case '/api/npass/me': return me(env, u);
      case '/api/npass/purchases': return purchases(env, u, b);
      case '/api/npass/purchase': return purchase(env, u, b);
    }
    return fail('Bulunamadı.', 404);
  }

  /* ===== Nexus bankası: sunucudan sunucuya hediye kartı bozdurma =====
     POST /api/ext/giftcard/redeem  başlıklar: x-nx-timestamp (ms), x-nx-signature = HMAC-SHA256(NEXUS_SECRET, "<ts>.<gövde>") hex
     gövde: { user_id, code: "NNNNNNNN CVV AA/YY", idempotency_key }
     200 { ok:true, amount:<kristal>, unit:'kristal', reference } · 4xx { ok:false, error:'invalid'|'used'|'expired' }
     Aynı kullanıcı aynı kartı tekrar gönderirse (ağ tekrarı) aynı reference döner; Nexus defteri referansla tekrar-güvenlidir. */
  async function hmac(secret, msg) {
    const te = new TextEncoder();
    const k = await crypto.subtle.importKey('raw', te.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return hex(await crypto.subtle.sign('HMAC', k, te.encode(msg)));
  }
  const xfail = (error, s) => json({ ok: false, error }, s);
  async function extRedeem(req, env, raw) {
    if (!env.NEXUS_SECRET || env.NEXUS_SECRET.length < 16) return json({ ok: false, error: 'unavailable' }, 503);
    const ts = req.headers.get('x-nx-timestamp') || '', sig = req.headers.get('x-nx-signature') || '';
    if (!/^\d{10,16}$/.test(ts) || Math.abs(Date.now() - Number(ts)) > 5 * 60e3) return json({ ok: false, error: 'bad_signature' }, 401);
    if (!eq(await hmac(env.NEXUS_SECRET, ts + '.' + raw), sig)) return json({ ok: false, error: 'bad_signature' }, 401);
    let b; try { b = JSON.parse(raw); } catch (e) { return xfail('invalid', 400); }
    const uid = String(b.user_id || '');
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(uid)) return xfail('invalid', 400);
    await rlBump(env, 'xuse', uid);
    if ((await rlCount(env, 'xuse', uid)) > CFG.redeemPer10m) return json({ ok: false, error: 'rate_limited' }, 429);
    const d = String(b.code || '').replace(/\D/g, '');
    if (d.length !== 15) return xfail('invalid', 400);
    const no = d.slice(0, 8), cvv = d.slice(8, 11), ex = d.slice(11, 13) + '/' + d.slice(13, 15);
    if (!c.cardOk(no) || +d.slice(11, 13) < 1 || +d.slice(11, 13) > 12) return xfail('invalid', 400);
    await c.ensureCards(env);
    const K = CFG.cards, now = nowSec(), who = 'nx:' + uid;
    const row = await env.DB.prepare('SELECT no,cvv,ex,exp,n,status,to_id,lock_until,bad FROM gcards WHERE no=?').bind(no).first();
    if (!row || row.lock_until > now) return xfail('invalid', 400);
    const good = eq(row.cvv, cvv) & eq(row.ex, ex);
    if (!good) {
      const bad = row.bad + 1, lock = bad >= K.failLock;
      await env.DB.prepare('UPDATE gcards SET bad=?, lock_until=? WHERE no=?').bind(lock ? 0 : bad, lock ? now + K.lockMin * 60 : 0, no).run();
      return xfail('invalid', 400);
    }
    if (row.status === 'used') return row.to_id === who ? json({ ok: true, amount: row.n, unit: 'kristal', reference: 'mkgc:' + no, repeat: true }) : xfail('used', 400);
    if (row.status !== 'active') return xfail('invalid', 400);
    if (row.exp <= now) return xfail('expired', 400);
    const up = await env.DB.prepare("UPDATE gcards SET status='used', to_id=?, used_at=?, bad=0 WHERE no=? AND status='active' AND exp>?").bind(who, now, no, now).run();
    if (!up.meta.changes) return xfail('used', 400);
    await addLog(env, 'nexus', 'card_use', 0, 'nx:' + no);
    return json({ ok: true, amount: row.n, unit: 'kristal', reference: 'mkgc:' + no });
  }

  return { handle, extRedeem };
}
