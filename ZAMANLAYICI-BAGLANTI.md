# Zamanlayıcı: üyelik ve günlük kristal görevi

## Üyelik kodları

Zamanlayıcı geçişleri Forevye Mağaza'dan kristalle alınır. Her satın almada sunucu 13 harflik tek kullanımlık kod üretir. Kod ilk kullanıldığında süre başlar ve en fazla iki cihaza bağlanır.

| Paket | Süre | Kristal |
|---|---:|---:|
| Plus | 3 gün | 100 |
| Plus | 7 gün | 200 |
| Premium | 3 gün | 250 |
| Premium | 7 gün | 500 |

## Günlük kristal çarkı

Çark Zamanlayıcı'nın **Özelleştir** panelindedir. Her kristal hesabı için Türkiye takvim gününde tek bir kez çevrilebilir. Hedef süresi ve ödülü sunucu kriptografik rastgelelikle belirler; tekrar istekleri aynı hedefi döndürür.

Hedef dilimleri: 1, 5, 10, 15, 30, 45 dakika; 1, 2, 3 ve 4 saat. Ödül oranı saat başına 10 kristaldir. Örnekler: 4 saat = 40, 1 saat = 10, 30 dakika = 5, 1 dakika = 0,1667 kristal. Ödül dört ondalık basamağa yuvarlanır.

### Hesabı bağlama

1. Mağaza/Hava uygulamasındaki Kristal hesabında **Yedeğimi kopyala** seçeneğini kullan.
2. Zamanlayıcı → Özelleştir → Günlük Kristal Görevi alanına yedek metnini yapıştır.
3. **Hesabı bağla** ile hesabın doğrulanmasını sağla, ardından çarkı çevir.

Desteklenen kimlik: `8 haneli ID.gizli_anahtar` veya Mağaza'nın `{"mk":1,"kr":{"id":"…","token":"…"}}` yedek biçimi. Anahtar yalnızca bu cihazın localStorage alanında saklanır; sunucuya yalnızca HTTPS `Authorization: Bearer` başlığıyla gönderilir. Hesabı ayırmak cihazdaki kopyayı siler; sunucu bakiyesi ve geçmişi silinmez.

### Süre nasıl hesaplanır?

- Tarayıcı süreyi veya kristal miktarını sunucuya bildirmez. Worker, her aktif sayaç için sunucu saatine göre heartbeat aralıklarını toplar.
- Günlük toplam, çark hedefiyle sınırlandırılır. Çark 4 saat verdiyse 7 saatlik sayaçta en fazla 4 saat ve 40 kristal yazılır. Hedefe ulaşıldığı ilk sunucu heartbeat’inde ödül anında yatırılır; 7 saatlik sayacın kalan 3 saatini beklemek gerekmez.
- Hedef dolmadan sayaç durdurulursa kısmi ilerleme korunur; aynı gün devam edilebilir. Hedef tamamlanınca ödül otomatik yatar ve ödül oturumu kapanır; sayaç kendi süresini tamamlamaya devam edebilir.
- Aralık modunda yalnızca **Çalışma** fazları sayılır; mola fazları ödüle eklenmez. Görev ödemesi aralık dizisi tamamlandığında kontrol edilir.
- Kısmi ilerleme günlük kayıtta korunur. Sayaç sıfırlanırsa veya sayfa kapanırsa ödeme yapılmaz; son heartbeat'ten sonra en fazla 120 saniye güvenli kapanış payı eklenir. Yeni sayfa açılınca eski oturum kapatılır.
- Bir hesapta aynı anda yalnızca bir ödül oturumu çalışabilir. Aynı gün ikinci çark isteği, yinelenen tamamlama veya aynı ödeme isteği ikinci kristali vermez.
- Yeni görev Türkiye saatiyle 00:00'da açılır. Bir önceki günün açık oturumu gece yarısında kapatılır.

## Sunucu uçları

Tamamı mevcut Kristal hesabının `Authorization: Bearer ID.TOKEN` kimliğiyle çağrılır:

- `POST /api/timer-reward/state`
- `POST /api/timer-reward/spin`
- `POST /api/timer-reward/start` — `mode: stopwatch | countdown | interval-work`
- `POST /api/timer-reward/pulse` — `sessionId`
- `POST /api/timer-reward/stop` — `sessionId`
- `POST /api/timer-reward/complete` — `sessionId` (isteğe bağlı)

Günlük ve oturum tabloları Worker ilk isteği aldığında `CREATE TABLE IF NOT EXISTS` ile kurulur; ayrıca manuel D1 migration gerekmez. Günlük kayıt `uid + day` birincil anahtarıyla korunur; `active=1` oturumları için hesap başına kısmi benzersiz indeks ve ödeme için tek kullanımlık sunucu referansı vardır.

## Dağıtım ve CORS

- Worker deposunda `wrangler.toml` içindeki `ZP_ORIGIN` değeri Zamanlayıcı'nın GitHub Pages kökeni olmalıdır (bu yapılandırmada `https://frovyes.github.io`).
- `MARKET_ORIGIN` Mağaza kökenini korur. `ZP_ORIGIN`, Zamanlayıcı'nın hesaplı günlük ödül uçlarına CORS erişimi verir.
- Worker deposunu GitHub'a gönderip mevcut Actions/Cloudflare dağıtımının tamamlanmasını bekle.
- Zamanlayıcı deposunda `index.html`, `app.js`, `daily-reward.js`, `style.css` ve `sw.js` birlikte yayımlanmalıdır. Service Worker kabuk sürümü yükseltilmiştir.

Günlük hedef seçenekleri ve ödül oranı Worker'daki `worker/timer-rewards.js` içinde tanımlıdır. Arayüzdeki dilimler aynı sırayı kullanır.
