# İki GitHub hesabı + iki Cloudflare hesabı — adresler tek yerden

Forevye iki ayrı GitHub hesabı ve iki ayrı Cloudflare hesabı üzerinde çalışır. Adresler eskiden yalnızca Cloudflare
panelindeki değişkenlerde (`ID_ORIGIN`, `MARKET_ORIGIN`, `ZP_ORIGIN`, Nexus'ta `BANK_URL`…) tutuluyordu; yanlış hesaba deploy,
panelde silinen/değişen değer ya da eski sürüm yüzünden CORS kapanıyor ve FOREVYE ID şu hatayı veriyordu:
*"Sunucu isteği tamamlanamadı. Worker kapalı/yanlış adresli olabilir veya CORS … kaynağına izin vermiyor."*

## Kalıcı çözüm: adresler KODA gömülü

| Ne | Nerede | Not |
|---|---|---|
| İki GitHub hesabının origin'leri | `worker/origins.js` → `PINNED_ORIGINS` (bu repo) ve `src/lib/origins.js` → `PINNED_SITE_ORIGINS` (forevye-nexus) | **İki dosya aynı listeyi taşır.** Testler (`tests/origins.test.mjs`, Nexus `test/origins.test.mjs`) tutarlılığı ve davranışı denetler. |
| "FOREVYE ID ile giriş" dönüş adresleri | `worker/identity.js` → `PINNED_REDIRECTS` | Zaten sabitti. |
| Ek / geçici adresler | `wrangler.toml` `[vars]` veya Cloudflare paneli | Sabit listeye **eklenir**, onu kaldıramaz. |

Sabit adresler: `https://mhaforevye.github.io` ve `https://frovyes.github.io`. Joker (`*.github.io`) yoktur; yalnızca tam origin eşleşir.

Bu adresler şunlar için her zaman izinlidir: `/identity/*` (FOREVYE ID), hesaplı Mağaza uçları (`/api/init`, `sync`, `buy`, …),
Zamanlayıcı açık uçları (`ZP_ORIGIN` doluysa; boşsa eskisi gibi `*`) ve Nexus'ta Banka / Kart editörü / Market / Pass uçları.

## Yeni bir site / GitHub hesabı eklemek
1. `worker/origins.js` içindeki `PINNED_ORIGINS` listesine ekle.
2. Aynı adresi forevye-nexus deposunda `src/lib/origins.js` → `PINNED_SITE_ORIGINS` listesine ekle.
3. `npm test` (iki depoda) → deploy (aşağıya bak).

Geçici/ek adres için kodu değiştirmeden `MARKET_ORIGIN` / `ID_ORIGIN` / `ZP_ORIGIN` (Nexus'ta `*_ORIGINS`) değişkeni de yeterlidir.

## Yanlış Cloudflare hesabına deploy'u engelle
İki `wrangler.toml` dosyasında da `account_id` satırı yorum olarak hazırdır. Kendi hesap kimliğini yazıp yorumu kaldır:

- Mikro-Klima (workers.dev alt alanı `forevye`) → bu repodaki `wrangler.toml`
- Nexus (workers.dev alt alanı `forevyenexus`) → forevye-nexus deposundaki `wrangler.toml`

Hesap kimliği: Cloudflare paneli → Workers & Pages → sağ kenardaki **Account ID**, ya da `npx wrangler whoami`.
`account_id` dolu olduğunda wrangler başka hesapta oturum açıkken bu Worker'ı yanlış yere yayınlayamaz.

## Her deploy'dan sonra doğrulama
`npm run deploy` artık en sonda `scripts/verify-live.mjs` çalıştırır: canlı Worker'a iki GitHub hesabının origin'iyle gerçek
preflight (OPTIONS) ve GET istekleri atar, yabancı origin'in reddedildiğini de kontrol eder. Elle çalıştırmak için:

```
npm run verify:live                         # Mikro-Klima Worker'ı
node scripts/verify-live.mjs --nexus        # ayrıca Nexus Banka/Editör/Market/Pass uçları
node scripts/verify-live.mjs https://baska-adres.workers.dev
```

Hepsi ✓ ise FOREVYE ID'deki CORS hatası bitmiştir. ✗ çıkarsa betik olası nedenleri yazar (yanlış hesap/eski sürüm, yanlış adres, kapalı Worker).
