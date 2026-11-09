# Bu sürümde değişenler

## Yapı
- Dosya yerleri değişmedi (her şey kökte, `js/app.js` yerinde). Eksik olan `.assetsignore` eklendi: `worker/`, `schema.sql`, `wrangler.toml`, `.github/`, README vb. artık internetten erişilemez.
- Kökteki `app.js` ile `js/app.js` birleştirildi: tek kaynak `js/app.js` (kökteki yeni sürüm). **Eski kök `app.js` dosyasını elle sil.** Böylece yayında eksik kalan `era5Trust`, `memClean` (yedek içe aktarma doğrulaması) ve gerçek `esc()` kaçışı devreye girdi.
- `.vscode/` kaldırıldı, `.gitignore` eklendi.

## Güvenlik
- `esc()` artık karakterleri silmiyor, HTML'e kaçışlıyor. METAR istasyon kodu da kaçışlandı.
- `_headers`: nosniff, Referrer-Policy, Permissions-Policy ve kırmayan bir CSP (`object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`).
- Worker hız sınırları (10 dakikalık dilim, `ipc` tablosunda): yanlış admin anahtarı 8/IP, kod deneme 20/hesap, satın alma 10/hesap.

## Performans / PWA
- İkonlar gerçek kare boyutlarda yeniden üretildi (192, 512, maskable 512 güvenli alanlı, apple 180). Toplam ~4 MB → ~430 KB.
- Service worker: sayfa dosyaları için 3,5 sn ağ zaman aşımı sonrası önbellek, yalnızca 200 cevapları önbelleğe alınır (206 hatası giderildi). Sürüm `mk-v15`.
- `index.html`: yinelenen meta etiketleri silindi, GoatCounter adresi `https://` yapıldı, sürüm numaraları artırıldı (`app.js?v=kristal-4`, `kristal.js?v=kristal-9`).

## Kristal
- Sunucu eski hesabı bulamayınca açılan yeni hesapta "Önceki hesabımı geri yükle" düğmesi çıkıyor.

## METAR
- Önceki dosya indirilemezse iş artık durur (geçmiş silinmez); 404 yalnızca ilk çalıştırma sayılır. Bozuk JSON'da `metar.py` hata verir. Eşzamanlı çalışma engellendi.

## Dokümantasyon
- README: "kendi sunucum yok" ifadesi düzeltildi, altyapı, klasör yapısı ve kurulum adımları eklendi. `sitemap.xml` sadeleştirildi.

## Bilerek yapılmayanlar
- Brier skoru / güvenilirlik eğrisi ve yağışta medyan: tahmin davranışını değiştirir, gerçek veriyle doğrulanmalı.
- Tam `script-src` CSP: `index.html` içinde 15 satır içi `onclick` ve çok sayıda satır içi stil var.
- Open-Meteo şartları ve "ticari değil" ifadesi: kod değil, senin karar vereceğin bir konu.
