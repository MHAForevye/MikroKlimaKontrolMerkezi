/* ===== Çocuksu, boyalı SVG ikonlar (titrek elle çizim kenarlar: #wob filtresi) ===== */
const CP = 'M14 36h20a7 7 0 0 0 0-14 10 10 0 0 0-19-2 8 8 0 0 0-1 16z';
const ICONS = {
  sun: '<circle cx="24" cy="24" r="9" fill="#fcd34d"/><path d="M24 5v6M24 37v6M5 24h6M37 24h6M11 11l4 4M33 33l4 4M37 11l-4 4M15 33l-4 4" fill="none" stroke="#f59e0b" stroke-width="4"/><circle cx="21" cy="22" r="1.3" fill="#4a3426"/><circle cx="27" cy="22" r="1.3" fill="#4a3426"/><path d="M20 27q4 3.5 8 0" fill="none"/>',
  moon: '<path d="M30 7A17 17 0 1 0 41 31 14 14 0 0 1 30 7z" fill="#fde68a"/><path d="M38 8v6M35 11h6" fill="none" stroke="#fde68a" stroke-width="3"/>',
  partly: '<circle cx="17" cy="17" r="8" fill="#fcd34d"/><path d="M17 3v3M3 17h3M7 7l2 2M27 7l-2 2" fill="none" stroke="#f59e0b" stroke-width="3.5"/><g transform="translate(8,10) scale(.8)"><path d="' + CP + '" fill="#e2e8f0"/></g>',
  cloud: '<g transform="translate(0,3)"><path d="' + CP + '" fill="#e2e8f0"/></g>',
  fog: '<g transform="translate(0,-4)"><path d="' + CP + '" fill="#cbd5e1"/></g><path d="M8 36h32M12 42h24" fill="none" stroke="#94a3b8" stroke-width="4"/>',
  rain: '<g transform="translate(0,-6)"><path d="' + CP + '" fill="#cbd5e1"/></g><path d="M16 35q3 4 0 7q-3-3 0-7zM25 36q3 4 0 7q-3-3 0-7zM34 35q3 4 0 7q-3-3 0-7z" fill="#60a5fa"/>',
  snow: '<g transform="translate(0,-6)"><path d="' + CP + '" fill="#cbd5e1"/></g><circle cx="16" cy="38" r="2.6" fill="#fff"/><circle cx="25" cy="42" r="2.6" fill="#fff"/><circle cx="34" cy="38" r="2.6" fill="#fff"/>',
  storm: '<g transform="translate(0,-6)"><path d="' + CP + '" fill="#94a3b8"/></g><path d="M27 29l-7 10h5l-3 8 10-12h-6z" fill="#fde047"/>',
  drop: '<path d="M24 5C18 15 11 21 11 30a13 13 0 0 0 26 0C37 21 30 15 24 5z" fill="#38bdf8"/><path d="M18 31a6 6 0 0 0 5 6" fill="none" stroke="#fff" stroke-width="2.5"/>',
  thermo: '<rect x="19" y="5" width="10" height="27" rx="5" fill="#fff"/><circle cx="24" cy="35" r="8" fill="#ef4444"/><path d="M24 14v20" fill="none" stroke="#ef4444" stroke-width="4"/>',
  wind: '<path d="M5 17h24a5 5 0 1 0-5-5M5 26h33a5 5 0 1 1-5 5M5 35h16" fill="none" stroke="#38bdf8" stroke-width="4.5"/>',
  pin: '<path d="M24 4C15 4 10 11 10 18c0 10 14 26 14 26s14-16 14-26c0-7-5-14-14-14z" fill="#f87171"/><circle cx="24" cy="18" r="5" fill="#fff"/>',
  faq: '<rect x="5" y="7" width="38" height="34" rx="9" fill="#fbd5e5"/><rect x="12" y="14" width="24" height="20" rx="6" fill="#fff6d6"/><path d="M20.5 21.5a3.6 3.6 0 1 1 5.4 3.1c-1.3.8-1.9 1.5-1.9 2.7" fill="none"/><circle cx="24" cy="31" r="1.1" fill="#4a3426"/><path d="M9 12.5h.01M13 10.5h.01" fill="none"/>',
  refresh: '<path d="M39 24a15 15 0 1 1-5-11" fill="none" stroke="#38bdf8" stroke-width="5"/><path d="M36 5v10H26" fill="none" stroke="#38bdf8" stroke-width="5"/>',
  clock: '<circle cx="24" cy="24" r="17" fill="#fef3c7"/><path d="M24 13v11l7 5" fill="none"/>',
  calendar: '<rect x="6" y="10" width="36" height="32" rx="5" fill="#bbf7d0"/><path d="M6 21h36M15 5v9M33 5v9" fill="none"/><circle cx="16" cy="30" r="2.2" fill="#f87171"/><circle cx="24" cy="30" r="2.2" fill="#fbbf24"/><circle cx="32" cy="30" r="2.2" fill="#60a5fa"/>',
  gauge: '<circle cx="24" cy="26" r="16" fill="#e9d5ff"/><path d="M24 26l8-9" fill="none" stroke="#ef4444" stroke-width="3.5"/><circle cx="24" cy="26" r="2.5" fill="#4a3426"/><path d="M12 32h3M33 32h3M24 14v3" fill="none"/>',
  eye: '<path d="M4 24q20-20 40 0q-20 20-40 0z" fill="#fff"/><circle cx="24" cy="24" r="7" fill="#38bdf8"/><circle cx="24" cy="24" r="3" fill="#4a3426"/>',
  arrow: '<path d="M10 18l14 14 14-14" fill="none" stroke="#38bdf8" stroke-width="6"/>'
,
  umbrella: '<path d="M5 25a19 17 0 0 1 38 0z" fill="#f472b6"/><path d="M24 25v13a4 4 0 0 1-8 0" fill="none"/>',
  bolt: '<path d="M28 4L12 27h10l-4 17 18-25H26z" fill="#fde047"/>',
  leaf: '<path d="M8 38C8 18 20 8 40 8c0 20-10 32-30 32z" fill="#4ade80"/><path d="M10 38L30 18" fill="none"/>',
  bell: '<path d="M10 35h28l-4-6V21a10 10 0 0 0-20 0v8z" fill="#fde68a"/><path d="M20 40a4 4 0 0 0 8 0" fill="none"/>',
  info: '<circle cx="24" cy="24" r="18" fill="#fff1b8"/><path d="M24 12v15" fill="none" stroke-width="5"/><circle cx="24" cy="35" r="2.8" fill="#4a3426"/>',
  help: '<circle cx="24" cy="24" r="18" fill="#d6ecfa"/><path d="M17 19a7 7 0 1 1 10 6c-2 1.5-3 2.5-3 5" fill="none" stroke-width="4.5"/><circle cx="24" cy="37" r="2.8" fill="#4a3426"/>',
  trash: '<path d="M12 14h24l-2 28H14z" fill="#a7f3d0"/><path d="M9 14h30M19 14V9h10v5M20 22v14M28 22v14" fill="none"/>',
  face: '<circle cx="24" cy="24" r="17" fill="#fdba74"/><circle cx="18" cy="21" r="1.8" fill="#4a3426"/><circle cx="30" cy="21" r="1.8" fill="#4a3426"/><path d="M17 29q7 6 14 0" fill="none"/><circle cx="14" cy="27" r="3" fill="#f87171" stroke="none"/><circle cx="34" cy="27" r="3" fill="#f87171" stroke="none"/>'
};
const BG = {sun:'#fcd34d',moon:'#fde68a',partly:'#fcd34d',cloud:'#94a3b8',fog:'#94a3b8',rain:'#60a5fa',snow:'#e0f2fe',storm:'#a78bfa',drop:'#38bdf8',thermo:'#f87171',wind:'#38bdf8',pin:'#f87171',refresh:'#38bdf8',faq:'#f9a8d4',clock:'#fde68a',calendar:'#86efac',gauge:'#c084fc',eye:'#38bdf8',arrow:'#38bdf8',umbrella:'#f472b6',bolt:'#fde047',leaf:'#4ade80',face:'#fb923c',bell:'#fde047',info:'#fde047',help:'#7dd3fc',trash:'#a7f3d0'};
const ico = n => '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><g filter="url(#paint)"><ellipse cx="24" cy="25" rx="22" ry="20" fill="' + (BG[n] || '#94a3b8') + '" opacity=".22"/><g stroke="#4a3426" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[n] || '') + '</g></g></svg>';
ICONS.share = '<circle cx="12" cy="24" r="5"/><circle cx="36" cy="11" r="5"/><circle cx="36" cy="37" r="5"/><path d="M16.5 21.5L31.5 13.5M16.5 26.5L31.5 34.5" fill="none"/>'; BG.share = '#a78bfa';
const $ = id => document.getElementById(id);
const PK = 'mk_prefs', PDEF = { fs: 17, tab: 'last', ref: 10, hot: 38, cold: 0, gust: 60 };
let PREFS = Object.assign({}, PDEF);
function sanePrefs(o) {
  const r = Object.assign({}, PDEF), n = (v, d, a, b) => { v = parseFloat(String(v).replace(',', '.')); return isFinite(v) && v >= a && v <= b ? v : d; };
  if (o && typeof o === 'object') {
    r.fs = [15, 17, 19, 21].indexOf(+o.fs) >= 0 ? +o.fs : r.fs;
    r.tab = ['last', 'today', 'detail', 'karne', 'sources'].indexOf(o.tab) >= 0 ? o.tab : r.tab;
    r.ref = [5, 10, 30, 60].indexOf(+o.ref) >= 0 ? +o.ref : r.ref;
    r.hot = n(o.hot, r.hot, -50, 70); r.cold = n(o.cold, r.cold, -50, 70); r.gust = n(o.gust, r.gust, 10, 200);
  }
  return r;
}
try { PREFS = sanePrefs(JSON.parse(localStorage.getItem(PK))); } catch (e) {}
const savePrefs = () => { try { localStorage.setItem(PK, JSON.stringify(PREFS)); } catch (e) {} };
const applyFont = () => { document.documentElement.style.fontSize = (PREFS.fs / 16 * 100) + '%'; };
applyFont();
function paintIcons() { document.querySelectorAll('[data-ico]').forEach(e => { e.innerHTML = ico(e.dataset.ico); }); }

/* ===== Hava kodu (WMO) ===== */
const WMO = {0:'Açık',1:'Çoğunlukla açık',2:'Parçalı bulutlu',3:'Kapalı',45:'Sis',48:'Kırağılı sis',51:'Hafif çise',53:'Çise',55:'Yoğun çise',56:'Dondurucu çise',57:'Yoğun dondurucu çise',61:'Hafif yağmur',63:'Yağmur',65:'Şiddetli yağmur',66:'Dondurucu yağmur',67:'Şiddetli dondurucu yağmur',71:'Hafif kar',73:'Kar',75:'Yoğun kar',77:'Kar taneleri',80:'Hafif sağanak',81:'Sağanak',82:'Şiddetli sağanak',85:'Hafif kar sağanağı',86:'Kar sağanağı',95:'Gök gürültülü fırtına',96:'Dolulu fırtına',99:'Şiddetli dolulu fırtına'};
function wIcon(c, d) {
  if (c === 0 || c === 1) return d ? 'sun' : 'moon';
  if (c === 2) return d ? 'partly' : 'cloud';
  if (c === 45 || c === 48) return 'fog';
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return 'rain';
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'snow';
  if (c >= 95) return 'storm';
  return 'cloud';
}

/* ===== Durum ===== */
let chartInstance = null, rawApiData = null, currentMode = 'hourly';
let activeDayIndex = 0, activeHourIndex = 0;
let sharedCoordinatesHidden = false, sharedPresentation = false;
let hours = [], days = [], nowKey = '', nowIdx = 0, reqId = 0, lastFetch = 0, lastOk = '';
const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const pad = n => String(n).padStart(2, '0');
const fmt = (v, d = 0, u = '') => (v == null || isNaN(v)) ? '--' + u : (+v).toFixed(d) + u;

/* ===== Konum kayıtları (localStorage kapalıysa bile çökmez) ===== */
const LS = 'custom_weather_locs';
const SELK = 'custom_weather_sel';
const safeLoad = () => { try { return JSON.parse(localStorage.getItem(LS)); } catch (e) { return null; } };
const safeStore = () => { try { localStorage.setItem(LS, JSON.stringify(savedLocations)); } catch (e) {} };
let savedLocations = safeLoad();
if (!Array.isArray(savedLocations)) savedLocations = [];
savedLocations = savedLocations.filter(l => l && l.name && isFinite(parseFloat(l.lat)) && isFinite(parseFloat(l.lon)));
if (!savedLocations.length) {
  savedLocations = [{ name: "Tarsus Merkez", lat: "36.9167", lon: "34.8958", alt: "45" }];
  safeStore();
}

function initLocations(idx) {
  const sel = $('locationSelect');
  sel.innerHTML = '';
  savedLocations.forEach(l => {
    const o = document.createElement('option');
    o.value = l.lat + ',' + l.lon + ',' + (l.alt == null ? '' : l.alt);
    o.textContent = l.name + (l.alt !== '' && l.alt != null ? ' (' + l.alt + 'm)' : '');
    sel.appendChild(o);
  });
  sel.selectedIndex = idx >= 0 && idx < savedLocations.length ? idx : 0;
  if (typeof renderLocList === 'function') renderLocList();
}
function addLoc(o) {
  const i = savedLocations.findIndex(l => l.name === o.name);
  if (i >= 0) savedLocations[i] = o; else savedLocations.push(o);
  safeStore();
  initLocations(savedLocations.findIndex(l => l.name === o.name));
}
async function lookupElevation(lat, lon) {
  try {
    const r = await fetch('https://api.open-meteo.com/v1/elevation?latitude=' + lat + '&longitude=' + lon);
    const d = await r.json();
    const v = d.elevation && d.elevation[0];
    return v == null ? '' : String(Math.round(v));
  } catch (e) { return ''; }
}

async function geocode(q) {
  try {
    const r = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=1&language=tr&format=json');
    const d = await r.json();
    return d.results && d.results[0] ? d.results[0] : null;
  } catch (e) { return null; }
}
/* ===== Ana ekrana ekle önerisi: Ayarlar'a 2. kez girildiğinde, bir kez, kapatılabilir ===== */
let a2hsEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); a2hsEvt = e; });
window.addEventListener('appinstalled', () => { track('a2hs/kuruldu', 'Ana ekrana eklendi'); });
const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
function settingsVisit() {
  let n = 0, shown = null;
  try { n = (+localStorage.getItem('mk_set_n') || 0) + 1; localStorage.setItem('mk_set_n', String(n)); shown = localStorage.getItem('mk_a2hs'); } catch (e) { return; }
  if (n !== 2 || shown || isStandalone() || sharedPresentation || !$('a2hs')) return;
  try { localStorage.setItem('mk_a2hs', '1'); } catch (e) {}            // bir kez gösterilir, ne olursa olsun tekrar sorulmaz
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  $('a2hsTx').textContent = 'Daha hızlı açılır, uygulama gibi tam ekran çalışır ve internet yokken son tahmini gösterir. Bunu sadece bir kez soruyoruz.';
  $('a2hsGo').textContent = a2hsEvt ? 'Ekle' : 'Nasıl eklenir?';
  $('a2hs').hidden = false; track('a2hs/goster', 'Ana ekrana ekle önerisi gösterildi');
  $('a2hsGo').onclick = async () => {
    if (a2hsEvt) { try { a2hsEvt.prompt(); const r = await a2hsEvt.userChoice; track('a2hs/' + (r && r.outcome === 'accepted' ? 'kabul' : 'red'), 'Ana ekrana ekle: ' + (r && r.outcome)); } catch (e) {} $('a2hs').hidden = true; return; }
    if ($('a2hsGo').dataset.steps) { $('a2hs').hidden = true; return; }
    $('a2hsTx').textContent = ios ? 'Safari\'de alttaki Paylaş düğmesine dokun, sonra "Ana Ekrana Ekle"yi seç.' : 'Tarayıcının menüsünü (⋮) aç ve "Ana ekrana ekle" ya da "Uygulamayı yükle"yi seç.';
    $('a2hsGo').textContent = 'Tamam'; $('a2hsGo').dataset.steps = '1'; track('a2hs/adimlar', 'Ana ekrana ekle: adımlar gösterildi');
  };
  $('a2hsNo').onclick = () => { $('a2hs').hidden = true; track('a2hs/kapat', 'Ana ekrana ekle önerisi kapatıldı'); };
}

/* ===== GoatCounter olayları: hangi sekme ne kadar kullanılıyor (kişisel veri yok; sadece olay adı sayılır) ===== */
function track(path, title) { try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: path, title: title || path, event: true }); } catch (e) {} }
const TABS = ['today', 'detail', 'karne', 'sources', 'settings'];
const TAB_NAME = { today: 'Tahmin', detail: 'Detay', karne: 'Karne', sources: 'Kaynaklar', settings: 'Ayarlar' };
let tabNow = null, tabSince = Date.now();
function tabFlush() {   // bir sekmede geçen süreyi kovaya at: 10 sn'den az, 10-60 sn, 1-5 dk, 5 dk üstü
  if (!tabNow) return;
  const sec = (Date.now() - tabSince) / 1000, b = sec < 10 ? 'lt10s' : sec < 60 ? '10-60s' : sec < 300 ? '1-5m' : '5m+';
  track('sure/' + tabNow + '/' + b, 'Süre: ' + TAB_NAME[tabNow] + ' ' + b); tabSince = Date.now();
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') tabFlush(); else tabSince = Date.now(); });
function showTab(t, save) {
  if (TABS.indexOf(t) < 0) t = 'today';
  if (t !== tabNow) {
    tabFlush(); if (save !== false || tabNow) track('sekme/' + t, 'Sekme: ' + TAB_NAME[t]); tabNow = t; tabSince = Date.now();
    if (t === 'settings' && save !== false) { try { settingsVisit(); } catch (e) {} }   // 2. girişte Ana ekrana ekle önerisi
  }
  TABS.forEach(k => {
    const on = k === t;
    $('panel-' + k).classList.toggle('active', on);
    const b = $('tab-' + k); b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
  });
  if (t === 'detail') { try { if (chartInstance) chartInstance.resize(); if (metricChart) metricChart.resize(); } catch (e) {} }
  if (t === 'detail') setTimeout(() => { try { rtLoad(); mtLoad(); } catch (e) {} }, 50);
  if (t === 'sources' || t === 'karne') setTimeout(() => { try { memRender(); } catch (e) {} }, 50);
  if (t === 'karne') { try { if (window.MKSeri) MKSeri.paint(); } catch (e) {} }
  try { const sb = $('selBlock'); if (t === 'detail') $('panel-detail').querySelector('.sel-hint').after(sb); else if (t === 'today') $('outlookCard').before(sb); } catch (e) {}
  window.scrollTo(0, 0);
  if (save !== false) { try { localStorage.setItem('mk_tab', t); } catch (e) {} }
}
/* Konum eklenince/GPS alınınca tahmin sekmesine dön */
function toggleLocBox() { showTab('today'); }
function setMode(m) {
  currentMode = m;
  $('modeHourly').classList.toggle('active', m === 'hourly');
  $('modeDaily').classList.toggle('active', m === 'daily');
  $('dayStrip').style.display = m === 'daily' ? 'flex' : 'none';
  if (m === 'daily') activeDayIndex = 0;
  if (!hours.length) { fetchWeatherData(); return; }
  resetSel(); render(); updateSharedUrl();
}

/* ===== GPS ===== */
function getPosition() {
  const o = h => ({ enableHighAccuracy: h, timeout: h ? 8000 : 15000, maximumAge: 60000 });
  return new Promise((res, rej) =>
    navigator.geolocation.getCurrentPosition(res, () =>
      navigator.geolocation.getCurrentPosition(res, rej, o(false)), o(true)));
}
async function handleGPSClick() {
  const btn = $('btnGps'), label = btn.innerHTML;
  if (!navigator.geolocation) return alert("Cihaz GPS desteklemiyor.");
  if (!window.isSecureContext) return alert("Bu sayfa güvenli (https/localhost) açılmadığı için tarayıcı konum izni soramıyor. Konum adı kutusuna şehir/ilçe yazıp + Ekle'ye bas (koordinat ve rakım otomatik gelir) ya da sayfayı https veya localhost üzerinden aç.");
  btn.disabled = true;
  btn.textContent = "Konum alınıyor...";
  try {
    const pos = await getPosition();
    const lat = pos.coords.latitude.toFixed(4), lon = pos.coords.longitude.toFixed(4);
    let alt = await lookupElevation(lat, lon);
    if (alt === '' && pos.coords.altitude != null) alt = String(Math.round(pos.coords.altitude));
    addLoc({ name: "GPS Konumu", lat, lon, alt });
    toggleLocBox();
    fetchWeatherData();
  } catch (err) {
    alert({ 1: "Konum izni verilmedi ya da tarayıcı bu sayfa için izin penceresi açmadı (yerel dosyalarda olur). Şehir adını yazıp + Ekle'ye bas.", 2: "Konum alınamadı (sinyal yok).", 3: "Konum alma zaman aşımına uğradı." }[err && err.code] || "GPS hatası.");
  } finally {
    btn.disabled = false;
    btn.innerHTML = label;
  }
}
async function addNewLocation() {
  const name = $('newName').value.trim();
  let lat = parseFloat($('newLat').value.trim().replace(',', '.'));
  let lon = parseFloat($('newLon').value.trim().replace(',', '.'));
  const altRaw = parseFloat($('newAlt').value.trim().replace(',', '.'));
  let gname = name, galt = '';
  if (name && (!isFinite(lat) || !isFinite(lon))) {
    const g = await geocode(name);
    if (!g) return alert("'" + name + "' bulunamadı. Başka yazım dene ya da enlem/boylam gir.");
    lat = g.latitude; lon = g.longitude; galt = g.elevation == null ? '' : String(Math.round(g.elevation));
    gname = g.name + (g.admin1 ? ', ' + g.admin1 : '');
  }
  if (!gname || !isFinite(lat) || !isFinite(lon)) return alert("Konum adı yaz (otomatik bulunur) ya da enlem ve boylam gir.");
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return alert("Enlem -90..90, boylam -180..180 aralığında olmalı.");
  const btn = $('btnAddLoc');
  btn.disabled = true;
  const la = lat.toFixed(4), lo = lon.toFixed(4);
  const alt = isFinite(altRaw) ? String(Math.round(altRaw)) : (galt || await lookupElevation(la, lo));
  addLoc({ name: gname, lat: la, lon: lo, alt });
  ['newName', 'newLat', 'newLon', 'newAlt'].forEach(k => { $(k).value = ''; });
  btn.disabled = false;
  toggleLocBox();
  fetchWeatherData();
}

/* Hava kodu tek bir modelden (best-match) gelir. Birleşik yağış/CAPE ve kaynak oyu desteklemiyorsa kodu bulut durumuna indirir. */
function adjCode(h) {
  const c = h.codeRaw; if (c == null) return c;
  const p = h.precip || 0, cape = h.cape || 0, agree = h.nP >= 3 ? h.wetW : null;
  const dryish = p < 0.1 && (agree == null || agree < 0.34);
  const byCloud = () => { const cl = h.cloud; if (cl == null) return 3; return cl < 20 ? 0 : cl < 45 ? 1 : cl < 75 ? 2 : 3; };
  if (c >= 95) {
    if (cape >= 800 || (p >= 0.5 && (agree == null || agree >= 0.5))) return c;
    return dryish ? byCloud() : 80;
  }
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return dryish ? byCloud() : c;
  return c;
}
function vizIcon(h) {
  if (h.code === 45 || h.code === 48) return 'fog';
  if ([71, 73, 75, 77, 85, 86].indexOf(h.code) >= 0) return 'snow';
  const s = h.score;
  if (s >= 8) return (h.code >= 95 || (h.cape || 0) >= 1000) ? 'storm' : 'rain';
  if (s >= 6) return 'rain';
  if (s >= 4) return 'cloud';
  if (s >= 2) return h.day ? 'partly' : 'cloud';
  return h.day ? 'sun' : 'moon';
}

/* ===== Veri çekme ===== */
const HOURLY = 'temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,snowfall,weather_code,surface_pressure,cloud_cover,visibility,wind_speed_10m,wind_gusts_10m,uv_index,is_day,cape';
setTimeout(() => document.body.classList.remove('first-load'), 20000);
function setStatus(m, err) { if (err) document.body.classList.remove('first-load'); const s = $('statusText'); s.textContent = m; s.style.color = err ? '#e5677f' : 'var(--subtext)'; }

async function fetchWeatherData(auto) {
  const sel = $('locationSelect');
  if (!sel || !sel.value) return;
  if (!sharedPresentation) {
    try { localStorage.setItem(SELK, savedLocations[sel.selectedIndex].name); } catch (e) {}
  }
  const p = sel.value.split(',');
  const lat = parseFloat(p[0]), lon = parseFloat(p[1]);
  const alt = (p[2] === undefined || p[2] === '') ? NaN : Number(p[2]);
  if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) { setStatus('Geçersiz koordinat.', true); return; }
  const id = ++reqId;
  if (!auto) setStatus('Yükleniyor...');
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), 15000);
  try {
    let url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
      '&hourly=' + HOURLY + '&forecast_days=7&timezone=auto&wind_speed_unit=kmh&precipitation_unit=mm&temperature_unit=celsius';
    if (isFinite(alt)) url += '&elevation=' + alt;
    const r = await fetch(url, { signal: ctl.signal });
    const d = await r.json();
    if (!r.ok || d.error) throw new Error(d.reason || ('HTTP ' + r.status));
    if (id !== reqId) return;
    rawApiData = d;
    lastFetch = Date.now();
    lastOk = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const locKey = lat + ',' + lon;
    if (locKey !== srcLoc) { SRC = []; STAT = []; ENS = null; EXT = null; HIST = null; srcLoc = locKey; }
    buildModel();
    calcNow();
    if (auto) {
      const w = win();
      activeHourIndex = Math.min(activeHourIndex, w.length - 1);
      activeDayIndex = Math.min(activeDayIndex, days.length - 1);
    } else resetSel();
    render();
    loadSources(lat, lon, alt, id);
    loadHist(lat, lon, alt, id);
    loadNow(lat, lon, alt, id);
  } catch (e) {
    if (id !== reqId) return;
    const msg = e.name === 'AbortError' ? 'zaman aşımı' : e.message;
    setStatus(hours.length ? 'Güncellenemedi (' + msg + '). Gösterilen veri ' + lastOk + ' tarihli.' : 'Veri alınamadı: ' + msg, true);
  } finally { clearTimeout(to); }
}

function buildModel() {
  const H = rawApiData.hourly;
  hours = H.time.map((t, i) => {
    const o = { t, date: t.slice(0, 10), hh: +t.slice(11, 13), temp: H.temperature_2m[i], hum: H.relative_humidity_2m[i],
      dew: H.dew_point_2m[i], feels: H.apparent_temperature[i], pop: H.precipitation_probability[i], precip: H.precipitation[i],
      snow: H.snowfall[i], code: H.weather_code[i], codeRaw: H.weather_code[i], press: H.surface_pressure[i], cloud: H.cloud_cover[i], vis: H.visibility[i],
      wind: H.wind_speed_10m[i], gust: H.wind_gusts_10m[i], uv: H.uv_index[i], day: H.is_day[i], cape: H.cape ? H.cape[i] : null };
    o.p = { temp: o.temp, hum: o.hum, dew: o.dew, precip: o.precip, cloud: o.cloud, wind: o.wind, gust: o.gust, press: o.press, cape: o.cape, pop: o.pop };
    o.score = scoreOf(o);
    return o;
  });
  calcNow();
  fuseAll();
}
function summarizeDays() {
  days = [];
  const m = {};
  hours.forEach((h, i) => {
    if (!m[h.date]) { m[h.date] = { date: h.date, idx: [] }; days.push(m[h.date]); }
    m[h.date].idx.push(i);
  });
  days.forEach(d => {
    const hs = d.idx.map(i => hours[i]);
    const t = hs.map(h => h.temp).filter(v => v != null);
    d.tmax = Math.max.apply(null, t); d.tmin = Math.min.apply(null, t);
    d.rain = hs.reduce((a, h) => a + (h.precip || 0), 0);
    const wet = hs.reduce((a, h) => (h.precip || 0) > (a.precip || 0) ? h : a, hs[0]);
    const noon = hs.find(h => h.hh === 12) || hs[0];
    const storm = hs.find(h => h.code >= 95);
    d.code = storm ? storm.code : (d.rain >= 0.5 ? wet.code : noon.code);
    d.peak = hs.reduce((a, h) => h.score > a.score ? h : a, hs[0]);
  });
}
function calcNow() {
  if (!rawApiData) return;
  nowKey = new Date(Date.now() + (rawApiData.utc_offset_seconds || 0) * 1000).toISOString().slice(0, 13);
  const i = hours.findIndex(h => h.t.slice(0, 13) === nowKey);
  nowIdx = i < 0 ? 0 : i;
}
function win() {
  return currentMode === 'hourly' ? hours.slice(nowIdx, nowIdx + 24) : days[activeDayIndex].idx.map(i => hours[i]);
}
function resetSel() {
  calcNow();
  if (currentMode === 'hourly') { activeHourIndex = 0; return; }
  const w = win();
  const k = activeDayIndex === 0 ? w.findIndex(h => h.t.slice(0, 13) === nowKey) : -1;
  activeHourIndex = k >= 0 ? k : Math.min(12, w.length - 1);
}
const dLabel = i => i === 0 ? 'Bugün' : dayNames[new Date(days[i].date + 'T00:00:00Z').getUTCDay()];

/* ===== Çizim ===== */
function render() {
  if (!hours.length) return;
  renderDays();
  const w = win();
  renderStrip(w); renderSelected(w); renderChart(w); renderNow(); renderAlerts();
  try { renderHero(); renderOutlook(); renderMetric(w); renderMeta(); renderLocList(); } catch (e) { console.error(e); }
}
function updateSharedUrl() {
  if (!sharedPresentation) return;
  const selected = win()[activeHourIndex];
  if (!selected) return;
  const url = new URL(window.location.href);
  url.searchParams.set('view', 'share');
  url.searchParams.set('time', selected.t);
  url.searchParams.set('mode', currentMode);
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}
function selectDay(i) { activeDayIndex = i; resetSel(); render(); updateSharedUrl(); }
function selectHour(i) { activeHourIndex = i; const w = win(); renderStrip(w); renderSelected(w); renderChart(w); if (sharedPresentation) renderHero(); try { renderMetric(w); } catch (e) {} updateSharedUrl(); }

function renderDays() {
  $('dayStrip').innerHTML = days.map((d, i) =>
    '<div class="day-chip' + (i === activeDayIndex ? ' active' : '') + '" role="button" tabindex="0" data-act="selectDay" data-arg="' + i + '">' +
    '<div>' + dLabel(i) + '</div><div style="font-size:.62rem;opacity:.8">' + d.date.slice(8) + '.' + d.date.slice(5, 7) + '</div>' +
    '<span class="ico cico">' + ico(vizIcon(Object.assign({}, d.peak, { day: 1 }))) + '</span>' +
    '<div style="font-weight:700">' + Math.round(d.tmax) + '°/' + Math.round(d.tmin) + '°</div>' +
    '<div style="font-size:.62rem">' + d.rain.toFixed(1) + ' mm</div><div style="font-size:.62rem">skor ' + d.peak.score.toFixed(1) + '</div></div>').join('');
}
function renderStrip(w) {
  const s = $('hourStrip');
  s.innerHTML = w.map((h, i) =>
    '<div class="hour-chip' + (i === activeHourIndex ? ' active' : '') + '" role="button" tabindex="0" data-act="selectHour" data-arg="' + i + '">' +
    '<div class="hour-chip-time">' + pad(h.hh) + ':00</div>' +
    '<span class="ico cico">' + ico(vizIcon(h)) + '</span>' +
    '<div class="hour-chip-temp">' + fmt(h.temp, 0, '°') + '</div></div>').join('');
  const a = s.querySelector('.active');
  if (a) s.scrollLeft = a.offsetLeft - s.clientWidth / 2 + a.clientWidth / 2;
}
const DISPLAY = { 'Tahmin güveni': 'Yağış kararı güveni', 'CAPE': 'Fırtına enerjisi (CAPE)', 'Hamle': 'Ani rüzgâr (hamle)', 'Nem (RH)': 'Bağıl nem', 'Çiy açığı': 'Nem doygunluğu (çiy açığı)' };
const TEMP_ST = [[0, 'Donma altı'], [10, 'Soğuk'], [18, 'Serin'], [27, 'Rahat'], [35, 'Sıcak'], [Infinity, 'Çok sıcak']];
const STATES = {
  'Sıcaklık': [h => h.temp, TEMP_ST],
  'Hissedilen': [h => h.feels, TEMP_ST],
  'Çiy noktası': [h => h.dew, [[10, 'Rahat'], [16, 'Hafif nemli'], [21, 'Nemli'], [Infinity, 'Bunaltıcı']]],
  'Çiy açığı': [h => (h.temp != null && h.dew != null) ? h.temp - h.dew : null, [[1, 'Doygun'], [3, 'Çok nemli'], [6, 'Nemli'], [10, 'Kuru'], [Infinity, 'Çok kuru']]],
  'Nem (RH)': [h => h.hum, [[30, 'Çok kuru'], [60, 'Rahat'], [80, 'Nemli'], [Infinity, 'Çok nemli']]],
  'Bulut': [h => h.cloud, [[20, 'Açık'], [50, 'Az bulutlu'], [80, 'Çok bulutlu'], [Infinity, 'Kapalı']]],
  'Yağış olasılığı': [h => h.pop, [[20, 'Düşük'], [50, 'Orta'], [80, 'Yüksek'], [Infinity, 'Çok yüksek']]],
  'Yağış': [h => h.precip, [[0.1, 'Yok'], [0.5, 'Çok az'], [2.5, 'Hafif'], [7.6, 'Orta'], [Infinity, 'Şiddetli']]],
  'Kar kalınlığı': [h => h.snow, [[0.1, 'Yok'], [Infinity, 'Kar var']]],
  'CAPE': [h => h.cape, [[100, 'Yok'], [1000, 'Zayıf'], [2500, 'Orta'], [4000, 'Yüksek'], [Infinity, 'Aşırı']]],
  'Rüzgâr': [h => h.wind, [[20, 'Hafif'], [40, 'Orta'], [60, 'Kuvvetli'], [Infinity, 'Çok kuvvetli']]],
  'Hamle': [h => h.gust, [[30, 'Hafif'], [50, 'Orta'], [75, 'Kuvvetli'], [Infinity, 'Çok kuvvetli']]],
  'Görüş': [h => h.vis == null ? null : h.vis / 1000, [[1, 'Sisli'], [4, 'Zayıf'], [10, 'Orta'], [Infinity, 'İyi']]],
  'UV indeksi': [h => h.uv, [[3, 'Düşük'], [6, 'Orta'], [8, 'Yüksek'], [11, 'Çok yüksek'], [Infinity, 'Aşırı']]]
};
function stateLabel(k, h) {
  const s = STATES[k];
  if (!s) return '';
  const v = s[0](h);
  if (v == null || isNaN(v)) return '';
  return s[1].find(x => v < x[0])[1];
}
function scaleText(k) {
  let prev = null;
  return STATES[k][1].map(x => {
    const t = prev === null ? x[1] + ' (&lt;' + x[0] + ')' : x[0] === Infinity ? x[1] + ' (' + prev + '+)' : x[1] + ' (' + prev + '–' + x[0] + ')';
    prev = x[0];
    return t;
  }).join('<br>');
}
function renderSelected(w) {
  const h = w[activeHourIndex];
  if (!h) return;
  const di = days.findIndex(x => x.date === h.date), d = days[di];
  const lab = currentMode === 'hourly' ? (activeHourIndex === 0 ? 'ŞU AN' : 'SEÇİLİ SAAT')
    : dLabel(di).toUpperCase() + ' ' + d.date.slice(8) + '.' + d.date.slice(5, 7);
  $('scoreTitle').textContent = lab + ' · ' + pad(h.hh) + ':00';
  const sv = $('indexScore');
  sv.textContent = h.score.toFixed(1);
  sv.style.color = h.score >= 8 ? '#e5677f' : h.score >= 6 ? '#ee9560' : h.score >= 4 ? '#dfa92f' : '#4fa57a';
  $('bigIcon').innerHTML = ico(vizIcon(h));
  $('rainAmount').textContent = fmt(h.precip, 1) + ' mm';
  const st = $('statusText');
  st.style.color = 'var(--subtext)';
  st.innerHTML = '<b>' + catOf(h.score) + '</b><br>Model: ' + (WMO[h.code] || '—') + (currentMode === 'daily' ? ' · Gün toplamı: ' + d.rain.toFixed(1) + ' mm' : '') +
    '<br>Yükseklik: ' + fmt(rawApiData.elevation, 0, ' m') + ' · Güncelleme ' + lastOk + confLine(h);
  $('qTemp').textContent = fmt(h.temp, 1, '°C');
  $('qHum').textContent = fmt(h.hum, 0, '%');
  $('qWind').textContent = fmt(h.wind, 0, ' km/h');
  $('qCloud').textContent = fmt(h.cloud, 0, '%');
  const gap = (h.temp != null && h.dew != null) ? h.temp - h.dew : null;
  const P = [['thermo', 'Sıcaklık', fmt(h.temp, 1, '°C')], ['face', 'Hissedilen', fmt(h.feels, 1, '°C')],
    ['drop', 'Çiy noktası', fmt(h.dew, 1, '°C')], ['thermo', 'Çiy açığı', fmt(gap, 1, '°C')],
    ['drop', 'Nem (RH)', fmt(h.hum, 0, '%')], ['cloud', 'Bulut', fmt(h.cloud, 0, '%')],
    ['umbrella', 'Yağış olasılığı', fmt(h.pop, 0, '%')], ['rain', 'Yağış', fmt(h.precip, 1, ' mm')],
    ['snow', 'Kar kalınlığı', fmt(h.snow, 1, ' cm')], ['bolt', 'CAPE', fmt(h.cape, 0, ' J/kg')],
    ['wind', 'Rüzgâr', fmt(h.wind, 0, ' km/h')], ['leaf', 'Hamle', fmt(h.gust, 0, ' km/h')],
    ['gauge', 'Basınç', fmt(h.press, 0, ' hPa')], ['eye', 'Görüş', h.vis == null ? '--' : (h.vis / 1000).toFixed(1) + ' km'],
    ['sun', 'UV indeksi', fmt(h.uv, 1)],
    ['gauge', 'Basınç eğilimi', h.ptr == null ? '--' : (h.ptr > 0 ? '+' : '') + h.ptr.toFixed(1) + ' hPa/3s'],
    ['drop', 'Orta seviye nem (700 hPa)', fmt(h.rh7, 0, '%')], ['drop', 'Toplam su buharı', fmt(h.pw, 0, ' kg/m²')],
    ['bolt', 'Kaldırma indeksi (LI)', fmt(h.li, 1)], ['bolt', 'CIN (fırtına freni)', fmt(h.cin, 0, ' J/kg')],
    ['umbrella', 'Kaynak oyu', h.nP >= 2 ? h.wet + '/' + h.nP + ' yağış diyor' : '--'],
    ['umbrella', 'Topluluk olasılığı', h.ens == null ? '--' : '%' + Math.round(h.ens)],
    ['face', 'Tahmin güveni', h.conf == null ? '--' : '%' + h.conf],
    ['thermo', 'Sıcaklık aralığı', h.trng == null ? '--' : '±' + h.trng.toFixed(1) + '°C']];
  const item = p =>
    '<div class="param-item" data-t="' + p[1] + '"><div class="param-label"><span class="ico">' + ico(p[0]) + '</span><span>' + (DISPLAY[p[1]] || p[1]) + '</span>' +
    '<button class="help-btn" data-t="' + p[1] + '" data-v="' + p[2] + '" aria-label="Açıklama"><span class="ico">' + ico('help') + '</span></button></div><div class="param-val">' + p[2] + '</div></div>';
  const GR = [['Sıcaklık ve nem', [0, 1, 2, 3, 4]], ['Gökyüzü', [5, 13, 14]], ['Yağış', [6, 7, 8, 20, 21]], ['Rüzgâr ve basınç', [10, 11, 12, 15]], ['Fırtına ve üst atmosfer', [9, 16, 17, 18, 19]], ['Tahmin güveni', [22, 23]]];
  $('paramGrid').innerHTML = GR.map(g => '<div class="grp"><h4 class="grp-title">' + g[0] + '</h4><div class="param-grid">' + g[1].map(k => P[k] ? item(P[k]) : '').join('') + '</div></div>').join('');
  renderSources(h);
}
function renderChart(w) {
  $('chartTitle').textContent = currentMode === 'hourly' ? 'ÖNÜMÜZDEKİ 24 SAAT · YAĞIŞ (mm) VE SKOR (0-10)'
    : dLabel(activeDayIndex).toUpperCase() + ' · YAĞIŞ (mm) VE SKOR (0-10)';
  if (typeof Chart === 'undefined') { $('chartTitle').textContent = 'Grafik yüklenemedi (internet / Chart.js erişimi)'; return; }
  const labels = w.map(h => pad(h.hh) + ':00');
  const pr = w.map(h => h.precip || 0), sc = w.map(h => +h.score.toFixed(1));
  const rad = w.map((_, i) => i === activeHourIndex ? 6 : 2.5);
  if (!chartInstance) {
    Chart.defaults.font.family = '"Patrick Hand","Chalkboard SE","Comic Sans MS",sans-serif';
    chartInstance = new Chart($('weatherChart'), {
      data: { labels, datasets: [
        { type: 'bar', label: 'Yağış (mm)', data: pr, backgroundColor: '#b5dff5', borderColor: '#4a3426', borderWidth: 2, borderRadius: 7, borderSkipped: false, yAxisID: 'y', order: 2 },
        { type: 'line', label: 'Mikro-Klima Skoru', data: sc, borderColor: '#f29cb9', backgroundColor: '#fff1b8', borderWidth: 4, tension: .35, pointRadius: rad, pointBorderColor: '#4a3426', pointBorderWidth: 2, pointBackgroundColor: '#fff1b8', yAxisID: 'y1', order: 1 }] },
      options: { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { color: '#8b7262', boxWidth: 12, font: { size: 12 } } } },
        onClick: (e, els) => { if (els.length) selectHour(els[0].index); },
        scales: {
          x: { ticks: { color: '#8b7262', maxTicksLimit: 8, font: { size: 11 } }, grid: { color: '#4a342622', borderDash: [5, 5] } },
          y: { position: 'left', beginAtZero: true, suggestedMax: 2, ticks: { color: '#4a97c4', font: { size: 11 } }, grid: { color: '#4a342622', borderDash: [5, 5] } },
          y1: { position: 'right', min: 0, max: 10, ticks: { color: '#d9779b', stepSize: 2, font: { size: 11 } }, grid: { drawOnChartArea: false } } } }
    });
    applyChartTheme();
  } else {
    const c = chartInstance;
    c.data.labels = labels; c.data.datasets[0].data = pr; c.data.datasets[1].data = sc; c.data.datasets[1].pointRadius = rad;
    c.update();
  }
}

/* ===== Bilgi penceresi ===== */
let infoOpener = null;
function showInfo(t, h) { infoOpener = document.activeElement; $('infoTitle').textContent = t; $('infoText').innerHTML = '<span class="hl">' + h + '</span>'; $('infoOverlay').classList.add('show'); $('infoClose').focus(); }
function closeInfo() { $('infoOverlay').classList.remove('show'); try { if (infoOpener && infoOpener.focus) infoOpener.focus(); } catch (e) {} infoOpener = null; }
document.addEventListener('keydown', e => { if (!$('infoOverlay').classList.contains('show')) return; if (e.key === 'Escape') closeInfo(); else if (e.key === 'Tab') { e.preventDefault(); $('infoClose').focus(); } });

/* ===== Başlat ===== */
$('btnRefresh').addEventListener('click', () => fetchWeatherData());
$('locationSelect').addEventListener('change', () => fetchWeatherData());
$('btnGps').addEventListener('click', handleGPSClick);
$('btnAddLoc').addEventListener('click', addNewLocation);
$('infoClose').addEventListener('click', closeInfo);
$('infoOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeInfo(); });
$('indexScore').addEventListener('click', () => showInfo('Mikro-Klima Skoru (0-10)',
  '<b>Yağış potansiyeli ve atmosferik gerilim indeksidir; yağış miktarı tahmini değildir</b> (miktar için mm değerine bak).<br>Hesap: %30 nem (RH 50→100%) + %25 çiy açığı (sıcaklık − çiy noktası, 8→0°C) + %25 bulut + %20 yağış olasılığı + CAPE ek puanı (en çok 2) + atmosfer ek puanı (hızlı basınç düşüşü, 700 hPa nemi, toplam su buharı, kaldırma indeksi; en çok 2). Model yağış veriyorsa alt sınır uygulanır: ≥0,1 → 6; ≥1 → 7,5; ≥4 mm, fırtına kodu veya CAPE ≥2500 → 9.<br><br>0–1,9 Açık, kuru, kararlı<br>2–3,9 Sakin, hafif nemli<br>4–5,9 Sınırda / potansiyel dönem<br>6–7,9 Yüksek yağış potansiyeli<br>8–10 Kritik: fırtına / şiddetli yağış riski<br>Veri: 12 hava modeli (Open-Meteo üzerinden) + MET Norway + wttr.in + ECMWF/ICON topluluk tahmini; değerler kaynakların medyanıdır.<br><br><b>Not:</b> Bu skor uygulamaya özgü sezgisel bir formüldür; bilimsel olarak doğrulanmış bir indeks ya da resmi uyarı değildir.'));
$('rainAmount').addEventListener('click', () => showInfo('Yağış (mm)',
  'Yağış miktarı milimetre (mm) cinsindendir; 1 mm = metrekareye 1 litre su (su eşdeğeri). Saatlik değer, o saate kadar geçen son 1 saatin toplamıdır. Kar yağışında bu değer su eşdeğeridir; kar kalınlığı (cm) Atmosferik Veri Matrisi\'nde ayrıca verilir.'));
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - lastFetch > PREFS.ref * 60000) fetchWeatherData(true); });
let refTimer = 0;
function scheduleRefresh() { clearInterval(refTimer); refTimer = setInterval(() => { if (!document.hidden || notifOn) fetchWeatherData(true); }, PREFS.ref * 60000); }
scheduleRefresh();
const INFO = {
  chart: ["Grafik", "Mavi çubuklar: modelin saatlik yağışı (mm, sol eksen). Sarı çizgi: Mikro-Klima Skoru (0-10, sağ eksen). Büyük nokta seçili saattir; grafiğe dokunarak saat seçebilirsin."],
  matrix: ["Atmosferik Veri Matrisi", "Seçili saatin ham değerleri. Her kutudaki ? işaretine basınca o terimin ne demek olduğunu, şu anki seviyesini ve seviye aralıklarını görürsün."]
};
const PINFO = {
  "Sıcaklık": "2 metre yükseklikte hava sıcaklığı.",
  "Hissedilen": "Rüzgâr ve nemin etkisiyle vücuda hissedilen sıcaklık.",
  "Çiy noktası": "Havanın neme doyup yoğuşmaya (bulut, sis, çiy) başladığı sıcaklık.",
  "Çiy açığı": "Sıcaklık − çiy noktası. Ne kadar küçükse hava o kadar neme doygundur; 0'a yakınsa bulut, sis veya yağış kolaylaşır.",
  "Nem (RH)": "Bağıl nem: havanın o sıcaklıkta tutabileceği neme göre doluluk oranı.",
  "Bulut": "Gökyüzünün bulutla kaplı yüzdesi.",
  "Yağış olasılığı": "Modelin o saatte ölçülebilir yağış ihtimali.",
  "Yağış": "Önceki 1 saatte düşen toplam yağış. 1 mm = metrekareye 1 litre su.",
  "Kar kalınlığı": "Önceki 1 saatte yağan kar miktarı (cm).",
  "CAPE": "Konvektif potansiyel enerji (J/kg). Havanın yükselip fırtına bulutu üretme enerjisi: yaklaşık 1000 üstü gök gürültülü fırtınaya elverişli, 2500 üstü şiddetli fırtına potansiyeli.",
  "Rüzgâr": "10 metre yükseklikte ortalama rüzgâr hızı.",
  "Hamle": "10 metre yükseklikte ani rüzgâr zirvesi.",
  "Basınç": "Yüzey hava basıncı (girdiğin rakıma göre).",
  "Görüş": "Yatay görüş mesafesi.",
  "UV indeksi": "Güneşin morötesi şiddeti. 3 altı düşük, 6-7 yüksek, 8 üstü çok yüksek."
};
document.querySelectorAll('[data-info]').forEach(b => b.addEventListener('click', e => {
  e.stopPropagation();
  const k = b.dataset.info;
  if (k === 'score') $('indexScore').click();
  else if (k === 'rain') $('rainAmount').click();
  else showInfo(INFO[k][0], INFO[k][1]);
}));
$('paramGrid').addEventListener('click', e => {
  const b = e.target.closest('.help-btn');
  if (!b) return;
  const k = b.dataset.t, h = win()[activeHourIndex];
  const st = h ? stateLabel(k, h) : '';
  showInfo(DISPLAY[k] || k, (PINFO[k] || '') + (st ? '<br><br><b>Şu an:</b> ' + b.dataset.v + ' → ' + st : '') + (STATES[k] ? '<br><br><b>Seviyeler:</b><br>' + scaleText(k) : ''));
});

/* ===== Çoklu kaynak: canlı veri çekme, birleştirme, uyum ve güven ===== */
const MODELS = [['ecmwf_ifs025', 'ECMWF (Avrupa)'], ['gfs_seamless', 'NOAA GFS (ABD)'], ['icon_seamless', 'DWD ICON (Almanya)'], ['meteofrance_seamless', 'Météo-France'], ['gem_seamless', 'GEM (Kanada)'], ['ukmo_seamless', 'UK Met Office'], ['jma_seamless', 'JMA (Japonya)']];
/* Ek modeller: ayrı istekle çekilir (biri hata verirse ana 7 model etkilenmez). Geçmiş doğruluk arşivi yoktur, ortalama ağırlık alır. */
const EXTRA_MODELS = [['gfs_graphcast025', 'GraphCast (Google DeepMind yapay zekâ)'], ['ecmwf_aifs025_single', 'ECMWF AIFS (yapay zekâ)'], ['cma_grapes_global', 'CMA (Çin)'], ['kma_seamless', 'KMA (Kore)'], ['bom_access_global', 'BoM ACCESS (Avustralya)']];
const MODEL_VARS = 'temperature_2m,relative_humidity_2m,dew_point_2m,precipitation,cloud_cover,wind_speed_10m,wind_gusts_10m,surface_pressure,cape';
const FUSE_F = ['temp', 'hum', 'dew', 'cloud', 'wind', 'gust', 'press', 'cape'];
let SRC = [], STAT = [], ENS = null, EXT = null, srcTimer = 0, srcLoc = '';
const num = v => (v == null || v === '' || isNaN(+v)) ? null : +v;
const hkOf = ms => new Date(ms + (rawApiData && rawApiData.utc_offset_seconds || 0) * 1000).toISOString().slice(0, 13);
const errMsg = e => e && e.name === 'AbortError' ? 'zaman aşımı' : (e && e.message) || 'hata';
/* İstek kuyruğu: aynı anda en çok NETMAX istek çalışır (düşük donanımda 3), arka plan işleri (pri 1) öne geçmez */
const NETMAX = ((navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 4) <= 2) ? 3 : 5;
const NETQ = []; let netRun = 0;
function netQ(fn, pri) { return new Promise((ok, no) => { NETQ.push({ fn, ok, no, pri: pri || 0 }); NETQ.sort((a, b) => a.pri - b.pri); netPump(); }); }
function netPump() {
  while (netRun < NETMAX && NETQ.length) { const j = NETQ.shift(); netRun++; Promise.resolve().then(j.fn).then(j.ok, j.no).finally(() => { netRun--; netPump(); }); }
}
const qf = (u, o) => netQ(() => fetch(u, o), 1);
/* Depolama kuyruğu: yazmalar birleştirilir, tarayıcı boştayken tek seferde yapılır */
const LSQ = {}; let lsT = 0;
function lsQ(k, fn) { LSQ[k] = fn; if (!lsT) lsT = (window.requestIdleCallback || (f => setTimeout(f, 300)))(lsFlush); }
function lsFlush() { lsT = 0; Object.keys(LSQ).forEach(k => { try { localStorage.setItem(k, LSQ[k]()); } catch (e) {} delete LSQ[k]; }); }
document.addEventListener('visibilitychange', () => { if (document.hidden) lsFlush(); });
window.addEventListener('pagehide', lsFlush);
function jget(url, ms, pri) { return netQ(() => jgetRaw(url, ms), pri); }
function jgetRaw(url, ms) {
  const c = new AbortController(), t0 = Date.now(), to = setTimeout(() => c.abort(), ms);
  return fetch(url, { signal: c.signal }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(d => ({ d, ms: Date.now() - t0 })).finally(() => clearTimeout(to));
}
function parseModels(d, list) {
  const H = d.hourly, F = { temp: 'temperature_2m', hum: 'relative_humidity_2m', dew: 'dew_point_2m', precip: 'precipitation', cloud: 'cloud_cover', wind: 'wind_speed_10m', gust: 'wind_gusts_10m', press: 'surface_pressure', cape: 'cape' };
  return (list || MODELS).map(m => {
    const vals = {}; let any = 0;
    H.time.forEach((t, i) => {
      const o = {}; let got = false;
      for (const f in F) { const a = H[F[f] + '_' + m[0]]; const v = a ? num(a[i]) : null; if (v != null) { o[f] = v; got = true; } }
      if (got) { vals[t.slice(0, 13)] = o; any++; }
    });
    return { key: m[0], name: m[1], vals, any };
  });
}
function parseMet(d) {
  const vals = {}, put = (k, o) => { vals[k] = Object.assign(vals[k] || {}, o); };
  d.properties.timeseries.forEach(e => {
    const ms = Date.parse(e.time), I = e.data.instant.details;
    put(hkOf(ms), { temp: num(I.air_temperature), hum: num(I.relative_humidity), dew: num(I.dew_point_temperature), cloud: num(I.cloud_area_fraction),
      wind: num(I.wind_speed) == null ? null : I.wind_speed * 3.6, gust: num(I.wind_speed_of_gust) == null ? null : I.wind_speed_of_gust * 3.6 });
    const n1 = e.data.next_1_hours, n6 = e.data.next_6_hours;
    if (n1 && n1.details && n1.details.precipitation_amount != null) put(hkOf(ms + 3600e3), { precip: n1.details.precipitation_amount });
    else if (n6 && n6.details && n6.details.precipitation_amount != null) for (let j = 1; j <= 6; j++) put(hkOf(ms + j * 3600e3), { precip: n6.details.precipitation_amount / 6 });
  });
  return vals;
}
function parseWttr(d) {
  const vals = {};
  (d.weather || []).forEach(day => {
    const q = day.date.split('-').map(Number);
    (day.hourly || []).forEach(e => {
      const H = Math.round(+e.time / 100), pm = num(e.precipMM);
      const o = { temp: num(e.tempC), hum: num(e.humidity), dew: num(e.DewPointC), cloud: num(e.cloudcover), wind: num(e.windspeedKmph), gust: num(e.WindGustKmph), precip: pm == null ? null : pm / 3 };
      for (let j = -1; j <= 1; j++) vals[new Date(Date.UTC(q[0], q[1] - 1, q[2], H + j)).toISOString().slice(0, 13)] = Object.assign({}, o);
    });
  });
  return vals;
}
function parseEns(d) {
  const H = d.hourly, keys = Object.keys(H).filter(k => k.indexOf('precipitation') === 0 && Array.isArray(H[k]));
  const p01 = {}, p1 = {}, mean = {};
  H.time.forEach((t, i) => {
    let n = 0, w = 0, w1 = 0, sum = 0;
    keys.forEach(k => { const v = num(H[k][i]); if (v == null) return; n++; sum += v; if (v >= 0.1) w++; if (v >= 1) w1++; });
    if (n >= 5) { const kk = t.slice(0, 13); p01[kk] = w / n * 100; p1[kk] = w1 / n * 100; mean[kk] = sum / n; }
  });
  return { n: keys.length, p01, p1, mean };
}
function parseExt(d) {
  const H = d.hourly, g = (k, i) => H[k] ? num(H[k][i]) : null, o = {};
  H.time.forEach((t, i) => { o[t.slice(0, 13)] = { li: g('lifted_index', i), cin: g('convective_inhibition', i), rh7: g('relative_humidity_700hPa', i), pw: g('total_column_integrated_water_vapour', i) }; });
  return o;
}
function loadSources(lat, lon, alt, id) {
  STAT = [];
  const e = isFinite(alt) ? '&elevation=' + alt : '';
  const base = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + e + '&forecast_days=7&timezone=auto&wind_speed_unit=kmh&precipitation_unit=mm';
  const done = fn => { if (id !== reqId) return; try { fn(); } catch (x) {} scheduleFuse(); };
  const drop = key => { SRC = SRC.filter(x => x.key !== key); };
  const put = s => { drop(s.key); SRC.push(s); };
  const mst = MODELS.map(m => ({ key: m[0], name: m[1], state: 'wait' }));
  STAT.push.apply(STAT, mst);
  jget(base + '&hourly=' + MODEL_VARS + '&models=' + MODELS.map(m => m[0]).join(','), 15000)
    .then(r => done(() => parseModels(r.d).forEach((s, i) => { const st = mst[i]; st.ms = r.ms; if (s.any) { st.state = 'ok'; put(s); } else { st.state = 'bad'; st.err = 'bu bölgeyi kapsamıyor'; drop(s.key); } })))
    .catch(x => done(() => mst.forEach(st => { st.state = 'bad'; st.err = errMsg(x); drop(st.key); })));
  const job = (key, name, url, ms, ok) => {
    const st = { key, name, state: 'wait' }; STAT.push(st);
    jget(url, ms).then(r => done(() => { st.ms = r.ms; ok(r.d); st.state = 'ok'; }))
      .catch(x => done(() => { st.state = 'bad'; st.err = errMsg(x); drop(key); }));
  };
  const xst = EXTRA_MODELS.map(m => ({ key: m[0], name: m[1], state: 'wait' }));
  STAT.push.apply(STAT, xst);
  jget(base + '&hourly=' + MODEL_VARS + '&models=' + EXTRA_MODELS.map(m => m[0]).join(','), 20000)
    .then(r => done(() => parseModels(r.d, EXTRA_MODELS).forEach((s, i) => { const st = xst[i]; st.ms = r.ms; if (s.any) { st.state = 'ok'; put(s); } else { st.state = 'bad'; st.err = 'bu bölgeyi kapsamıyor'; drop(s.key); } })))
    .catch(x => done(() => xst.forEach(st => { st.state = 'bad'; st.err = errMsg(x); drop(st.key); })));
  job('metno', 'MET Norway (Yr)', 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=' + (+lat).toFixed(4) + '&lon=' + (+lon).toFixed(4) + (isFinite(alt) ? '&altitude=' + Math.round(alt) : ''), 12000,
    d => put({ key: 'metno', name: 'MET Norway (Yr)', vals: parseMet(d) }));
  job('wttr', 'wttr.in (WWO)', 'https://wttr.in/' + lat + ',' + lon + '?format=j1', 12000,
    d => put({ key: 'wttr', name: 'wttr.in (3 saatlik)', vals: parseWttr(d) }));
  job('ens', 'Topluluk tahmini', 'https://ensemble-api.open-meteo.com/v1/ensemble?latitude=' + lat + '&longitude=' + lon + '&hourly=precipitation&models=icon_seamless,ecmwf_ifs025&forecast_days=7&timezone=auto&precipitation_unit=mm', 20000,
    d => { ENS = parseEns(d); if (!ENS.n) { ENS = null; throw new Error('üye yok'); } });
  job('ext', 'Atmosfer ek verileri', base + '&hourly=lifted_index,convective_inhibition,relative_humidity_700hPa,total_column_integrated_water_vapour', 15000,
    d => { EXT = parseExt(d); });
}
function scheduleFuse() {
  clearTimeout(srcTimer);
  srcTimer = setTimeout(() => {
    if (!hours.length) return;
    fuseAll(); calcNow();
    const w = win(); activeHourIndex = Math.min(activeHourIndex, w.length - 1);
    render(); renderKarne();
  }, 150);
}
function fuseAll() {
  const live = SRC.filter(s => s.vals), WT = wmap('t'), WR = wmap('r'), BC = bmap();
  hours.forEach(h => {
    const k = h.t.slice(0, 13), P = h.p;
    h.rows = live.map(s => ({ s, v: s.vals[k] })).filter(r => r.v);
    FUSE_F.forEach(f => {
      const pr = h.rows.filter(r => r.v[f] != null), a = pr.map(r => r.v[f] - (f === 'temp' ? (BC[r.s.key] || 0) : 0));
      h['sd_' + f] = a.length >= 2 ? Math.max.apply(null, a) - Math.min.apply(null, a) : null;
      h[f] = a.length >= 2 ? (f === 'temp' ? wmed(pr.map(r => [r.v[f] - (BC[r.s.key] || 0), WT[r.s.key] || 1])) : MED(a)) : P[f];
    });
    const pr2 = h.rows.filter(r => r.v.precip != null), pa = pr2.map(r => r.v.precip);
    const wsum = pr2.reduce((x, r) => x + (WR[r.s.key] || 1), 0);
    h.nP = pa.length; h.wet = pa.filter(x => x >= 0.1).length;
    h.wetW = wsum ? pr2.reduce((x, r) => x + (r.v.precip >= 0.1 ? (WR[r.s.key] || 1) : 0), 0) / wsum : 0;
    h.precip = pa.length >= 2 ? pr2.reduce((x, r) => x + r.v.precip * (WR[r.s.key] || 1), 0) / wsum : P.precip;
    h.ens = ENS && ENS.p01[k] != null ? ENS.p01[k] : null;
    h.ens1 = ENS && ENS.p1[k] != null ? ENS.p1[k] : null;
    h.ensMean = ENS && ENS.mean[k] != null ? ENS.mean[k] : null;
    const parts = [];
    if (h.ens != null) parts.push(h.ens);
    h.calP = calP(h);
    if (h.calP != null) parts.push(h.calP); else if (h.nP >= 3) parts.push(h.wetW * 100);
    if (P.pop != null) parts.push(P.pop);
    h.pop = parts.length ? MEAN(parts) : P.pop;
    const x = EXT && EXT[k];
    h.li = x ? x.li : null; h.cin = x ? x.cin : null; h.rh7 = x ? x.rh7 : null; h.pw = x ? x.pw : null;
  });
  hours.forEach((h, i) => { h.ptr = (i >= 3 && h.press != null && hours[i - 3].press != null) ? h.press - hours[i - 3].press : null; });
  hours.forEach(h => { h.code = adjCode(h); });
  hours.forEach((h, i) => { h.score = scoreOf(h); h.conf = confOf(h, i); h.trng = trngOf(h); });
  summarizeDays();
}
function confOf(h, i) {
  if (!h.rows || h.rows.length < 3 || h.pop == null) return null;
  const ahead = Math.max(0, (i - nowIdx) / 24), c = Math.max(h.pop, 100 - h.pop);
  return Math.round(50 + (c - 50) * Math.max(0.6, 1 - 0.06 * ahead));
}
function trngOf(h) {
  if (h.sd_temp == null) return null;
  const S = HIST && HIST.skill, ks = S ? Object.keys(S).filter(k => k !== 'med') : [];
  const base = ks.length ? MEAN(ks.map(k => S[k].sd)) : 1.5;
  return Math.sqrt(Math.pow(h.sd_temp / 2, 2) + base * base);
}
const confLabel = c => c == null ? '--' : c >= 85 ? 'çok yüksek' : c >= 70 ? 'yüksek' : c >= 60 ? 'orta' : 'düşük';
function confLine(h) {
  const wait = STAT.some(s => s.state === 'wait');
  if (h.conf == null) return '<br>Güven: ' + (wait ? 'kaynaklar yükleniyor…' : 'karşılaştırma için yeterli kaynak yok');
  return '<br>Yağış kararı: <b>' + (h.pop >= 50 ? 'yağışlı' : 'kuru') + '</b> · güven <b>%' + h.conf + ' (' + confLabel(h.conf) + ')</b>' + (h.trng != null ? ' · sıcaklık ±' + h.trng.toFixed(1) + '°' : '') + ' · ' + h.rows.length + ' kaynak' + (h.nP >= 3 ? ' · yağış oyu ' + h.wet + '/' + h.nP : '');
}
function renderSources(h) {
  const wait = STAT.some(s => s.state === 'wait');
  $('srcBadges').innerHTML = STAT.map(s => '<span class="pill ' + s.state + '" title="' + esc(s.err) + '">' + (s.state === 'ok' ? '✓ ' : s.state === 'bad' ? '✕ ' : '… ') + esc(s.name) + (s.state === 'bad' && s.err ? ' (' + esc(s.err) + ')' : '') + '</span>').join('');
  const n = h.rows ? h.rows.length : 0;
  $('srcSummary').textContent = h.conf != null ? 'Güven %' + h.conf + ' · ' + confLabel(h.conf) : (wait ? 'yükleniyor…' : 'karşılaştırma yok');
  const C = [['temp', 'Sıc.', 1], ['hum', 'Nem', 0], ['precip', 'Yağış', 1], ['cloud', 'Bulut', 0], ['wind', 'Rüzgâr', 0]];
  const tol = { temp: 2, hum: 15, cloud: 30, wind: 12 };
  const maj = h.nP >= 2 ? h.wet / h.nP >= 0.5 : null;
  const cell = (f, v, d) => {
    if (v == null) return '<td class="na">–</td>';
    let bad = false;
    if (f === 'precip') bad = maj != null && (v >= 0.1) !== maj; else bad = h[f] != null && Math.abs(v - h[f]) > tol[f];
    return '<td' + (bad ? ' class="out"' : '') + '>' + v.toFixed(d) + '</td>';
  };
  let t = '<tr><th>Kaynak</th>' + C.map(c => '<th>' + c[1] + '</th>').join('') + '</tr>';
  t += '<tr class="cons"><td>Birleşik</td>' + C.map(c => '<td>' + (h[c[0]] == null ? '–' : h[c[0]].toFixed(c[2])) + '</td>').join('') + '</tr>';
  h.rows.forEach(r => { t += '<tr><td>' + esc(r.s.name) + '</td>' + C.map(c => cell(c[0], r.v[c[0]] == null ? null : r.v[c[0]], c[2])).join('') + '</tr>'; });
  if (h.ens != null) t += '<tr><td>Topluluk (' + ENS.n + ' üye)</td><td class="na">–</td><td class="na">–</td><td>%' + Math.round(h.ens) + ' · ' + (h.ensMean == null ? '' : h.ensMean.toFixed(1)) + '</td><td class="na">–</td><td class="na">–</td></tr>';
  t += '<tr class="ref"><td>Open-Meteo best-match</td>' + C.map(c => '<td>' + (h.p[c[0]] == null ? '–' : (+h.p[c[0]]).toFixed(c[2])) + '</td>').join('') + '</tr>';
  $('srcTable').innerHTML = t;
  const L = [];
  if (h.nP >= 2) L.push('Yağış oyu: <b>' + h.wet + '/' + h.nP + '</b> kaynak (%' + Math.round(h.wet / h.nP * 100) + ') ölçülebilir yağış gösteriyor');
  if (h.ens != null) L.push('Topluluk olasılığı: <b>%' + Math.round(h.ens) + '</b> (≥0,1 mm) · <b>%' + Math.round(h.ens1) + '</b> (≥1 mm)');
  if (h.sd_temp != null) L.push('Sıcaklık yayılımı: <b>' + h.sd_temp.toFixed(1) + '°C</b> · nem: <b>' + (h.sd_hum == null ? '--' : h.sd_hum.toFixed(0) + ' puan') + '</b> · bulut: <b>' + (h.sd_cloud == null ? '--' : h.sd_cloud.toFixed(0) + ' puan') + '</b>');
  if (h.nP >= 2) L.push('Yağış miktarı kaynakların ortalamasıdır; diğer değerler medyandır. Pembe hücre = çoğunluktan belirgin sapan kaynak.');
  $('srcStats').innerHTML = L.join('<br>');
}
Object.assign(PINFO, {
  'Basınç eğilimi': 'Son 3 saatte yüzey basıncının değişimi. Hızlı düşüş (−2 hPa ve altı) yaklaşan cephe veya alçak basınç sistemini, yani yağış ve rüzgâr artışını haber verir.',
  'Orta seviye nem (700 hPa)': 'Yaklaşık 3 km yükseklikteki bağıl nem. Yerde nem yüksek olsa bile üst seviye kuruysa yağış çıkmaz; ikisi birlikte yüksekse yağış ihtimali ciddi artar.',
  'Toplam su buharı': 'Havanın tüm kalınlığındaki su buharı (kg/m²). 35 üstü çok nemli hava kütlesi, yani yağışın hammaddesi bol demektir.',
  'Kaldırma indeksi (LI)': 'Atmosferin kararsızlığı. Sıfırın altı kararsız, −3 altı fırtınaya elverişli, −6 altı çok kararsızdır.',
  'CIN (fırtına freni)': 'Konvektif engel (J/kg). Yüksekse (örn. 100 üstü) yüzeydeki sıcak hava yükselemez ve fırtına başlaması zorlaşır; CAPE yüksek olsa bile tetiklenmeyebilir.',
  'Kaynak oyu': 'Bağımsız kaynakların kaçı o saatte ölçülebilir (≥0,1 mm) yağış gösteriyor. Hepsi aynı yöndeyse güven yüksektir.',
  'Topluluk olasılığı': 'ECMWF ve ICON topluluk tahminlerinin (yaklaşık 90 üye) yağış gösterme oranı. Gerçek olasılığa en yakın ölçüdür.',
  'Tahmin güveni': 'Yağar mı, yağmaz mı kararından ne kadar emin olduğumuz. Birleşik yağış olasılığı (topluluk, kaynak oyu, geçmişe göre kalibrasyon) %0 ya da %100\'e ne kadar yakınsa güven o kadar yüksek; %50 civarı yazı-tura demektir. İleri günlerde güven azalır. Sıcaklık belirsizliği ayrıca "Sıcaklık aralığı"nda verilir.',
  'Sıcaklık aralığı': 'Kaynakların sıcaklıkta ne kadar ayrıştığı ve bu bölgede geçmişte ne kadar sapıldığı birleştirilerek hesaplanan tipik hata payı. Örnek: 21° ve ±2 ise gerçek değer büyük olasılıkla 19-23° arasında olur.',
  'Yağış olasılığı': 'Üç şeyin ortalaması: topluluk olasılığı, kaynakların yağış oyu ve Open-Meteo modelinin kendi olasılığı (hangileri varsa).'
});
Object.assign(STATES, {
  'Basınç eğilimi': [h => h.ptr, [[-4, 'Hızlı düşüş'], [-1.5, 'Düşüyor'], [1.5, 'Durağan'], [4, 'Yükseliyor'], [Infinity, 'Hızlı yükseliş']]],
  'Kaldırma indeksi (LI)': [h => h.li, [[-6, 'Çok kararsız'], [-3, 'Kararsız'], [0, 'Hafif kararsız'], [Infinity, 'Kararlı']]],
  'Tahmin güveni': [h => h.conf, [[60, 'Düşük'], [70, 'Orta'], [85, 'Yüksek'], [Infinity, 'Çok yüksek']]]
});
INFO.sources = ['Kaynak karşılaştırması', 'Tahmin tek bir yerden değil, birbirinden bağımsız kaynaklardan canlı çekilir: 7 ulusal hava modeli (ECMWF, NOAA GFS, DWD ICON, Météo-France, GEM, UK Met Office, JMA), 5 ek model (Google DeepMind GraphCast ve ECMWF AIFS yapay zekâ modelleri, CMA, KMA, BoM), MET Norway ve wttr.in. Ayrıca ECMWF + ICON topluluk tahmininin yaklaşık 90 üyesi yağış olasılığı için taranır.<br><br><b>Birleşik değer:</b> sıcaklık, nem, bulut, rüzgâr ve basınçta kaynakların medyanı; yağış miktarında ortalaması. Yağış olasılığı topluluk oranı, kaynak oyu ve model olasılığının ortalamasıdır.<br><br><b>Güven:</b> yağış kararının netliğidir; birleşik olasılık uçlara ne kadar yakınsa yüksektir ve ileri saatlerde azalır. Hiçbir hava tahmini %100 kesin değildir; güven yüzdesi tutarlılığı gösterir, doğruluğu garanti etmez. Birkaç kaynak yüklenemezse hesap kalanlarla yapılır, güven buna göre düşer.<br><br>Pembe hücre, çoğunluktan belirgin sapan kaynağı gösterir.'];


/* ===== Geçmiş doğruluk: internetten otomatik (Open-Meteo arşivlenmiş tahminler vs ERA5 gerçek) ===== */
const HL = 'mk_hist_v4';
let HIST = null, histState = 'yükleniyor…';
const histKey = (lat, lon, alt) => (+lat).toFixed(2) + ',' + (+lon).toFixed(2) + ',' + (isFinite(alt) ? Math.round(alt) : '');
const histRead = () => { try { return JSON.parse(localStorage.getItem(HL)) || {}; } catch (e) { return {}; } };
const histWrite = o => {
  try {
    const ks = Object.keys(o).sort((a, b) => o[a].at - o[b].at);
    while (ks.length > 8) delete o[ks.shift()];
    lsQ(HL, () => JSON.stringify(o));
  } catch (e) {}
};
function histScore(F, A) {
  const T = A.hourly, skill = {}, acc = {};
  const get = (key, i) => {
    const t = F.hourly['temperature_2m_' + key], p = F.hourly['precipitation_' + key];
    return [t ? num(t[i]) : null, p ? num(p[i]) : null];
  };
  const idx = {}; F.hourly.time.forEach((t, i) => { idx[t] = i; });
  const keys = MODELS.map(m => m[0]).concat(['med']);
  let wetHrs = 0; const cal = [];
  for (let q = 0; q <= 7; q++) cal.push({ n: 0, w: 0 });
  T.time.forEach((t, j) => {
    const i = idx[t]; if (i == null) return;
    const tt = num(T.temperature_2m[j]), tp = num(T.precipitation[j]);
    if (tt == null) return;
    const wet = tp != null && tp >= 0.1; if (wet) wetHrs++;
    const rows = {}, tl = [], pl = [];
    MODELS.forEach(m => { const g = get(m[0], i); rows[m[0]] = g; if (g[0] != null) tl.push(g[0]); if (g[1] != null) pl.push(g[1]); });
    const pv = MODELS.map(m => rows[m[0]][1]).filter(v => v != null);
    if (pv.length >= 5 && tp != null) { const ix = Math.round(pv.filter(v => v >= 0.1).length / pv.length * 7); cal[ix].n++; if (wet) cal[ix].w++; }
    rows.med = [tl.length >= 3 ? MED(tl) : null, pl.length >= 3 ? MEAN(pl) : null];
    keys.forEach(k => {
      const g = rows[k], a = acc[k] = acc[k] || { n: 0, e: 0, b: 0, q: 0, h: 0, m: 0, f: 0, pn: 0 };
      if (g[0] != null) { a.n++; a.e += Math.abs(g[0] - tt); a.b += g[0] - tt; a.q += (g[0] - tt) * (g[0] - tt); }
      if (g[1] != null && tp != null) { a.pn++; const p = g[1] >= 0.1; if (p && wet) a.h++; else if (!p && wet) a.m++; else if (p && !wet) a.f++; }
    });
  });
  keys.forEach(k => {
    const a = acc[k]; if (!a || a.n < 48) return;
    const d = a.h + a.m + a.f;
    skill[k] = { mae: a.e / a.n, bias: a.b / a.n, sd: Math.sqrt(Math.max(0, a.q / a.n - Math.pow(a.b / a.n, 2))), n: a.n, csi: d ? a.h / d : 0, pod: (a.h + a.m) ? a.h / (a.h + a.m) : null, far: (a.h + a.f) ? a.f / (a.h + a.f) : null };
  });
  return { skill, wetHrs, cal, hours: T.time.length };
}
function loadHist(lat, lon, alt, id) {
  const key = histKey(lat, lon, alt), all = histRead(), c = all[key];
  if (c && Date.now() - c.at < 12 * 3600e3 && c.skill) { HIST = c; histState = ''; scheduleFuse(); return; }
  HIST = null; histState = 'yükleniyor…'; renderKarne();
  const day = k => new Date(Date.now() - k * 864e5).toISOString().slice(0, 10);
  const q = '&latitude=' + lat + '&longitude=' + lon + (isFinite(alt) ? '&elevation=' + alt : '') + '&start_date=' + day(36) + '&end_date=' + day(6) + '&hourly=temperature_2m,precipitation&timezone=auto';
  Promise.all([
    jget('https://historical-forecast-api.open-meteo.com/v1/forecast?models=' + MODELS.map(m => m[0]).join(',') + q, 30000, 1),
    jget('https://archive-api.open-meteo.com/v1/archive?' + q.slice(1), 30000, 1)
  ]).then(r => {
    if (id !== reqId) return;
    const res = histScore(r[0].d, r[1].d);
    if (!Object.keys(res.skill).length) throw new Error('veri yok');
    res.at = Date.now(); res.from = day(36); res.to = day(6);
    HIST = res; histState = '';
    const a = histRead(); a[key] = res; histWrite(a);
    scheduleFuse();
  }).catch(x => { if (id !== reqId) return; histState = 'ulaşılamadı (' + errMsg(x) + ')'; renderKarne(); });
}
/* Kaynak ağırlıkları: sıcaklık için 1/(hata+0,4)², yağış için (CSI+0,15)². Geçmişi olmayan kaynak, bilinenlerin ortalamasını alır. */
function wmap(kind) {
  const out = {}, S = HIST && HIST.skill;
  const f = s => kind === 't' ? 1 / Math.pow(s.sd + 0.4, 2) : Math.pow(s.csi + 0.15, 2);
  const off = !S || (kind === 'r' && HIST.wetHrs < 8);
  const known = off ? [] : Object.keys(S).filter(k => k !== 'med').map(k => f(S[k]));
  const avg = known.length ? MEAN(known) : 1;
  const tr = era5Trust();
  SRC.forEach(s => { out[s.key] = ((!off && S[s.key]) ? avg * Math.pow(f(S[s.key]) / avg, tr) : avg) * memFactor(kind, s.key); });
  return out;
}
/* ERA5 ECMWF'nin sisteminden çıkar ve kaba çözünürlüklüdür; bu yüzden geçmiş başarının ağırlığı kısılır (0,75).
   Bu konumda METAR ile doğrulanmış yeterli canlı veri birikince ERA5'in payı daha da azalır (0,5). */
function era5Trust() { try { const m = memOn() && memLoc().tm; return m && m.m >= 72 ? 0.5 : 0.75; } catch (e) { return 0.75; } }
/* Sıcaklık sapma düzeltmesi: kaynağın geçmişteki ortalama sapması (en çok ±3°) birleşik hesaptan önce çıkarılır */
function bmap() {
  const out = {}, S = HIST && HIST.skill;
  SRC.forEach(s => { const k = S && S[s.key]; let b = k && k.n >= 240 ? Math.max(-3, Math.min(3, k.bias)) : 0; const m = memBias(s.key); if (m) b = (1 - m.a) * b + m.a * m.b; out[s.key] = Math.max(-3, Math.min(3, b)); });
  return out;
}
/* Kalibrasyon: kaç model yağış diyorsa, geçmişte bu bölgede gerçekte yağış çıkma sıklığı (önceki olarak oy oranıyla yumuşatılır) */
function calP(h) {
  if (!HIST || !HIST.cal || HIST.wetHrs < 8) return null;
  const pv = h.rows.filter(r => MODELS.some(m => m[0] === r.s.key) && r.v.precip != null).map(r => r.v.precip);
  if (pv.length < 5) return null;
  const ix = Math.round(pv.filter(v => v >= 0.1).length / pv.length * 7), c = HIST.cal[ix];
  return (c.w + 2 * ix / 7) / (c.n + 2) * 100;
}
function renderKarne() {
  const tb = $('karneTable'); if (!tb) return;
  if (!HIST || !HIST.skill) {
    tb.innerHTML = ''; $('karneSum').textContent = histState || '';
    $('karneNote').textContent = histState.indexOf('ulaş') === 0 ? 'Geçmiş tahmin arşivine şu an erişilemedi; kaynaklar eşit ağırlıkla birleştiriliyor. Yenileyince tekrar denenir.' : 'Son 30 günün arşivlenmiş tahminleri gerçekle kıyaslanıyor…';
    return;
  }
  const S = HIST.skill, WT = wmap('t'), WR = wmap('r');
  const sT = Object.keys(WT).reduce((a, k) => a + WT[k], 0), sR = Object.keys(WR).reduce((a, k) => a + WR[k], 0);
  const nm = {}; MODELS.forEach(m => { nm[m[0]] = m[1]; }); SRC.forEach(s => { nm[s.key] = s.name; }); nm.med = 'Model medyanı';
  const ids = Array.from(new Set(Object.keys(S).filter(k => k !== 'med').concat(SRC.map(s => s.key))));
  ids.sort((a, b) => ((S[b] ? S[b].csi : -1) - (S[a] ? S[a].csi : -1)) || ((S[a] ? S[a].mae : 99) - (S[b] ? S[b].mae : 99)));
  const rainOk = HIST.wetHrs >= 8;
  const row = (k, cls) => {
    const s = S[k], live = WT[k] != null;
    return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + esc(nm[k] || k) + '</td><td>' + (s ? s.mae.toFixed(1) + '° (' + (s.bias > 0 ? '+' : '') + s.bias.toFixed(1) + ')' : '–') + '</td><td>' + (s && rainOk ? '%' + Math.round(s.csi * 100) : '–') + '</td><td>' + (live ? '%' + Math.round(WT[k] / sT * 100) + ' / ' + (rainOk ? '%' + Math.round(WR[k] / sR * 100) : '–') : '–') + '</td></tr>';
  };
  const best = ids.find(k => S[k]);
  tb.innerHTML = '<tr><th>Kaynak</th><th>Sıc. hata (sapma)</th><th>Yağış CSI</th><th>Ağırlık (sıc/yağ)</th></tr>' + ids.map(k => row(k, k === best ? 'cons' : '')).join('') + (S.med ? row('med', 'ref') : '');
  const d = Math.round(S[best || 'med'].n / 24);
  $('karneSum').textContent = d + ' gün · en iyi: ' + (nm[best] || '');
  $('karneNote').innerHTML = 'Open-Meteo arşivindeki geçmiş tahminler, aynı konumun gerçek (ERA5) verisiyle otomatik kıyaslandı (' + HIST.from + ' → ' + HIST.to + '). Sıc. hata: ortalama mutlak sapma, parantezde sistematik eğilim (düşük iyi). Yağış CSI: yağışlı saatleri tutturma başarısı, yanlış alarm ve kaçırma dahil (yüksek iyi).' +
    (rainOk ? '' : '<br>Bu dönemde bölgede neredeyse hiç yağış olmadı; yağış başarısı hesaplanamadı, yağışta eşit ağırlık kullanılıyor.') +
    '<br>Yağış olasılığı da geçmişe göre kalibre edilir: "kaç model yağış diyor" bilgisi, bu bölgede geçmişte gerçekte ne sıklıkla yağış çıktığıyla eşlenir.<br>Birleşik tahmin bu başarıya göre ağırlıklanır ve her kaynağın sıcaklıktaki sistematik eğilimi (en çok ±3°) düzeltilir. MET Norway ve wttr.in için arşiv yok, bilinen kaynakların ortalama ağırlığını alır.<br><b>Not:</b> ERA5, ECMWF\'nin kendi sisteminden çıkar ve kaba çözünürlüklüdür, ayrıca ~5 gün gecikmelidir; bu yüzden ECMWF modellerini hafifçe kayırabilir. Geçmiş başarının ağırlığı kısılır, bölgende METAR ile doğrulanmış canlı veri biriktikçe daha da azalır.';
}
INFO.karne = ['Geçmiş doğruluk', 'Hiçbir şeyi senin girmen gerekmez. Her açılışta, bu konum için son 30 günün <b>arşivlenmiş model tahminleri</b> internetten çekilir ve aynı saatlerin gerçek (ERA5 yeniden analiz) değerleriyle kıyaslanır. Böylece hangi modelin bölgende geçmişte daha sık haklı çıktığı hemen görülür.<br><br><b>Ağırlık:</b> sıcaklıkta 1/(rastgele hata+0,4)², yağışta (CSI+0,15)² ile hesaplanır; başarılı kaynağın sözü birleşik tahminde daha çok sayılır. Sonuç 12 saat önbelleğe alınır.<br><br>Not: ERA5 gerçek ölçüm değil, istasyon/uydu verisiyle üretilmiş en iyi yeniden analizdir; havalimanı METAR verisi tarayıcıdan çekilemediği için kullanılmıyor.'];

/* ===== 0-3 saat yağış (nowcast): Open-Meteo 15 dk + MET Norway radar nowcast (kapsama varsa) ===== */
let NOW = null;
function loadNow(lat, lon, alt, id) {
  const e = isFinite(alt) ? '&elevation=' + alt : '';
  const st = { om: 'wait', met: 'wait' };
  NOW = { st, om: null, met: null, off: 0 }; renderNow();
  const fin = () => { if (id !== reqId) return; renderNow(); };
  jget('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + e + '&minutely_15=precipitation&forecast_minutely_15=24&timezone=auto&precipitation_unit=mm', 15000)
    .then(r => {
      if (id !== reqId) return;
      const M = r.d.minutely_15; if (!M || !M.time) throw new Error('veri yok');
      const off = r.d.utc_offset_seconds || 0, o = {};
      M.time.forEach((t, i) => { const v = num(M.precipitation[i]); if (v != null) o[Math.floor((Date.parse(t + ':00Z') - off * 1000) / 900e3) - 1] = v; });   // damga = diliminin SONU (önceki 15 dk toplamı)
      NOW.om = o; NOW.off = off; st.om = 'ok'; fin();
    }).catch(x => { st.om = 'bad'; NOW.err = errMsg(x); fin(); });
  jget('https://api.met.no/weatherapi/nowcast/2.0/complete?lat=' + (+lat).toFixed(4) + '&lon=' + (+lon).toFixed(4), 12000)
    .then(r => {
      if (id !== reqId) return;
      const ts = r.d.properties && r.d.properties.timeseries; if (!ts || !ts.length) throw new Error('kapsam dışı');
      const sum = {}, cnt = {};
      ts.forEach(x => {
        const v = num(x.data.instant.details.precipitation_rate); if (v == null) return;
        const b = Math.floor(Date.parse(x.time) / 900e3);
        sum[b] = (sum[b] || 0) + v / 12; cnt[b] = (cnt[b] || 0) + 1;   // 5 dk adımı: mm/sa ÷ 12
      });
      const o = {}; Object.keys(sum).forEach(b => { if (cnt[b] >= 2) o[b] = sum[b] * 3 / cnt[b]; });  // 15 dk toplamına ölçekle
      if (!Object.keys(o).length) throw new Error('kapsam dışı');
      NOW.met = o; st.met = 'ok'; fin();
    }).catch(() => { st.met = 'bad'; fin(); });
}
function renderNow() {
  const box = $('nowBars'); if (!box) return;
  if (!NOW) return;
  const sum = $('nowSum'), note = $('nowNote');
  if (!NOW.om && !NOW.met) {
    box.innerHTML = ''; sum.textContent = NOW.st.om === 'bad' ? 'ulaşılamadı' : 'yükleniyor…';
    note.textContent = NOW.st.om === 'bad' ? 'Kısa vade verisi şu an alınamadı. Yenileyince tekrar denenir.' : ''; return;
  }
  const b0 = Math.floor(Date.now() / 900e3), slots = [];
  for (let k = 0; k < 12; k++) {
    const b = b0 + k, v = [];
    if (NOW.om && NOW.om[b] != null) v.push(NOW.om[b]);
    if (NOW.met && NOW.met[b] != null) v.push(NOW.met[b]);
    slots.push({ b, mm: v.length ? MEAN(v) : null, n: v.length, ms: b * 900e3 });
  }
  const ok = slots.filter(s => s.mm != null); if (!ok.length) return;
  const mx = Math.max(0.5, Math.max.apply(null, ok.map(s => s.mm)));
  const lbl = ms => new Date(ms + NOW.off * 1000).toISOString().slice(11, 16);
  box.innerHTML = slots.map((s, k) => '<div class="nbar" title="' + lbl(s.ms) + ' · ' + (s.mm == null ? '--' : s.mm.toFixed(2)) + ' mm"><div class="nfill' + (s.mm != null && s.mm >= 0.1 ? ' wet' : '') + '" style="height:' + (s.mm == null ? 0 : Math.max(s.mm >= 0.1 ? 8 : 2, s.mm / mx * 100)) + '%"></div><span>' + (k % 4 === 0 ? lbl(s.ms) : '') + '</span></div>').join('');
  const total = ok.reduce((a, s) => a + s.mm, 0), mins = k => k * 15;
  const first = ok.find(s => s.mm >= 0.1);
  let msg;
  if (!first) msg = '3 saat boyunca yağış beklenmiyor';
  else if (first.b === b0 || slots[0].mm >= 0.1) {
    const dry = slots.find(s => s.mm != null && s.mm < 0.1);
    msg = dry ? 'Şu an yağış var, ~' + mins(dry.b - b0) + ' dk içinde dinmesi bekleniyor' : 'Yağış var ve 3 saat boyunca sürmesi bekleniyor';
  } else msg = 'Yağış ~' + mins(first.b - b0) + ' dk içinde başlıyor';
  sum.textContent = msg;
  NOW.wetNow = slots[0].mm != null && slots[0].mm >= 0.1;
  NOW.startMin = (first && !NOW.wetNow) ? mins(first.b - b0) : null;
  const src = (NOW.met ? 'Open-Meteo 15 dk + MET Norway radar nowcast' : 'Open-Meteo 15 dk') + (NOW.st.met === 'bad' ? ' (radar bu bölgeyi kapsamıyor)' : '');
  let nxt = '';
  if (hours.length) {
    const cur = hours[nowIdx], nh = hours.slice(nowIdx + 1, nowIdx + 49).find(x => (x.precip || 0) >= 0.2 && (x.pop || 0) >= 40);
    nxt = nh ? '<br>Saatlik kaynaklara göre sıradaki yağış: <b>' + pad((nh.hh + 23) % 24) + ':00</b> civarı' + (cur && nh.date !== cur.date ? ' (yarın)' : '') + ' · olasılık <b>%' + Math.round(nh.pop) + '</b> · ~' + nh.precip.toFixed(1) + ' mm'
      : '<br>Saatlik kaynaklara göre 48 saat içinde belirgin yağış yok.';
  }
  note.innerHTML = '3 saatlik toplam: <b>' + total.toFixed(1) + ' mm</b> · en yoğun 15 dk: <b>' + Math.max.apply(null, ok.map(s => s.mm)).toFixed(2) + ' mm</b><br>Kaynak: ' + src + '. Çubuklar 15 dakikalık yağış toplamıdır.' + nxt;
  renderAlerts();
}
INFO.now = ['Önümüzdeki 3 saat', 'Saatlik tahminden daha ince, 15 dakikalık yağış tahmini. Open-Meteo\'nun 15 dakikalık modeli kullanılır; konum MET Norway\'in radar tabanlı kısa vade (nowcast) kapsamındaysa (şu an esas olarak kuzey Avrupa) iki kaynağın ortalaması alınır. Mavi dolu çubuk ölçülebilir yağış (≥0,1 mm) demektir. Kısa vadede yağışın başlama zamanı birkaç on dakika sapabilir; tutarlılık için yine de yukarıdaki güven değerine bak.<br><br><b>Not:</b> Kuzey Avrupa dışında 15 dakikalık veri radardan değil, hava modellerinden türetilir. Radar kullanan servisler (Google gibi) yağış başlangıcında farklı çıkabilir.'];


/* ===== Uyarılar: önümüzdeki 24 saat + 0-3 saat yağış başlangıcı ===== */
function renderAlerts() {
  const box = $('alertBox'); if (!box || !hours.length) return;
  const H = hours.slice(nowIdx, nowIdx + 24), A = [];
  const at = h => (h === H[0] ? 'şu an' : pad(h.hh) + ':00 civarı');
  const firstOf = fn => H.find(fn);
  let h;
  if ((h = firstOf(x => x.code >= 95 || ((x.cape || 0) >= 2500 && ((x.precip || 0) >= 0.1 || (x.pop || 0) >= 30))))) A.push(['bolt', 'warn', 'Gök gürültülü fırtına riski', at(h)]);
  if ((h = firstOf(x => (x.precip || 0) >= 4))) A.push(['rain', 'warn', 'Şiddetli yağış (' + h.precip.toFixed(1) + ' mm/sa)', at(h)]);
  if (NOW && NOW.startMin != null && NOW.startMin <= 90) A.push(['umbrella', 'info', 'Yağış başlıyor', '~' + NOW.startMin + ' dk içinde']);
  else if (NOW && NOW.wetNow) A.push(['umbrella', 'info', 'Şu an yağış var', 'kısa vade verisine göre']);
  if ((h = firstOf(x => (x.gust || 0) >= PREFS.gust))) A.push(['wind', 'warn', 'Kuvvetli rüzgâr hamlesi (' + Math.round(h.gust) + ' km/h)', at(h)]);
  if ((h = firstOf(x => x.temp != null && x.temp >= PREFS.hot))) A.push(['thermo', 'warn', 'Aşırı sıcak (' + Math.round(h.temp) + '°C)', at(h)]);
  if ((h = firstOf(x => x.temp != null && x.temp <= PREFS.cold))) A.push(['snow', 'info', (PREFS.cold <= 0 ? 'Donma riski' : 'Soğuk uyarısı') + ' (' + Math.round(h.temp) + '°C)', at(h)]);
  if ((h = firstOf(x => x.vis != null && x.vis < 1000))) A.push(['fog', 'info', 'Sis, görüş 1 km altı', at(h)]);
  const shown = A.slice(0, 4);
  box.innerHTML = shown.map(a => '<div class="alert-item ' + a[1] + '"><span class="ico" style="--s:26px">' + ico(a[0]) + '</span><b>' + a[2] + '</b><span class="alert-when">' + a[3] + '</span></div>').join('');
  notifyAlerts(shown);
  try { radarFollow(); memTick(); if ($('panel-detail').classList.contains('active')) { rtLoad(); mtLoad(); } } catch (e) {}
  const base = 'Mikro-Klima Kontrol Merkezi';
  document.title = (A.some(a => a[1] === 'warn') ? '⚠ ' : '') + base;
}


/* ===== Bildirimler (sayfa açıkken; sekme arka planda olabilir) ===== */
const NK = 'mk_notif', NSENT = 'mk_notif_sent';
let notifOn = false;
try { notifOn = localStorage.getItem(NK) === '1' && 'Notification' in window && Notification.permission === 'granted'; } catch (e) {}
function paintNotif() { const b = $('btnNotif'); if (b) { b.classList.toggle('on', notifOn); b.title = notifOn ? 'Bildirimler açık' : 'Bildirimleri aç'; b.setAttribute('aria-pressed', notifOn ? 'true' : 'false'); const s = $('notifState'); if (s) s.textContent = notifOn ? 'Açık' : 'Kapalı'; } }
async function showNote(title, body, tag, strong) {
  const opt = { body, tag, icon: 'icon.png', badge: 'badge.png', vibrate: strong ? [250, 120, 250, 120, 500] : [150, 80, 150], requireInteraction: !!strong, renotify: false };
  try {
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
    if (reg && reg.showNotification) { await reg.showNotification(title, opt); return true; }
  } catch (e) {}
  try { new Notification(title, opt); return true; } catch (e) { return false; }
}
async function toggleNotif() {
  if (!('Notification' in window)) return alert("Bu tarayıcı bildirim desteklemiyor (iPhone'da önce sayfayı Ana Ekran'a ekle).");
  if (!window.isSecureContext) return alert("Bildirim için sayfa https veya localhost üzerinden açılmalı.");
  if (notifOn) { notifOn = false; try { localStorage.setItem(NK, '0'); } catch (e) {} paintNotif(); return; }
  let p = Notification.permission;
  if (p === 'default') p = await Notification.requestPermission();
  if (p !== 'granted') return alert("Bildirim izni verilmedi. Tarayıcının site ayarlarından izin verebilirsin.");
  notifOn = true; try { localStorage.setItem(NK, '1'); } catch (e) {}
  paintNotif();
  showNote('🔔 Bildirimler açık', 'Fırtına, şiddetli yağış, kuvvetli rüzgâr, sıcak/soğuk ve yağış başlangıcı için veri bildirimi gelir. Sayfa arka planda da olsa açık kalmalı. 23:00-07:00 arası sadece fırtına.', 'test');
}
function notifyAlerts(A) {
  if (!notifOn || !('Notification' in window) || Notification.permission !== 'granted') return;
  let sent = {}; try { sent = JSON.parse(localStorage.getItem(NSENT)) || {}; } catch (e) {}
  const now = Date.now(), hr = +hkOf(now).slice(11, 13), quiet = hr >= 23 || hr < 7;
  const loc = savedLocations[$('locationSelect').selectedIndex];
  A.forEach(a => {
    const storm = a[2].indexOf('Gök gürültülü') === 0;
    if (!(a[1] === 'warn' || a[2] === 'Yağış başlıyor')) return;
    if (quiet && !storm) return;
    const key = (loc ? loc.name : '') + '|' + a[2].replace(/\s*\(.*$/, '');
    if (sent[key] && now - sent[key] < 6 * 3600e3) return;
    sent[key] = now;
    const EM = [['Gök gürültülü', '⛈️'], ['Şiddetli yağış', '🌧️'], ['Yağış başlıyor', '🌦️'], ['Kuvvetli rüzgâr', '💨'], ['Aşırı sıcak', '🔥'], ['Donma', '🧊'], ['Sis', '🌫️']];
    const em = (EM.find(e => a[2].indexOf(e[0]) === 0) || ['', '⚠️'])[1];
    showNote(em + ' ' + a[2], (loc ? loc.name + ' · ' : '') + a[3], key, storm);
  });
  Object.keys(sent).forEach(k => { if (now - sent[k] > 24 * 3600e3) delete sent[k]; });
  try { localStorage.setItem(NSENT, JSON.stringify(sent)); } catch (e) {}
}

/* ===== v3: özet kartı, notlar, 7 günlük bakış, ölçüm grafiği, konum listesi ===== */
function renderHero() {
  const h = (sharedPresentation ? win()[activeHourIndex] : null) || hours[nowIdx] || hours[0]; if (!h) return;
  const d = days.find(x => x.date === h.date);
  $('heroIcon').innerHTML = ico(vizIcon(h));
  $('heroTemp').textContent = fmt(h.temp, 0, '°');
  $('heroDesc').textContent = WMO[h.code] || '—';
  const i0 = hours.indexOf(h), s0 = i0 < 0 ? (nowIdx || 0) : i0;
  $('sadeLine').textContent = sadeText(hours.slice(s0, s0 + 12).map(x => ({ hh: x.t.slice(11, 13), pop: x.pop, precip: x.precip })));
  $('heroFeels').textContent = 'Hissedilen ' + fmt(h.feels, 0, '°');
  const range = d ? 'En yüksek ' + Math.round(d.tmax) + '° · en düşük ' + Math.round(d.tmin) + '°' : '';
  $('heroHiLo').textContent = sharedPresentation
    ? h.date.slice(8, 10) + '.' + h.date.slice(5, 7) + '.' + h.date.slice(0, 4) + ' · ' + pad(h.hh) + ':00' + (range ? ' · ' + range : '')
    : range;
  const st = [['Nem', fmt(h.hum, 0, '%')], ['Rüzgâr', fmt(h.wind, 0, ' km/h')], ['UV', fmt(h.uv, 1)], ['Basınç', fmt(h.press, 0, ' hPa')]];
  document.body.classList.remove('first-load');
  $('heroStats').innerHTML = st.map(x => '<div><div class="quick-item-title">' + x[0] + '</div><div class="quick-item-val">' + x[1] + '</div></div>').join('');
}
function openDay(i) { setMode('daily'); selectDay(i); showTab('today'); }
function renderOutlook() {
  const box = $('outlook'); if (!box || !days.length) return;
  const D = days.slice(0, 7);
  const lo = Math.min.apply(null, D.map(d => d.tmin)), hi = Math.max.apply(null, D.map(d => d.tmax)), span = Math.max(1, hi - lo);
  box.innerHTML = D.map((d, i) => {
    const l = (d.tmin - lo) / span * 100, w = Math.max(6, (d.tmax - d.tmin) / span * 100);
    return '<button type="button" class="out-row" data-act="openDay" data-arg="' + i + '" aria-label="' + dLabel(i) + ' gününü aç">' +
      '<span class="out-day">' + dLabel(i) + '</span><span class="ico" style="--s:30px">' + ico(vizIcon(Object.assign({}, d.peak, { day: 1 }))) + '</span>' +
      '<span class="out-t">' + Math.round(d.tmin) + '°</span><span class="out-bar"><span style="left:' + l + '%;width:' + w + '%"></span></span><span class="out-t">' + Math.round(d.tmax) + '°</span>' +
      '<span class="out-r">' + d.rain.toFixed(1) + ' mm</span></button>';
  }).join('');
}

let metricChart = null, metricKey = 'temp';
const METRICS = [
  { k: 'temp', n: 'Sıcaklık', u: '°C', d: 1, f: h => h.temp },
  { k: 'feels', n: 'Hissedilen', u: '°C', d: 1, f: h => h.feels },
  { k: 'hum', n: 'Nem', u: '%', d: 0, f: h => h.hum, min: 0, max: 100 },
  { k: 'pop', n: 'Yağış ihtimali', u: '%', d: 0, f: h => h.pop, min: 0, max: 100, bar: true },
  { k: 'wind', n: 'Rüzgâr', u: ' km/h', d: 0, f: h => h.wind, n2: 'Hamle', f2: h => h.gust },
  { k: 'press', n: 'Basınç', u: ' hPa', d: 0, f: h => h.press },
  { k: 'cloud', n: 'Bulut', u: '%', d: 0, f: h => h.cloud, min: 0, max: 100 },
  { k: 'uv', n: 'UV', u: '', d: 1, f: h => h.uv, min: 0 }
];
function paintMetricChips() {
  $('metricChips').innerHTML = METRICS.map(m => '<button type="button" class="chip' + (m.k === metricKey ? ' active' : '') + '" data-act="setMetric" data-arg="' + m.k + '">' + m.n + '</button>').join('');
}
function setMetric(k) { metricKey = k; paintMetricChips(); if (hours.length) renderMetric(win()); }
function renderMetric(w) {
  const cv = $('metricChart'); if (!cv || typeof Chart === 'undefined' || !w || !w.length) return;
  const m = METRICS.find(x => x.k === metricKey), t = CHART_THEME[chartKey()];
  const labels = w.map(h => pad(h.hh) + ':00');
  const num = (f, h) => { const v = f(h); return (v == null || isNaN(v)) ? null : +(+v).toFixed(m.d); };
  const vals = w.map(h => num(m.f, h));
  const ds = [{ label: m.n + (m.u ? ' (' + m.u.trim() + ')' : ''), data: vals, type: m.bar ? 'bar' : 'line', borderColor: m.bar ? t.barB : t.line, backgroundColor: m.bar ? t.bar : t.pt,
    borderWidth: m.bar ? 2 : 4, borderRadius: 6, tension: .35, spanGaps: true,
    pointRadius: w.map((_, i) => i === activeHourIndex ? 6 : 2.5), pointBackgroundColor: t.pt, pointBorderColor: t.ptB, pointBorderWidth: 2 }];
  if (m.f2) ds.push({ label: m.n2 + ' (' + m.u.trim() + ')', data: w.map(h => num(m.f2, h)), type: 'line', borderColor: t.y, borderDash: [6, 4], borderWidth: 2.5, tension: .35, pointRadius: 0, spanGaps: true });
  if (metricChart) { metricChart.destroy(); metricChart = null; }
  Chart.defaults.font.family = '"Patrick Hand","Chalkboard SE","Comic Sans MS",sans-serif';
  const sc = { x: { ticks: { color: t.tick, maxTicksLimit: 8, font: { size: 11 } }, grid: { color: t.grid, borderDash: [5, 5] } },
    y: { ticks: { color: t.tick, font: { size: 11 } }, grid: { color: t.grid, borderDash: [5, 5] } } };
  if (m.min != null) sc.y.min = m.min; if (m.max != null) sc.y.max = m.max;
  metricChart = new Chart(cv, { data: { labels, datasets: ds },
    options: { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: !!m.f2, labels: { color: t.leg, boxWidth: 12, font: { size: 12 } } } },
      onClick: (e, els) => { if (els.length) selectHour(els[0].index); }, scales: sc } });
  const nn = vals.map((v, i) => [v, i]).filter(a => a[0] != null);
  if (nn.length) {
    const mx = nn.reduce((a, b) => b[0] > a[0] ? b : a), mn = nn.reduce((a, b) => b[0] < a[0] ? b : a), av = nn.reduce((q, a) => q + a[0], 0) / nn.length;
    $('metricNote').innerHTML = 'En yüksek <b>' + mx[0] + m.u + '</b> (' + labels[mx[1]] + ') · en düşük <b>' + mn[0] + m.u + '</b> (' + labels[mn[1]] + ') · ortalama <b>' + av.toFixed(m.d) + m.u + '</b>';
  } else $('metricNote').textContent = 'Bu ölçüm için veri yok.';
}
paintMetricChips();

function renderLocList() {
  const box = $('locList'); if (!box) return;
  const cur = $('locationSelect').selectedIndex;
  box.innerHTML = savedLocations.map((l, i) => '<button type="button" class="loc-item' + (i === cur ? ' active' : '') + '" data-act="pickLoc" data-arg="' + i + '"' + (i === cur ? ' aria-current="true"' : '') + '>' +
    '<span class="ico" style="--s:22px">' + ico('pin') + '</span><span class="loc-name">' + escHtml(l.name) + '</span>' +
    '<span class="loc-meta">' + (l.alt !== '' && l.alt != null ? escHtml(l.alt) + ' m' : '') + '</span>' + (i === cur ? '<span class="state">Seçili</span>' : '') + '</button>').join('');
}
function pickLoc(i) {
  const sel = $('locationSelect'); if (sel.selectedIndex === i) return showTab('today');
  sel.selectedIndex = i; sel.dispatchEvent(new Event('change')); renderLocList(); showTab('today');
}
function renderMeta() {
  const b = $('metaBox'); if (!b || !rawApiData) return;
  const l = savedLocations[$('locationSelect').selectedIndex] || {};
  const coordinates = sharedCoordinatesHidden ? '' : '<br>Koordinat: <b>' + (+l.lat).toFixed(4) + ', ' + (+l.lon).toFixed(4) + '</b>';
  b.innerHTML = 'Son güncelleme: <b>' + (lastOk || '--') + '</b>' + coordinates + '<br>Model yüksekliği: <b>' + fmt(rawApiData.elevation, 0, ' m') + '</b>' +
    (l.alt ? '<br>Girilen rakım: <b>' + escHtml(l.alt) + ' m</b>' : '');
}
$('locationSelect').addEventListener('change', renderLocList);
$('btnRefresh2').addEventListener('click', () => fetchWeatherData());


/* ===== Gece / gündüz teması ===== */
const CHART_THEME = {
  cl_light: { bar:'#7dd3fc', barB:'#0284c7', line:'#f43f5e', pt:'#ffffff', ptB:'#f43f5e', leg:'#475569', tick:'#475569', y:'#0284c7', y1:'#e11d48', grid:'#33415522' },
  cl_dark:  { bar:'#38bdf8', barB:'#0ea5e9', line:'#fb7185', pt:'#1e293b', ptB:'#fb7185', leg:'#94a3b8', tick:'#94a3b8', y:'#38bdf8', y1:'#fb7185', grid:'#94a3b822' },
  light: { bar:'#b5dff5', barB:'#4a3426', line:'#f29cb9', pt:'#fff1b8', ptB:'#4a3426', leg:'#8b7262', tick:'#8b7262', y:'#4a97c4', y1:'#d9779b', grid:'#4a342622' },
  dark:  { bar:'#8fc3e6', barB:'#f3e8d4', line:'#ffb8d0', pt:'#ffe69a', ptB:'#f3e8d4', leg:'#b6abc9', tick:'#b6abc9', y:'#9fd3f0', y1:'#ffb8d0', grid:'#f3e8d424' }
};
const curTheme = () => document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
const SKINS = ['sade', 'classic', 'pastel'];   // sade = varsayılan, klasik ve çizgi film (pastel) Ayarlar'dan seçilir
const curSkin = () => { const s = document.documentElement.getAttribute('data-skin'); return SKINS.indexOf(s) >= 0 ? s : 'sade'; };
const chartKey = () => (curSkin() === 'pastel' ? '' : 'cl_') + curTheme();
function applyChartTheme() {
  const c = chartInstance; if (!c) return; const t = CHART_THEME[chartKey()];
  const b = c.data.datasets[0], l = c.data.datasets[1], sc = c.options.scales;
  b.backgroundColor = t.bar; b.borderColor = t.barB;
  l.borderColor = t.line; l.backgroundColor = t.pt; l.pointBorderColor = t.ptB; l.pointBackgroundColor = t.pt;
  c.options.plugins.legend.labels.color = t.leg;
  sc.x.ticks.color = t.tick; sc.x.grid.color = t.grid; sc.y.ticks.color = t.y; sc.y.grid.color = t.grid; sc.y1.ticks.color = t.y1;
  c.update();
}
function setTheme(t, save) {
  document.documentElement.setAttribute('data-theme', t);
  if (save) { try { localStorage.setItem('mk_theme', t); } catch (e) {} document.documentElement.setAttribute('data-theme-mode', t); }
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = curSkin() !== 'pastel' ? (t === 'dark' ? '#0f172a' : '#f1f5f9') : (t === 'dark' ? '#1e1a2e' : '#fdf1dc');
  applyChartTheme();
  if (hours.length) { try { renderMetric(win()); } catch (e) {} }
}
/* Renk modu: açık / koyu / sistem (sistem: cihazın ayarını izler, değişirse kendiliğinden döner) */
const themeMode = () => { const m = document.documentElement.getAttribute('data-theme-mode'); return m === 'light' || m === 'dark' ? m : 'system'; };
const sysDark = () => !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
function setThemeMode(mode, save) {
  if (mode === 'light' || mode === 'dark') { setTheme(mode, !!save); document.documentElement.setAttribute('data-theme-mode', mode); }
  else {
    document.documentElement.setAttribute('data-theme-mode', 'system');
    if (save) { try { localStorage.removeItem('mk_theme'); } catch (e) {} }
    setTheme(sysDark() ? 'dark' : 'light', false);
  }
  renderPicker();
}
try { const mq = matchMedia('(prefers-color-scheme: dark)'), on = e => { if (themeMode() === 'system') setTheme(e.matches ? 'dark' : 'light', false); }; mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on); } catch (e) {}
$('btnNotif').addEventListener('click', toggleNotif);

/* ===== Görünüm seçici (Vitrin kartları): karta dokun, açıklamayı oku, Uygula / Kapat ===== */
const MODE_CARDS = [
  ['light', 'Açık', '<span class="vt-mode"><span class="vt-mock light"><i></i><i class="s"></i><em></em></span></span>', 'Her zaman açık renkli arka plan. Gün ışığında ve dışarıda okumak için en rahatı.'],
  ['dark', 'Koyu', '<span class="vt-mode"><span class="vt-mock dark"><i></i><i class="s"></i><em></em></span></span>', 'Koyu arka plan: geceleri gözü yormaz, OLED ekranlarda pil tasarrufu sağlar.'],
  ['system', 'Sistem', '<span class="vt-mode"><span class="vt-mock sys"><i></i><i class="s"></i><em></em></span></span>', 'Telefonunun ya da bilgisayarının ayarına uyar. Cihaz geceleri koyuya geçince uygulama da geçer.']
];
const SKIN_CARDS = [
  ['sade', 'Sade', '<span class="vt-sk sade"><span class="t">24°</span><span class="p"></span><span class="l"></span></span>', 'Büyük sıcaklık, tek cümlelik özet, az ayrıntı. Yeni başlayanlar için önerilen görünüm; Kaynaklar sekmesi gizlenir.'],
  ['classic', 'Klasik', '<span class="vt-sk classic"><span class="t">24°</span><span class="l"></span><span class="l"></span><span class="r"><span></span><span></span><span></span></span></span>', 'Kartlı, düzenli ve eksiksiz görünüm. Tüm sekmeler ve ayrıntılar açık: kaynak karşılaştırması dahil.'],
  ['pastel', 'Çizgi film', '<span class="vt-sk pastel"><span class="t">24°</span><span class="l"></span><span class="r"><span></span><span></span><span></span></span></span>', 'El çizimi kenarlıklar, pastel renkler ve oyuncu bir yazı tipi. Hava durumuna biraz neşe katar.']
];
function renderPicker() {
  const V = window.MKVitrin, mb = $('modeShelf'), sb = $('skinShelf'); if (!V || !mb || !sb) return;
  mb.textContent = ''; sb.textContent = '';
  const curM = themeMode(), curS = curSkin();
  const mk = (box, list, cur, kind, apply) => list.forEach((c, i) => {
    const sel = c[0] === cur;
    box.appendChild(V.card({
      art: c[2], cls: sel ? 'sel' : '', delay: i * .4, label: c[1] + (sel ? ', seçili' : ''), tag: sel ? { kind: 'ok', text: c[1], sm: true } : { kind: 'text', text: c[1], sm: true },
      onClick: () => V.open({
        art: c[2], title: c[1], desc: c[3], wide: false,
        chips: [kind + (sel ? ': şu an seçili' : '')],
        primary: sel ? { label: 'Seçili', disabled: true } : { label: 'Uygula', fn: () => { apply(c[0]); track('gorunum/' + c[0], 'Görünüm: ' + c[1]); } }
      })
    }));
  });
  mk(mb, MODE_CARDS, curM, 'Renk modu', m => setThemeMode(m, true));
  mk(sb, SKIN_CARDS, curS, 'Tema', k => setSkin(k, true));
}

function setSkin(s, save) {
  s = SKINS.indexOf(s) >= 0 ? s : 'sade';
  document.documentElement.setAttribute('data-skin', s);
  if (save) { try { localStorage.setItem('mk_skin', s); } catch (e) {} }
  document.querySelectorAll('[data-act="setSkin"]').forEach(b => { const on = b.dataset.arg === s; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  const more = $('detailMoreTxt'); if (more) { if (!more.dataset.orig) more.dataset.orig = more.textContent; more.textContent = s === 'sade' ? 'Ayrıntıları gör →' : more.dataset.orig; }
  setTheme(curTheme(), false);
  try { if (hours.length) renderHero(); } catch (e) {}
  try { renderPicker(); } catch (e) {}
}

document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.hour-chip,.day-chip')) { e.preventDefault(); e.target.click(); } });
/* ===== Forevye stüdyo sayfası ===== */
function openStudio() { $('studioPage').classList.add('show'); $('studioPage').scrollTop = 0; document.body.style.overflow = 'hidden'; $('studioBack').focus(); }
function fillPrefs() {
  $('prefFont').value = PREFS.fs; $('prefTab').value = PREFS.tab; $('prefRef').value = PREFS.ref;
  $('prefHot').value = PREFS.hot; $('prefCold').value = PREFS.cold; $('prefGust').value = PREFS.gust;
}
function readNum(id, key) {
  const v = parseFloat($(id).value.trim().replace(',', '.'));
  PREFS = sanePrefs(Object.assign({}, PREFS, { [key]: isFinite(v) ? v : NaN }));
  savePrefs(); fillPrefs(); if (hours.length) renderAlerts();
}
$('prefFont').addEventListener('change', e => { PREFS.fs = +e.target.value; savePrefs(); applyFont(); });
$('prefTab').addEventListener('change', e => { PREFS.tab = e.target.value; savePrefs(); });
$('prefRef').addEventListener('change', e => { PREFS.ref = +e.target.value; savePrefs(); scheduleRefresh(); });
$('prefHot').addEventListener('change', () => readNum('prefHot', 'hot'));
$('prefCold').addEventListener('change', () => readNum('prefCold', 'cold'));
$('prefGust').addEventListener('change', () => readNum('prefGust', 'gust'));
$('btnBackup').addEventListener('click', async () => {
  const txt = JSON.stringify({ mk: 1, locs: savedLocations, prefs: PREFS, theme: curTheme(), mode: themeMode(), skin: curSkin(), kr: window.MKKristal ? MKKristal.exportData() : undefined });
  try { await navigator.clipboard.writeText(txt); alert('Yedek kopyalandı.'); }
  catch (e) { prompt('Kopyalama izni yok. Bu metni elle kopyala:', txt); }
});
$('btnRestore').addEventListener('click', () => {
  const t = prompt('Yedek metnini yapıştır:'); if (!t) return;
  try {
    const o = JSON.parse(t);
    const L = (o.locs || []).filter(l => l && l.name && isFinite(parseFloat(l.lat)) && isFinite(parseFloat(l.lon)));
    if (!L.length) throw new Error('konum yok');
    savedLocations = L.map(l => ({ name: String(l.name), lat: String(l.lat), lon: String(l.lon), alt: l.alt == null ? '' : String(l.alt) }));
    safeStore(); PREFS = sanePrefs(o.prefs); savePrefs(); applyFont(); fillPrefs(); scheduleRefresh();
    if (o.mode === 'system') setThemeMode('system', true);
    else if (o.theme === 'dark' || o.theme === 'light') setTheme(o.theme, true);
    if (SKINS.indexOf(o.skin) >= 0) setSkin(o.skin, true);
    initLocations(0); fetchWeatherData();
    if (o.kr && window.MKKristal) MKKristal.importData(o.kr);
    alert('Yedek yüklendi.');
  } catch (e) { alert('Yedek okunamadı.'); }
});
fillPrefs();
function closeStudio() { $('studioPage').classList.remove('show'); document.body.style.overflow = ''; }
$('btnFaq').addEventListener('click', openFaq); $('faqBack').addEventListener('click', closeFaq);
function openFaq() { $('faqPage').classList.add('show'); $('faqPage').scrollTop = 0; document.body.style.overflow = 'hidden'; $('faqBack').focus(); }
function closeFaq() { $('faqPage').classList.remove('show'); document.body.style.overflow = ''; $('btnFaq').focus(); }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('faqPage').classList.contains('show')) closeFaq(); });
$('btnStudio').addEventListener('click', openStudio);
$('btnCredit').addEventListener('click', openStudio);
$('studioBack').addEventListener('click', closeStudio);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('studioPage').classList.contains('show')) closeStudio(); });

/* ===== Radar (RainViewer + Leaflet, sadece açılınca yüklenir) ===== */
let RM = null, RL = [], RF = [], RI = 0, RT = null, RMK = null, RLOC = '';
const curLoc = () => savedLocations[$('locationSelect').selectedIndex] || savedLocations[0];
const loadScript = u => new Promise((ok, no) => { const e = document.createElement('script'); e.src = u; e.onload = ok; e.onerror = no; document.head.appendChild(e); });
function radarShow(i) {
  RI = i; RL.forEach((l, k) => l.setOpacity(k === i ? 0.75 : 0));
  $('radarSlide').value = i;
  $('radarTime').textContent = new Date(RF[i].time * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}
function radarToggle() {
  if (RT) { clearInterval(RT); RT = null; $('radarPlay').textContent = '▶'; return; }
  $('radarPlay').textContent = '⏸';
  RT = setInterval(() => radarShow((RI + 1) % RF.length), 700);
}
function radarFollow() {
  if (!RM) return;
  const l = curLoc(), k = l.lat + ',' + l.lon; if (k === RLOC) return;
  RLOC = k; const ll = [parseFloat(l.lat), parseFloat(l.lon)]; RM.setView(ll, RM.getZoom()); RMK.setLatLng(ll);
}
async function radarOpen() {
  const msg = $('radarMsg'); msg.textContent = 'yükleniyor…';
  try {
    if (!window.L) {
      const c = document.createElement('link'); c.rel = 'stylesheet'; c.href = 'lib/leaflet.css'; document.head.appendChild(c);
      await loadScript('lib/leaflet.js');
    }
    const r = await qf('https://api.rainviewer.com/public/weather-maps.json'); if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json(); RF = (j.radar && j.radar.past) || []; if (!RF.length) throw new Error('veri yok');
    const l = curLoc(), ll = [parseFloat(l.lat), parseFloat(l.lon)]; RLOC = l.lat + ',' + l.lon;
    $('radarMap').style.display = 'block'; $('radarCtl').hidden = false; $('radarBtn').style.display = 'none';
    if (!RM) {
      RM = L.map('radarMap').setView(ll, 7);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 10, attribution: '© OpenStreetMap' }).addTo(RM);
      RMK = L.circleMarker(ll, { radius: 6, color: '#c0392b', fillOpacity: 0.9 }).addTo(RM);
    }
    RL.forEach(x => RM.removeLayer(x));
    RL = RF.map(f => L.tileLayer(j.host + f.path + '/256/{z}/{x}/{y}/2/1_1.png', { opacity: 0, maxNativeZoom: 7, maxZoom: 10, zIndex: 5 }).addTo(RM));
    const sl = $('radarSlide'); sl.max = RF.length - 1; sl.oninput = () => { if (RT) radarToggle(); radarShow(+sl.value); };
    radarShow(RF.length - 1); if (!RT) radarToggle();
    msg.textContent = ''; setTimeout(() => RM.invalidateSize(), 100);
  } catch (e) { msg.textContent = 'radar alınamadı'; }
}

/* ===== Yağış zamanlaması: ücretsiz, anahtarsız (çoklu model + radar yaklaşma tahmini) ===== */
const RTM = { icon_seamless: 'ICON', ecmwf_ifs025: 'ECMWF', gfs_seamless: 'GFS', meteofrance_seamless: 'Météo-France', gem_seamless: 'GEM' };
let rtT = 0, rtK = '', rtBusy = false;
const rtHH = (t, off) => String(new Date((t + off) * 1000).getUTCHours()).padStart(2, '0') + ':00';
async function rtRadar(lat, lon) {
  const j = await (await qf('https://api.rainviewer.com/public/weather-maps.json')).json();
  const F = (j.radar && j.radar.past) || []; if (F.length < 4) return '';
  const z = 7, n = 2 ** z, rad = lat * Math.PI / 180;
  const fx = (lon + 180) / 360 * n, fy = (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * n;
  const tx = Math.floor(fx), ty = Math.floor(fy), cx = (fx - tx) * 256 + 256, cy = (fy - ty) * 256 + 256;
  const mpp = 156543.03 * Math.cos(rad) / n / 1000; // km/piksel
  const dist = async f => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 768; const g = cv.getContext('2d', { willReadFrequently: true });
    await Promise.all([-1, 0, 1].flatMap(dy => [-1, 0, 1].map(dx => new Promise(ok => {
      const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { g.drawImage(im, (dx + 1) * 256, (dy + 1) * 256); ok(); }; im.onerror = ok;
      im.src = j.host + f.path + '/256/' + z + '/' + (tx + dx) + '/' + (ty + dy) + '/2/1_1.png';
    }))));
    const d = g.getImageData(0, 0, 768, 768).data; let best = 1e9;
    for (let y = 0; y < 768; y += 2) for (let x = 0; x < 768; x += 2) if (d[(y * 768 + x) * 4 + 3] > 60) { const r = Math.hypot(x - cx, y - cy); if (r < best) best = r; }
    return best >= 1e9 ? best : best * mpp;
  };
  const d0 = await dist(F[F.length - 1]), d1 = await dist(F[F.length - 4]); // son kare ve 30 dk öncesi
  if (d0 < 3) return 'Konumun üstünde şu an radar yağış ekosu var.';
  if (d0 >= 1e9) return 'Çevrede (~250 km) radar yağış göstermiyor.';
  const v = (d1 - d0) / 0.5; // km/sa, + = yaklaşıyor
  if (d1 < 1e9 && v > 6) { const eta = Math.round(d0 / v * 60); return 'En yakın radar ekosu ~' + Math.round(d0) + ' km uzakta, yaklaşıyor (~' + Math.round(v) + ' km/sa)' + (eta <= 180 ? ', tahmini varış ~' + eta + ' dk (kaba hesap).' : '.'); }
  if (d1 >= 1e9 || v > 6) return 'En yakın radar ekosu ~' + Math.round(d0) + ' km uzakta, yaklaşıyor.';
  if (v < -6) return 'En yakın radar ekosu ~' + Math.round(d0) + ' km uzakta ve uzaklaşıyor.';
  return 'En yakın radar ekosu ~' + Math.round(d0) + ' km uzakta, hareketi belirgin değil.';
}
async function rtLoad(force) {
  const box = $('rtBody'); if (!box || rtBusy) return;
  const l = curLoc(), k = l.lat + ',' + l.lon;
  if (!force && k === rtK && Date.now() - rtT < 20 * 60e3) return;
  rtBusy = true; rtK = k; rtT = Date.now();
  let html = '';
  try {
    const w = await (await qf('https://api.open-meteo.com/v1/forecast?latitude=' + l.lat + '&longitude=' + l.lon + '&hourly=precipitation&models=' + Object.keys(RTM).join(',') + '&forecast_days=2&timeformat=unixtime&timezone=auto')).json();
    const T = w.hourly.time, off = w.utc_offset_seconds || 0, now = Date.now() / 1000, starts = []; let tot = 0, rows = '';
    for (const m in RTM) {
      const P = w.hourly['precipitation_' + m]; if (!P) continue; const r = rtWhen(T, P, now); if (!r) continue; tot++;
      let t = 'kuru';
      if (r.s >= 0) { starts.push(r.st); t = (r.s === 0 ? 'şu an yağışlı' : rtHH(r.st, off) + ' başlıyor') + (r.et ? ', ' + rtHH(r.et, off) + ' bitiyor' : ', 12 saat sürüyor'); }
      rows += '<div>' + RTM[m] + ': ' + t + '</div>';
    }
    starts.sort((a, b) => a - b);
    html = tot ? '<b>' + starts.length + '/' + tot + ' model</b> önümüzdeki 12 saatte yağış öngörüyor' + (starts.length ? ' (ortanca başlangıç ' + (starts[Math.floor(starts.length / 2)] <= now ? 'şimdi' : rtHH(starts[Math.floor(starts.length / 2)], off)) + ')' : '') + '.' + rows : 'Model verisi alınamadı.';
  } catch (e) { html = 'Model verisi alınamadı.'; }
  box.innerHTML = html + '<div style="margin-top:6px">Radar bilgisi alınıyor…</div>';
  let rd = ''; try { rd = await rtRadar(parseFloat(l.lat), parseFloat(l.lon)); } catch (e) {}
  box.innerHTML = html + (rd ? '<div style="margin-top:6px"><b>Radar:</b> ' + rd + '</div>' : '');
  rtBusy = false;
}

/* ===== Kendi doğruluk belleğim: tahmin kaydet, gerçekleşenle kıyasla, ağırlığı öğren ===== */
const MK = 'mk_mem', MKON = 'mk_memon';
let MEM = null, memBusy = false;
function memOn() { try { return localStorage.getItem(MKON) !== '0'; } catch (e) { return true; } }
function memLoad() { if (MEM) return MEM; try { MEM = JSON.parse(localStorage.getItem(MK)); } catch (e) {} if (!MEM || !MEM.locs) MEM = { locs: {} }; return MEM; }
function memSave() { lsQ(MK, () => JSON.stringify(MEM)); }
function memLoc() { const l = curLoc(), k = (+l.lat).toFixed(2) + ',' + (+l.lon).toFixed(2), M = memLoad(); return M.locs[k] || (M.locs[k] = { pend: [], st: {}, rec: 0, ver: 0, name: l.name }); }
function memSt() { try { return memOn() ? memLoc().st : {}; } catch (e) { return {}; } }
function memFactor(kind, key) {
  const S = memSt(), st = S[key]; if (!st || st.n < 40) return 1;
  const ks = Object.keys(S).filter(k => S[k].n >= 20); if (ks.length < 2) return 1;
  let f, a;
  if (kind === 't') { const mae = k => S[k].ae / S[k].n, ref = MEAN(ks.map(mae)); f = Math.pow((ref + 0.4) / (mae(key) + 0.4), 2); a = Math.min(1, st.n / 300); }
  else {
    const ev = k => S[k].h + S[k].mi + S[k].fa, kk = ks.filter(k => ev(k) >= 8); if (ev(key) < 8 || kk.length < 2) return 1;
    const csi = k => S[k].h / ev(k), ref = MEAN(kk.map(csi)); f = Math.pow((csi(key) + 0.15) / (ref + 0.15), 2); a = Math.min(1, ev(key) / 25);
  }
  return Math.max(0.5, Math.min(2, 1 + a * (f - 1)));
}
function memBias(key) { const st = memSt()[key]; return st && st.n >= 40 ? { b: Math.max(-3, Math.min(3, st.e / st.n)), a: Math.min(1, st.n / 300) } : null; }
function memRecord() {
  const L = memLoc(), now = Date.now(); if (now - L.rec < 55 * 60e3 || !hours.length || !hours[nowIdx]) return;
  const ents = [6, 24].map(lead => {
    const h = hours[nowIdx + lead]; if (!h || !h.rows) return null; const m = {};
    h.rows.forEach(r => { if (r.v.temp != null || r.v.precip != null) m[r.s.key] = [r.v.temp, r.v.precip]; });
    return Object.keys(m).length >= 3 ? { k: h.t.slice(0, 13), L: lead, u: Math.floor(now / 3600e3) * 3600 + lead * 3600, m } : null;
  }).filter(Boolean);
  if (!ents.length) return;
  L.pend = L.pend.concat(ents).slice(-150); L.rec = now; L.name = curLoc().name; memSave();
}
async function memVerify() {
  const L = memLoc(), nk = hours[nowIdx] && hours[nowIdx].t.slice(0, 13);
  if (!nk || memBusy || Date.now() - L.ver < 30 * 60e3 || !L.pend.some(e => e.k < nk)) return;
  memBusy = true; L.ver = Date.now();
  try {
    await mtFetch(); const l = curLoc(), mb0 = mtNear(l, MT), mb = mtOk(l, mb0) ? mb0 : null, j = await (await qf('https://api.open-meteo.com/v1/forecast?latitude=' + l.lat + '&longitude=' + l.lon + '&hourly=temperature_2m,precipitation&past_days=3&forecast_days=1&timezone=auto')).json();
    const tr = {}; j.hourly.time.forEach((t, i) => { tr[t.slice(0, 13)] = [j.hourly.temperature_2m[i], j.hourly.precipitation[i]]; });
    const minK = j.hourly.time[0].slice(0, 13);
    L.pend.filter(e => e.k < nk && tr[e.k] && tr[e.k][0] != null).forEach(e => {
      let T = tr[e.k]; const mv = mb && e.u ? mtTemp(mb, l, e.u) : null; L.tm = L.tm || { m: 0, a: 0 };
      if (mv != null) { T = [mv, T[1]]; L.tm.m++; } else L.tm.a++;
      for (const key in e.m) {
        const f = e.m[key], s = L.st[key] || (L.st[key] = { n: 0, ae: 0, e: 0, h: 0, mi: 0, fa: 0 });
        for (const q in s) s[q] *= 0.997;
        if (f[0] != null) { s.n++; s.ae += Math.abs(f[0] - T[0]); s.e += f[0] - T[0]; }
        if (f[1] != null && T[1] != null) { const fw = f[1] >= 0.1, tw = T[1] >= 0.1; if (fw && tw) s.h++; else if (tw) s.mi++; else if (fw) s.fa++; }
      }
    });
    L.pend = L.pend.filter(e => e.k >= nk || (!(tr[e.k] && tr[e.k][0] != null) && e.k >= minK));
    memSave(); memRender(); if (memOn()) scheduleFuse();
  } catch (e) {}
  memBusy = false;
}
function memRender() {
  const b = $('memBox'); if (!b) return;
  const L = memLoc(), S = L.st, ks = Object.keys(S).filter(k => S[k].n >= 1).sort((a, c) => S[a].ae / S[a].n - S[c].ae / S[c].n);
  const nm = {}; MODELS.forEach(m => { nm[m[0]] = m[1]; }); SRC.forEach(s => { nm[s.key] = s.name; });
  const tot = ks.length ? Math.max.apply(null, ks.map(k => S[k].n)) : 0;
  let h = '<div class="src-stats"><b>' + esc(L.name || '') + '</b> · ' + L.pend.length + ' tahmin doğrulama bekliyor · ' + Math.round(tot) + ' saatlik doğrulama' + (L.tm ? ' (gerçek: METAR ' + L.tm.m + ' / analiz ' + L.tm.a + ')' : '') + ' · ' + (tot < 40 ? 'henüz yeterli veri yok, ağırlıklar değişmiyor' : memOn() ? 'ağırlıklara uygulanıyor' : 'kapalı, sadece izleniyor') + '</div>';
  if (ks.length) h += '<div class="src-scroll"><table class="src-table"><tr><th>Kaynak</th><th>Sıc. hata (sapma)</th><th>Yağış CSI</th><th>Ağırlık × (sıc/yağ)</th></tr>' + ks.map(k => {
    const s = S[k], ev = s.h + s.mi + s.fa, e = s.e / s.n;
    return '<tr><td>' + esc(nm[k] || k) + '</td><td>' + (s.ae / s.n).toFixed(1) + '° (' + (e > 0 ? '+' : '') + e.toFixed(1) + ')</td><td>' + (ev >= 8 ? '%' + Math.round(s.h / ev * 100) : '–') + '</td><td>' + memFactor('t', k).toFixed(2) + ' / ' + memFactor('r', k).toFixed(2) + '</td></tr>';
  }).join('') + '</table></div>';
  $('memSw').textContent = memOn() ? 'Açık' : 'Kapalı'; b.innerHTML = h;
}
function memTick() {
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  memRecord(); memVerify(); if ($('panel-sources').classList.contains('active') || $('panel-karne').classList.contains('active')) memRender();
}
function memToggle() { try { localStorage.setItem(MKON, memOn() ? '0' : '1'); } catch (e) {} memRender(); scheduleFuse(); }
function memExport() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(memLoad())], { type: 'application/json' })); a.download = 'mikro-klima-kontrol-merkezi-karne.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
function memClean(o) {
  if (!o || typeof o !== 'object' || !o.locs || typeof o.locs !== 'object' || Array.isArray(o.locs)) throw new Error('şekil');
  const fin = v => typeof v === 'number' && isFinite(v), out = { locs: {} };
  Object.keys(o.locs).slice(0, 50).forEach(k => {
    const l = o.locs[k]; if (!/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(k) || !l || typeof l !== 'object') return;
    const c = { pend: [], st: {}, rec: fin(l.rec) ? l.rec : 0, ver: fin(l.ver) ? l.ver : 0, name: typeof l.name === 'string' ? l.name.slice(0, 80) : '' };
    if (l.tm && fin(l.tm.m) && fin(l.tm.a)) c.tm = { m: l.tm.m, a: l.tm.a };
    (Array.isArray(l.pend) ? l.pend : []).slice(-150).forEach(e => {
      if (!e || typeof e.k !== 'string' || !fin(e.L) || !e.m || typeof e.m !== 'object') return;
      const m = {}; Object.keys(e.m).forEach(s => { const a = e.m[s]; if (Array.isArray(a) && a.every(x => x === null || fin(x))) m[s] = [a[0] == null ? null : a[0], a[1] == null ? null : a[1]]; });
      if (Object.keys(m).length) c.pend.push({ k: e.k.slice(0, 13), L: e.L, u: fin(e.u) ? e.u : 0, m });
    });
    Object.keys(l.st && typeof l.st === 'object' ? l.st : {}).forEach(s => {
      const q = l.st[s], f = ['n', 'ae', 'e', 'h', 'mi', 'fa'];
      if (q && typeof q === 'object' && f.every(x => fin(q[x]))) { c.st[s] = {}; f.forEach(x => { c.st[s][x] = q[x]; }); }
    });
    out.locs[k] = c;
  });
  if (!Object.keys(out.locs).length) throw new Error('boş');
  return out;
}
function memImport(inp) { const f = inp.files[0]; if (!f) return; f.text().then(t => { MEM = memClean(JSON.parse(t)); memSave(); memRender(); scheduleFuse(); }).catch(() => alert('Dosya geçersiz.')); inp.value = ''; }
function memReset() { if (!confirm('Kendi karne belleği silinsin mi?')) return; MEM = { locs: {} }; memSave(); memRender(); scheduleFuse(); }

/* ===== Gerçek ölçüm: en yakın havalimanı METAR (GitHub Actions'ın hazırladığı Türkiye JSON'u) ===== */
const METAR_URL = 'https://raw.githubusercontent.com/MHAForevye/MikroKlimaKontrolMerkezi/metar-data/metar-tr.json';   // örn: 'https://raw.githubusercontent.com/KULLANICI/DEPO/metar-data/metar-tr.json'
let MT = null, MTT = 0;
const kmBetween = (a, b, c, d) => { const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
async function mtFetch() {
  if (!METAR_URL) return null;
  if (MT && Date.now() - MTT < 15 * 60e3) return MT;
  try { const r = await qf(METAR_URL); if (r.ok) { MT = await r.json(); MTT = Date.now(); } } catch (e) {}
  return MT;
}
function mtNear(l, d) {
  if (!d || !d.st) return null; let best = null;
  for (const id in d.st) { const s = d.st[id], km = kmBetween(+l.lat, +l.lon, s.lat, s.lon); if (!best || km < best.km) best = { id, s, km }; }
  return best;
}
/* Karne için uygun mu: 50 km içinde ve rakım farkı en çok 250 m (rakım girilmişse) */
function mtOk(l, b) { const al = parseFloat(l.alt); return !!b && b.km <= 50 && (!isFinite(al) || b.s.el == null || Math.abs(al - b.s.el) <= 250); }
/* Saatin ±30 dk'sındaki ölçümün sıcaklığı, konum rakımına 6,5°C/km ile taşınır */
function mtTemp(b, l, u) {
  let best = null; (b.s.o || []).forEach(o => { const d = Math.abs(o[0] - u); if (d <= 1800 && (!best || d < Math.abs(best[0] - u))) best = o; });
  if (!best || best[1] == null) return null;
  const al = parseFloat(l.alt); return best[1] + (isFinite(al) && b.s.el != null ? 0.0065 * (b.s.el - al) : 0);
}
async function mtLoad() {
  const box = $('mtBody'); if (!box) return;
  if (!METAR_URL) { box.textContent = 'Kurulmadı: METAR_URL boş. GitHub Actions dosyalarını yükleyip adresi koduna yazınca burada en yakın havalimanının gerçek ölçümü görünür.'; return; }
  const d = await mtFetch(), l = curLoc(), b = mtNear(l, d);
  if (!b) { box.textContent = 'METAR verisi alınamadı.'; return; }
  const o = b.s.o[b.s.o.length - 1], ageMin = Math.round((Date.now() / 1000 - o[0]) / 60);
  const hm = new Date(o[0] * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const rn = /RA|DZ|SH|TS|SN/.test(o[6] || '');
  const pr = o[5] ? (o[5] > 200 ? o[5] : o[5] * 33.8639) : null;
  let t = '<b>' + esc(b.s.n || b.id) + ' (' + esc(b.id) + ')</b> · ' + Math.round(b.km) + ' km · ' + hm + (ageMin > 120 ? ' <b>(eski veri)</b>' : '') +
    '<br>' + Math.round(o[1]) + '°C · rüzgâr ' + (o[3] != null ? Math.round(o[3] * 1.852) + ' km/sa' : '--') + (o[4] ? ' (hamle ' + Math.round(o[4] * 1.852) + ')' : '') + (pr ? ' · ' + Math.round(pr) + ' hPa' : '') + (rn ? ' · yağış var' : '');
  try { const h = hours[nowIdx], adj = mtTemp({ s: { o: [o], el: b.s.el } }, l, o[0]); if (h && h.temp != null && adj != null) t += '<br>Sayfa şu an ' + Math.round(h.temp) + '°C diyor, ölçüme göre fark ' + (h.temp - adj > 0 ? '+' : '') + (h.temp - adj).toFixed(1) + '° (rakım düzeltmeli).'; } catch (e) {}
  if (d.upd && Date.now() / 1000 - d.upd > 3 * 3600) t += '<br><b>Uyarı:</b> havalimanı veri dosyası ' + Math.round((Date.now() / 1000 - d.upd) / 3600) + ' saattir güncellenmedi, ölçüm eski olabilir.';
  t += '<br><span style="opacity:.75">' + (mtOk(l, b) ? 'Bu istasyon yakın, kendi karnemde gerçek değer olarak kullanılıyor.' : 'İstasyon uzak ya da rakımı çok farklı; konumunu temsil etmeyebilir, karnede kullanılmıyor.') + '</span>';
  box.innerHTML = t;
}

/* ===== Çevrimdışı uyarı ===== */
const offPaint = () => { const b = $('offBar'); if (b) b.hidden = navigator.onLine; };
window.addEventListener('online', () => { offPaint(); fetchWeatherData(true); });
window.addEventListener('offline', offPaint);
offPaint();

(function () { var m = $('studioMail'); if (!m) return; m.addEventListener('click', function (e) { if (m.dataset.on) return; e.preventDefault(); var a = ['mustafahakansunum', 'gmail.com'].join('@'); m.href = 'mailto:' + a; m.textContent = a; m.dataset.on = '1'; }); })();
paintIcons();
paintNotif();
/* ===== Olay dağıtıcısı: HTML'de onclick yok (CSP satır içi betiği engeller). Düğmeye data-act ile işlem adını, gerekirse data-arg ile değeri yaz ve işlemi aşağıdaki ACT tablosuna ekle. ===== */
const ACT = {
  shareCurrentView: () => shareCurrentView(),
  setMode: a => setMode(a),
  showTab: a => showTab(a),
  radarOpen: () => radarOpen(),
  radarToggle: () => radarToggle(),
  rtLoad: () => rtLoad(true),
  memToggle: () => memToggle(),
  memExport: () => memExport(),
  memFile: () => $('memFile').click(),
  memReset: () => memReset(),
  selectDay: a => selectDay(+a),
  selectHour: a => selectHour(+a),
  openDay: a => openDay(+a),
  setMetric: a => setMetric(a),
  pickLoc: a => pickLoc(+a),
  setSkin: a => setSkin(a, true),
  openStore: () => { if (window.MKKristal) MKKristal.openStore(); },
  kartOpen: () => { if (window.MKKart) MKKart.open(); }
};
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('[data-act]');
  const fn = el && ACT[el.dataset.act];
  if (fn) fn(el.dataset.arg);
});
document.addEventListener('keydown', e => {   // sekmeler: ← → Home End ile gezinme (ARIA tab deseni)
  const cur = e.target.closest && e.target.closest('.tabbar [role="tab"]');
  if (!cur || ['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) < 0) return;
  const tabs = Array.from(document.querySelectorAll('.tabbar [role="tab"]')).filter(x => getComputedStyle(x).display !== 'none');
  let i = tabs.indexOf(cur); if (i < 0) return;
  i = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  e.preventDefault(); tabs[i].focus(); tabs[i].click();
});
(function () { const f = $('memFile'); if (f) f.addEventListener('change', () => memImport(f)); })();

try { if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
setSkin(curSkin(), false);

async function shareCurrentView() {
  const sel = $('locationSelect');
  const selectedHour = win()[activeHourIndex];
  if (!sel || !sel.value || !selectedHour) return;

  const selectedLoc = savedLocations[sel.selectedIndex];
  const url = new URL(window.location.href);
  url.search = '';
  const locationBytes = new TextEncoder().encode(JSON.stringify([
    selectedLoc.lat,
    selectedLoc.lon,
    selectedLoc.name
  ]));
  let locationData = '';
  locationBytes.forEach(byte => { locationData += String.fromCharCode(byte); });
  url.searchParams.set('p', btoa(locationData).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
  url.searchParams.set('view', 'share');
  url.searchParams.set('time', selectedHour.t);
  url.searchParams.set('mode', currentMode);
  const activeTab = TABS.find(tab => $('panel-' + tab).classList.contains('active')) || 'today';
  url.searchParams.set('tab', activeTab);

  const timeText = selectedHour.date + ' ' + pad(selectedHour.hh) + ':00';
  const shareData = {
    title: 'Mikro-Klima Kontrol Merkezi: ' + selectedLoc.name,
    text: selectedLoc.name + ', ' + timeText + ' hava durumu:',
    url: url.toString()
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url.toString());
      alert('Paylaşım bağlantısı panoya kopyalandı!');
    } else {
      window.prompt('Paylaşım bağlantısını kopyalayın:', url.toString());
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Paylaşım hatası:', err);
      window.prompt('Paylaşım bağlantısını kopyalayın:', url.toString());
    }
  }
}

function readSharedView() {
  const params = new URLSearchParams(window.location.search);
  let lat = params.get('lat'), lon = params.get('lon');
  let name = params.get('name');

  if ((!lat || !lon) && params.has('p')) {
    try {
      const base64 = params.get('p').replace(/-/g, '+').replace(/_/g, '/');
      const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      [lat, lon, name] = JSON.parse(new TextDecoder().decode(bytes));
    } catch (err) {
      console.error('Paylaşım bağlantısındaki konum okunamadı:', err);
    }
  }

  if ((!lat || !lon) && params.has('loc')) {
    const parts = params.get('loc').split(',');
    lat = parts[0];
    lon = parts[1];
    name = parts.slice(2).join(',');
    try { name = decodeURIComponent(name); } catch (e) {}
  }

  let city = false;
  if ((!lat || !lon) && params.has('yer')) {   // şehir sayfalarından gelen bağlantı: ?yer=enlem,boylam,Ad
    const parts = params.get('yer').split(',');
    lat = parts[0]; lon = parts[1]; name = parts.slice(2).join(',').slice(0, 60); city = true;
  }
  let locIndex = -1;
  const latitude = Number(lat), longitude = Number(lon);
  if (lat !== null && lon !== null && isFinite(latitude) && isFinite(longitude) &&
      Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
    locIndex = savedLocations.findIndex(l =>
      Math.abs(parseFloat(l.lat) - latitude) < 0.01 && Math.abs(parseFloat(l.lon) - longitude) < 0.01);
    if (locIndex === -1) {
      savedLocations.unshift({
        name: name || 'Paylaşılan Konum',
        lat: String(latitude),
        lon: String(longitude),
        alt: ''
      });
      locIndex = 0;
      if (city) safeStore();   // şehir sayfasından gelen konum kayıtlı konumlara eklenir
    }
  }

  const day = params.has('d') ? Number(params.get('d')) : null;
  const hour = params.has('h') ? Number(params.get('h')) : null;
  const mode = params.get('mode');
  return {
    locIndex, city,
    isShared: params.get('view') === 'share' || params.has('p') || params.has('loc') || params.has('lat') || params.has('lon'),
    time: params.get('time'),
    mode: mode === 'daily' ? 'daily' : 'hourly',
    tab: TABS.includes(params.get('tab')) ? params.get('tab') : null,
    day: Number.isInteger(day) ? day : null,
    hour: Number.isInteger(hour) ? hour : null
  };
}

function applySharedView(shared) {
  if (!hours.length || !days.length) return false;

  if (shared.time) {
    const target = hours.findIndex(h => h.t === shared.time);
    if (target < 0) return false;
    const dayIndex = days.findIndex(d => d.date === hours[target].date);
    if (dayIndex < 0) return false;

    if (shared.mode === 'daily' || target < nowIdx || target >= nowIdx + 24) {
      setMode('daily');
      selectDay(dayIndex);
      const hourIndex = win().findIndex(h => h.t === hours[target].t);
      if (hourIndex < 0) return false;
      selectHour(hourIndex);
    } else {
      setMode('hourly');
      selectHour(target - nowIdx);
    }
    return true;
  }

  if (shared.day !== null || shared.hour !== null) {
    const dayIndex = shared.day === null ? 0 : shared.day;
    if (dayIndex < 0 || dayIndex >= days.length) return false;
    setMode('daily');
    selectDay(dayIndex);
    if (shared.hour !== null) {
      const hourCount = win().length;
      if (shared.hour < 0 || shared.hour >= hourCount) return false;
      selectHour(shared.hour);
    }
  }
  return true;
}

const sharedView = readSharedView();
sharedPresentation = sharedView.isShared;
sharedCoordinatesHidden = sharedView.locIndex >= 0 && !sharedView.city;
document.body.classList.toggle('share-presentation', sharedPresentation);
let selName = null;
try { selName = localStorage.getItem(SELK); } catch (e) {}
const initialLocIndex = sharedView.locIndex >= 0
  ? sharedView.locIndex
  : Math.max(0, savedLocations.findIndex(l => l.name === selName));
initLocations(initialLocIndex);
if (sharedPresentation) {
  $('sharedHeading').hidden = false;
  $('sharedLocationName').textContent = savedLocations[initialLocIndex]?.name || 'Hava durumu';
}

$('btnDelLoc').addEventListener('click', () => {
  if (savedLocations.length <= 1) return alert("Son konum silinemez.");
  const i = $('locationSelect').selectedIndex;
  if (!confirm("'" + savedLocations[i].name + "' silinsin mi?")) return;
  savedLocations.splice(i, 1);
  safeStore();
  initLocations(0);
  fetchWeatherData();
});
let lastTab = 'today'; try { lastTab = localStorage.getItem('mk_tab') || 'today'; } catch (e) {}
if (PREFS.tab !== 'last') lastTab = PREFS.tab;
if (sharedPresentation) lastTab = 'today';
showTab(lastTab, false);
fetchWeatherData().then(() => {
  const restored = applySharedView(sharedView);
  if (sharedPresentation) {
    showTab('today', false);
    $('sharedLocationName').textContent = savedLocations[$('locationSelect').selectedIndex]?.name || 'Hava durumu';
  } else if (sharedView.tab && restored) {
    showTab(sharedView.tab, false);
  }
});
