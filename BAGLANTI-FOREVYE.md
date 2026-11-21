# Forevye uygulamalarının Mikro-Klima sunucusuna bağlanması

Mikro-Klima Worker'ı (`mikroklimakontrolmerkezi.forevye.workers.dev`, D1 `mikroklima`) ortak arka uçtur.

| Uygulama | Bağlantı | Sunucu ucu |
|---|---|---|
| **Nexus Pass** | Kristal hesabıyla üyelik alır. Hesap = Mikro-Klima ID.ANAHTAR (`#hesap=` bağlantısı veya yapıştırma; yoksa yeni hesap açar) | `POST /api/npass/{products,product,me,purchases,purchase}` — `worker/nexus.js` |
| **Nexus (banka)** | Hediye kartı = kristal kartı; kart FN bakiyesine çevrilir | `POST /api/ext/giftcard/redeem`, `GET /api/ext/giftcard/health` (HMAC) |
| **Forevye ID** | E-posta/parola + **Google ile giriş**, 2FA (e-posta/TOTP), oturumlar, uygulama bağlantıları, profil fotoğrafı | `/identity/*` — `worker/identity.js` |

## Kurulum (bir kez)
1. Tabloları ekle (güvenli, tekrar çalıştırılabilir): `npx wrangler d1 execute mikroklima --remote --file=schema.sql`
2. `wrangler.toml` → `MARKET_ORIGIN`'e Nexus Pass sitesinin adresini ekle (virgülle), `ID_ORIGIN` = Forevye ID sitesinin adresi. Sadece alan adı, sonunda `/` yok.
3. Gizli değerler: `npx wrangler secret put NEXUS_SECRET` (en az 16 karakter; Nexus'taki `GIFTCARD_API_SECRET` ile aynı) ve `npx wrangler secret put RESEND_API_KEY`; `[vars]` içine `EMAIL_FROM = "FOREVYE ID <no-reply@alanadin.com>"` (Resend'de doğrulanmış alan adı). E-posta servisi yoksa ID kaydı **kapalı** kalır (503), sessizce kod sızdırmaz.
4. `npx wrangler deploy`. Nexus tarafında: `GIFTCARD_API_SECRET` secret'ı + wrangler.toml'daki `GIFTCARD_API_URL` hazır.

## Notlar / kararlar
- Nexus Pass fiyatları ve süreleri `worker/nexus.js` → `NP.products` içindedir (tarayıcı fiyat gönderemez). Örnek değerleri kendi ekonomine göre ayarla.
- Kristal → FN kuru Nexus'ta `GIFTCARD_MINOR_PER_KRISTAL`. Kristal kartla FN'e dönüşebildiği için kuru dikkatli seç.
- ID'de parolalar PBKDF2-SHA256 (100.000 tur, Workers sınırı), oturum jetonları yalnızca özet olarak saklanır; erişim jetonu 30 dk, yenileme 30 gün. Google ile giriş bu sürümde yok (istemci de "henüz eklenmedi" der). Profil fotoğrafı D1'de tutulur (en çok 1,9 MB; istemci zaten küçültür).
- `/api/pass/*` (Mantar Pano geçişi) ile `/api/npass/*` (Nexus Pass) ayrı uçlardır, karışmaz.

## FOREVYE ID ile giriş (Nexus ve Nexus Pass)
Akış (kod + PKCE, parola uygulamaya hiç gitmez): uygulama kullanıcıyı `ID sitesi/#/baglan?app=…&redirect=…&state=…&challenge=…` adresine yollar →
kullanıcı ID'de girişliyse “İzin ver” der → tarayıcı `redirect?code=…&state=…` ile uygulamaya döner → uygulama kodu `POST /identity/token/exchange` ile değiştirir.
Kod 60 saniye geçerli ve tek kullanımlıktır; `redirect` adresleri yalnızca `ID_REDIRECTS` içinde tam eşleşirse kabul edilir.

- **Nexus**: kendi çerez oturumunu açar (jeton almaz, `tokens:false`). İlk girişte aynı doğrulanmış e-postalı eski hesap varsa ona bağlanır; yoksa kullanıcı adı + kart ismi seçtirir (şifresiz hesap). `LEGACY_LOGIN="off"` ile e-posta/şifre kayıt-girişi kapatılır.
- **Nexus Pass**: uygulamaya özel jeton alır (30 dk erişim + 30 gün yenileme; ID profil/ayarlarına erişemez). İlk girişte bir kristal hesabı bağlanır (`np_links`; ID.ANAHTAR yapıştır ya da yeni hesap aç). Bundan sonra Pass kristal anahtarı taşımadan çalışır. ID'de “Bağlantıyı kaldır” Pass jetonlarını anında öldürür.
- **Google**: ID girişinde Google Identity Services düğmesi kimlik jetonu verir; sunucu imzayı (Google'ın anahtarlarıyla), `aud`, `iss`, süre ve e-posta doğrulamasını denetler. Aynı e-postalı doğrulanmamış (ele geçirilmiş olabilecek) hesaba bağlanırsa eski parola geçersiz kılınır. 2FA açıksa Google girişi de kod ister. Yalnız Google ile açılan hesapta (parolasız) bağlantı, parola belirlenmeden kaldırılamaz.

### Ek kurulum
1. `schema.sql`'i tekrar uygula (yeni tablolar: `id_google`, `id_authcodes`, `id_app_sessions`, `np_links`).
2. Google Cloud'da “Web uygulaması” OAuth istemcisi aç; yetkili JavaScript kaynağı = ID sitesinin alan adı. İstemci kimliğini hem Mikro-Klima `wrangler.toml` → `GOOGLE_CLIENT_ID` hem `forevye-id/config.js` → `GOOGLE_CLIENT_ID` alanına yaz (gizli değil).
3. Mikro-Klima `wrangler.toml` → `ID_REDIRECTS = "sanal-banka=https://<nexus>/api/auth/id/callback,nexus-pass=https://<pass-adresi>/"` (tam adres, sonunda `/` dahil aynen).
4. Nexus: `ID_URL` (ID arayüzü adresi) doldur, `npx wrangler d1 migrations apply` (0002_forevye_id.sql), deploy. Nexus Pass: `assets/config.js` → `ID_URL`.
5. Pass adresi `MARKET_ORIGIN` listesinde ve ID adresi `ID_ORIGIN`'de olmalı (CORS).
