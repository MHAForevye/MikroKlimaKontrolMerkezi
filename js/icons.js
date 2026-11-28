/* SVG ikon seti. Emoji yok, dış dosya yok.
   - Hava durumu glifleri (48x48, renkli, düz): sun, moon, partly, cloud, fog, rain, snow, storm. Renkler css/style.css içindeki .w* sınıflarından gelir (açık/koyu temaya uyar).
   - Arayüz ikonları (24x24, tek çizgi kalınlığı, currentColor): bulundukları yerin yazı rengini alır.
   Kullanım: <span class="ico" data-ico="pin"></span>  ya da  ico('pin')  → svg dizesi. Yeni ikon eklemek için UI veya WX tablosuna ekle. */
const CP = 'M14 37h20a7.5 7.5 0 0 0 0-15 10.5 10.5 0 0 0-20-2.2A8.8 8.8 0 0 0 14 37z';
const WX = {
  sun: '<circle class="ws" cx="24" cy="24" r="9.5"/><path class="wsr" d="M24 5.5v5M24 37.5v5M5.5 24h5M37.5 24h5M10.9 10.9l3.5 3.5M33.6 33.6l3.5 3.5M37.1 10.9l-3.5 3.5M14.4 33.6l-3.5 3.5"/>',
  moon: '<path class="wm" d="M29.5 6.5A17.5 17.5 0 1 0 41.5 31 14.5 14.5 0 0 1 29.5 6.5z"/><circle class="wms" cx="37" cy="12" r="1.6"/><circle class="wms" cx="41.5" cy="19" r="1.1"/>',
  partly: '<circle class="ws" cx="17" cy="17" r="7.5"/><path class="wsr" d="M17 3.5v3M3.5 17h3M7.5 7.5l2.1 2.1M26.5 7.5l-2.1 2.1" stroke-width="3"/><path class="wc" d="' + CP + '" transform="translate(2 1)"/>',
  cloud: '<path class="wc" d="' + CP + '" transform="translate(0 -1)"/>',
  fog: '<path class="wc" d="' + CP + '" transform="translate(0 -5)"/><path class="wf" d="M8 36h32M13 42h22"/>',
  rain: '<path class="wc wcd" d="' + CP + '" transform="translate(0 -6)"/><path class="wr" d="M16.5 36l-2.2 5.5M25 36l-2.2 5.5M33.5 36l-2.2 5.5"/>',
  snow: '<path class="wc wcd" d="' + CP + '" transform="translate(0 -6)"/><circle class="wsn" cx="16" cy="38" r="2.4"/><circle class="wsn" cx="25" cy="42" r="2.4"/><circle class="wsn" cx="34" cy="38" r="2.4"/>',
  storm: '<path class="wc wcd" d="' + CP + '" transform="translate(0 -7)"/><path class="wb" d="M26.5 28l-7 10.5h5l-2.5 8 10-12.5h-6z"/>'
};
const UI = {
  pin: '<path d="M12 21.5s7-6.2 7-11.8A7 7 0 0 0 5 9.7c0 5.6 7 11.8 7 11.8z"/><circle cx="12" cy="9.7" r="2.5"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 4.5V9h-4.5"/>',
  share: '<path d="M12 15V3.5"/><path d="M8 7.5l4-4 4 4"/><path d="M6 11.5H5.5A1.5 1.5 0 0 0 4 13v6a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-6a1.5 1.5 0 0 0-1.5-1.5H18"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.8"/><path d="M12 17h.01"/>',
  faq: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.8"/><path d="M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.6h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  gauge: '<path d="M4.6 17.5a8.5 8.5 0 1 1 14.8 0"/><path d="M12 13.2l3.6-3.8"/><circle cx="12" cy="13.5" r="1" fill="currentColor"/>',
  eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
  sources: '<path d="M12 3.5l8.5 4.3-8.5 4.3-8.5-4.3L12 3.5z"/><path d="M3.5 12l8.5 4.3 8.5-4.3"/><path d="M3.5 16.2l8.5 4.3 8.5-4.3"/>',
  settings: '<path d="M4 7h9M17.5 7H20M4 17h3M11.5 17H20"/><circle cx="15.2" cy="7" r="2.2"/><circle cx="9.2" cy="17" r="2.2"/>',
  detail: '<path d="M5.5 20V11M12 20V4.5M18.5 20v-6.5"/>',
  chart: '<path d="M3.5 3.5v16a1 1 0 0 0 1 1h16"/><path d="M7.5 15.5l3.6-4.6 3 2.6 4.6-6"/>',
  grid: '<rect x="3.8" y="3.8" width="7" height="7" rx="1.8"/><rect x="13.2" y="3.8" width="7" height="7" rx="1.8"/><rect x="3.8" y="13.2" width="7" height="7" rx="1.8"/><rect x="13.2" y="13.2" width="7" height="7" rx="1.8"/>',
  thermo: '<path d="M14 14.6V5.5a2 2 0 0 0-4 0v9.1a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>',
  feels: '<path d="M12 14.6V5.5a2 2 0 0 0-4 0v9.1a4 4 0 1 0 4 0z"/><path d="M16 6.5h4M16 10.5h3M16 14.5h4"/>',
  drop: '<path d="M12 3s6 6.2 6 10.6a6 6 0 0 1-12 0C6 9.2 12 3 12 3z"/>',
  wind: '<path d="M3 9h10.5a2.5 2.5 0 1 0-2.5-2.5"/><path d="M3 13h15a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3 17h6.5"/>',
  gust: '<path d="M3.5 8h7.5M3.5 12h13M3.5 16h6"/><path d="M15 7.5l4 4.5-4 4.5"/>',
  umbrella: '<path d="M3 12.2a9 9 0 0 1 18 0H3z"/><path d="M12 12.2v6.3a2 2 0 0 1-4 0"/><path d="M12 3.2V2.5"/>',
  bolt: '<path d="M13 2.5L4.5 13.5h6.5l-1 8 8.5-11H12l1-8z"/>',
  bell: '<path d="M6 16.5v-5.2a6 6 0 1 1 12 0v5.2l1.8 1.8H4.2L6 16.5z"/><path d="M10 21h4"/>',
  trash: '<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.2 7l.9 12.5a1 1 0 0 0 1 .9h7.8a1 1 0 0 0 1-.9L17.8 7"/><path d="M10 11v5.5M14 11v5.5"/>',
  chevron: '<path d="M9.5 6l6 6-6 6"/>',
  back: '<path d="M14.5 6l-6 6 6 6"/>',
  down: '<path d="M6 9.5l6 6 6-6"/>',
  check: '<path d="M5 12.8l4.4 4.4L19 7.6"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  dots: '<path d="M6 12h.01M12 12h.01M18 12h.01" stroke-width="3"/>',
  play: '<path d="M8 5.2v13.6l11-6.8z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6.5" y="5" width="3.8" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.7" y="5" width="3.8" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
  radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.8"/><path d="M12 12l6.2-5.4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  plane: '<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.7-6.2"/><path d="M3.5 4.5V9H8"/><path d="M12 7.8V12l3 1.8"/>',
  confidence: '<path d="M12 3l7.5 2.8v5.7c0 4.6-3.2 7.8-7.5 9.5-4.3-1.7-7.5-4.9-7.5-9.5V5.8L12 3z"/><path d="M8.8 12l2.2 2.2 4.2-4.4"/>',
  studio: '<path d="M12 3.5l2.3 5.2 5.7.6-4.3 3.8 1.3 5.6L12 15.8l-5 2.9 1.3-5.6L4 9.3l5.7-.6L12 3.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
  auto: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  gem: '<path d="M6.5 3.5h11L22 9.5 12 21 2 9.5l4.5-6z"/><path d="M2 9.5h20"/><path d="M9.5 3.5L8 9.5 12 21l4-11.5-1.5-6"/>',
  snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.1 8.9 4.6 4.6 0 0 0 7 18z"/>'
};
/* ico(ad): arayüz ikonu (çizgi, currentColor). wico(ad): hava durumu glifi (renkli). */
const ico = n => UI[n]
  ? '<svg class="u" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + UI[n] + '</svg>'
  : WX[n] ? wico(n) : '';
const wico = n => '<svg class="w" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' + (WX[n] || WX.cloud) + '</svg>';
