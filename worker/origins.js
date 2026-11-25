/* ===========================================================================
   FOREVYE — SABİT (KODA GÖMÜLÜ) SİTE ADRESLERİ · TEK DOĞRU KAYNAK
   ---------------------------------------------------------------------------
   Forevye siteleri İKİ ayrı GitHub hesabında yayınlanır:
     • https://mhaforevye.github.io   (FOREVYE ID, Nexus Banka/Market/Pass, Zamanlayıcı ...)
     • https://frovyes.github.io      (Zamanlayıcı ikinci yayını ...)
   Ve sunucular da İKİ ayrı Cloudflare hesabındadır (Mikro-Klima ↔ Nexus).

   Eskiden bu adresler yalnızca Cloudflare değişkenlerinde (ID_ORIGIN, MARKET_ORIGIN, ZP_ORIGIN) tutuluyordu.
   Yanlış hesaba deploy, panelde silinen/değişen değer ya da eski sürüm yüzünden CORS kapanıyor ve FOREVYE ID
   "Sunucu isteği tamamlanamadı ... CORS" hatası veriyordu.

   ARTIK: aşağıdaki adresler HER ZAMAN izinlidir; panel / wrangler.toml değişkenleri bunlara EK adres ekleyebilir
   ama bunları kaldıramaz. Yeni bir GitHub hesabı/sitesi eklenecekse SADECE bu dosyaya yazılır.
   (Nexus tarafındaki karşılığı: forevye-nexus/src/lib/origins.js — iki dosya aynı listeyi taşımalıdır;
   tests/origins.test.mjs ve Nexus test/origins.test.mjs bunu denetler.)
   Joker (*.github.io) yoktur; yalnızca tam origin eşleşir. Çerez yok, kimlik Authorization başlığında.
   =========================================================================== */
export const PINNED_ORIGINS = Object.freeze([
  'https://mhaforevye.github.io',
  'https://frovyes.github.io'
]);

/* "https://x.github.io/yol/" gibi yola kaçmış bir değer de olsa yalnızca origin'e indirger; çözümlenemeyen değer (ör. "*") aynen kalır. */
export function cleanOrigin(x) {
  const s = String(x == null ? '' : x).trim().replace(/\/+$/, '');
  if (!s || s === '*') return s;
  try { const u = new URL(s); return u.protocol === 'https:' || u.protocol === 'http:' ? u.origin : s; } catch (_) { return s; }
}

/* Virgülle ayrılmış liste → temiz origin dizisi (boşlar atılır) */
export const parseOrigins = val => String(val == null ? '' : val).split(',').map(cleanOrigin).filter(Boolean);

/* Sabit adresler + verilen değişken değerleri (tekrarsız). Sabitler her zaman başta gelir. */
export const withPinned = (...vals) => [...new Set([...PINNED_ORIGINS, ...vals.flatMap(parseOrigins)])];
