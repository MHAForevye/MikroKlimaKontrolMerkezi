# Forevye uygulamalarının Mikro-Klima sunucusuna bağlanması

Mikro-Klima Worker'ı (`mikroklimakontrolmerkezi.forevye.workers.dev`, D1 `mikroklima`) ortak arka uçtur.

| Uygulama | Bağlantı | Sunucu ucu |
|---|---|---|
| **Nexus Pass** | Kristal hesabıyla üyelik alır. Hesap = Mikro-Klima ID.ANAHTAR (`#hesap=` bağlantısı veya yapıştırma; yoksa yeni hesap açar) | `POST /api/npass/{products,product,me,purchases,purchase}` — `worker/nexus.js` |
| **Nexus (banka)** | Hediye kartı = kristal kartı; kart FN bakiyesine çevrilir | `POST /api/ext/giftcard/redeem`, `GET /api/ext/giftcard/health` (HMAC) |
| **Forevye ID** | E-posta/parola kimliği, 2FA (e-posta/TOTP), oturumlar, uygulama bağlantıları, profil fotoğrafı | `/identity/*` — `worker/identity.js` |

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
