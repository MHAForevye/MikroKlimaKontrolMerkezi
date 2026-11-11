/* Giriş serisi ("seri ateşi"): uygulamayı üst üste kaç gün açtığını sayar, mavi bir alevle gösterir.
   Tamamen yerel (localStorage 'mk_seri'); sunucuya, kristal hesabına ve ödüllere dokunmaz. Hesap mantığı js/core.js (seriNext).
   Baskı yok: kaçırılan gün için uyarı, bildirim ya da otomatik pencere yok. Pencere sadece 3/7/14/30... gün dönüm noktalarında kendiliğinden açılır.
   Ayarlar > Seri ateşi ile tamamen gizlenebilir. */
(function () {
  'use strict';
  var KEY = 'mk_seri', OFF = 'mk_seri_off', MILES = [3, 7, 14, 30, 50, 100, 200, 365];
  var DAYS = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
  var MSG = {
    start: 'İlk gün! Yarın da uğrarsan seri büyür.',
    up: 'Bugün de buradasın. Güzel gidiyor.',
    saved: 'Dün uğrayamadın, kalkanın seriyi korudu.',
    reset: 'Seri yeniden başladı, sorun değil.'
  };
  var $ = function (id) { return document.getElementById(id); };
  var st = null, changed = false, gotShield = false, lastFocus = null, timer = 0;

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
  function isOff() { try { return localStorage.getItem(OFF) === '1'; } catch (e) { return false; } }
  function setOff(v) { try { localStorage.setItem(OFF, v ? '1' : '0'); } catch (e) {} }
  function dayName(s) { return DAYS[(seriDayNum(s) + 4) % 7]; }   // 1970-01-01 Perşembe

  function tick() {
    var r = seriNext(load(), todayStr());
    st = r.st; changed = r.ev !== 'same'; gotShield = r.gotShield;
    if (changed) save();
    return r;
  }

  function paint() {
    var off = isOff(), b = $('btnSeri');
    if (!b || !st) return;
    b.hidden = off;
    $('seriN').textContent = st.n;
    b.setAttribute('aria-label', 'Giriş serisi: ' + st.n + ' gün. Ayrıntı için aç.');
    b.title = st.n + ' günlük seri';
    var t = $('seriToggle');
    if (t) { t.classList.toggle('off', off); t.setAttribute('aria-pressed', off ? 'false' : 'true'); $('seriToggleSt').textContent = off ? 'kapalı' : 'açık'; }
    if (!$('seriOv').hidden) fill();
  }

  function fill() {
    var today = todayStr(), msg = MSG[st.ev] || MSG.up;
    if (st.ev === 'reset' && st.best > 1) msg += ' En uzun serin ' + st.best + ' gün.';
    if (changed && MILES.indexOf(st.n) >= 0 && st.ev !== 'reset') msg = st.n + ' gün üst üste! ' + msg;
    if (gotShield) msg += ' Kalkan kazandın.';
    $('seriBig').innerHTML = flame('');
    $('seriNum').textContent = st.n;
    $('seriTtl').textContent = 'günlük seri';
    $('seriMsg').textContent = msg;
    var w = '';
    for (var i = 6; i >= 0; i--) {
      var d = seriAddDays(today, -i), on = st.h.indexOf(d) >= 0;
      w += '<div class="seri-d' + (on ? ' on' : '') + (i === 0 ? ' today' : '') + '"><b>' + dayName(d) + '</b><i></i><span class="seri-sr">' + (on ? 'girdin' : 'girmedin') + '</span></div>';
    }
    $('seriWeek').innerHTML = w;
    $('seriStats').textContent = 'En uzun serin: ' + st.best + ' gün. ' + (st.shield
      ? 'Kalkanın hazır: bir gün uğramasan da seri korunur.'
      : 'Her 7. günde bir kalkan kazanırsın; kalkan bir gün uğramasan da seriyi korur.') + ' Her giriş günü Mağaza\'da kristal birikir.';
  }

  function trap(e) {
    if ($('seriOv').hidden) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    var f = $('seriOv').querySelectorAll('button:not([hidden])'); if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }
  function open() {
    if (!st) return;
    lastFocus = document.activeElement;
    fill(); $('seriOv').hidden = false; document.body.style.overflow = 'hidden'; $('seriClose').focus();
  }
  function close() {
    $('seriOv').hidden = true; document.body.style.overflow = '';
    changed = false; gotShield = false;   // dönüm noktası mesajı bir kez gösterilir
    if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus();
  }
  function busy() { return !!document.querySelector('.studio-page.show, .info-sheet.show') || document.body.classList.contains('share-presentation'); }

  function init() {
    if (!$('btnSeri') || !$('seriOv')) return;
    $('seriFlame').innerHTML = flame('');
    $('seriMini').innerHTML = flame('');
    tick(); paint();
    if (changed && !isOff()) {
      $('btnSeri').classList.add('pop');
      if (MILES.indexOf(st.n) >= 0 && st.ev !== 'reset') timer = setTimeout(function () { if (!busy()) open(); }, 1200);
    }
    $('btnSeri').addEventListener('click', open);
    $('seriClose').addEventListener('click', close);
    $('seriOv').addEventListener('click', function (e) { if (e.target === this) close(); });
    $('seriStore').addEventListener('click', function () {
      lastFocus = null; close();
      var s = $('btnStore'); if (s) s.click();
    });
    document.addEventListener('keydown', trap);
    $('seriToggle').addEventListener('click', function () { setOff(!isOff()); paint(); });
    document.addEventListener('visibilitychange', function () {   // sekme gece yarısından sonra tekrar açılırsa yeni gün say
      if (document.visibilityState !== 'visible' || !$('seriOv').hidden) return;
      var old = st.last; tick(); paint();
      if (st.last !== old && !isOff()) { $('btnSeri').classList.remove('pop'); void $('btnSeri').offsetWidth; $('btnSeri').classList.add('pop'); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
