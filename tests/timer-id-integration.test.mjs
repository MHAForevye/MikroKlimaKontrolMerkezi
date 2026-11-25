import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = p => readFile(new URL(p, root), 'utf8');

test('FOREVYE ID registers Zamanlayıcı and pins the exact callback', async () => {
  const id = await read('worker/identity.js');
  assert.ok(id.includes("id: 'zamanlayici', name: 'Zamanlayıcı'"));
  assert.ok(id.includes('https://frovyes.github.io/zamanlayici/'));
});

test('ID CORS allows the configured Zamanlayıcı origin', async () => {
  const worker = await read('worker/index.js');
  assert.ok(worker.includes('withPinned(env.ID_ORIGIN, env.MARKET_ORIGIN, env.ZP_ORIGIN)'));
});

test('daily reward routes resolve the ID app session to the linked crystal wallet', async () => {
  const worker = await read('worker/index.js');
  assert.ok(worker.includes("IDENT.appAuth(env, req, 'zamanlayici')"));
  assert.ok(worker.includes("SELECT id,email,verified FROM id_users WHERE id=?"));
  const rewards = await read('worker/timer-rewards.js');
  assert.ok(rewards.includes('/api/ext/timer-reward/'));
  assert.ok(rewards.includes('id_user_id: identity.idUserId'));
});

test('timer performs PKCE, token refresh, and account-link status checks', async () => {
  const app = await read('../Zamanlayici/daily-reward.js');
  assert.ok(app.includes('/identity/token/exchange'));
  assert.ok(app.includes('/identity/app/refresh'));
  assert.ok(app.includes('zamanlayici-forevye-id-pkce-v1'));
  assert.ok(app.includes('refreshToken'));
});

test('customization panel is stacked and mobile sheet prevents horizontal overflow', async () => {
  const css = await read('../Zamanlayici/style.css');
  assert.ok(css.includes('grid-template-columns:minmax(0,1fr)'));
  assert.ok(css.includes('overflow-x:hidden'));
});
