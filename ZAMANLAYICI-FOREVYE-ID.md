# Zamanlayıcı — FOREVYE ID oturumu ve Kristal eşleştirmesi

## Otomatik tanıma

- Zamanlayıcı, FOREVYE ID uygulama kimliği `zamanlayici` ile PKCE girişini kullanır.
- ID oturumu zaten açıksa ID giriş sayfası kullanıcıyı yeniden parola ekranına göndermez.
- Kullanıcı Zamanlayıcı'ya daha önce izin verdiyse onay ekranı tekrar gösterilmeden güvenli tek kullanımlık kod döndürülür.
- İlk onaydan sonra uygulamaya özel erişim/yenileme jetonları Zamanlayıcı'da saklanır; kısa süreli erişim jetonu bittiğinde yenileme otomatik yapılır.
- Kimlik jetonu parolayı veya ID anahtarını Zamanlayıcı'ya vermez.

## Kristal hesabı eşleştirme

1. Kullanıcının FOREVYE ID hesabında daha önce Nexus Pass üzerinden `np_links` kaydı varsa Zamanlayıcı aynı Kristal hesabını otomatik kullanır.
2. Eski Zamanlayıcı sürümünden kalma cihaz içi `ID.ANAHTAR` kaydı varsa, ilk FOREVYE ID oturumunda sunucuya güvenli biçimde bir defa eşleştirilir ve cihazdaki eski kayıt silinir.
3. Bu iki durum da yoksa kullanıcıdan mevcut Kristal hesap yedeği yalnızca bir defa istenir. Eşleştirme `np_links` tablosuna ID kullanıcı kimliğiyle kaydedilir; sonraki girişlerde tekrar anahtar istenmez.
4. Bir Kristal hesabı birden fazla FOREVYE ID hesabına bağlanamaz.

## Güvenlik ve callback

- PKCE `S256`, tek kullanımlık authorization code ve `state` doğrulaması kullanılır.
- Zamanlayıcı callback adresi: `https://frovyes.github.io/zamanlayici/`
- Bu tek callback, Worker'daki `redirectsOf()` içinde sabit ve tam URL allowlist olarak tanımlıdır. Diğer uygulamaların `ID_REDIRECTS` kayıtları değiştirilmez.
- Identity API CORS, mevcut `ZP_ORIGIN` üzerinden Zamanlayıcı kökenine izin verir.
- Zamanlayıcı ödül uçları ID app token'ını doğrular, ardından `np_links` kaydındaki Kristal `site_id` üzerinden mevcut bakiyeye yazar.

## Yayınlanacak dosyalar

- `zamanlayici-main/`: `daily-reward.js`, `style.css`, `sw.js`, `README.md`
- `MikroKlimaKontrolMerkezi-main/`: `worker/index.js`, `worker/identity.js`, `wrangler.toml`, bu belge
- `forevye-id-main/`: `app.js`
