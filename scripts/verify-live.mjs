#!/usr/bin/env node
/* Canlı Worker CORS doğrulaması — iki GitHub hesabı için.
 *   node scripts/verify-live.mjs                      → Mikro-Klima Worker'ı (varsayılan adres)
 *   node scripts/verify-live.mjs <mikro-klima-url>    → başka adres
 *   node scripts/verify-live.mjs --nexus [<nexus-url>] → ayrıca Nexus Banka Worker'ı
 * `npm run deploy` bunu her yayından sonra kendiliğinden çalıştırır. Hata varsa çıkış kodu 1'dir.
 * Bağımlılık yok (Node 18+). Tarayıcının yaptığı preflight (OPTIONS) isteğini taklit eder. */
import { PINNED_ORIGINS } from '../worker/origins.js';

const args = process.argv.slice(2);
const withNexus = args.includes('--nexus');
const urls = args.filter(a => /^https?:\/\//.test(a));
const MK = (urls[0] || 'https://mikroklimakontrolmerkezi.forevye.workers.dev').replace(/\/+$/, '');
const NX = (withNexus && urls[1] || 'https://forevye-nexus.forevyenexus.workers.dev').replace(/\/+$/, '');
const RETRIES = Number(process.env.VERIFY_RETRIES || 4), WAIT_MS = 3000;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function preflight(base, path, origin) {
  const r = await fetch(base + path, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } });
  return { status: r.status, acao: r.headers.get('access-control-allow-origin'), hdrs: r.headers.get('access-control-allow-headers') || '' };
}
async function simple(base, path, origin) {
  const r = await fetch(base + path, { headers: { Origin: origin } });
  return { status: r.status, acao: r.headers.get('access-control-allow-origin') };
}

const checks = [];
for (const o of PINNED_ORIGINS) {
  checks.push({ name: `MK  OPTIONS /identity/login        ← ${o}`, run: async () => { const x = await preflight(MK, '/identity/login', o); return x.status === 204 && x.acao === o && /authorization/i.test(x.hdrs) ? null : `HTTP ${x.status}, Allow-Origin=${x.acao}`; } });
  checks.push({ name: `MK  GET     /identity/client-config ← ${o}`, run: async () => { const x = await simple(MK, '/identity/client-config', o); return x.status === 200 && x.acao === o ? null : `HTTP ${x.status}, Allow-Origin=${x.acao}`; } });
  if (withNexus) for (const p of ['/api/bank/exchange', '/api/editor/exchange', '/api/shop/exchange', '/api/pass/exchange'])
    checks.push({ name: `NX  OPTIONS ${p.padEnd(24)}← ${o}`, run: async () => { const x = await preflight(NX, p, o); return x.status === 204 && x.acao === o ? null : `HTTP ${x.status}, Allow-Origin=${x.acao}`; } });
}
checks.push({ name: 'MK  GET     /api/ext/giftcard/health (Worker ayakta mı)', run: async () => { const r = await fetch(MK + '/api/ext/giftcard/health'); const j = await r.json().catch(() => null); return r.status === 200 && j && j.ok ? null : `HTTP ${r.status}`; } });
checks.push({ name: 'MK  OPTIONS yabancı origin REDDEDİLİR (güvenlik)', run: async () => { const x = await preflight(MK, '/identity/login', 'https://kotu.example'); return x.status === 403 && !x.acao ? null : `Beklenmedik: HTTP ${x.status}, Allow-Origin=${x.acao}`; } });

let failed = 0;
console.log(`Mikro-Klima: ${MK}${withNexus ? `\nNexus:       ${NX}` : ''}\nSabit GitHub origin'leri: ${PINNED_ORIGINS.join(' , ')}\n`);
for (const c of checks) {
  let err = 'çalışmadı';
  for (let i = 0; i < RETRIES; i++) {
    try { err = await c.run(); } catch (e) { err = 'AĞ HATASI: ' + (e && e.cause && e.cause.code || e.message); }
    if (!err) break;
    if (i < RETRIES - 1) await sleep(WAIT_MS);   // yeni deploy yayılırken kısa bekleme
  }
  console.log((err ? '✗ ' : '✓ ') + c.name + (err ? '   → ' + err : ''));
  if (err) failed++;
}
if (failed) {
  console.log(`\n${failed} kontrol BAŞARISIZ. Olası nedenler:
  1) Worker yanlış Cloudflare hesabına/eski sürüme deploy edilmiş → wrangler.toml'daki account_id'yi doldurun, 'npx wrangler whoami' ile hesabı doğrulayıp yeniden 'npm run deploy'.
  2) Adres yanlış → config.js / wrangler.toml içindeki workers.dev adresini panelden kontrol edin.
  3) Worker kapalı/hatalı → Cloudflare > Workers > Logs.`);
  process.exit(1);
}
console.log('\nTüm kontroller geçti: iki GitHub hesabı da Worker\'a erişebiliyor.');
