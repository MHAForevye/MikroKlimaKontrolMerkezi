/* Çevrimdışı çalışma: sayfa, kütüphaneler ve fontlar önbelleğe alınır; hava API cevapları ayrı, sınırlı bir önbellekte tutulur.
   Sayfa dosyaları "ağ önce": ağ NET_TIMEOUT içinde cevap vermezse önbellekteki kopya hemen gösterilir (yavaş bağlantıda takılmaz),
   ağ cevabı sonradan gelince önbellek arka planda yenilenir. */
const V = 'mk-ec550050', AV = 'mk-api-v1';
const API_MAX = 60, API_TTL = 24 * 3600e3;   // en fazla 60 kayıt, çevrimdışı yedek olarak en çok 24 saat eski cevap
const NET_TIMEOUT = 3500;                    // sayfa dosyaları için ağa verilen süre (ms)
const FONTS = ['patrick-hand-latin-400', 'patrick-hand-latin-ext-400', 'bebas-neue-latin-400', 'bebas-neue-latin-ext-400', 'oswald-latin-300', 'oswald-latin-ext-300', 'oswald-latin-400', 'oswald-latin-ext-400'].map(n => 'fonts/' + n + '-normal.woff2');
const SHELL = ['./', 'manifest.webmanifest', 'icon.png', 'icon-512.png', 'apple-touch-icon.png', 'badge.png', 'css/style.css?v=f15697ec', 'css/classic.css?v=222beb74', 'css/sade.css?v=746e927a', 'css/fonts.css?v=f1b34a86', 'js/theme.js?v=368b16f2', 'js/core.js?v=f80068bd', 'js/app.js?v=05f0f8af', 'js/kristal.js?v=19a0e8ac', 'lib/chart.umd.min.js', 'lib/leaflet.js', 'lib/leaflet.css', 'gizlilik.html'].concat(FONTS);
const API = /(open-meteo\.com|api\.met\.no|wttr\.in|api\.rainviewer\.com|raw\.githubusercontent\.com)/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== AV).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

/* API cevabını zaman damgasıyla kaydet, sınırı aşan en eski kayıtları sil */
async function putApi(r, res) {
  const c = await caches.open(AV), h = new Headers(res.headers);
  h.set('x-mk-cached', String(Date.now()));
  await c.put(r, new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: h }));
  const ks = await c.keys();
  for (let i = 0; i < ks.length - API_MAX; i++) await c.delete(ks[i]);
}
async function getApi(r) {
  const c = await caches.open(AV), hit = await c.match(r);
  if (!hit) return null;
  if (Date.now() - (+hit.headers.get('x-mk-cached') || 0) > API_TTL) { await c.delete(r); return null; }
  return hit;
}

/* Kendi dosyalarımız: ağ önce (zaman aşımlı), olmazsa önbellek */
async function ownFile(e, r) {
  const c = await caches.open(V);
  const cached = (await c.match(r)) || (await c.match(r, { ignoreSearch: true })) || (r.mode === 'navigate' ? await c.match('./', { ignoreSearch: true }) : null);
  const net = fetch(r).then(res => {
    if (res.status === 200) e.waitUntil(c.put(r, res.clone()).catch(() => {}));   // 206 ve hata cevapları önbelleğe girmez
    return res;
  });
  if (!cached) return net;
  return Promise.race([
    net.catch(() => cached),
    new Promise(ok => setTimeout(() => ok(cached), NET_TIMEOUT))
  ]);
}

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  const mine = u.origin === location.origin, api = API.test(u.hostname);
  if (mine && u.pathname.startsWith('/api/')) return;   // kristal sunucusu: asla önbelleğe alınmaz
  if (!mine && !api) return;
  if (mine) { e.respondWith(ownFile(e, r)); return; }
  e.respondWith((async () => {
    try {
      const res = await fetch(r);
      if (res.status === 200) e.waitUntil(putApi(r, res.clone()).catch(() => {}));
      return res;
    } catch (err) {
      const hit = await getApi(r);
      if (hit) return hit;
      throw err;
    }
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
