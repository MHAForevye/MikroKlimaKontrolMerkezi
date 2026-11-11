/* Seri ateşi: uygulamayı üst üste kaç gün açtığını sayar ve Mağaza sayfasında hafif animasyonlu mavi bir alevle gösterir.
   Tamamen yerel (localStorage 'mk_seri'); sunucuya, kristal hesabına ve ödüllere dokunmaz. Hesap mantığı js/core.js (seriNext).
   Bilerek baskısız: pencere, bildirim, uyarı ya da "seri bozuldu" dili yok. Sadece olumlu şeyler gösterilir.
   (core.js'teki kalkan sessizce çalışır: tek gün kaçırılırsa seri korunur, bunu ekrana yazmayız.) */
(function () {
  'use strict';
  var KEY = 'mk_seri';
  var DAYS = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
  var MSG = { start: 'İlk gün, hoş geldin!', up: 'Bugün de buradasın.', saved: 'Bugün de buradasın.', reset: 'Tekrar hoş geldin!' };
  var $ = function (id) { return document.getElementById(id); };
  var st = null, changed = false;

  function flame(cls) {
    return '<svg class="flame ' + (cls || '') + '" viewBox="0 0 32 40" aria-hidden="true" focusable="false">' +
      '<path class="fl-o" d="M16 2C17 9 26 13 26 25C26 33 21 38 16 38C11 38 6 33 6 25C6 20 9 17 10 12C12 15 13 17 14 17C14 11 14 6 16 2Z"/>' +
      '<path class="fl-m" d="M16 16C17 21 22 23 22 29C22 33.5 19.5 36 16 36C12.5 36 10 33.5 10 29C10 25 13 24 13.5 20C14.5 21 15.5 21 16 16Z"/>' +
      '<path class="fl-c" d="M16 26C17 29 19 30 19 32.5C19 34.5 17.7 35.5 16 35.5C14.3 35.5 13 34.5 13 32.5C13 30 15 29 16 26Z"/>' +
      '<circle class="sp sp1" cx="10" cy="14" r="1.3"/><circle class="sp sp2" cx="23" cy="18" r="1.1"/></svg>';
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function dayName(s) { return DAYS[(seriDayNum(s) + 4) % 7]; }   // 1970-01-01 Perşembe

  function tick() {
    var r = seriNext(load(), todayStr());
    st = r.st; changed = r.ev !== 'same';
    if (changed) save();
  }

  function paint() {
    if (!st || !$('seriCard')) return;
    var today = todayStr(), w = '';
    $('seriBig').innerHTML = flame('');
    $('seriNum').textContent = st.n;
    $('seriMsg').textContent = MSG[st.ev] || MSG.up;
    for (var i = 6; i >= 0; i--) {
      var d = seriAddDays(today, -i), on = st.h.indexOf(d) >= 0;
      w += '<div class="seri-d' + (on ? ' on' : '') + (i === 0 ? ' today' : '') + '"><b>' + dayName(d) + '</b><i></i><span class="seri-sr">' + (on ? 'girdin' : 'girmedin') + '</span></div>';
    }
    $('seriWeek').innerHTML = w;
    $('seriStats').textContent = 'En uzun serin: ' + st.best + ' gün. Siteyi her açtığın gün Mağaza\'da kristal birikir.';
    var b = $('seriSt');   // Ayarlar > Mağaza düğmesinde küçük alev + gün sayısı
    if (b) { b.hidden = false; b.innerHTML = '<span class="flame-mini">' + flame('') + '</span>' + st.n + ' gün'; }
    if (changed) { $('seriBig').classList.remove('pop'); void $('seriBig').offsetWidth; $('seriBig').classList.add('pop'); }
  }

  function init() {
    tick(); paint();
    var s = $('btnStore');
    if (s) s.addEventListener('click', function () { if (st) { changed = true; paint(); changed = false; } });   // alev, Mağaza her açıldığında küçük bir "pop" yapar
    document.addEventListener('visibilitychange', function () {   // sekme gece yarısından sonra tekrar açılırsa yeni gün say
      if (document.visibilityState === 'visible') { tick(); paint(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
