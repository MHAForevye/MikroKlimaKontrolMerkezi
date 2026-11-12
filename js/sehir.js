/* Şehir sayfaları: şu anki sıcaklığı Open-Meteo'dan çeker (sunucuya hiçbir şey gönderilmez). Başarısız olursa metin olduğu gibi kalır. */
(function () {
  var box = document.getElementById('live'); if (!box) return;
  var W = { 0: 'Açık', 1: 'Çoğunlukla açık', 2: 'Parçalı bulutlu', 3: 'Kapalı', 45: 'Sis', 48: 'Kırağılı sis', 51: 'Hafif çise', 53: 'Çise', 55: 'Yoğun çise', 56: 'Dondurucu çise', 57: 'Dondurucu çise', 61: 'Hafif yağmur', 63: 'Yağmur', 65: 'Şiddetli yağmur', 66: 'Dondurucu yağmur', 67: 'Dondurucu yağmur', 71: 'Hafif kar', 73: 'Kar', 75: 'Yoğun kar', 77: 'Kar taneleri', 80: 'Hafif sağanak', 81: 'Sağanak', 82: 'Şiddetli sağanak', 85: 'Kar sağanağı', 86: 'Kar sağanağı', 95: 'Gök gürültülü fırtına', 96: 'Dolulu fırtına', 99: 'Dolulu fırtına' };
  var lat = parseFloat(box.getAttribute('data-lat')), lon = parseFloat(box.getAttribute('data-lon'));
  if (!isFinite(lat) || !isFinite(lon)) return;
  fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,weather_code&timezone=auto')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d || !d.current || typeof d.current.temperature_2m !== 'number') throw 0;
      document.getElementById('liveT').textContent = Math.round(d.current.temperature_2m) + '°';
      document.getElementById('liveD').textContent = W[d.current.weather_code] || 'Güncel hava';
    })
    .catch(function () { document.getElementById('liveD').textContent = 'Canlı veri alınamadı; tahmini uygulamada aç.'; });
})();
