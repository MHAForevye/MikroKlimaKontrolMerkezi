/* Şehir sayfalarını üretir: sehir/<ad>.html (81 il) + sehir/index.html + sitemap.xml.
   Kullanım:  node build-cities.mjs          → dosyaları yazar
              node build-cities.mjs --check  → güncel değilse hata kodu 1 ile çıkar
   Sayfalar statiktir (arama motorları ve paylaşım için); canlı sıcaklık js/sehir.js ile tarayıcıda çekilir.
   Uygulamaya bağlantı: /?yer=enlem,boylam,Ad  (konumu kayıtlı konumlara ekler ve açar). */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';

const BASE = 'https://mikroklimakontrolmerkezi.forevye.workers.dev';
const CHECK = process.argv.includes('--check');
/* [plaka, ad, bölge, enlem, boylam]: şehir merkezi (yaklaşık) */
export const CITIES = [
  [1, 'Adana', 'Akdeniz', 37.00, 35.32], [2, 'Adıyaman', 'Güneydoğu Anadolu', 37.76, 38.28], [3, 'Afyonkarahisar', 'Ege', 38.76, 30.54], [4, 'Ağrı', 'Doğu Anadolu', 39.72, 43.05],
  [5, 'Amasya', 'Karadeniz', 40.65, 35.83], [6, 'Ankara', 'İç Anadolu', 39.93, 32.86], [7, 'Antalya', 'Akdeniz', 36.90, 30.70], [8, 'Artvin', 'Karadeniz', 41.18, 41.82],
  [9, 'Aydın', 'Ege', 37.85, 27.84], [10, 'Balıkesir', 'Marmara', 39.65, 27.89], [11, 'Bilecik', 'Marmara', 40.14, 29.98], [12, 'Bingöl', 'Doğu Anadolu', 38.88, 40.50],
  [13, 'Bitlis', 'Doğu Anadolu', 38.40, 42.11], [14, 'Bolu', 'Karadeniz', 40.73, 31.61], [15, 'Burdur', 'Akdeniz', 37.72, 30.29], [16, 'Bursa', 'Marmara', 40.19, 29.06],
  [17, 'Çanakkale', 'Marmara', 40.15, 26.41], [18, 'Çankırı', 'İç Anadolu', 40.60, 33.62], [19, 'Çorum', 'Karadeniz', 40.55, 34.95], [20, 'Denizli', 'Ege', 37.78, 29.09],
  [21, 'Diyarbakır', 'Güneydoğu Anadolu', 37.91, 40.24], [22, 'Edirne', 'Marmara', 41.68, 26.56], [23, 'Elazığ', 'Doğu Anadolu', 38.67, 39.22], [24, 'Erzincan', 'Doğu Anadolu', 39.75, 39.49],
  [25, 'Erzurum', 'Doğu Anadolu', 39.90, 41.27], [26, 'Eskişehir', 'İç Anadolu', 39.78, 30.52], [27, 'Gaziantep', 'Güneydoğu Anadolu', 37.07, 37.38], [28, 'Giresun', 'Karadeniz', 40.91, 38.39],
  [29, 'Gümüşhane', 'Karadeniz', 40.46, 39.48], [30, 'Hakkâri', 'Doğu Anadolu', 37.58, 43.74], [31, 'Hatay', 'Akdeniz', 36.40, 36.35], [32, 'Isparta', 'Akdeniz', 37.76, 30.55],
  [33, 'Mersin', 'Akdeniz', 36.80, 34.64], [34, 'İstanbul', 'Marmara', 41.01, 28.98], [35, 'İzmir', 'Ege', 38.42, 27.14], [36, 'Kars', 'Doğu Anadolu', 40.60, 43.10],
  [37, 'Kastamonu', 'Karadeniz', 41.39, 33.78], [38, 'Kayseri', 'İç Anadolu', 38.72, 35.49], [39, 'Kırklareli', 'Marmara', 41.74, 27.23], [40, 'Kırşehir', 'İç Anadolu', 39.15, 34.17],
  [41, 'Kocaeli', 'Marmara', 40.77, 29.94], [42, 'Konya', 'İç Anadolu', 37.87, 32.48], [43, 'Kütahya', 'Ege', 39.42, 29.98], [44, 'Malatya', 'Doğu Anadolu', 38.35, 38.31],
  [45, 'Manisa', 'Ege', 38.61, 27.43], [46, 'Kahramanmaraş', 'Akdeniz', 37.58, 36.94], [47, 'Mardin', 'Güneydoğu Anadolu', 37.31, 40.74], [48, 'Muğla', 'Ege', 37.22, 28.36],
  [49, 'Muş', 'Doğu Anadolu', 38.74, 41.49], [50, 'Nevşehir', 'İç Anadolu', 38.62, 34.71], [51, 'Niğde', 'İç Anadolu', 37.97, 34.68], [52, 'Ordu', 'Karadeniz', 40.98, 37.88],
  [53, 'Rize', 'Karadeniz', 41.02, 40.52], [54, 'Sakarya', 'Marmara', 40.76, 30.40], [55, 'Samsun', 'Karadeniz', 41.29, 36.33], [56, 'Siirt', 'Güneydoğu Anadolu', 37.93, 41.94],
  [57, 'Sinop', 'Karadeniz', 42.03, 35.15], [58, 'Sivas', 'İç Anadolu', 39.75, 37.02], [59, 'Tekirdağ', 'Marmara', 40.98, 27.51], [60, 'Tokat', 'Karadeniz', 40.31, 36.55],
  [61, 'Trabzon', 'Karadeniz', 41.00, 39.72], [62, 'Tunceli', 'Doğu Anadolu', 39.11, 39.55], [63, 'Şanlıurfa', 'Güneydoğu Anadolu', 37.16, 38.79], [64, 'Uşak', 'Ege', 38.68, 29.41],
  [65, 'Van', 'Doğu Anadolu', 38.49, 43.38], [66, 'Yozgat', 'İç Anadolu', 39.82, 34.81], [67, 'Zonguldak', 'Karadeniz', 41.46, 31.80], [68, 'Aksaray', 'İç Anadolu', 38.37, 34.03],
  [69, 'Bayburt', 'Karadeniz', 40.26, 40.23], [70, 'Karaman', 'İç Anadolu', 37.18, 33.22], [71, 'Kırıkkale', 'İç Anadolu', 39.85, 33.52], [72, 'Batman', 'Güneydoğu Anadolu', 37.89, 41.13],
  [73, 'Şırnak', 'Güneydoğu Anadolu', 37.52, 42.46], [74, 'Bartın', 'Karadeniz', 41.64, 32.34], [75, 'Ardahan', 'Doğu Anadolu', 41.11, 42.70], [76, 'Iğdır', 'Doğu Anadolu', 39.92, 44.04],
  [77, 'Yalova', 'Marmara', 40.65, 29.27], [78, 'Karabük', 'Karadeniz', 41.20, 32.63], [79, 'Kilis', 'Güneydoğu Anadolu', 36.72, 37.12], [80, 'Osmaniye', 'Akdeniz', 37.07, 36.25],
  [81, 'Düzce', 'Karadeniz', 40.84, 31.16]
].map(([plate, name, region, lat, lon]) => ({ plate, name, region, lat, lon, slug: slugOf(name) }));

export function slugOf(n) {
  return n.replace(/İ/g, 'i').toLowerCase().replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/â/g, 'a').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const km = (a, b) => { const r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r, x = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
const nearby = c => CITIES.filter(x => x !== c).sort((a, b) => km(c, a) - km(c, b)).slice(0, 6);
const appLink = c => '/?yer=' + c.lat + ',' + c.lon + ',' + encodeURIComponent(c.name);
const fmt = n => n.toFixed(2).replace('.', ',');

const HEAD = (title, desc, canon, extra) => `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canon}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#0369a1">
<meta property="og:type" content="website"><meta property="og:locale" content="tr_TR"><meta property="og:site_name" content="Mikro-Klima Kontrol Merkezi">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canon}"><meta property="og:image" content="${BASE}/icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="stylesheet" href="/css/sehir.css">
${extra || ''}<script data-goatcounter="https://havadurumu.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
</head>
`;

function cityPage(c) {
  const url = `${BASE}/sehir/${c.slug}`, near = nearby(c);
  const title = `${c.name} hava durumu: saatlik, 7 günlük tahmin ve radar | Mikro-Klima`;
  const desc = `${c.name} (${c.region} Bölgesi, plaka ${String(c.plate).padStart(2, '0')}) için saatlik ve 7 günlük hava tahmini, yağış radarı ve çok kaynaklı karşılaştırma. Reklamsız, ücretsiz, hesap istemez.`;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', name: `${c.name} hava durumu`, url, description: desc, inLanguage: 'tr', isPartOf: { '@type': 'WebSite', name: 'Mikro-Klima Kontrol Merkezi', url: BASE + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana sayfa', item: BASE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Şehirler', item: BASE + '/sehir/' },
      { '@type': 'ListItem', position: 3, name: c.name, item: url }] }] };
  return HEAD(title, desc, url, `<script type="application/ld+json">${JSON.stringify(ld)}</script>\n`) + `<body>
<header class="bar"><a class="brand" href="/"><img src="/icon.png" width="40" height="40" alt="">Mikro-Klima Kontrol Merkezi</a></header>
<main>
<nav class="crumb" aria-label="Sayfa yolu"><a href="/">Ana sayfa</a> › <a href="/sehir/">Şehirler</a> › <span>${esc(c.name)}</span></nav>
<h1>${esc(c.name)} hava durumu</h1>
<section class="live" id="live" data-lat="${c.lat}" data-lon="${c.lon}" aria-live="polite">
  <div class="live-t" id="liveT">--°</div>
  <div><div class="live-d" id="liveD">Şu anki hava yükleniyor…</div><div class="live-s" id="liveS">${esc(c.name)} şehir merkezi için, Open-Meteo verisi</div></div>
</section>
<p><a class="cta" href="${appLink(c)}">${esc(c.name)} tahminini aç →</a></p>
<h2>${esc(c.name)} için neler var?</h2>
<ul>
<li>Saatlik ve 7 günlük tahmin, saat saat ayrıntı</li>
<li>Önümüzdeki 3 saat için 15 dakikalık yağış tahmini ve “yağış ne zaman başlar, biter?” özeti</li>
<li>Yağış radarı (son 2 saatin hareketli görüntüsü)</li>
<li>12 hava modeli, MET Norway ve wttr.in yan yana; geçmişte hangisinin ${esc(c.name)} için daha sık haklı çıktığını gösteren karne</li>
<li>Türkiye havalimanları için gerçek ölçüm (METAR); en yakın havalimanı ölçümü</li>
</ul>
<h2>Bu sayfa hakkında</h2>
<p>${esc(c.name)}, ${esc(c.region)} Bölgesi'nde yer alır ve plaka kodu ${String(c.plate).padStart(2, '0')}'dır. Buradaki tahmin, ${fmt(c.lat)} enlem ve ${fmt(c.lon)} boylamındaki şehir merkezi için hesaplanır; ilçelerde ve yüksek kesimlerde hava farklı olabilir. Uygulamada kendi konumunu GPS ile ya da adını yazarak ekleyebilirsin.</p>
<p class="warn">Bu bir resmî uyarı değildir. Can ve mal güvenliği gerektiren durumlarda <a href="https://www.mgm.gov.tr/meteouyari/il.aspx" target="_blank" rel="noopener">Meteoroloji Genel Müdürlüğü (MGM)</a> uyarılarına bak.</p>
<h2>Yakın şehirler</h2>
<ul class="near">${near.map(n => `<li><a href="/sehir/${n.slug}">${esc(n.name)} hava durumu</a></li>`).join('')}</ul>
</main>
<footer><a href="/sehir/">Tüm şehirler</a> · <a href="/gizlilik.html">Gizlilik</a> · Forevye tarafından geliştirildi</footer>
<script src="/js/sehir.js"></script>
</body>
</html>
`;
}

function indexPage() {
  const url = BASE + '/sehir/', regions = [...new Set(CITIES.map(c => c.region))].sort((a, b) => a.localeCompare(b, 'tr'));
  const title = 'Şehirlere göre hava durumu: 81 il | Mikro-Klima Kontrol Merkezi';
  const desc = '81 il için saatlik ve 7 günlük hava tahmini, yağış radarı ve çok kaynaklı karşılaştırma. Şehrini seç, tahmini aç.';
  const ld = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Şehirlere göre hava durumu', itemListElement: CITIES.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: `${BASE}/sehir/${c.slug}`, name: c.name + ' hava durumu' })) };
  return HEAD(title, desc, url, `<script type="application/ld+json">${JSON.stringify(ld)}</script>\n`) + `<body>
<header class="bar"><a class="brand" href="/"><img src="/icon.png" width="40" height="40" alt="">Mikro-Klima Kontrol Merkezi</a></header>
<main>
<nav class="crumb" aria-label="Sayfa yolu"><a href="/">Ana sayfa</a> › <span>Şehirler</span></nav>
<h1>Şehirlere göre hava durumu</h1>
<p>Şehrini seç; saatlik ve 7 günlük tahmin, yağış radarı ve kaynak karşılaştırması uygulamada açılır.</p>
${regions.map(r => `<h2>${esc(r)} Bölgesi</h2>\n<ul class="grid">${CITIES.filter(c => c.region === r).map(c => `<li><a href="/sehir/${c.slug}">${esc(c.name)}</a></li>`).join('')}</ul>`).join('\n')}
</main>
<footer><a href="/">Ana sayfa</a> · <a href="/gizlilik.html">Gizlilik</a> · Forevye tarafından geliştirildi</footer>
</body>
</html>
`;
}

function sitemap(day) {
  const u = (p, d) => `  <url>\n    <loc>${BASE}${p}</loc>\n    <lastmod>${d}</lastmod>\n  </url>\n`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` + u('/', day) + u('/gizlilik.html', day) + u('/sehir/', day) + CITIES.map(c => u('/sehir/' + c.slug, day)).join('') + '</urlset>\n';
}

const day = (existsSync('sitemap.xml') && /<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/.exec(readFileSync('sitemap.xml', 'utf8')) || [])[1] || new Date().toISOString().slice(0, 10);
const out = { 'sehir/index.html': indexPage(), 'sitemap.xml': sitemap(process.env.SITEMAP_DATE || day) };
for (const c of CITIES) out['sehir/' + c.slug + '.html'] = cityPage(c);
let stale = 0;
if (!CHECK) mkdirSync('sehir', { recursive: true });
for (const [f, t] of Object.entries(out)) {
  const old = existsSync(f) ? readFileSync(f, 'utf8') : null;
  if (old !== t) { stale++; if (!CHECK) writeFileSync(f, t); }
}
console.log(CHECK ? (stale ? 'GÜNCEL DEĞİL: ' + stale + ' şehir dosyası (npm run cities)' : 'şehir sayfaları güncel') : stale + ' dosya yazıldı');
if (CHECK && stale) process.exit(1);
