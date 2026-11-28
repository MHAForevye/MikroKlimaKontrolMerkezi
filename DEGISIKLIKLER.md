# Bu sürümde değişenler

## Yeni tasarım (profesyonel, Apple tarzı)
- Çizgi film / pastel / elle çizim görünümü tamamen kaldırıldı. Sistem yazı tipi (Apple'da SF Pro, Windows'ta Segoe UI, Android'de Roboto), sade kartlar, ince çizgiler, yumuşak gölgeler.
- Emoji yok. Tüm ikonlar SVG: 8 hava glifi (renkli) + 40'tan fazla arayüz ikonu (`js/icons.js`). Testler emoji girmesini engeller.
- Özet kartı gökyüzüne göre renk değiştirir (açık, parçalı, bulutlu, sis, yağmur, kar, fırtına, gece). Beyaz yazı kontrastı testle doğrulanır.
- Mobil: alt sekme çubuğu, bulanık arka planlı üst çubuk, kaydırmalı saat şeridi. Masaüstü (1024 px üstü): sol kenar çubuğu, geniş iki sütunlu Ayrıntılı görünüm. Bilgi pencereleri mobilde alt sayfa, masaüstünde ortada pencere.
- Grafikler (Chart.js) yeni renklerle: ızgara sade, açık ve koyu temada okunur.

## Kontroller ve isimler
- Tema: **Otomatik / Açık / Koyu** (Ayarlar). Otomatik, cihazın gece/gündüz ayarını canlı izler. Eski tek düğmeli "Gece / gündüz teması" kalktı.
- Görünüm: **Sade / Ayrıntılı** (eskiden Sade / Klasik / Çizgi film). Daha önce "Çizgi film" seçmiş kullanıcılar Sade'ye geçer; "Klasik" seçenler Ayrıntılı'ya.
- Sekme ikonları düzeltildi: Tahmin (bulut), Detay (grafik), Kaynaklar (katmanlar), Ayarlar (ayar çubukları; eskiden konum iğnesiydi).
- Kart başlıklarındaki ikonlar işlevine uydu (radar, havalimanı, grafik, hedef, geçmiş...).
- Bildirim başlıklarındaki emojiler kaldırıldı, sayfa başlığındaki uyarı işareti "(!)" oldu.

## Seri alevi kaldırıldı
- Seri alevi, gün sayacı ve ilgili kod (`js/seri.js`, `core.js` içindeki `seriNext`) kaldırıldı. Eski `mk_seri` kaydı tarayıcılardan kendiliğinden silinir.
- **Günlük kristal ödülü, Mağaza ve hediye kodu aynı yerde ve aynı şekilde duruyor** (Ayarlar > Mağaza). Sunucuya, Worker'a ve D1'e dokunulmadı.

## Dosyalar
- Yeni: `js/icons.js`. Yeniden yazıldı: `css/style.css`, `css/sade.css`, `index.html`, `js/app.js`, `js/theme.js`, `gizlilik.html`.
- Artık kullanılmayan (silinebilir): `css/classic.css`, `css/fonts.css`, `fonts/` klasörü, `js/seri.js`.
- Sürüm numaraları (`?v=`) ve `sw.js` önbellek adı bu paket için hazır hesaplandı.
