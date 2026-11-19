# Zamanlayıcı: kod sistemi ve uygulamaya bağlama

Zamanlayıcı geçişleri Forevye Mağaza'dan kristalle alınır. Her satın almada sunucu 13 harflik tek kullanımlık bir kod üretir; kodu Zamanlayıcı uygulamasında girersin.

| Paket | Süre | Kristal |
|---|---|---|
| Plus | 3 gün | 100 |
| Plus | 7 gün | 200 (günlük hesapla **%14 tasarruf**) |
| Premium | 3 gün | 250 |
| Premium | 7 gün | 500 (günlük hesapla **%14 tasarruf**) |

Fiyatlar ve süreler yalnızca `worker/index.js` içindeki `CFG.zaman` bölümündedir. Tarayıcının gönderdiği tutar kullanılmaz; Mağaza ekranındaki yüzde de sunucudan gelir (`1 − 7 günlük / (3 günlük × 7/3)`).

## Kurulum (bir kerelik)

1. **Tabloyu ekle:** `npx wrangler d1 execute mikroklima --remote --file=schema.sql` (mevcut tablolara dokunmaz, sadece yeni `zpasses` tablosunu ekler; tekrar çalıştırmak güvenlidir).
2. **Sunucuyu yayınla:** `npx wrangler deploy`
3. **(İsteğe bağlı) Adres kısıtla:** Zamanlayıcı web uygulamasıysa `ZP_ORIGIN = https://KULLANICI.github.io` (sadece alan adı; virgülle birden fazla). Boşsa herhangi bir adresten çağrılabilir; kodun kendisi anahtardır.
4. **(İsteğe bağlı) İmzalı jeton:** `npx wrangler secret put ZP_SIGN_KEY` (ECDSA P-256 özel anahtar, JWK). Yanıtta `token` döner; uygulama açık anahtarla doğrular. Anahtar yoksa jeton eklenmez. Mantar Pano'dan ayrı anahtardır.

## Uygulamanın çağıracağı uçlar (hesapsız, CORS açık)

```
POST https://mikroklimakontrolmerkezi.forevye.workers.dev/api/zamanlayici/redeem
POST https://mikroklimakontrolmerkezi.forevye.workers.dev/api/zamanlayici/verify
Content-Type: application/json
{ "code": "ABCD-EFGH-JKLMN", "app": "zamanlayici", "device": "<cihaza özel rastgele kimlik, 4-64 karakter>", "v": 1 }
```

- **redeem:** kodu ilk kez girince süre **o an** başlar ve kod cihaza bağlanır. Aynı cihaz tekrar girerse aynı bitiş tarihini alır. Kod en fazla **2 cihaza** bağlanır.
- **verify:** süre başlatmaz, cihaz bağlamaz; "hâlâ geçerli mi" der (uygulama açılışında yenileme için).
- Kod büyük/küçük harf ve tire fark etmez.

Başarı: `{ "ok": true, "app": "zamanlayici", "plan": "plus" | "premium", "expiresAt": <ms>, "token"?: "..." }`

Hata: `{ "ok": false, "error": "invalid_code" | "used" | "expired" | "wrong_app" | "rate_limited", "message": "..." }`

| error | HTTP | anlamı |
|---|---|---|
| `invalid_code` | 400/404 | kod yok ya da bozuk |
| `used` | 409 | kod 2 cihaza bağlı, bu üçüncü |
| `expired` | 410 | süre dolmuş |
| `wrong_app` | 400 | `app` alanı `zamanlayici` değil |
| `rate_limited` | 429 (verify: 503) | çok deneme; verify'da 503 "ağ sorunu" sayılsın, premium kapanmasın |

Uygulama tarafında önerilen davranış: `plan`'ı `expiresAt`'e kadar geçerli say; açılışta ve günde bir `verify` çağır; ağ hatasında (ya da 5xx) son bilinen durumu koru; `expired` ya da `invalid_code` gelirse planı kapat.

## Güvenlik özeti

- 13 harflik kod, 32 karakterlik alfabeden kriptografik rastgele üretilir (~65 bit); tahmin etmek pratikte imkânsız, ayrıca IP başına 10 dakikada 40 deneme sınırı vardır.
- Satın alma tek atomik SQL ile kristali düşer (`bal >= fiyat` koşullu): aynı anda çok istek gelse de bakiye eksiye düşmez, kod yazılamazsa kristal iade edilir.
- Paket ve gün yalnızca izin listesinden (`plus|premium` × `3|7`) kabul edilir; "3.5", "3; DROP" gibi değerler reddedilir. Tablo adı koda sabittir, kullanıcı girdisi SQL'e eklenmez (hep `bind`).
- Zamanlayıcı ve Mantar Pano kodları ayrı tablolardadır: biri ötekinde geçmez. İmzalı jetonda uygulama adı da imzalıdır.
- Yönetici kodu üretimi (`/api/admin/zpass`) `ADMIN_TOKEN` ister ve hız sınırlıdır.
