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
  kind  TEXT NOT NULL,                    -- daily | streak | buy | redeem | admin_add | card_new | card_use | card_cancel | card_refund
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

-- Zamanlayıcı geçişleri (Plus / Premium, 3 ya da 7 gün; kristalle alınır, kod ilk kullanıldığında süre başlar). Mantar Pano tablosundan ayrı. Tekrar çalıştırmak güvenlidir.
CREATE TABLE IF NOT EXISTS zpasses (
  code    TEXT PRIMARY KEY,               -- 13 harflik kod
  uid     TEXT NOT NULL,                  -- satın alan Site ID ('' = yönetici üretti)
  tier    TEXT NOT NULL,                  -- plus | premium
  days    INTEGER NOT NULL,               -- süre (gün)
  cost    INTEGER NOT NULL DEFAULT 0,
  t       TEXT NOT NULL,
  created INTEGER NOT NULL,
  used_at INTEGER,                        -- ilk kullanım (unix sn); NULL = henüz kullanılmadı
  exp     INTEGER NOT NULL DEFAULT 0,     -- bitiş (unix sn), ilk kullanımda yazılır
  devs    TEXT NOT NULL DEFAULT ''        -- bağlı cihaz kimlikleri (virgülle), en fazla CFG.zaman.maxDevices
);
CREATE INDEX IF NOT EXISTS zpasses_uid ON zpasses(uid, created);

-- Hediye kartları (kristal kartı): 8 haneli no + 3 haneli CVV + SKT (AA/YY) ile bozdurulur. Kristal oluşturanın hesabından kart oluşturulurken düşer. Tekrar çalıştırmak güvenlidir.
CREATE TABLE IF NOT EXISTS gcards (
  no         TEXT PRIMARY KEY,            -- 8 haneli kart numarası (son hane Luhn)
  cvv        TEXT NOT NULL,               -- 3 haneli güvenlik kodu
  ex         TEXT NOT NULL,               -- SKT, "AA/YY"
  exp        INTEGER NOT NULL,            -- bitiş (unix sn): SKT ayının sonu
  uid        TEXT NOT NULL,               -- kartı oluşturan Site ID
  n          INTEGER NOT NULL,            -- kristal tutarı
  tpl        INTEGER NOT NULL DEFAULT 0,  -- şablon (0-14)
  msg        TEXT NOT NULL DEFAULT '',    -- kısa mesaj
  frm        TEXT NOT NULL DEFAULT '',    -- gönderen adı (isteğe bağlı)
  t          TEXT NOT NULL,
  created    INTEGER NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active',  -- active | used | cancelled | expired
  to_id      TEXT,                        -- bozduran Site ID
  used_at    INTEGER,
  bad        INTEGER NOT NULL DEFAULT 0,  -- art arda yanlış deneme
  lock_until INTEGER NOT NULL DEFAULT 0   -- kilit bitişi (unix sn)
);
CREATE INDEX IF NOT EXISTS gcards_uid ON gcards(uid, created);

-- FOREVYE ID (e-posta/parola kimliği; forevye-id arayüzü) ve Nexus Pass (kristalle üyelik). Tekrar çalıştırmak güvenlidir.
CREATE TABLE IF NOT EXISTS id_users (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, hash TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL,
  username TEXT UNIQUE, uname_first INTEGER NOT NULL DEFAULT 0, uname_hist TEXT NOT NULL DEFAULT '[]',
  photo_at INTEGER, tf_method TEXT, tf_secret TEXT, tf_draft TEXT, google TEXT,
  devices TEXT NOT NULL DEFAULT '[]', apps TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS id_sessions (
  id TEXT PRIMARY KEY, uid TEXT NOT NULL, a_hash TEXT NOT NULL, r_hash TEXT NOT NULL, a_exp INTEGER NOT NULL, r_exp INTEGER NOT NULL,
  device TEXT NOT NULL DEFAULT '', dtype TEXT NOT NULL DEFAULT '', loc TEXT NOT NULL DEFAULT '',
  created INTEGER NOT NULL, last INTEGER NOT NULL, revoked INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS id_sessions_uid ON id_sessions(uid);
CREATE INDEX IF NOT EXISTS id_sessions_a ON id_sessions(a_hash);
CREATE INDEX IF NOT EXISTS id_sessions_r ON id_sessions(r_hash);
CREATE TABLE IF NOT EXISTS id_codes (uid TEXT NOT NULL, kind TEXT NOT NULL, h TEXT NOT NULL, exp INTEGER NOT NULL, tries INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (uid, kind));
CREATE TABLE IF NOT EXISTS id_chal (id TEXT PRIMARY KEY, uid TEXT NOT NULL, exp INTEGER NOT NULL, tries INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS id_events (id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT NOT NULL, type TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS id_events_uid ON id_events(uid, id);
CREATE TABLE IF NOT EXISTS id_photos (uid TEXT PRIMARY KEY, mime TEXT NOT NULL, data BLOB NOT NULL);

CREATE TABLE IF NOT EXISTS np_purchases (
  id TEXT PRIMARY KEY, uid TEXT NOT NULL, pid TEXT NOT NULL, app TEXT NOT NULL, name TEXT NOT NULL,
  price INTEGER NOT NULL, dur INTEGER NOT NULL, status TEXT NOT NULL, idem TEXT NOT NULL, at INTEGER NOT NULL, ledger TEXT NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS np_idem ON np_purchases(uid, idem);
CREATE INDEX IF NOT EXISTS np_uid ON np_purchases(uid, at);
CREATE TABLE IF NOT EXISTS np_ents (id TEXT PRIMARY KEY, uid TEXT NOT NULL, pid TEXT NOT NULL, starts INTEGER NOT NULL, expires INTEGER NOT NULL, purchase_id TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS np_ents_uid ON np_ents(uid, pid);

-- Google ile giriş, uygulama girişi (FOREVYE ID ile giriş) ve Nexus Pass ↔ ID hesap bağı
CREATE TABLE IF NOT EXISTS id_google (sub TEXT PRIMARY KEY, uid TEXT NOT NULL UNIQUE, email TEXT NOT NULL, nopw INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS id_authcodes (h TEXT PRIMARY KEY, uid TEXT NOT NULL, app TEXT NOT NULL, redirect TEXT NOT NULL, challenge TEXT NOT NULL, exp INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS id_authcodes_uid ON id_authcodes(uid);
CREATE TABLE IF NOT EXISTS id_app_sessions (
  id TEXT PRIMARY KEY, uid TEXT NOT NULL, app TEXT NOT NULL, a_hash TEXT NOT NULL, r_hash TEXT NOT NULL,
  a_exp INTEGER NOT NULL, r_exp INTEGER NOT NULL, created INTEGER NOT NULL, last INTEGER NOT NULL, revoked INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS id_app_sessions_uid ON id_app_sessions(uid);
CREATE INDEX IF NOT EXISTS id_app_sessions_a ON id_app_sessions(a_hash);
CREATE INDEX IF NOT EXISTS id_app_sessions_r ON id_app_sessions(r_hash);
CREATE TABLE IF NOT EXISTS np_links (uid TEXT PRIMARY KEY, site_id TEXT NOT NULL UNIQUE, at INTEGER NOT NULL);
