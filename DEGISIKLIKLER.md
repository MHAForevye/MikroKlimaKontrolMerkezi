# Bu sürümde değişenler

## Karne artık kendi sekmesinde
- Alt çubukta 5 sekme: Tahmin, Detay, **Karne**, Kaynaklar, Ayarlar. "Geçmiş doğruluk" tablosu, "Kendi karnem" ve seri ateşi Karne sekmesinde; Kaynaklar'da yalnızca kaynak listesi kaldı. Sade görünümde Kaynaklar gizli olsa da Karne görünür. Ayarlar > Açılış sekmesi'ne "Karne" eklendi.

## Seri ateşi: 12 alev, 7 günde bir 60 kristal
- Alev 7, 14, 21... günde rengini ve şeklini değiştirir (Kıvılcım, Mum Alevi, Kamp Ateşi, Meşale, Mavi, Turkuaz, Zümrüt, Mor, Gül, Altın, Buz, Gökkuşağı; yan diller, hale, yıldız ve taç eklenir). Kademeler `js/core.js` (`SERI_TIERS`, `seriTier`), çizim `js/seri.js`, renkler `css/style.css` (`.fl-t0` ... `.fl-t11`).
- **Seriyi sunucu hesaplar** (`worker/index.js`, `streakNext`): ardışık günde +1, tek gün kaçırılırsa kalkan varsa korunur, yoksa 1'den başlar. Her **7. günde +60 kristal** (`CFG.streakEvery`, `CFG.streakBonus`). Tarayıcıdaki sayı ödülü etkilemez, hile yapılamaz. Yerel seri bir kez devralınır ama sunucudaki giriş günü sayısını aşamaz.
- **Dağıtım için zorunlu:** yeni `streak` tablosu var. `npx wrangler d1 execute <veritabanı> --remote --file=schema.sql` (tekrar çalıştırmak güvenli).
- Mağaza'da "Alev koleksiyonu" rafı: 12 alevden hangileri açık, kilitlilerin ne zaman açılacağı; açık olanlardan istediğini seçebilirsin ("Otomatik" en yükseği gösterir).

## Mağaza ve görünüm seçici yeniden tasarlandı ("Vitrin")
- `css/vitrin.css` + `js/vitrin.js`: dokulu altın çerçeveli, parıltılı, animasyonlu kartlar; iki renkli sahne başlığı, bakiye çubuğu ve "sonraki günlük ödüle kalan süre". Karta basınca **ayrıntı penceresi** açılır: büyük resim, ad, açıklama, bilgi etiketleri, **Al / Uygula** ve **Kapat**.
- Mağaza: Ücretsiz ödüller (günlük giriş, seri ödülü, hediye kodu), Aktivasyon paketleri, Alev koleksiyonu, Hesabım.
- Ayarlar > Görünüm: Renk modu için **Açık / Koyu / Sistem** önizleme kartları (Sistem artık cihazı canlı izler) ve Tema için Sade / Klasik / Çizgi film önizleme kartları.
- Hareket azaltma ayarı açıksa animasyonlar kapanır.

## Paylaşım kartı
- Karne sekmesi > Paylaşım kartı: Hava, Karne ve Seri olmak üzere 3 tür, 1080x1350 resim. Tarayıcıda çizilir, sunucuya gitmez. Paylaş (Web Share) ya da indir. `js/kart.js`.

## Şehir sayfaları
- 81 il için `sehir/<ad>.html` + `sehir/index.html`, `sitemap.xml` güncellendi. `node build-cities.mjs` (veya `npm run cities`) üretir, `npm run deploy` otomatik çalıştırır. Sayfadaki "tahmini aç" bağlantısı `/?yer=enlem,boylam,Ad` ile konumu kayıtlı konumlara ekler ve açar. Canlı sıcaklık `js/sehir.js`.

## Ana ekrana ekle önerisi, iskelet ekran, sekme olayları
- Ayarlar'a **ikinci kez** girildiğinde bir kez, kapatılabilir bir "Ana ekrana ekleyelim mi?" kartı çıkar (kuruluysa hiç çıkmaz).
- İlk veri gelene kadar sıcaklık, saatlik şerit ve 7 günlük görünüm için iskelet (shimmer) ekran.
- GoatCounter olayları: `sekme/<ad>` (hangi sekme açıldı), `sure/<ad>/<kova>` (sekmede geçen süre kovası), `a2hs/...`, `kart-ac/...`, `gorunum/...`. Kişisel veri yok. Gizlilik sayfası güncellendi.

## Karne verisi sunucuda tutulmuyor
- Karne verisi (model tahminleri ve gerçekleşenler) cihazda kalır; yalnızca yukarıdaki anonim olay sayıları GoatCounter'a gider. İleride toplu karne istenirse ayrı bir izinle düşünülmeli.

## Düzeltme
- `.assetsignore` zip'te yoktu (test başarısızdı); yeniden eklendi. Worker kodu ve testler artık siteyle birlikte yayınlanmıyor.

---

# Önceki sürümde değişenler

## Seri ateşi (Mağaza'da)
- Mağaza sayfasının üstünde hafif animasyonlu mavi alev, kaç gün üst üste açıldığı ve son 7 günün işaretleri. Ayarlar > Mağaza düğmesinde de küçük alev + gün sayısı görünür.
- Baskı yok: üst çubukta alev, açılır pencere, uyarı ya da "seri bozuldu" dili kalmadı. Sadece olumlu mesajlar ("Bugün de buradasın", "Tekrar hoş geldin"). Tek gün kaçırılırsa seri sessizce korunur (her 7. günde bir kalkan, ekranda yazmaz).
- Tamamen yerel (`mk_seri`, localStorage). Sunucuya, kristallere, Worker'a dokunulmadı. Mantık `js/core.js` (`seriNext`, 9 test), arayüz `js/seri.js`.

## Logo ve ikonlar
- Başlıkta küçük güneş yerine uygulamanın şemsiyeli logosu (`icon.png`), 48 px, beyaz zeminli, mavi halkalı.
- Klasik/Sade: ikonlar keskin çiziliyor (karanlık temada boya filtresi bulanıktı), kart başlığı ikonları 28 px. Karanlık temada açık dolgulu küçük ikonlar (SSS, takvim, saat) açık rozet üstünde.

## Masaüstü (Sade)
- Başlık 1200 px, içerik 620 px idi; şimdi hepsi tek, ortalanmış 680 px sütunda. İçerik yatay yarım kalmıyor.

## Diğer uygulamalar
- Stüdyo sayfasında **Mantar Pano** bağlantısı (https://frovyes.github.io/mantarpano/, yeni sekmede).

---

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
