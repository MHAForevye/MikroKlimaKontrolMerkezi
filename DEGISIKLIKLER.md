# Bu sürümde değişenler (iki GitHub / iki Cloudflare hesabı: CORS kalıcı düzeltme)

- **Sorun:** FOREVYE ID "Sunucu isteği tamamlanamadı … CORS, https://mhaforevye.github.io kaynağına izin vermiyor" hatası veriyordu. İki GitHub hesabının adresleri yalnızca Cloudflare değişkenlerinde tutuluyordu; yanlış hesaba deploy / panelde silinen değer / eski sürüm CORS'u kapatıyordu.
- **Çözüm:** `worker/origins.js` (yeni) iki GitHub origin'ini (`mhaforevye`, `frovyes`) koda gömer. `worker/index.js` bunları `/identity/*`, hesaplı Mağaza uçları ve Zamanlayıcı uçlarında HER ZAMAN izinli sayar; `ID_ORIGIN` / `MARKET_ORIGIN` / `ZP_ORIGIN` yalnızca EK adres ekler. Yola kaçmış değerler (`https://x.github.io/forevye-id/`) origin'e indirgenir.
- **Yeni:** `scripts/verify-live.mjs` + `npm run verify:live` (deploy sonunda kendiliğinden çalışır), `HESAPLAR-VE-ADRESLER.md`, `wrangler.toml` içinde `account_id` koruması (yorum olarak hazır).
- **Testler:** `tests/origins.test.mjs` (yeni; panel değişkenleri boş/yanlış olsa da iki hesap çalışır, yabancı origin reddedilir). `tests/worker.test.mjs` ve `tests/timer-id-integration.test.mjs` yeni davranışa göre güncellendi.

## Ortak servisler: posta ve altın fiyatı (Nexus'un yükünü alır)
- `worker/mail.js`: tek Brevo/Resend gönderici. FOREVYE ID (`identity.js`) bunu kullanır; aynı modül Nexus için `POST /api/ext/mail` (HMAC imzalı, `NEXUS_SECRET`) ucunda da çalışır. Alıcı başına 10 dk'da 5, toplam 80 posta sınırı. Gizli anahtar/gönderen yalnızca burada (BREVO_API_KEY, EMAIL_FROM).
- `GET /api/ext/gold`: altın fiyatı (gold-api, yedek Yahoo) 60 sn önbelleklenir (`ext_cache` tablosu ilk kullanımda kendiliğinden kurulur); kaynak çökerse 15 dk'ya kadar son fiyat `stale:true` ile döner. Nexus `GOLD_API_URL` ile buradan okur.
- Testler: `tests/ext-services.test.mjs`.
- Nexus girişi için `ID_REDIRECTS` içinde `sanal-banka=https://<nexus-adresi>/api/auth/id/callback` bulunmalı.

## Hediye kartı: tablo otomatik kurulur
- `worker/index.js`: `gcards` tablosu veritabanında yoksa ilk kart isteğinde kendisi kurulur (`schema.sql`'i çalıştırmayı unutmak artık "Sunucu hatası" yapmaz). Testi: `tests/cards.test.mjs`.
- `.assetsignore` adı düzeltildi (zip içinde `_.assetsignore` olmuştu).

# Bu sürümde değişenler (Mağaza ayrı repoya taşındı)

## Mağaza artık bu repoda değil
- Mağaza sayfası, kristal ekranı, alev koleksiyonu, hediye kodu ve yönetici bölümü **forevye-market** reposuna taşındı (statik site). Bu repoda `js/kristal.js` ve `#storePage` yok.
- Ayarlar > **Mağazayı aç** artık Mağaza sitesini yeni sekmede açar (`js/magaza.js`, adres: `MARKET_URL`). Bu tarayıcıda eski bir kristal hesabı varsa adrese `#hesap=ID.ANAHTAR` eklenir; Mağaza hesabı bir kez yükler ve adres çubuğundan siler (`#` sonrası sunucuya gitmez).
- Yedek metni `kr` (hesap anahtarı) taşır; Mağaza bu yedeği de okur.
- **Günlük ödül ve seri aynen hava uygulamasında işlenir.** `js/kristal.js` artık arayüzsüz: uygulama açılınca sunucuya `sync` gider, ödül aynı hesaba yazılır; kristal Mağaza'da harcanır. Mağaza ve hava uygulaması aynı hesabı kullanır (hesap `#hesap=ID.ANAHTAR` bağlantısıyla iki yönde taşınır, `js/hesap.js`). Farklı hesaplar açılmışsa karşı taraf sorar, eskisi yedeklenir.
- Alev koleksiyonu rafı ve seri sayısının Ayarlar düğmesindeki rozeti Mağaza'ya taşındı (rozet için `#seriSt` hâlâ var).

## Zamanlayıcı kodları (yeni)
- Mağaza'ya **Zamanlayıcı** rafı: Plus 3 gün 100, Plus 7 gün 200, Premium 3 gün 250, Premium 7 gün 500 kristal. 7 günlük paketlerde günlük hesapla **%14 tasarruf** yazar.
- Sunucu: `POST /api/zpass/buy` (hesaplı), `POST /api/zamanlayici/redeem|verify` (açık, Mantar Pano ile aynı sözleşme), `POST /api/admin/zpass|zpasses` (yönetici). Yeni tablo `zpasses` (`schema.sql`, mevcut tablolara dokunmaz). Uygulamaya bağlama: `ZAMANLAYICI-BAGLANTI.md`.
- Mantar Pano kodu çalışması genelleştirildi (`APPS` tablosu); davranışı değişmedi, mevcut testler aynen geçiyor.
- Yeni isteğe bağlı değişkenler: `ZP_ORIGIN`, `ZP_SIGN_KEY`. `MP_ORIGIN` artık virgülle liste de kabul eder.
- 8 yeni test (fiyatlar, güvenlik, eşzamanlı alım, 3. cihaz, süre, imza, yönetici). Toplam 68.

## Sunucu (`worker/index.js`)
- Yeni değişken **`MARKET_ORIGIN`** (`wrangler.toml [vars]`): hesaplı uçlara (`/api/init`, `sync`, `buy`, `pass/buy`, `redeem`, `mail-done`, `admin/*`) sadece bu adres(ler)den CORS ile erişilir. Boşsa eskisi gibi kapalı. Hata yanıtları dahil her yanıta başlık eklenir; çerez yok, kimlik `Authorization` başlığında.
- Mantar Pano uçları (`/api/mantarpano/redeem|verify`) değişmedi.
- 2 yeni test (CORS izin listesi, ön kontrol, hata yanıtları).

## Kurulum notu
- Zip'te `.assetsignore` adı `_.assetsignore` olarak gelmişti (bu yüzden bir test düşüyordu); doğru adla eklendi.

---

# Bu sürümde değişenler (Mantar Pano Pro / Sınırsız kodları)

## Mağaza: Mantar Pano
- Mağazaya **Mantar Pano** rafı eklendi: **Pro 120 kristal**, **Sınırsız 250 kristal**, ikisi de **7 gün**. Satın alınca 13 harflik tek kod verilir ve "Mantar Pano kodlarım" bölümünde durur (durum: hazır / aktif + bitiş tarihi / süresi doldu, kopyala düğmesi).
- Astrophoto Cam paketleri, hediye kodu, seri ve alev sistemi **aynen duruyor**.
- Yönetici bölümüne **Mantar kodu üret** eklendi (ücretsiz kod: paket + gün sayısı). Test ve hediye için.

## Sunucu (`worker/index.js`, `schema.sql`)
- Yeni tablo `passes` (kod, paket, gün, ilk kullanım, bitiş, bağlı cihazlar). `schema.sql` tekrar çalıştırılabilir (`IF NOT EXISTS`).
- `POST /api/pass/buy` (hesaplı): kristal atomik düşer, kod üretilir; yazılamazsa kristal iade edilir. Hız sınırı: 10 dakikada 10 istek.
- `POST /api/mantarpano/redeem` ve `/api/mantarpano/verify` (hesapsız, CORS açık): Mantar Pano'nun `BAGLANTI.md` sözleşmesiyle birebir. İlk kullanımda 7 gün başlar ve kod cihaza bağlanır; en fazla **2 cihaz** (telefon + bilgisayar), aynı cihaz aynı bitişi alır. `verify` süre başlatmaz. Yanıt: `{ok, app, plan: pro|unlimited, expiresAt(ms), token?}`; hata: `invalid_code | used | expired | wrong_app | rate_limited`.
- Hız sınırı: IP başına 10 dakikada 40 bozdurma, 300 yenileme kontrolü (yenileme sınırı aşılırsa 503 döner; Mantar Pano 5xx'i ağ sorunu sayar, premium kapanmaz).
- İsteğe bağlı **imzalı jeton** (ECDSA P-256): `MP_SIGN_KEY` gizli anahtarı tanımlıysa yanıta `token` eklenir. Anahtar çifti: `node worker/gen-mp-key.mjs`.
- İsteğe bağlı `MP_ORIGIN` değişkeni: CORS'u sadece Mantar Pano adresine kısıtlar (boşsa `*`).
- `POST /api/admin/pass`: yönetici kodu.
- `state` cevabına `passes` (son 20 kod) ve `cfg.mantar` eklendi.

## Diğer
- `js/kristal.js` v10, `js/vitrin.js` (yeni `art.pano` resmi), `index.html`, `sw.js` sürümleri güncellendi. `gizlilik.html` Mantar Pano kodlarını anlatıyor.
- Testler: 9 yeni test (satın alma, süre başlangıcı, cihaz sınırı, hatalar, verify, CORS, imza, hız sınırı, yönetici kodu).

---

# Bu sürümde değişenler (tasarım turu)

## Alev daha büyüleyici
- `js/seri.js` (`flame`) + `css/style.css`: renk geçişli gövde (alt koyu, uç açık), nefes alan aura, alevin ucu ve gövdesi kıvrılarak akar (`d` özelliği desteklenen tarayıcılarda), ince parlama çizgisi, yukarı uçan kıvılcımlar (kademe arttıkça çoğalır).
- 5. kademeden (Turkuaz) itibaren yavaş dönen ışık huzmeleri; 7. kademeden (Mor) itibaren alevin etrafında dönen ışıltılar (9. kademeden sonra yıldız); Gökkuşağı'nda renk akışı ve parlayan taç sürüyor.
- Karne'deki alev büyütüldü (92x112). Alevin altında **"Sıradaki: Mavi Alev · 5 gün sonra yanar"** önizlemesi var: baskısız, sadece merak uyandırır. Son kademede gizlenir.
- Küçük alevlerde (Ayarlar düğmesi) ek efektler kapalı, sade kalır. Hareket azaltma açıksa tüm animasyonlar durur.

## Kristal: çocuksu çizim korundu
- `js/vitrin.js` içindeki yeni kristal çizimi, eski çocuksu (yüzlü, yanaklı) kristalle değiştirildi; Mağaza, bakiye çubuğu ve etiketlerde artık Ayarlar ikonlarıyla aynı kristal görünür.

## Mağaza Karne'den kalktı
- Karne sekmesindeki "Alev koleksiyonu" düğmesi kaldırıldı; Karne'de yalnızca "Paylaşım kartı" kaldı. Mağaza artık sadece **Ayarlar'ın en altında** (küçük bir kart olarak), seri sayısı ve alevle birlikte.

---

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
