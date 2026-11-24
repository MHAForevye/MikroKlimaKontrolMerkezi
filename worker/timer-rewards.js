/* Zamanlayıcı günlük kristal görevi.
   Günlük hedef/ilerleme bu Worker'da tutulur; Kristal ödemesi doğrudan FOREVYE NEXUS
   Banka D1 crystal_holdings tablosuna, FOREVYE ID -> banka id_links bağı üzerinden yapılır. */

export const TIMER_REWARD_TARGETS = [60, 300, 600, 900, 1800, 2700, 3600, 7200, 10800, 14400];
const MAX_PULSE_SECONDS = 120;
const STALE_AFTER_MS = 180000;
const QTY_SCALE = 10000;
const dayEndMs = day => Date.parse(day + 'T21:00:00.000Z'); // Türkiye saatiyle sonraki gün 00:00
const rewardFor = seconds => Math.round((seconds * 10 / 3600) * 10000) / 10000;

export function makeTimerRewards(ctx) {
  const { json, fail, rndStr, rndInt, AB, today, stamp, sha256hex } = ctx;
  const schemaPromises = new WeakMap();
  const bankCache = new Map();

  async function ensureSchema(env) {
    let schemaPromise = schemaPromises.get(env.DB);
    if (!schemaPromise) {
      schemaPromise = (async () => {
        const sql = [
          `CREATE TABLE IF NOT EXISTS timer_reward_daily (
            uid TEXT NOT NULL, day TEXT NOT NULL, target_seconds INTEGER NOT NULL,
            credited_seconds INTEGER NOT NULL DEFAULT 0, reward REAL NOT NULL,
            spun_at INTEGER NOT NULL, paid_at INTEGER, reward_ref TEXT NOT NULL DEFAULT '',
            PRIMARY KEY(uid, day)
          )`,
          `CREATE TABLE IF NOT EXISTS timer_reward_segments (
            id TEXT PRIMARY KEY, uid TEXT NOT NULL, day TEXT NOT NULL, mode TEXT NOT NULL,
            started_at INTEGER NOT NULL, last_ping INTEGER NOT NULL,
            active INTEGER NOT NULL DEFAULT 1, pulse_ref TEXT NOT NULL DEFAULT ''
          )`,
          'CREATE INDEX IF NOT EXISTS timer_reward_segments_uid ON timer_reward_segments(uid, active)',
          'CREATE UNIQUE INDEX IF NOT EXISTS timer_reward_one_active ON timer_reward_segments(uid) WHERE active=1',
          'CREATE INDEX IF NOT EXISTS timer_reward_daily_day ON timer_reward_daily(day)'
        ];
        for (const q of sql) await env.DB.prepare(q).run();
      })().catch(e => { schemaPromises.delete(env.DB); throw e; });
      schemaPromises.set(env.DB, schemaPromise);
    }
    return schemaPromise;
  }

  function hex(bytes) { return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join(''); }
  async function hmac(secret, message) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)));
  }
  function assertIdentity(identity) {
    if (!identity || !/^usr_[a-f0-9]{16}$/.test(String(identity.idUserId || '')) ||
        identity.emailVerified !== true || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(identity.email || ''))) {
      const e = new Error('FOREVYE ID hesabının doğrulanmış e-posta bilgisi alınamadı.'); e.status = 401; e.code = 'id_identity_invalid'; throw e;
    }
  }
  async function bankCall(env, identity, action, extra = {}) {
    assertIdentity(identity);
    if (!env.NEXUS_SECRET || env.NEXUS_SECRET.length < 16) {
      const e = new Error('Banka bağlantısı sunucuda yapılandırılmamış.'); e.status = 503; e.code = 'bank_service_unavailable'; throw e;
    }
    const base = String(env.NEXUS_BANK_API_URL || 'https://forevye-nexus.forevyenexus.workers.dev').replace(/\/+$/, '');
    if (!/^https:\/\//i.test(base)) throw new Error('Banka API adresi HTTPS olmalı.');
    const raw = JSON.stringify({ id_user_id: identity.idUserId, email: identity.email.toLowerCase(), email_verified: true, ...extra });
    const ts = String(Date.now());
    const signature = await hmac(env.NEXUS_SECRET, `${ts}.${raw}`);
    let response;
    try {
      response = await fetch(`${base}/api/ext/timer-reward/${action}`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-nx-timestamp': ts, 'x-nx-signature': signature },
        body: raw, signal: AbortSignal.timeout(10000), cache: 'no-store'
      });
    } catch (_) {
      const e = new Error('Banka bağlantısına şu anda ulaşılamıyor. Görev ilerlemen korunuyor.'); e.status = 503; e.code = 'bank_unreachable'; throw e;
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true) {
      const err = data.error || {};
      const e = new Error(err.message || (err.code === 'bank_account_not_found' ? 'FOREVYE ID ile eşleşen banka hesabı bulunamadı.' : 'Banka işlemi tamamlanamadı.'));
      e.status = response.status; e.code = err.code || 'bank_request_failed'; throw e;
    }
    return data;
  }
  async function bankAccount(env, identity, force = false) {
    const key = identity.idUserId, cached = bankCache.get(key);
    if (!force && cached && cached.until > Date.now()) return cached.value;
    const result = await bankCall(env, identity, 'account');
    const value = { linked: true, qty: Number(result.qty || 0), crystals: Number(result.crystals || 0) };
    bankCache.set(key, { value, until: Date.now() + 15000 });
    return value;
  }

  async function task(env, uid, day = today(), identity) {
    const r = await env.DB.prepare('SELECT day,target_seconds,credited_seconds,reward,spun_at,paid_at FROM timer_reward_daily WHERE uid=? AND day=?').bind(uid, day).first();
    const bank = await bankAccount(env, identity);
    if (!r) return { day, spun: false, targetSeconds: 0, creditedSeconds: 0, reward: 0, paid: false, balance: bank.crystals, bankLinked: true };
    return {
      day: r.day, spun: true, targetSeconds: r.target_seconds,
      creditedSeconds: Math.min(r.target_seconds, r.credited_seconds),
      reward: r.reward, paid: !!r.paid_at, paidAt: r.paid_at || null,
      spunAt: r.spun_at, balance: bank.crystals, bankLinked: true
    };
  }

  async function payIfReady(env, uid, day, identity) {
    const r = await env.DB.prepare('SELECT target_seconds,credited_seconds,reward,paid_at FROM timer_reward_daily WHERE uid=? AND day=?').bind(uid, day).first();
    if (!r || r.paid_at || r.credited_seconds < r.target_seconds) return 0;
    const qty = Math.round(Number(r.reward) * QTY_SCALE);
    const dayHash = (await sha256hex(`${uid}:${day}`)).slice(0, 36);
    const ref = `timer_${dayHash}_${day.replace(/-/g, '')}`;
    // Banka Worker'ı id_links üzerinden aynı FOREVYE ID'ye bağlı bankayı bulur.
    // Referans ve (ID, kaynak, gün) benzersizliği çift ödemeyi engeller.
    await bankCall(env, identity, 'credit', { source: 'zamanlayici_daily', day, qty, ref });
    const now = Date.now();
    const updated = await env.DB.prepare(`UPDATE timer_reward_daily SET paid_at=?,reward_ref=?
      WHERE uid=? AND day=? AND paid_at IS NULL AND credited_seconds>=target_seconds`).bind(now, ref, uid, day).run();
    bankCache.delete(identity.idUserId);
    return updated.meta?.changes ? Number(r.reward) : 0;
  }

  async function settleSegment(env, uid, row, close = false) {
    if (!row || !row.active) return 0;
    const now = Date.now();
    const until = Math.min(now, dayEndMs(row.day));
    const elapsed = Math.max(0, Math.floor((until - row.last_ping) / 1000));
    const daily = await env.DB.prepare('SELECT target_seconds,credited_seconds FROM timer_reward_daily WHERE uid=? AND day=?').bind(uid, row.day).first();
    const remaining = daily ? Math.max(0, daily.target_seconds - daily.credited_seconds) : 0;
    const delta = Math.min(MAX_PULSE_SECONDS, elapsed, remaining);
    const stale = close || now - row.last_ping > STALE_AFTER_MS || now >= dayEndMs(row.day);
    const goalReached = !daily || remaining === 0 || delta >= remaining;
    const ref = 'pulse_' + rndStr(18, AB);
    const results = await env.DB.batch([
      env.DB.prepare('UPDATE timer_reward_segments SET last_ping=?, pulse_ref=?, active=? WHERE id=? AND uid=? AND active=1 AND last_ping=?')
        .bind(now, ref, stale || goalReached || !daily ? 0 : 1, row.id, uid, row.last_ping),
      env.DB.prepare('UPDATE timer_reward_daily SET credited_seconds=MIN(target_seconds,credited_seconds+?) WHERE uid=? AND day=? AND EXISTS (SELECT 1 FROM timer_reward_segments WHERE id=? AND uid=? AND pulse_ref=?)')
        .bind(delta, uid, row.day, row.id, uid, ref)
    ]);
    return results[0] && results[0].meta && results[0].meta.changes ? delta : 0;
  }

  async function closeAll(env, uid, identity) {
    const rows = (await env.DB.prepare('SELECT * FROM timer_reward_segments WHERE uid=? AND active=1').bind(uid).all()).results || [];
    for (const r of rows) {
      await settleSegment(env, uid, r, true);
      await payIfReady(env, uid, r.day, identity);
    }
  }

  // Banka geçici olarak erişilemezse hedef tamamlanmış olsa bile ödeme kaydı kaybolmaz.
  // Sonraki durum isteğinde tamamlanmış fakat ödenmemiş günler bankaya idempotent biçimde yeniden gönderilir.
  async function retryCompleted(env, uid, identity) {
    const rows = (await env.DB.prepare(`SELECT day FROM timer_reward_daily
      WHERE uid=? AND paid_at IS NULL AND credited_seconds>=target_seconds
      ORDER BY day DESC LIMIT 7`).bind(uid).all()).results || [];
    for (const row of rows) await payIfReady(env, uid, row.day, identity);
  }

  async function state(env, uid, identity) {
    await ensureSchema(env);
    await closeAll(env, uid, identity);
    await retryCompleted(env, uid, identity);
    const bank = await bankAccount(env, identity, true);
    return json({ ok: true, bank: { linked: true, crystals: bank.crystals, qty: bank.qty }, task: await task(env, uid, today(), identity) });
  }

  async function spin(env, uid, identity) {
    await ensureSchema(env);
    await bankAccount(env, identity);
    const day = today();
    const prior = await env.DB.prepare('SELECT target_seconds FROM timer_reward_daily WHERE uid=? AND day=?').bind(uid, day).first();
    if (prior) return json({ ok: true, repeated: true, task: await task(env, uid, day, identity) });
    const target = TIMER_REWARD_TARGETS[rndInt(TIMER_REWARD_TARGETS.length)];
    const reward = rewardFor(target), now = Date.now();
    await env.DB.prepare('INSERT OR IGNORE INTO timer_reward_daily(uid,day,target_seconds,credited_seconds,reward,spun_at) VALUES(?,?,?,0,?,?)')
      .bind(uid, day, target, reward, now).run();
    return json({ ok: true, repeated: false, task: await task(env, uid, day, identity) });
  }

  async function start(env, uid, b, identity) {
    await ensureSchema(env);
    const day = today(), current = await task(env, uid, day, identity);
    if (!current.spun) return fail('Önce günlük çarkı çevir.', 409, { code: 'not_spun' });
    if (current.paid || current.creditedSeconds >= current.targetSeconds) return fail('Günlük hedef tamamlandı.', 409, { code: 'goal_done' });
    const mode = String(b.mode || '');
    if (!['stopwatch', 'countdown', 'interval-work'].includes(mode)) return fail('Geçersiz zamanlayıcı modu.', 400);
    const active = await env.DB.prepare('SELECT id,last_ping FROM timer_reward_segments WHERE uid=? AND active=1 ORDER BY started_at DESC LIMIT 1').bind(uid).first();
    if (active) {
      if (Date.now() - active.last_ping <= STALE_AFTER_MS) return fail('Bu hesapta başka bir zamanlayıcı oturumu çalışıyor.', 409, { code: 'already_running' });
      await closeAll(env, uid, identity);
    }
    const id = 'trs_' + rndStr(24, AB), now = Date.now();
    try {
      await env.DB.prepare('INSERT INTO timer_reward_segments(id,uid,day,mode,started_at,last_ping,active) VALUES(?,?,?,?,?,?,1)')
        .bind(id, uid, day, mode, now, now).run();
    } catch (_) { return fail('Zaten çalışan bir zamanlayıcı oturumu var.', 409, { code: 'already_running' }); }
    return json({ ok: true, sessionId: id, task: await task(env, uid, day, identity) });
  }

  async function pulse(env, uid, b, identity, close = false) {
    await ensureSchema(env);
    const id = String(b.sessionId || '');
    if (!/^trs_[A-Z2-9]{24}$/.test(id)) return fail('Zamanlayıcı oturumu bulunamadı.', 404);
    const row = await env.DB.prepare('SELECT * FROM timer_reward_segments WHERE id=? AND uid=? AND active=1').bind(id, uid).first();
    if (!row) return json({ ok: true, active: false, task: await task(env, uid, today(), identity) });
    await settleSegment(env, uid, row, close);
    const awarded = await payIfReady(env, uid, row.day, identity);
    const fresh = await env.DB.prepare('SELECT active FROM timer_reward_segments WHERE id=?').bind(id).first();
    return json({ ok: true, active: !!(fresh && fresh.active), awarded, task: await task(env, uid, today(), identity) });
  }

  async function complete(env, uid, b, identity) {
    await ensureSchema(env);
    const id = String(b.sessionId || '');
    let awarded = 0;
    if (id) {
      const row = await env.DB.prepare('SELECT * FROM timer_reward_segments WHERE id=? AND uid=? AND active=1').bind(id, uid).first();
      if (row) {
        await settleSegment(env, uid, row, true);
        awarded += await payIfReady(env, uid, row.day, identity);
      }
    }
    awarded += await payIfReady(env, uid, today(), identity);
    return json({ ok: true, awarded, task: await task(env, uid, today(), identity) });
  }

  async function stop(env, uid, b, identity) { return pulse(env, uid, b, identity, true); }

  return {
    async handle(path, req, env, uid, b, identity) {
      try {
        assertIdentity(identity);
        await bankAccount(env, identity);
        switch (path) {
          case '/api/timer-reward/state': return await state(env, uid, identity);
          case '/api/timer-reward/spin': return await spin(env, uid, identity);
          case '/api/timer-reward/start': return await start(env, uid, b, identity);
          case '/api/timer-reward/pulse': return await pulse(env, uid, b, identity);
          case '/api/timer-reward/stop': return await stop(env, uid, b, identity);
          case '/api/timer-reward/complete': return await complete(env, uid, b, identity);
          default: return fail('Bulunamadı.', 404);
        }
      } catch (e) {
        return fail(e.message || 'Banka bağlantısı başarısız.', e.status || 503, { code: e.code || 'bank_request_failed' });
      }
    }
  };
}
