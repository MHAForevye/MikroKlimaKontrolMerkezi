/* Zamanlayıcı günlük kristal görevi.
   Hedef, ilerleme ve ödeme sunucuda tutulur. İstemciden süre kabul edilmez;
   yalnızca sunucunun gördüğü heartbeat aralıkları sayılır. */

export const TIMER_REWARD_TARGETS = [60, 300, 600, 900, 1800, 2700, 3600, 7200, 10800, 14400];
const MAX_PULSE_SECONDS = 120;
const STALE_AFTER_MS = 180000;
const dayEndMs = day => Date.parse(day + 'T21:00:00.000Z'); // Türkiye saatiyle sonraki gün 00:00
const rewardFor = seconds => Math.round((seconds * 10 / 3600) * 10000) / 10000;

export function makeTimerRewards(ctx) {
  const { json, fail, rndStr, rndInt, AB, today, stamp } = ctx;
  const schemaPromises = new WeakMap();

  async function ensureSchema(env) {
    let schemaPromise = schemaPromises.get(env.DB);
    if (!schemaPromise) { schemaPromise = (async () => {
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

  async function task(env, uid, day = today()) {
    const r = await env.DB.prepare('SELECT day,target_seconds,credited_seconds,reward,spun_at,paid_at FROM timer_reward_daily WHERE uid=? AND day=?').bind(uid, day).first();
    const bal = await env.DB.prepare('SELECT bal FROM users WHERE id=?').bind(uid).first();
    if (!r) return { day, spun: false, targetSeconds: 0, creditedSeconds: 0, reward: 0, paid: false, balance: bal ? bal.bal : 0 };
    return {
      day: r.day, spun: true, targetSeconds: r.target_seconds,
      creditedSeconds: Math.min(r.target_seconds, r.credited_seconds),
      reward: r.reward, paid: !!r.paid_at, paidAt: r.paid_at || null,
      spunAt: r.spun_at, balance: bal ? bal.bal : 0
    };
  }

  async function payIfReady(env, uid, day) {
    const r = await env.DB.prepare('SELECT target_seconds,credited_seconds,reward,paid_at FROM timer_reward_daily WHERE uid=? AND day=?').bind(uid, day).first();
    if (!r || r.paid_at || r.credited_seconds < r.target_seconds) return 0;
    const now = Date.now(), ref = 'trw_' + rndStr(20, AB), reward = r.reward;
    // Bu üç ifade D1 batch içinde tek işlem olarak çalışır. Aynı günün iki isteği
    // farklı ref üretir; yalnızca daily satırını ilk kilitleyen ödeme yapabilir.
    await env.DB.batch([
      env.DB.prepare('UPDATE timer_reward_daily SET paid_at=?, reward_ref=? WHERE uid=? AND day=? AND paid_at IS NULL AND credited_seconds>=target_seconds').bind(now, ref, uid, day),
      env.DB.prepare("UPDATE users SET bal=bal+?, earned=earned+? WHERE id=? AND EXISTS (SELECT 1 FROM timer_reward_daily WHERE uid=? AND day=? AND paid_at=? AND reward_ref=?)").bind(reward, reward, uid, uid, day, now, ref),
      env.DB.prepare("INSERT INTO log(uid,kind,delta,ref,t) SELECT ?, 'timer_reward', ?, ?, ? WHERE EXISTS (SELECT 1 FROM timer_reward_daily WHERE uid=? AND day=? AND paid_at=? AND reward_ref=?)").bind(uid, reward, day + ':zamanlayici-gunluk', stamp(), uid, day, now, ref)
    ]);
    const after = await env.DB.prepare('SELECT paid_at,reward_ref FROM timer_reward_daily WHERE uid=? AND day=?').bind(uid, day).first();
    return after && after.paid_at === now && after.reward_ref === ref ? reward : 0;
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
    // Hedef tamamlandığı anda ödül oturumu kapanır; sayaç 7 saat sürse bile 4 saatlik görev 4 saatte biter.
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

  async function closeAll(env, uid) {
    const rows = (await env.DB.prepare('SELECT * FROM timer_reward_segments WHERE uid=? AND active=1').bind(uid).all()).results || [];
    for (const r of rows) {
      await settleSegment(env, uid, r, true);
      await payIfReady(env, uid, r.day);
    }
  }

  async function state(env, uid) {
    await ensureSchema(env);
    // Bir sayfa yenilendiğinde eski sekmenin açık segmentini güvenli şekilde kapat.
    await closeAll(env, uid);
    return json({ ok: true, task: await task(env, uid) });
  }

  async function spin(env, uid) {
    await ensureSchema(env);
    const day = today();
    const prior = await env.DB.prepare('SELECT target_seconds FROM timer_reward_daily WHERE uid=? AND day=?').bind(uid, day).first();
    if (prior) return json({ ok: true, repeated: true, task: await task(env, uid, day) });
    const target = TIMER_REWARD_TARGETS[rndInt(TIMER_REWARD_TARGETS.length)];
    const reward = rewardFor(target), now = Date.now();
    await env.DB.prepare('INSERT OR IGNORE INTO timer_reward_daily(uid,day,target_seconds,credited_seconds,reward,spun_at) VALUES(?,?,?,0,?,?)')
      .bind(uid, day, target, reward, now).run();
    return json({ ok: true, repeated: false, task: await task(env, uid, day) });
  }

  async function start(env, uid, b) {
    await ensureSchema(env);
    const day = today(), current = await task(env, uid, day);
    if (!current.spun) return fail('Önce günlük çarkı çevir.', 409, { code: 'not_spun' });
    if (current.paid || current.creditedSeconds >= current.targetSeconds) return fail('Günlük hedef tamamlandı.', 409, { code: 'goal_done' });
    const mode = String(b.mode || '');
    if (!['stopwatch', 'countdown', 'interval-work'].includes(mode)) return fail('Geçersiz zamanlayıcı modu.', 400);
    const active = await env.DB.prepare('SELECT id,last_ping FROM timer_reward_segments WHERE uid=? AND active=1 ORDER BY started_at DESC LIMIT 1').bind(uid).first();
    if (active) {
      if (Date.now() - active.last_ping <= STALE_AFTER_MS) return fail('Bu hesapta başka bir zamanlayıcı oturumu çalışıyor.', 409, { code: 'already_running' });
      await closeAll(env, uid);
    }
    const id = 'trs_' + rndStr(24, AB), now = Date.now();
    try {
      await env.DB.prepare('INSERT INTO timer_reward_segments(id,uid,day,mode,started_at,last_ping,active) VALUES(?,?,?,?,?,?,1)')
        .bind(id, uid, day, mode, now, now).run();
    } catch (_) {
      return fail('Zaten çalışan bir zamanlayıcı oturumu var.', 409, { code: 'already_running' });
    }
    return json({ ok: true, sessionId: id, task: await task(env, uid, day) });
  }

  async function pulse(env, uid, b, close = false) {
    await ensureSchema(env);
    const id = String(b.sessionId || '');
    if (!/^trs_[A-Z2-9]{24}$/.test(id)) return fail('Zamanlayıcı oturumu bulunamadı.', 404);
    const row = await env.DB.prepare('SELECT * FROM timer_reward_segments WHERE id=? AND uid=? AND active=1').bind(id, uid).first();
    if (!row) return json({ ok: true, active: false, task: await task(env, uid) });
    await settleSegment(env, uid, row, close);
    const awarded = await payIfReady(env, uid, row.day);
    const fresh = await env.DB.prepare('SELECT active FROM timer_reward_segments WHERE id=?').bind(id).first();
    const day = today();
    return json({ ok: true, active: !!(fresh && fresh.active), awarded, task: await task(env, uid, day) });
  }

  async function complete(env, uid, b) {
    await ensureSchema(env);
    const id = String(b.sessionId || '');
    let awarded = 0;
    if (id) {
      const row = await env.DB.prepare('SELECT * FROM timer_reward_segments WHERE id=? AND uid=? AND active=1').bind(id, uid).first();
      if (row) {
        await settleSegment(env, uid, row, true);
        awarded += await payIfReady(env, uid, row.day);
      }
    }
    const day = today();
    awarded += await payIfReady(env, uid, day);
    return json({ ok: true, awarded, task: await task(env, uid, day) });
  }

  async function stop(env, uid, b) {
    return pulse(env, uid, b, true);
  }

  return {
    async handle(path, req, env, uid, b) {
      switch (path) {
        case '/api/timer-reward/state': return state(env, uid);
        case '/api/timer-reward/spin': return spin(env, uid);
        case '/api/timer-reward/start': return start(env, uid, b);
        case '/api/timer-reward/pulse': return pulse(env, uid, b, false);
        case '/api/timer-reward/stop': return stop(env, uid, b);
        case '/api/timer-reward/complete': return complete(env, uid, b);
        default: return fail('Bulunamadı.', 404);
      }
    }
  };
}
