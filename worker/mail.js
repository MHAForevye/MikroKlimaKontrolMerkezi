/* FOREVYE ortak posta servisi. Tek yer, tek gönderen: FOREVYE ID (identity.js) ve Nexus (/api/ext/mail üzerinden) aynı Brevo hesabını kullanır.
   BREVO_API_KEY varsa Brevo (ücretsiz 300/gün), yoksa RESEND_API_KEY. Gönderen: EMAIL_FROM = "Ad <adres@...>" (Brevo > Senders'ta doğrulanmış olmalı). */
const parseFrom = f => { const m = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(String(f || '')); return m ? { name: m[1].replace(/^"|"$/g, '') || undefined, email: m[2] } : { email: String(f || '').trim() }; };

export const mailReady = env => Array.isArray(env.__mail) || Boolean(env.EMAIL_FROM && (env.BREVO_API_KEY || env.RESEND_API_KEY));

export async function sendMail(env, to, subject, text) {
  if (Array.isArray(env.__mail)) { env.__mail.push({ to, subject, text }); return true; }   // testler
  if (!env.EMAIL_FROM || !(env.BREVO_API_KEY || env.RESEND_API_KEY)) { console.log('[mail:kapalı]', subject); return false; }
  try {
    if (env.BREVO_API_KEY) {
      const r = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ sender: parseFrom(env.EMAIL_FROM), to: [{ email: to }], subject, textContent: text }) });
      if (!r.ok) console.log('[mail:brevo]', r.status, (await r.text().catch(() => '')).slice(0, 200));
      return r.ok;
    }
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, text }) });
    return r.ok;
  } catch (e) { return false; }
}
