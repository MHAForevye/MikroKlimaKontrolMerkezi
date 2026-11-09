# Bu sürümde değişenler

## Kurulum: üzerine yazarken
- Zip'i repo köküne çıkar, üzerine yaz. **Eski kök `app.js`'i elle sil** (artık tek kaynak `js/app.js`).
- `.assetsignore` gizli dosyadır, çıkarken üzerine yazıldığından emin ol.
- Bundan sonra yayın: `npm run deploy` (sürüm numaralarını günceller, testleri çalıştırır, yayınlar).

## Görünüm: yeni varsayılan "Sade"
- Yeni kullanıcılar **Sade** görünümle açılır: büyük sıcaklık, öğüt vermeyen tek olgu cümlesi ("Saat 15:00 civarında yağmur bekleniyor."), 3 sekme (Kaynaklar sekmesi gizli), ayrıntı düğmesi "Ayrıntıları gör →", teknik istatistik şeridi gizli.
- **Klasik** ve **Çizgi film** görünümleri Ayarlar > Görünüm'de üçlü seçici olarak duruyor. Daha önce görünüm seçmiş kullanıcıların seçimi korunur. Kaynaklar sekmesi Klasik/Çizgi film'de görünür.
- Sade, Klasik'in renk ve bileşenlerini paylaşır (`css/sade.css` yalnızca farkları ekler).

## Erişilebilirlik
- "İçeriğe geç" bağlantısı (klavye/ekran okuyucu), `main` hedefi.
- Sekmeler doğru ARIA desenine getirildi: `tablist`, ←/→/Home/End ile gezinme, yalnızca etkin sekme Tab sırasında. Gizli sekme atlanır.
- İki grafik tuvaline `role="img"` ve ad eklendi (daha önce ekran okuyucuya adsızdı).
- Sade'de: belirgin 3 px odak halkası, en az 48 px dokunma alanı, açık temada ana renk metin için yeterli kontrastta (#0284c7 4.1:1 → #0369a1 5.9:1).
- Testler: bu kuralların bozulmasını yakalar (`tests/site.test.mjs`).
- Henüz yapılmadı: grafiklerin metin tablosu eşdeğeri, Ayarlar ekranının yeniden sıralanması, Detay ekranının sadeleştirilmesi.

## Güvenlik
- **Gerçek CSP:** `script-src 'self' https://gc.zgo.at`. Satır içi betik ve `onclick` kalmadı: 15 statik + 5 dinamik düğme `data-act` + tek olay dağıtıcısına, tema betiği `js/theme.js`'e taşındı.
- `esc()` artık karakterleri silmiyor, kaçışlıyor. METAR istasyon kodu da kaçışlandı.
- Güvenlik başlıkları (`_headers`), `.assetsignore` (Worker kodu, şema, ayarlar yayına girmez).
- Worker hız sınırları: kod denemesi 20 / satın alma 10 (hesap başına, 10 dk), yanlış admin anahtarı 30 (IP başına, 10 dk), yeni hesap 20 / IP / gün (operatör IP paylaşımı yüzünden 5'ten yükseltildi).

## Kod
- `js/core.js`: skor, medyan, ağırlıklı medyan, kaçış, yağış zamanı saf fonksiyon olarak ayrıldı ve Node'da test ediliyor.
- `bump-version.mjs`: `?v=` numaraları ve `sw.js` önbellek adı içerikten otomatik üretilir.
- `tests/`: 26 test (skor/hesap, Worker + sahte D1, site bütünlüğü: CSP kuralı, dosya referansları, ikon boyutları, sürüm güncelliği).

## Uygulama
- Havalimanı METAR dosyası 3 saatten eskiyse arayüzde uyarı çıkıyor.
- Hesap kurtarma: sunucu eski hesabı bulamayıp yeni hesap açınca "Önceki hesabımı geri yükle" düğmesi.
- Gerçek kare ikonlar (4 MB → ~430 KB), service worker'da 3,5 sn ağ zaman aşımı, 206 önbellek hatası giderildi.
- METAR iş akışı: önceki dosya indirilemezse iş durur, 72 saatlik geçmiş silinmez.

## Bilerek yapılmayanlar
- Brier skoru / güvenilirlik eğrisi: mevcut veriyle hesaplanamaz (aşağıya bak).
- Yağışta medyan: tahmin davranışını değiştirir, gerçek veriyle doğrulanmalı.
- Open-Meteo yük azaltma (önbellek / toplu çağrı): ayrı bir tasarım kararı.
- Mağaza ve sahip girişi: istek üzerine olduğu gibi bırakıldı.
