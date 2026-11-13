-- Kristal veritabanı (Cloudflare D1)
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,            -- 8 haneli Site ID
  token_hash TEXT NOT NULL,               -- gizli anahtarın SHA-256 özeti
  bal        INTEGER NOT NULL DEFAULT 0,
  earned     INTEGER NOT NULL DEFAULT 0,
  gift       INTEGER NOT NULL DEFAULT 0,
  spent      INTEGER NOT NULL DEFAULT 0,
  days       INTEGER NOT NULL DEFAULT 0,
  first      TEXT NOT NULL DEFAULT '',
  last       TEXT NOT NULL DEFAULT '',
  cam        TEXT NOT NULL DEFAULT '',
  pending    TEXT NOT NULL DEFAULT '',
  created    INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reqs (
  no      TEXT PRIMARY KEY,
  uid     TEXT NOT NULL,
  pack    TEXT NOT NULL,
  cost    INTEGER NOT NULL,
  cam     TEXT NOT NULL,
  t       TEXT NOT NULL,
  created INTEGER NOT NULL,
  status  TEXT NOT NULL DEFAULT 'new'     -- new | done
);
CREATE INDEX IF NOT EXISTS reqs_uid ON reqs(uid, created);
CREATE TABLE IF NOT EXISTS codes (
  code    TEXT PRIMARY KEY,               -- 13 harflik hediye kodu
  to_id   TEXT NOT NULL,
  n       INTEGER NOT NULL,
  t       TEXT NOT NULL,
  created INTEGER NOT NULL,
  used_at INTEGER
);
CREATE INDEX IF NOT EXISTS codes_to ON codes(to_id);
CREATE TABLE IF NOT EXISTS log (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  uid   TEXT NOT NULL,
  kind  TEXT NOT NULL,                    -- daily | streak | buy | redeem | admin_add
  delta INTEGER NOT NULL,
  ref   TEXT NOT NULL DEFAULT '',
  t     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS log_uid ON log(uid);
-- Günlük yeni hesap sınırı için (IP ham saklanmaz, günlük özet)
CREATE TABLE IF NOT EXISTS ipc (
  h TEXT NOT NULL,
  d TEXT NOT NULL,
  c INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (h, d)
);
-- Giriş serisi (sunucu hesaplar; 7 günde bir seri ödülü buradan verilir). Tekrar çalıştırmak güvenlidir.
CREATE TABLE IF NOT EXISTS streak (
  uid    TEXT PRIMARY KEY,
  n      INTEGER NOT NULL DEFAULT 0,      -- güncel seri (gün)
  best   INTEGER NOT NULL DEFAULT 0,
  shield INTEGER NOT NULL DEFAULT 0,      -- 0/1: tek günü kaçırmaya karşı sessiz kalkan
  paid   INTEGER NOT NULL DEFAULT 0,      -- bu seride seri ödülü verilen en son gün sayısı
  last   TEXT NOT NULL DEFAULT ''         -- son sayılan gün (Türkiye saati)
);

-- Mantar Pano geçişleri (Pro / Sınırsız, kristalle alınır; süre kod ilk kullanıldığında başlar; Mantar Pano /api/mantarpano/redeem ile bozdurur). Tekrar çalıştırmak güvenlidir.
CREATE TABLE IF NOT EXISTS passes (
  code    TEXT PRIMARY KEY,               -- 13 harflik kod
  uid     TEXT NOT NULL,                  -- satın alan Site ID ('' = yönetici üretti)
  tier    TEXT NOT NULL,                  -- pro | unl
  days    INTEGER NOT NULL,               -- süre (gün)
  cost    INTEGER NOT NULL DEFAULT 0,
  t       TEXT NOT NULL,
  created INTEGER NOT NULL,
  used_at INTEGER,                        -- ilk kullanım (unix sn); NULL = henüz kullanılmadı
  exp     INTEGER NOT NULL DEFAULT 0,     -- bitiş (unix sn), ilk kullanımda yazılır
  devs    TEXT NOT NULL DEFAULT ''        -- bağlı cihaz kimlikleri (virgülle), en fazla CFG.mantar.maxDevices
);
CREATE INDEX IF NOT EXISTS passes_uid ON passes(uid, created);
