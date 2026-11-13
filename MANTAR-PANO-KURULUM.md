# Mantar Pano kodlarını yayına alma (sırayla)

1. **Veritabanı:** `schema.sql` içindeki yeni `passes` tablosunu D1'e ekle (tekrar çalıştırmak güvenli):
   `npx wrangler d1 execute <VERITABANI_ADI> --remote --file=schema.sql`
2. **Worker'ı yayınla:** `npx wrangler deploy`
3. **Site dosyalarını yayınla** (index.html, js/kristal.js, js/vitrin.js, sw.js, gizlilik.html): GitHub'a gönder.
4. **Mantar Pano `config.js`:**
   ```js
   API_BASE: 'https://MIKROKLIMA-WORKER-ADRESIN.workers.dev',
   VERIFY_PATH: '/api/mantarpano/verify',            // isteğe bağlı: iptal/yenileme kontrolü
   STORE_URL: 'https://KULLANICI.github.io/MikroKlimaKontrolMerkezi/',
   ```
5. **(İsteğe bağlı) CORS'u kısıtla:** Worker değişkeni `MP_ORIGIN = https://KULLANICI.github.io` (sadece alan adı, sonunda `/` ve yol olmadan).
6. **(İsteğe bağlı) İmza:** `node worker/gen-mp-key.mjs` çıktısındaki PRIVATE satırı `npx wrangler secret put MP_SIGN_KEY` ile Worker'a ver; PUBLIC satırı Mantar Pano `config.js → PUBLIC_KEY` alanına koy. Özel anahtarı GitHub'a yazma.

## Deneme
- Mikro Klima → Mağaza → yönetici bölümü → **Mantar kodu üret** → kodu Mantar Pano'da Premium penceresine yapıştır.
- Ya da kristalle al: Mağaza → Mantar Pano → Pro (120) / Sınırsız (250).
- Tarayıcı konsolunda CORS hatası görürsen `API_BASE` adresini ve `MP_ORIGIN` değerini kontrol et.
