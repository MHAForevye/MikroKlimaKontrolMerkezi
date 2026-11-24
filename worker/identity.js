/* FOREVYE ID servisi (Mikro-Klima Worker + D1 üzerinde). Arayüz: forevye-id (config.js → API_BASE = bu Worker).
   Kurallar forevye-id/api.js'teki demo arka uçla birebir aynıdır (kullanıcı adı, 48 saat/2 hak/15 gün, 24 saatlik fotoğraf, 2FA, oturumlar).
   Ortak yardımcılar index.js'ten `makeIdentity(ctx)` ile gelir. Tablolar: schema.sql (id_*). */
import { sendMail as sendMailShared, mailReady } from './mail.js';

const USERNAME_RE = /^#[A-Z0-9]{8,29}$/, EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/* schema.sql canlı D1'e uygulanmadıysa her /identity/* isteği "no such table: id_users" ile 500 (Sunucu hatası) verirdi.
   Tablolar eksikse (IF NOT EXISTS, schema.sql ile birebir aynı) burada kendiliğinden kurulur; isolate başına bir kez çalışır. */
const ID_SCHEMA = [
  "CREATE TABLE IF NOT EXISTS id_users ( id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, hash TEXT NOT NULL, verified INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL, username TEXT UNIQUE, uname_first INTEGER NOT NULL DEFAULT 0, uname_hist TEXT NOT NULL DEFAULT '[]', photo_at INTEGER, tf_method TEXT, tf_secret TEXT, tf_draft TEXT, google TEXT, devices TEXT NOT NULL DEFAULT '[]', apps TEXT NOT NULL DEFAULT '{}' )",
  "CREATE TABLE IF NOT EXISTS id_sessions ( id TEXT PRIMARY KEY, uid TEXT NOT NULL, a_hash TEXT NOT NULL, r_hash TEXT NOT NULL, a_exp INTEGER NOT NULL, r_exp INTEGER NOT NULL, device TEXT NOT NULL DEFAULT '', dtype TEXT NOT NULL DEFAULT '', loc TEXT NOT NULL DEFAULT '', created INTEGER NOT NULL, last INTEGER NOT NULL, revoked INTEGER NOT NULL DEFAULT 0 )",
  "CREATE INDEX IF NOT EXISTS id_sessions_uid ON id_sessions(uid)",
  "CREATE INDEX IF NOT EXISTS id_sessions_a ON id_sessions(a_hash)",
  "CREATE INDEX IF NOT EXISTS id_sessions_r ON id_sessions(r_hash)",
  "CREATE TABLE IF NOT EXISTS id_codes (uid TEXT NOT NULL, kind TEXT NOT NULL, h TEXT NOT NULL, exp INTEGER NOT NULL, tries INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (uid, kind))",
  "CREATE TABLE IF NOT EXISTS id_chal (id TEXT PRIMARY KEY, uid TEXT NOT NULL, exp INTEGER NOT NULL, tries INTEGER NOT NULL DEFAULT 0)",
  "CREATE TABLE IF NOT EXISTS id_events (id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT NOT NULL, type TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS id_events_uid ON id_events(uid, id)",
  "CREATE TABLE IF NOT EXISTS id_photos (uid TEXT PRIMARY KEY, mime TEXT NOT NULL, data BLOB NOT NULL)",
  "CREATE TABLE IF NOT EXISTS id_google (sub TEXT PRIMARY KEY, uid TEXT NOT NULL UNIQUE, email TEXT NOT NULL, nopw INTEGER NOT NULL DEFAULT 0)",
  "CREATE TABLE IF NOT EXISTS id_authcodes (h TEXT PRIMARY KEY, uid TEXT NOT NULL, app TEXT NOT NULL, redirect TEXT NOT NULL, challenge TEXT NOT NULL, exp INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0)",
  "CREATE INDEX IF NOT EXISTS id_authcodes_uid ON id_authcodes(uid)",
  "CREATE TABLE IF NOT EXISTS id_app_sessions ( id TEXT PRIMARY KEY, uid TEXT NOT NULL, app TEXT NOT NULL, a_hash TEXT NOT NULL, r_hash TEXT NOT NULL, a_exp INTEGER NOT NULL, r_exp INTEGER NOT NULL, created INTEGER NOT NULL, last INTEGER NOT NULL, revoked INTEGER NOT NULL DEFAULT 0 )",
  "CREATE INDEX IF NOT EXISTS id_app_sessions_uid ON id_app_sessions(uid)",
  "CREATE INDEX IF NOT EXISTS id_app_sessions_a ON id_app_sessions(a_hash)",
  "CREATE INDEX IF NOT EXISTS id_app_sessions_r ON id_app_sessions(r_hash)"
];
const ID_SCHEMA_OK = new WeakSet();
async function ensureIdSchema(env) {
  if (!env.DB || ID_SCHEMA_OK.has(env.DB)) return;
  await env.DB.batch(ID_SCHEMA.map(q => env.DB.prepare(q)));
  ID_SCHEMA_OK.add(env.DB);
}

export const ID_CFG = {
  pwMin: 10, photoMax: 1900000, photoCooldownH: 24,
  unameWindowH: 48, unameWindowMax: 2, unameCooldownD: 15,
  accessMin: 30, refreshDays: 30, codeMin: 10, pbkdf2: 100000,   // Workers PBKDF2 üst sınırı 100k
  apps: [
    { id: 'sanal-banka', name: 'Sanal Banka', scopes: ['kimlik', 'bakiye'] },
    { id: 'print', name: 'FOREVYE PRINT', scopes: ['kimlik', 'siparis'] },
    { id: 'retro-camera', name: 'RETRO CAMERA', scopes: ['kimlik', 'fotograf'] },
    { id: 'mantar-pano', name: 'Mantar Pano', scopes: ['kimlik'] },
    { id: 'nexus-pass', name: 'Nexus Pass', scopes: ['kimlik', 'bakiye'] },
    { id: 'zamanlayici', name: 'Zamanlayıcı', scopes: ['kimlik', 'bakiye'] },
    { id: 'mikro-klima', name: 'Mikro-Klima', scopes: ['kimlik'] }
  ]
};
const H = 3600e3, D = 24 * H, te = new TextEncoder();
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const rnd = n => crypto.getRandomValues(new Uint8Array(n));
const rndHex = n => hex(rnd(n));
function b32enc(bytes) { let bits = '', out = ''; bytes.forEach(b => (bits += b.toString(2).padStart(8, '0'))); for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)]; return out; }
function b32dec(s) { let bits = ''; for (const ch of s) bits += B32.indexOf(ch).toString(2).padStart(5, '0'); const o = []; for (let i = 0; i + 8 <= bits.length; i += 8) o.push(parseInt(bits.slice(i, i + 8), 2)); return new Uint8Array(o); }
async function totp(secret, t) {
  const msg = new ArrayBuffer(8); new DataView(msg).setUint32(4, Math.floor((t || Date.now()) / 30000));
  const key = await crypto.subtle.importKey('raw', b32dec(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const h = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg)), o = h[19] & 0xf;
  return String((((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1000000).padStart(6, '0');
}
async function totpOk(secret, code) { for (const d of [-30000, 0, 30000]) if ((await totp(secret, Date.now() + d)) === code) return true; return false; }
async function hashPw(pw, salt) {
  const key = await crypto.subtle.importKey('raw', te.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new Uint8Array(salt.match(/../g).map(h => parseInt(h, 16))), iterations: ID_CFG.pbkdf2, hash: 'SHA-256' }, key, 256));
}
const code6 = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
function validateUsername(u) {
  if (!u || u[0] !== '#') return "Kullanıcı adı '#' ile başlamalıdır.";
  if (u.length - 1 < 8 || u.length - 1 > 29) return "'#' hariç 8–29 karakter olmalıdır (toplam 9–30).";
  if (!USERNAME_RE.test(u)) return 'Yalnızca İngilizce BÜYÜK harf (A–Z) ve rakam (0–9) kullanılabilir.';
  return null;
}
function validatePassword(p) {
  if (!p || p.length < ID_CFG.pwMin) return 'Parola en az ' + ID_CFG.pwMin + ' karakter olmalıdır.';
  if (!/[a-zA-Z]/.test(p) || !/[0-9]/.test(p)) return 'Parola en az bir harf ve bir rakam içermelidir.';
  return null;
}
function sniff(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  const s = (i, n) => String.fromCharCode(...b.slice(i, i + n));
  if (s(0, 4) === 'RIFF' && s(8, 4) === 'WEBP') return 'image/webp';
  return null;
}
function device(ua) {
  ua = ua || '';
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Bilinmiyor';
  const br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Tarayıcı';
  return { type: /Mobi|Android|iPhone/.test(ua) ? 'Mobil' : 'Masaüstü', label: br + ' · ' + os };
}
const b64u = bytes => { let t = ''; new Uint8Array(bytes).forEach(x => { t += String.fromCharCode(x); }); return btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = str => Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=')), ch => ch.charCodeAt(0));
let GJ = { at: 0, keys: null };
async function googleKeys(force) {
  if (!force && GJ.keys && Date.now() - GJ.at < 3600e3) return GJ.keys;
  const r = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  if (!r.ok) throw new E('Google doğrulama anahtarları alınamadı.', 'GOOGLE_UNAVAILABLE', 503);
  GJ = { at: Date.now(), keys: (await r.json()).keys || [] };
  return GJ.keys;
}
/* Google kimlik jetonunu (JWT) doğrular: imza (RS256), yayıncı, hedef (client id), süre, e-posta doğrulanmış mı */
async function verifyGoogle(env, cred) {
  if (!env.GOOGLE_CLIENT_ID) throw new E('Google ile giriş bu sunucuda ayarlı değil.', 'GOOGLE_UNAVAILABLE', 503);
  const bad = () => new E('Google doğrulaması başarısız.', 'GOOGLE_INVALID', 401);
  const parts = String(cred || '').split('.');
  if (parts.length !== 3 || String(cred).length > 4096) throw bad();
  let head, pay;
  try { head = JSON.parse(new TextDecoder().decode(unb64u(parts[0]))); pay = JSON.parse(new TextDecoder().decode(unb64u(parts[1]))); } catch (e) { throw bad(); }
  if (head.alg !== 'RS256' || !head.kid) throw bad();
  let key = (await googleKeys(false)).find(k => k.kid === head.kid);
  if (!key) key = (await googleKeys(true)).find(k => k.kid === head.kid);
  if (!key) throw bad();
  const ck = await crypto.subtle.importKey('jwk', key, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  if (!(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', ck, unb64u(parts[2]), te.encode(parts[0] + '.' + parts[1])))) throw bad();
  if (!['https://accounts.google.com', 'accounts.google.com'].includes(pay.iss) || pay.aud !== env.GOOGLE_CLIENT_ID || !(pay.exp * 1000 > Date.now()) || !pay.sub) throw bad();
  if (!(pay.email_verified === true || pay.email_verified === 'true') || !EMAIL_RE.test(String(pay.email || ''))) throw new E('Google hesabınızın e-postası doğrulanmamış.', 'GOOGLE_INVALID', 401);
  return { sub: String(pay.sub), email: String(pay.email).toLowerCase() };
}
class E extends Error { constructor(msg, code, status) { super(msg); this.code = code; this.status = status || 400; } }

export function makeIdentity(c) {
  const { json, sha256hex, eq, rlBump, rlCount } = c;
  const ok = o => json(o || { ok: true });
  const sendMail = sendMailShared;
  const j = r => { try { return JSON.parse(r || 'null'); } catch (e) { return null; } };

  // E-posta: ortak posta modülü (worker/mail.js). Nexus de aynı modülü /api/ext/mail ile kullanır.
  async function limit(env, name, who, max, msg) {
    await rlBump(env, name, who);
    if ((await rlCount(env, name, who)) > max) throw new E(msg || 'Çok fazla deneme. Biraz bekleyip tekrar deneyin.', 'RATE_LIMIT', 429);
  }
  async function event(env, uid, type, detail) {
    await env.DB.prepare('INSERT INTO id_events(uid,type,detail,at) VALUES(?,?,?,?)').bind(uid, type, detail || '', Date.now()).run();
  }
  const byEmail = (env, email) => env.DB.prepare('SELECT * FROM id_users WHERE email=?').bind(String(email || '').trim().toLowerCase()).first();

  async function sendCode(env, u, kind, subject) {
    if (!mailReady(env)) throw new E('E-posta servisi bu sunucuda ayarlı değil.', 'MAIL_UNAVAILABLE', 503);
    const code = code6();
    await env.DB.prepare('INSERT INTO id_codes(uid,kind,h,exp,tries) VALUES(?,?,?,?,0) ON CONFLICT(uid,kind) DO UPDATE SET h=excluded.h, exp=excluded.exp, tries=0')
      .bind(u.id, kind, await sha256hex(u.id + '|' + kind + '|' + code), Date.now() + ID_CFG.codeMin * 60e3).run();
    const sent = await sendMail(env, u.email, subject, 'Doğrulama kodunuz: ' + code + ' (' + ID_CFG.codeMin + ' dakika geçerli, tek kullanımlık).');
    // Kayıt doğrulaması sessizce başarısız olmasın (ör. Brevo'da doğrulanmamış EMAIL_FROM): kullanıcı hatayı görür.
    if (!sent && kind === 'verify') throw new E('Doğrulama e-postası gönderilemedi. Birkaç dakika sonra "Kodu yeniden gönder"i deneyin; sürerse yöneticiye bildirin.', 'MAIL_UNAVAILABLE', 503);
  }
  async function checkCode(env, u, kind, code) {
    const p = await env.DB.prepare('SELECT h,exp,tries FROM id_codes WHERE uid=? AND kind=?').bind(u.id, kind).first();
    if (!p || p.exp < Date.now()) throw new E('Kodun süresi dolmuş veya hiç gönderilmemiş. Yeni kod isteyin.', 'CODE_EXPIRED');
    if (p.tries + 1 > 5) { await env.DB.prepare('DELETE FROM id_codes WHERE uid=? AND kind=?').bind(u.id, kind).run(); throw new E('Çok fazla hatalı deneme. Yeni kod isteyin.', 'RATE_LIMIT', 429); }
    await env.DB.prepare('UPDATE id_codes SET tries=tries+1 WHERE uid=? AND kind=?').bind(u.id, kind).run();
    if (!eq(p.h, await sha256hex(u.id + '|' + kind + '|' + String(code || '').trim()))) throw new E('Kod hatalı.', 'CODE_INVALID');
    await env.DB.prepare('DELETE FROM id_codes WHERE uid=? AND kind=?').bind(u.id, kind).run();
  }

  /* kullanıcı adı hakları (demo ile aynı) */
  const hist = u => j(u.uname_hist) || [];
  function changesLeft(u) {
    const h = hist(u); if (!h.length) return ID_CFG.unameWindowMax;
    if (Date.now() - u.uname_first < ID_CFG.unameWindowH * H) return Math.max(0, ID_CFG.unameWindowMax - h.length);
    return 0;
  }
  function nextUsernameChange(u) {
    const h = hist(u); if (!h.length) return null;
    if (Date.now() - u.uname_first < ID_CFG.unameWindowH * H && h.length < ID_CFG.unameWindowMax) return null;
    return h[h.length - 1].at + ID_CFG.unameCooldownD * D;
  }
  const publicUser = (u, origin) => ({
    userId: u.id, email: u.email, emailVerified: !!u.verified, username: u.username || null,
    photo: u.photo_at ? origin + '/identity/photo/' + u.id + '?v=' + u.photo_at : null,
    photoNextChangeAt: u.photo_at ? u.photo_at + ID_CFG.photoCooldownH * H : null,
    usernameNextChangeAt: nextUsernameChange(u), usernameChangesLeftInWindow: u.username ? changesLeft(u) : null,
    twoFactor: { enabled: !!u.tf_method, method: u.tf_method || null },
    google: { linked: !!u.google, email: u.google || null }, createdAt: u.created
  });

  /* oturumlar: erişim jetonu kısa, yenileme jetonu uzun; ikisi de özet olarak saklanır */
  async function newSession(env, req, u, method) {
    const d = device(req.headers.get('user-agent')), id = rndHex(12), at = b64(rnd(32)), rt = b64(rnd(32)), now = Date.now();
    const devs = j(u.devices) || [], known = devs.includes(d.label);
    await env.DB.prepare('INSERT INTO id_sessions(id,uid,a_hash,r_hash,a_exp,r_exp,device,dtype,loc,created,last) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
      .bind(id, u.id, await sha256hex(at), await sha256hex(rt), now + ID_CFG.accessMin * 60e3, now + ID_CFG.refreshDays * D, d.label, d.type, (req.cf && req.cf.country) || '', now, now).run();
    if (!known) {
      devs.push(d.label); await env.DB.prepare('UPDATE id_users SET devices=? WHERE id=?').bind(JSON.stringify(devs.slice(-20)), u.id).run();
      if (devs.length > 1) await sendMail(env, u.email, 'Yeni cihazdan giriş', 'Hesabınıza daha önce kullanılmamış bir cihazdan giriş yapıldı: ' + d.label + '. Siz değilseniz parolanızı hemen değiştirin.');
    }
    await event(env, u.id, 'login', (method || 'parola') + ' · ' + d.label);
    return { accessToken: at, refreshToken: rt };
  }
  const b64 = bytes => { let s = ''; bytes.forEach(x => { s += String.fromCharCode(x); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  async function need(env, req) {
    const m = /^Bearer ([A-Za-z0-9_-]{30,64})$/.exec(req.headers.get('Authorization') || '');
    const bad = () => new E('Oturum geçersiz. Lütfen yeniden giriş yapın.', 'UNAUTHORIZED', 401);
    if (!m) throw bad();
    const s = await env.DB.prepare('SELECT * FROM id_sessions WHERE a_hash=? AND revoked=0 AND a_exp>?').bind(await sha256hex(m[1]), Date.now()).first();
    if (!s) throw bad();
    const u = await env.DB.prepare('SELECT * FROM id_users WHERE id=?').bind(s.uid).first();
    if (!u) throw bad();
    if (Date.now() - s.last > 60e3) await env.DB.prepare('UPDATE id_sessions SET last=? WHERE id=?').bind(Date.now(), s.id).run();
    return { s, u };
  }
  const revokeAll = (env, uid) => env.DB.prepare('UPDATE id_sessions SET revoked=1 WHERE uid=?').bind(uid).run();
  const revokeApps = (env, uid, app) => app ? env.DB.prepare('UPDATE id_app_sessions SET revoked=1 WHERE uid=? AND app=?').bind(uid, app).run() : env.DB.prepare('UPDATE id_app_sessions SET revoked=1 WHERE uid=?').bind(uid).run();
  async function pwOk(env, u, pw) { return eq(await hashPw(String(pw || ''), u.salt), u.hash); }
  const dummySalt = '00'.repeat(16);

  const H_ = {
    async register(env, req, b) {
      const email = String(b.email || '').trim().toLowerCase();
      if (!EMAIL_RE.test(email) || email.length > 120) throw new E('Geçerli bir e-posta adresi girin.', 'VALIDATION');
      const pe = validatePassword(b.password); if (pe) throw new E(pe, 'VALIDATION');
      if (!mailReady(env)) throw new E('E-posta servisi bu sunucuda ayarlı değil.', 'MAIL_UNAVAILABLE', 503);
      await limit(env, 'idreg', req.headers.get('CF-Connecting-IP') || 'x', 20);
      if (await byEmail(env, email)) throw new E('Bu e-posta ile zaten bir hesap var.', 'EMAIL_TAKEN', 409);
      const salt = rndHex(16), id = 'usr_' + rndHex(8), apps = {}; ID_CFG.apps.forEach(a => { apps[a.id] = { connected: true, displayName: '' }; });
      await env.DB.prepare('INSERT INTO id_users(id,email,salt,hash,created,apps) VALUES(?,?,?,?,?,?)').bind(id, email, salt, await hashPw(b.password, salt), Date.now(), JSON.stringify(apps)).run();
      await sendCode(env, { id, email }, 'verify', 'FOREVYE ID e-posta doğrulama');
      await event(env, id, 'register');
      return ok({ email, verificationRequired: true });
    },
    async verifyEmail(env, req, b) {
      const u = await byEmail(env, b.email); if (!u) throw new E('Hesap bulunamadı.', 'NOT_FOUND', 404);
      await limit(env, 'idver', u.id, 10);
      await checkCode(env, u, 'verify', b.code);
      await env.DB.prepare('UPDATE id_users SET verified=1 WHERE id=?').bind(u.id).run(); await event(env, u.id, 'email_verified');
      return ok();
    },
    async resend(env, req, b) {
      const u = await byEmail(env, b.email);
      if (u && !u.verified) { await limit(env, 'idrs', u.id, 3, 'Çok sık kod istediniz. Birkaç dakika bekleyin.'); await sendCode(env, u, 'verify', 'FOREVYE ID e-posta doğrulama'); }
      return ok();
    },
    async login(env, req, b) {
      const email = String(b.email || '').trim().toLowerCase();
      await limit(env, 'idlog', email, 8, 'Çok fazla giriş denemesi. Biraz sonra tekrar deneyin.');
      await limit(env, 'idlogip', req.headers.get('CF-Connecting-IP') || 'x', 60);
      const u = await byEmail(env, email), BADC = () => new E('E-posta veya parola hatalı.', 'BAD_CREDENTIALS', 401);
      if (!b.challengeId) {
        if (!u) { await hashPw(String(b.password || ''), dummySalt); throw BADC(); }   // süre sızıntısını azalt
        if (!(await pwOk(env, u, b.password))) { await event(env, u.id, 'failed_login'); throw BADC(); }
        if (!u.verified) throw new E('E-posta adresinizi doğrulamadan giriş yapamazsınız.', 'EMAIL_NOT_VERIFIED', 403);
        if (u.tf_method) {
          const ch = b64(rnd(24));
          await env.DB.prepare('INSERT INTO id_chal(id,uid,exp,tries) VALUES(?,?,?,0)').bind(await sha256hex(ch), u.id, Date.now() + 5 * 60e3).run();
          if (u.tf_method === 'email') await sendCode(env, u, 'login2fa', 'FOREVYE ID giriş kodu');
          return ok({ twoFactorRequired: true, method: u.tf_method, challengeId: ch });
        }
        return ok(await newSession(env, req, u));
      }
      const chId = await sha256hex(String(b.challengeId));
      const ch = await env.DB.prepare('SELECT * FROM id_chal WHERE id=? AND exp>?').bind(chId, Date.now()).first();
      if (!ch || !u || ch.uid !== u.id) throw new E('Doğrulama oturumu geçersiz.', 'BAD_CHALLENGE', 401);
      if (ch.tries >= 5) { await env.DB.prepare('DELETE FROM id_chal WHERE id=?').bind(chId).run(); throw new E('Çok fazla hatalı deneme. Baştan giriş yapın.', 'RATE_LIMIT', 429); }
      await env.DB.prepare('UPDATE id_chal SET tries=tries+1 WHERE id=?').bind(chId).run();
      if (u.tf_method === 'email') await checkCode(env, u, 'login2fa', b.code);
      else if (!(await totpOk(u.tf_secret, String(b.code || '').trim()))) throw new E('Authenticator kodu hatalı.', 'CODE_INVALID');
      await env.DB.prepare('DELETE FROM id_chal WHERE id=?').bind(chId).run();
      return ok(await newSession(env, req, u, '2FA'));
    },
    async refresh(env, req, b) {
      const rt = String(b.refreshToken || '');
      if (!/^[A-Za-z0-9_-]{30,64}$/.test(rt)) throw new E('Oturum geçersiz.', 'UNAUTHORIZED', 401);
      const s = await env.DB.prepare('SELECT * FROM id_sessions WHERE r_hash=? AND revoked=0 AND r_exp>?').bind(await sha256hex(rt), Date.now()).first();
      if (!s) throw new E('Oturum geçersiz.', 'UNAUTHORIZED', 401);
      const at = b64(rnd(32)), nrt = b64(rnd(32));
      await env.DB.prepare('UPDATE id_sessions SET a_hash=?, r_hash=?, a_exp=?, r_exp=?, last=? WHERE id=?')
        .bind(await sha256hex(at), await sha256hex(nrt), Date.now() + ID_CFG.accessMin * 60e3, Date.now() + ID_CFG.refreshDays * D, Date.now(), s.id).run();
      return ok({ accessToken: at, refreshToken: nrt });
    },
    async logout(env, req) { const { s, u } = await need(env, req); await env.DB.prepare('UPDATE id_sessions SET revoked=1 WHERE id=?').bind(s.id).run(); await event(env, u.id, 'logout'); return ok(); },
    async logoutAll(env, req) { const { u } = await need(env, req); await revokeAll(env, u.id); await revokeApps(env, u.id); await event(env, u.id, 'logout_all'); return ok(); },
    async forgot(env, req, b) {
      const u = await byEmail(env, b.email);
      if (u && u.verified) { await limit(env, 'idfg', u.id, 3, 'Çok sık istek. Biraz bekleyin.'); await sendCode(env, u, 'reset', 'FOREVYE ID parola sıfırlama'); }
      return ok();   // hesap var/yok bilgisi sızdırılmaz
    },
    async reset(env, req, b) {
      const u = await byEmail(env, b.email); if (!u) throw new E('Kod hatalı veya süresi dolmuş.', 'CODE_INVALID');
      const pe = validatePassword(b.password); if (pe) throw new E(pe, 'VALIDATION');
      await checkCode(env, u, 'reset', b.code);
      const salt = rndHex(16);
      await env.DB.prepare('UPDATE id_users SET salt=?, hash=? WHERE id=?').bind(salt, await hashPw(b.password, salt), u.id).run();
      await revokeAll(env, u.id); await revokeApps(env, u.id); await env.DB.prepare('UPDATE id_google SET nopw=0 WHERE uid=?').bind(u.id).run(); await event(env, u.id, 'password_reset');
      await sendMail(env, u.email, 'Parolanız değiştirildi', 'FOREVYE ID parolanız sıfırlandı ve tüm oturumlar kapatıldı.');
      return ok();
    },
    async profile(env, req) { const { u } = await need(env, req); return json(publicUser(u, new URL(req.url).origin)); },
    async setUsername(env, req, b) {
      const { u } = await need(env, req), username = String(b.username || '');
      const err = validateUsername(username); if (err) throw new E(err, 'VALIDATION');
      if (u.username === username) throw new E('Bu zaten kullanıcı adınız.', 'VALIDATION');
      if (await env.DB.prepare('SELECT 1 AS x FROM id_users WHERE username=? AND id<>?').bind(username, u.id).first()) throw new E('Bu kullanıcı adı alınmış.', 'USERNAME_TAKEN', 409);
      let h = hist(u), first = u.uname_first;
      if (u.username) {
        const nxt = nextUsernameChange(u);
        if (nxt && nxt > Date.now()) throw new E('Kullanıcı adını en erken ' + new Date(nxt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) + ' tarihinde değiştirebilirsiniz.', 'COOLDOWN', 429);
        if (Date.now() - first < ID_CFG.unameWindowH * H && changesLeft(u) <= 0) throw new E('İlk 48 saatlik değişiklik hakkınız doldu.', 'COOLDOWN', 429);
        h = h.concat({ from: u.username, to: username, at: Date.now() });
      } else { h = []; first = Date.now(); }   // ilk atama hak sayılmaz; 48 saatlik pencere ilk atamadan başlar
      try { await env.DB.prepare('UPDATE id_users SET username=?, uname_hist=?, uname_first=? WHERE id=?').bind(username, JSON.stringify(h), first, u.id).run(); }
      catch (e) { throw new E('Bu kullanıcı adı alınmış.', 'USERNAME_TAKEN', 409); }
      await event(env, u.id, 'username', username);
      return json(publicUser(await env.DB.prepare('SELECT * FROM id_users WHERE id=?').bind(u.id).first(), new URL(req.url).origin));
    },
    async putPhoto(env, req) {
      const { u } = await need(env, req);
      if (u.photo_at && Date.now() - u.photo_at < ID_CFG.photoCooldownH * H) throw new E('Profil fotoğrafı 24 saatte bir değiştirilebilir. Sonraki hak: ' + new Date(u.photo_at + ID_CFG.photoCooldownH * H).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }), 'COOLDOWN', 429);
      let f; try { f = (await req.formData()).get('photo'); } catch (e) { f = null; }
      if (!f || typeof f === 'string' || typeof f.arrayBuffer !== 'function') throw new E('Fotoğraf dosyası yok.', 'VALIDATION');
      if (f.size > ID_CFG.photoMax) throw new E('Dosya 2 MB sınırını aşıyor.', 'VALIDATION', 413);
      const bytes = new Uint8Array(await f.arrayBuffer()), mime = sniff(bytes);   // içerik türü dosya imzasından anlaşılır, istemcinin söylediğine bakılmaz
      if (!mime) throw new E('Yalnızca JPG, PNG veya WEBP kabul edilir.', 'VALIDATION');
      await env.DB.batch([
        env.DB.prepare('INSERT INTO id_photos(uid,mime,data) VALUES(?,?,?) ON CONFLICT(uid) DO UPDATE SET mime=excluded.mime, data=excluded.data').bind(u.id, mime, bytes),
        env.DB.prepare('UPDATE id_users SET photo_at=? WHERE id=?').bind(Date.now(), u.id)
      ]);
      await event(env, u.id, 'photo');
      return json(publicUser(await env.DB.prepare('SELECT * FROM id_users WHERE id=?').bind(u.id).first(), new URL(req.url).origin));
    },
    async delPhoto(env, req) {
      const { u } = await need(env, req);
      await env.DB.batch([env.DB.prepare('DELETE FROM id_photos WHERE uid=?').bind(u.id), env.DB.prepare('UPDATE id_users SET photo_at=NULL WHERE id=?').bind(u.id)]);
      await event(env, u.id, 'photo_removed');
      return json(publicUser(await env.DB.prepare('SELECT * FROM id_users WHERE id=?').bind(u.id).first(), new URL(req.url).origin));
    },
    async getPhoto(env, req, id) {
      const r = await env.DB.prepare('SELECT mime,data FROM id_photos WHERE uid=?').bind(id).first();
      if (!r) return new Response('Yok', { status: 404 });
      return new Response(r.data, { headers: { 'Content-Type': r.mime, 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' } });
    },
    async sessions(env, req) {
      const { u, s } = await need(env, req);
      const rows = (await env.DB.prepare('SELECT * FROM id_sessions WHERE uid=? AND revoked=0 AND r_exp>? ORDER BY last DESC').bind(u.id, Date.now()).all()).results || [];
      return json(rows.map(x => ({ id: x.id, device: x.device, deviceType: x.dtype, location: x.loc || '—', lastActive: x.last, createdAt: x.created, status: 'Etkin', current: x.id === s.id })));
    },
    async revoke(env, req, sid) {
      const { u, s } = await need(env, req);
      const r = await env.DB.prepare('UPDATE id_sessions SET revoked=1 WHERE id=? AND uid=?').bind(sid, u.id).run();
      if (!r.meta.changes) throw new E('Oturum bulunamadı.', 'NOT_FOUND', 404);
      await event(env, u.id, 'session_revoked');
      return ok({ ok: true, wasCurrent: sid === s.id });
    },
    async events(env, req) {
      const { u } = await need(env, req);
      const rows = (await env.DB.prepare('SELECT id,type,detail,at FROM id_events WHERE uid=? ORDER BY id DESC LIMIT 25').bind(u.id).all()).results || [];
      return json(rows.map(r => ({ id: String(r.id), type: r.type, detail: r.detail, at: r.at })));
    },
    async apps(env, req) {
      const { u } = await need(env, req), m = j(u.apps) || {};
      return json(ID_CFG.apps.map(a => { const x = m[a.id] || { connected: false, displayName: '' }; return { id: a.id, name: a.name, scopes: a.scopes, connected: !!x.connected, displayName: x.displayName || '' }; }));
    },
    async appEdit(env, req, id, method, b) {
      const { u } = await need(env, req), m = j(u.apps) || {};
      if (!ID_CFG.apps.some(a => a.id === id)) throw new E('Uygulama bulunamadı.', 'NOT_FOUND', 404);
      const x = m[id] = m[id] || { connected: false, displayName: '' };
      if (method === 'PATCH') {
        const n = String(b.displayName || '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').trim();
        if (n.length > 32) throw new E('Görünen ad en fazla 32 karakter olabilir.', 'VALIDATION');
        x.displayName = n;
      } else if (method === 'POST') x.connected = true;
      else { x.connected = false; await revokeApps(env, u.id, id); await event(env, u.id, 'app_disconnected', id); }
      await env.DB.prepare('UPDATE id_users SET apps=? WHERE id=?').bind(JSON.stringify(m), u.id).run();
      return ok();
    },
    async twoFaEnable(env, req, b) {
      const { u } = await need(env, req);
      if (b.method !== undefined) {   // 1. adım: kurulumu başlat (parola yeniden doğrulanır)
        await limit(env, 'idtf', u.id, 10);
        if (!(await pwOk(env, u, b.password))) throw new E('Parola hatalı (güvenli yeniden doğrulama).', 'BAD_CREDENTIALS', 401);
        if (!['email', 'totp'].includes(b.method)) throw new E('Geçersiz yöntem.', 'VALIDATION');
        if (b.method === 'email') { await sendCode(env, u, 'tfsetup', 'FOREVYE ID 2FA kurulum kodu'); await env.DB.prepare('UPDATE id_users SET tf_draft=? WHERE id=?').bind(JSON.stringify({ method: 'email' }), u.id).run(); return ok({ method: 'email' }); }
        const secret = b32enc(rnd(20));
        await env.DB.prepare('UPDATE id_users SET tf_draft=? WHERE id=?').bind(JSON.stringify({ method: 'totp', secret }), u.id).run();
        return ok({ method: 'totp', secret, uri: 'otpauth://totp/FOREVYE%20ID:' + encodeURIComponent(u.email) + '?secret=' + secret + '&issuer=FOREVYE%20ID' });
      }
      const d = j(u.tf_draft); if (!d) throw new E('Önce kurulumu başlatın.', 'VALIDATION');
      await limit(env, 'idtf2', u.id, 10);
      if (d.method === 'email') await checkCode(env, u, 'tfsetup', b.code);
      else if (!(await totpOk(d.secret, String(b.code || '').trim()))) throw new E('Authenticator kodu hatalı.', 'CODE_INVALID');
      await env.DB.prepare('UPDATE id_users SET tf_method=?, tf_secret=?, tf_draft=NULL WHERE id=?').bind(d.method, d.secret || null, u.id).run();
      await event(env, u.id, '2fa_enabled', d.method);
      await sendMail(env, u.email, 'İki aşamalı doğrulama açıldı', 'Yöntem: ' + (d.method === 'email' ? 'E-posta kodu' : 'Authenticator uygulaması'));
      return json(publicUser(await env.DB.prepare('SELECT * FROM id_users WHERE id=?').bind(u.id).first(), new URL(req.url).origin));
    },
    async twoFaDisable(env, req, b) {
      const { u } = await need(env, req);
      if (!(await pwOk(env, u, b.password))) throw new E('Parola hatalı.', 'BAD_CREDENTIALS', 401);
      await env.DB.prepare('UPDATE id_users SET tf_method=NULL, tf_secret=NULL, tf_draft=NULL WHERE id=?').bind(u.id).run();
      await event(env, u.id, '2fa_disabled');
      await sendMail(env, u.email, 'İki aşamalı doğrulama kapatıldı', 'Hesabınızda 2FA devre dışı bırakıldı.');
      return json(publicUser(await env.DB.prepare('SELECT * FROM id_users WHERE id=?').bind(u.id).first(), new URL(req.url).origin));
    },
    async googleUnlink(env, req) {
      const { u } = await need(env, req);
      const g = await env.DB.prepare('SELECT nopw FROM id_google WHERE uid=?').bind(u.id).first();
      if (g && g.nopw) throw new E('Bu hesabın parolası yok; Google bağlantısını kaldırmadan önce “Şifremi unuttum” ile bir parola belirleyin.', 'NEEDS_PASSWORD', 409);
      await env.DB.batch([env.DB.prepare('DELETE FROM id_google WHERE uid=?').bind(u.id), env.DB.prepare('UPDATE id_users SET google=NULL WHERE id=?').bind(u.id)]); await event(env, u.id, 'google_unlinked');
      return json(publicUser({ ...u, google: null }, new URL(req.url).origin));
    },
    async deleteAccount(env, req, b) {
      const { u } = await need(env, req);
      const g = await env.DB.prepare('SELECT nopw FROM id_google WHERE uid=?').bind(u.id).first();
      if (!(g && g.nopw) && !(await pwOk(env, u, b.password))) throw new E('Parola hatalı.', 'BAD_CREDENTIALS', 401);   // parolası olmayan (yalnız Google) hesap oturumla silinebilir
      await env.DB.batch(['id_sessions', 'id_app_sessions', 'id_authcodes', 'id_codes', 'id_chal', 'id_events', 'id_photos', 'id_google', 'np_links'].map(t => env.DB.prepare('DELETE FROM ' + t + ' WHERE uid=?').bind(u.id)).concat(env.DB.prepare('DELETE FROM id_users WHERE id=?').bind(u.id)));
      return ok({ ok: true, googleLinkRemoved: !!b.unlinkGoogle });
    }
  };

  /* ===== Google ile giriş / bağlama ===== */
  async function challenge(env, u) {
    const ch = b64(rnd(24));
    await env.DB.prepare('INSERT INTO id_chal(id,uid,exp,tries) VALUES(?,?,?,0)').bind(await sha256hex(ch), u.id, Date.now() + 5 * 60e3).run();
    if (u.tf_method === 'email') await sendCode(env, u, 'login2fa', 'FOREVYE ID giriş kodu');
    return ok({ twoFactorRequired: true, method: u.tf_method, challengeId: ch, email: u.email });
  }
  H_.googleLogin = async (env, req, b) => {
    await limit(env, 'idgg', req.headers.get('CF-Connecting-IP') || 'x', 40);
    const g = await verifyGoogle(env, b.credential);
    let u, link = await env.DB.prepare('SELECT * FROM id_google WHERE sub=?').bind(g.sub).first();
    if (link) u = await env.DB.prepare('SELECT * FROM id_users WHERE id=?').bind(link.uid).first();
    if (!u) {
      u = await byEmail(env, g.email);
      if (u) {
        // Aynı e-posta ile kayıtlı hesap: Google e-postayı kanıtladı. Doğrulanmamış (ele geçirilmiş olabilecek) hesapta eski parola geçersiz kılınır.
        let nopw = 0;
        if (!u.verified) { const salt = rndHex(16); await env.DB.prepare('UPDATE id_users SET salt=?, hash=?, verified=1 WHERE id=?').bind(salt, await hashPw(rndHex(24), salt), u.id).run(); await revokeAll(env, u.id); await revokeApps(env, u.id); nopw = 1; u = await env.DB.prepare('SELECT * FROM id_users WHERE id=?').bind(u.id).first(); }
        if (await env.DB.prepare('SELECT 1 AS x FROM id_google WHERE uid=?').bind(u.id).first()) throw new E('Bu hesaba başka bir Google hesabı bağlı.', 'GOOGLE_CONFLICT', 409);
        await env.DB.batch([env.DB.prepare('INSERT INTO id_google(sub,uid,email,nopw) VALUES(?,?,?,?)').bind(g.sub, u.id, g.email, nopw), env.DB.prepare('UPDATE id_users SET google=? WHERE id=?').bind(g.email, u.id)]);
        await event(env, u.id, 'google_linked', 'giriş sırasında');
      } else {
        const id = 'usr_' + rndHex(8), salt = rndHex(16), apps = {}; ID_CFG.apps.forEach(a => { apps[a.id] = { connected: true, displayName: '' }; });
        await env.DB.batch([
          env.DB.prepare('INSERT INTO id_users(id,email,salt,hash,verified,created,google,apps) VALUES(?,?,?,?,1,?,?,?)').bind(id, g.email, salt, await hashPw(rndHex(24), salt), Date.now(), g.email, JSON.stringify(apps)),
          env.DB.prepare('INSERT INTO id_google(sub,uid,email,nopw) VALUES(?,?,?,1)').bind(g.sub, id, g.email)]);
        await event(env, id, 'register', 'Google');
        u = await env.DB.prepare('SELECT * FROM id_users WHERE id=?').bind(id).first();
      }
    }
    if (u.tf_method) return challenge(env, u);
    return ok(await newSession(env, req, u, 'Google'));
  };
  H_.googleLink = async (env, req, b) => {
    const { u } = await need(env, req);
    await limit(env, 'idgl', u.id, 10);
    const g = await verifyGoogle(env, b.credential);
    if (await env.DB.prepare('SELECT 1 AS x FROM id_google WHERE uid=?').bind(u.id).first()) throw new E('Hesabınıza zaten bir Google hesabı bağlı.', 'GOOGLE_CONFLICT', 409);
    if (await env.DB.prepare('SELECT 1 AS x FROM id_google WHERE sub=?').bind(g.sub).first()) throw new E('Bu Google hesabı başka bir FOREVYE ID hesabına bağlı.', 'GOOGLE_CONFLICT', 409);
    await env.DB.batch([env.DB.prepare('INSERT INTO id_google(sub,uid,email,nopw) VALUES(?,?,?,0)').bind(g.sub, u.id, g.email), env.DB.prepare('UPDATE id_users SET google=? WHERE id=?').bind(g.email, u.id)]);
    await event(env, u.id, 'google_linked');
    return json(publicUser(await env.DB.prepare('SELECT * FROM id_users WHERE id=?').bind(u.id).first(), new URL(req.url).origin));
  };

  /* ===== Uygulama girişi: "FOREVYE ID ile giriş" (yetkilendirme kodu + PKCE) =====
     1) Uygulama kullanıcıyı ID sitesine yollar:  <ID>/#/baglan?app=..&redirect=..&state=..&challenge=BASE64URL(SHA256(verifier))
     2) ID sitesi (oturum açıkken) POST /identity/authorize → tek kullanımlık kod (60 sn) → tarayıcı redirect?code=..&state=.. adresine döner
     3) Uygulama POST /identity/token/exchange {code, verifier, app, redirect, tokens?} → kullanıcı kimliği (+ isteğe bağlı uygulamaya özel jetonlar)
     redirect adresleri yalnızca ID_REDIRECTS içinde (app=adres, virgülle) tam eşleşirse kabul edilir. */
  const redirectsOf = (env, app) => {
    const configured = String(env.ID_REDIRECTS || '').split(',').map(x => x.trim()).filter(Boolean)
      .map(x => { const i = x.indexOf('='); return [x.slice(0, i), x.slice(i + 1)]; })
      .filter(x => x[0] === app).map(x => x[1]);
    // Zamanlayıcı'nın sabit GitHub Pages callback'i güvenli allowlist'e gömülüdür;
    // diğer uygulamaların ID_REDIRECTS kayıtlarına dokunulmaz.
    if (app === 'zamanlayici') configured.push('https://frovyes.github.io/zamanlayici/');
    return [...new Set(configured)];
  };
  function checkApp(env, b) {
    const a = ID_CFG.apps.find(x => x.id === b.app);
    if (!a) throw new E('Bilinmeyen uygulama.', 'BAD_APP', 400);
    const allowed = redirectsOf(env, a.id);
    if (!allowed.includes(String(b.redirect || ''))) {
      // Kurulum hatası kolay bulunsun: gelen adres ve (gizli olmayan) izinli adresler mesajda görünür.
      const got = String(b.redirect || '').slice(0, 200);
      throw new E('Bu uygulama için yönlendirme adresi izinli değil. Gelen: ' + (got || '(boş)') + ' — ' + (allowed.length ? 'İzinli: ' + allowed.join(' , ') : 'Sunucuda ' + a.id + ' için ID_REDIRECTS tanımlı DEĞİL.'), 'BAD_REDIRECT', 400);
    }
    return a;
  }
  H_.authorizeInfo = async (env, req, b) => {
    const { u } = await need(env, req), a = checkApp(env, b), m = j(u.apps) || {};
    return ok({ app: { id: a.id, name: a.name, scopes: a.scopes }, connected: !!(m[a.id] && m[a.id].connected), email: u.email });
  };
  H_.authorize = async (env, req, b) => {
    const { u } = await need(env, req), a = checkApp(env, b);
    if (!/^[A-Za-z0-9_-]{43}$/.test(String(b.challenge || ''))) throw new E('Geçersiz PKCE değeri.', 'VALIDATION');
    const state = String(b.state || ''); if (!/^[A-Za-z0-9._~-]{8,200}$/.test(state)) throw new E('Geçersiz state.', 'VALIDATION');
    await limit(env, 'idaz', u.id, 30);
    const m = j(u.apps) || {}; m[a.id] = Object.assign({ displayName: '' }, m[a.id], { connected: true });
    const code = b64(rnd(32));
    await env.DB.batch([
      env.DB.prepare('UPDATE id_users SET apps=? WHERE id=?').bind(JSON.stringify(m), u.id),
      env.DB.prepare('INSERT INTO id_authcodes(h,uid,app,redirect,challenge,exp,used) VALUES(?,?,?,?,?,?,0)').bind(await sha256hex('ac|' + code), u.id, a.id, b.redirect, b.challenge, Date.now() + 60e3)]);
    await event(env, u.id, 'app_authorized', a.id);
    return ok({ redirect: b.redirect + (String(b.redirect).includes('?') ? '&' : '?') + 'code=' + code + '&state=' + state });
  };
  async function newAppSession(env, uid, app) {
    const at = b64(rnd(32)), rt = b64(rnd(32)), now = Date.now();
    await env.DB.prepare('INSERT INTO id_app_sessions(id,uid,app,a_hash,r_hash,a_exp,r_exp,created,last) VALUES(?,?,?,?,?,?,?,?,?)')
      .bind(rndHex(12), uid, app, await sha256hex(at), await sha256hex(rt), now + ID_CFG.accessMin * 60e3, now + ID_CFG.refreshDays * D, now, now).run();
    return { accessToken: at, refreshToken: rt };
  }
  H_.exchange = async (env, req, b) => {
    await limit(env, 'idex', req.headers.get('CF-Connecting-IP') || 'x', 120);
    const bad = () => new E('Kod geçersiz veya süresi dolmuş.', 'CODE_INVALID', 400);
    const code = String(b.code || ''), ver = String(b.verifier || '');
    if (!/^[A-Za-z0-9_-]{30,64}$/.test(code) || !/^[A-Za-z0-9._~-]{43,128}$/.test(ver)) throw bad();
    const h = await sha256hex('ac|' + code), r = await env.DB.prepare('SELECT * FROM id_authcodes WHERE h=? AND used=0 AND exp>?').bind(h, Date.now()).first();
    if (!r || r.app !== b.app || r.redirect !== b.redirect) throw bad();
    if (!eq(b64u(await crypto.subtle.digest('SHA-256', te.encode(ver))), r.challenge)) throw bad();
    if (!(await env.DB.prepare('UPDATE id_authcodes SET used=1 WHERE h=? AND used=0').bind(h).run()).meta.changes) throw bad();   // tek kullanım
    const u = await env.DB.prepare('SELECT * FROM id_users WHERE id=?').bind(r.uid).first(); if (!u) throw bad();
    const out = { user: { userId: u.id, email: u.email, emailVerified: !!u.verified, username: u.username || null } };
    if (b.tokens !== false) Object.assign(out, await newAppSession(env, u.id, r.app));
    return ok(out);
  };
  H_.appRefresh = async (env, req, b) => {
    const rt = String(b.refreshToken || ''), bad = () => new E('Oturum geçersiz.', 'UNAUTHORIZED', 401);
    if (!/^[A-Za-z0-9_-]{30,64}$/.test(rt)) throw bad();
    const s = await env.DB.prepare('SELECT * FROM id_app_sessions WHERE r_hash=? AND revoked=0 AND r_exp>?').bind(await sha256hex(rt), Date.now()).first();
    if (!s) throw bad();
    const u = await env.DB.prepare('SELECT apps FROM id_users WHERE id=?').bind(s.uid).first(), m = u && j(u.apps) || {};
    if (!(m[s.app] && m[s.app].connected)) throw bad();
    const at = b64(rnd(32)), nrt = b64(rnd(32));
    await env.DB.prepare('UPDATE id_app_sessions SET a_hash=?, r_hash=?, a_exp=?, r_exp=?, last=? WHERE id=?').bind(await sha256hex(at), await sha256hex(nrt), Date.now() + ID_CFG.accessMin * 60e3, Date.now() + ID_CFG.refreshDays * D, Date.now(), s.id).run();
    return ok({ accessToken: at, refreshToken: nrt });
  };
  H_.appRevoke = async (env, req, b) => {
    const rt = String(b.refreshToken || '');
    if (/^[A-Za-z0-9_-]{30,64}$/.test(rt)) await env.DB.prepare('UPDATE id_app_sessions SET revoked=1 WHERE r_hash=?').bind(await sha256hex(rt)).run();
    return ok();
  };
  /* Diğer modüller (Nexus Pass) için: uygulamaya özel erişim jetonu → { uid } */
  async function appAuth(env, req, app) {
    const m = /^Bearer ([A-Za-z0-9_-]{30,64})$/.exec(req.headers.get('Authorization') || ''); if (!m) return null;
    const s = await env.DB.prepare('SELECT uid FROM id_app_sessions WHERE a_hash=? AND app=? AND revoked=0 AND a_exp>?').bind(await sha256hex(m[1]), app, Date.now()).first();
    if (!s) return null;
    const u = await env.DB.prepare('SELECT apps FROM id_users WHERE id=?').bind(s.uid).first(), ap = u && j(u.apps) || {};
    return ap[app] && ap[app].connected ? { uid: s.uid } : null;
  }

  /* yönlendirme: [yöntem, yol] */
  async function handle(req, env, path, b) {
    const m = req.method;
    try {
      await ensureIdSchema(env);
      let r;
      if ((r = /^\/identity\/photo\/(usr_[0-9a-f]{16})$/.exec(path)) && m === 'GET') return await H_.getPhoto(env, req, r[1]);
      if ((r = /^\/identity\/sessions\/([0-9a-f]{24})$/.exec(path)) && m === 'DELETE') return await H_.revoke(env, req, r[1]);
      if ((r = /^\/identity\/apps\/([a-z0-9-]{1,40})$/.exec(path)) && ['PATCH', 'POST', 'DELETE'].includes(m)) return await H_.appEdit(env, req, r[1], m, b);
      const key = m + ' ' + path;
      switch (key) {
        case 'POST /identity/oauth/google': return await H_.googleLogin(env, req, b);
        case 'POST /identity/oauth/google/link': return await H_.googleLink(env, req, b);
        case 'POST /identity/authorize/info': return await H_.authorizeInfo(env, req, b);
        case 'POST /identity/authorize': return await H_.authorize(env, req, b);
        case 'POST /identity/token/exchange': return await H_.exchange(env, req, b);
        case 'POST /identity/app/refresh': return await H_.appRefresh(env, req, b);
        case 'POST /identity/app/revoke': return await H_.appRevoke(env, req, b);
        case 'POST /identity/register': return await H_.register(env, req, b);
        case 'POST /identity/email/verify': return await H_.verifyEmail(env, req, b);
        case 'POST /identity/email/resend': return await H_.resend(env, req, b);
        case 'POST /identity/login': return await H_.login(env, req, b);
        case 'POST /identity/token/refresh': return await H_.refresh(env, req, b);
        case 'POST /identity/logout': return await H_.logout(env, req);
        case 'POST /identity/logout-all': return await H_.logoutAll(env, req);
        case 'POST /identity/password/forgot': return await H_.forgot(env, req, b);
        case 'POST /identity/password/reset': return await H_.reset(env, req, b);
        case 'GET /identity/profile': return await H_.profile(env, req);
        case 'PATCH /identity/username': return await H_.setUsername(env, req, b);
        case 'POST /identity/profile/photo': return await H_.putPhoto(env, req);
        case 'DELETE /identity/profile/photo': return await H_.delPhoto(env, req);
        case 'GET /identity/sessions': return await H_.sessions(env, req);
        case 'GET /identity/security-events': return await H_.events(env, req);
        case 'GET /identity/apps': return await H_.apps(env, req);
        case 'POST /identity/2fa/enable': return await H_.twoFaEnable(env, req, b);
        case 'POST /identity/2fa/disable': return await H_.twoFaDisable(env, req, b);
        case 'DELETE /identity/oauth/google': return await H_.googleUnlink(env, req);
        case 'DELETE /identity/account': return await H_.deleteAccount(env, req, b);
      }
      return json({ code: 'NOT_FOUND', message: 'Bulunamadı.' }, 404);
    } catch (e) {
      if (e instanceof E) return json({ code: e.code, message: e.message }, e.status);
      throw e;
    }
  }
  return { handle, appAuth };
}
