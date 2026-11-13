/* Mantar Pano imza anahtarı üretir (isteğe bağlı sertleştirme). Kullanım:  node worker/gen-mp-key.mjs
   1) ÖZEL anahtarı Worker'a gizli olarak ver:   npx wrangler secret put MP_SIGN_KEY   (aşağıdaki PRIVATE satırını yapıştır)
   2) AÇIK anahtarı Mantar Pano config.js içindeki PUBLIC_KEY alanına koy (aşağıdaki PUBLIC satırı).
   Özel anahtarı hiçbir yere (GitHub dahil) yazma. */
import { generateKeyPairSync } from 'node:crypto';
const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
const priv = privateKey.export({ format: 'jwk' }), pub = publicKey.export({ format: 'jwk' });
console.log('PRIVATE (wrangler secret MP_SIGN_KEY):\n' + JSON.stringify(priv) + '\n');
console.log('PUBLIC (Mantar Pano config.js → PUBLIC_KEY):\n' + JSON.stringify({ kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y }));
