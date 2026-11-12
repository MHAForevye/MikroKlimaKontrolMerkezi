/* Seri ateşi: uygulamayı üst üste kaç gün açtığını sayar ve Karne sekmesinde 12 kademeli alevle gösterir.
   Alev 7, 14, 21... günde renk ve şekil değiştirir (core.js: SERI_TIERS, seriTier). Mağaza'da "Alev koleksiyonu" rafı vardır.
   Sayının kaynağı: kristal sunucusu (7 günde bir +60 kristal oradan verilir). Sunucuya ulaşılamazsa yerel sayım (localStorage 'mk_seri') gösterilir.
   Bilerek baskısız: "seri bozuldu" dili, uyarı ya da pencere yok; tek gün kaçırılırsa kalkan sessizce seriyi korur. */
(function () {
  'use strict';
  var KEY = 'mk_seri', PREF = 'mk_flame';
  var DAYS = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
  var MSG = { start: 'İlk gün, hoş geldin!', up: 'Bugün de buradasın.', saved: 'Bugün de buradasın.', reset: 'Tekrar hoş geldin!' };
  var $ = function (id) { return document.getElementById(id); };
  var st = null, changed = false;

  /* ===== Alev çizimi: kademeye göre renk (CSS değişkenleri) ve şekil ===== */
  var P_O = 'M16 2C17 9 26 13 26 25C26 33 21 38 16 38C11 38 6 33 6 25C6 20 9 17 10 12C12 15 13 17 14 17C14 11 14 6 16 2Z';
  var P_M = 'M16 16C17 21 22 23 22 29C22 33.5 19.5 36 16 36C12.5 36 10 33.5 10 29C10 25 13 24 13.5 20C14.5 21 15.5 21 16 16Z';
  var P_C = 'M16 26C17 29 19 30 19 32.5C19 34.5 17.7 35.5 16 35.5C14.3 35.5 13 34.5 13 32.5C13 30 15 29 16 26Z';
  var P_L = 'M8.5 30C3.5 27 3.5 20 8 14C8.6 18 11 20 11.5 24C10.5 25 9 27 8.5 30Z';
  var P_R = 'M23.5 30C28.5 27 28.5 20 24 14C23.4 18 21 20 20.5 24C21.5 25 23 27 23.5 30Z';
  var P_STAR = 'M0-3.4L.9-.9 3.4 0 .9.9 0 3.4-.9.9-3.4 0-.9-.9Z';
  /* Kıvılcımlar: [cx, cy, r, yana kayma, süre, gecikme]. Kademe arttıkça daha çok kıvılcım uçar. */
  var EMB = [[11, 30, 1.2, -4, 2.6, 0], [21, 28, 1, 5, 3.1, -1.1], [16, 24, 1.1, 1, 2.2, -.5], [8, 24, .9, -6, 3.4, -2], [24, 24, .9, 6, 2.8, -1.7],
             [14, 20, .8, -3, 2.4, -1.4], [19, 18, .8, 3, 3, -.3], [10, 18, .7, -5, 3.6, -2.6], [22, 16, .7, 5, 2.5, -.9], [16, 14, .7, 0, 3.2, -2.2]];
  var uid = 0;
  function flame(tier, cls) {
    tier = Math.max(0, Math.min(11, tier | 0));
    var id = 'flg' + (++uid), side = tier >= 2 ? (tier >= 4 ? 2 : 1) : 0;    // yan dil sayısı
    var h = '<svg class="flame fl-t' + tier + (cls ? ' ' + cls : '') + '" viewBox="-4 -8 40 50" aria-hidden="true" focusable="false">';
    /* Renk geçişleri: alt koyu, uç açık. Renkler CSS değişkenlerinden (.fl-tN) gelir. */
    h += '<defs>' +
      '<linearGradient id="' + id + 'o" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--fo)"/><stop offset=".7" style="stop-color:var(--fo)"/><stop offset="1" style="stop-color:var(--fm)"/></linearGradient>' +
      '<linearGradient id="' + id + 'm" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--fm)"/><stop offset="1" style="stop-color:var(--fc)"/></linearGradient>' +
      '<radialGradient id="' + id + 'c" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#fff"/><stop offset="1" style="stop-color:var(--fc)"/></radialGradient>' +
      '<radialGradient id="' + id + 'a"><stop offset="0" style="stop-color:var(--fm);stop-opacity:.6"/><stop offset=".6" style="stop-color:var(--fo);stop-opacity:.18"/><stop offset="1" style="stop-color:var(--fo);stop-opacity:0"/></radialGradient></defs>';
    h += '<circle class="fl-aura" cx="16" cy="24" r="23" fill="url(#' + id + 'a)"/>';
    if (tier >= 5) {                                                          // yavaş dönen ışık huzmeleri
      h += '<g class="fl-rays">';
      for (var r = 0; r < 8; r++) h += '<path transform="rotate(' + r * 45 + ' 16 24)" d="M16 24L14.4 -2H17.6Z"/>';
      h += '</g>';
    }
    if (tier >= 8) h += '<circle class="fl-halo" cx="16" cy="23" r="19"/>';
    if (side) h += '<path class="fl-s fl-sl" d="' + P_L + '"/>' + (side > 1 ? '<path class="fl-s fl-sr" d="' + P_R + '"/>' : '');
    h += '<path class="fl-o" fill="url(#' + id + 'o)" d="' + P_O + '"/><path class="fl-m" fill="url(#' + id + 'm)" d="' + P_M + '"/><path class="fl-c" fill="url(#' + id + 'c)" d="' + P_C + '"/>';
    h += '<path class="fl-hl" d="M12.6 31C11 27.5 11.4 23.5 13.6 20"/>';      // ince parlama çizgisi
    for (var e = 0, n = Math.min(EMB.length, 4 + Math.floor(tier * .55)); e < n; e++) {
      var m = EMB[e];
      h += '<circle class="emb ' + (e % 2 ? 'e2' : 'e1') + '" cx="' + m[0] + '" cy="' + m[1] + '" r="' + m[2] + '" style="--dx:' + m[3] + 'px;--du:' + m[4] + 's;--dl:' + m[5] + 's"/>';
    }
    if (tier >= 7) {                                                          // alevin etrafında dönen ışıltılar
      h += '<g class="fl-orb">';
      for (var o = 0; o < 4; o++) {
        var ang = o * Math.PI / 2, ox = (16 + Math.cos(ang) * 18).toFixed(1), oy = (22 + Math.sin(ang) * 18).toFixed(1);
        h += tier >= 9 ? '<path class="fl-star" transform="translate(' + ox + ' ' + oy + ')" d="' + P_STAR + '"/>' : '<circle class="fl-dot" cx="' + ox + '" cy="' + oy + '" r="1.2"/>';
      }
      h += '</g>';
    }
    if (tier >= 9) h += '<path class="fl-star st1" transform="translate(4 6)" d="' + P_STAR + '"/><path class="fl-star st2" transform="translate(28 9)" d="' + P_STAR + '"/>';
    if (tier >= 11) h += '<path class="fl-crown" d="M8.5 5L11 8.4 16 0.5 21 8.4 23.5 5 22.4 12H9.6Z"/>';
    return h + '</svg>';
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

  /* Gösterilecek seri: sunucudaki sayı varsa o, yoksa yerel */
  function info() {
    var sv = window.MKKristal && MKKristal.streak ? MKKristal.streak() : null, n, best, last, shield, src;
    if (sv && sv.n > 0) { n = sv.n; best = Math.max(sv.best, sv.n); last = sv.last; shield = sv.shield; src = 'server'; }
    else if (st) { n = st.n; best = st.best; last = st.last; shield = st.shield; src = 'local'; }
    else { n = 1; best = 1; last = todayStr(); shield = 0; src = 'local'; }
    var cfg = window.MKKristal && MKKristal.cfg ? MKKristal.cfg() : null;
    return { n: n, best: best, last: last, shield: shield, src: src, bonus: cfg && cfg.streak ? cfg.streak.bonus : 60, every: cfg && cfg.streak ? cfg.streak.every : 7, ev: st ? st.ev : 'up' };
  }
  function prefGet() { var v; try { v = localStorage.getItem(PREF); } catch (e) {} return /^(\d|1[01])$/.test(v || '') ? +v : 'auto'; }
  function prefSet(v) { try { localStorage.setItem(PREF, String(v)); } catch (e) {} paint(); renderShelf(); }
  function shownTier(i) {
    i = i || info(); var top = seriTier(i.best), want = prefGet();
    return want !== 'auto' && want <= top ? want : seriTier(i.n);
  }

  function paint() {
    var i = info(), tier = shownTier(i), today = todayStr();
    var b = $('seriSt');   // Ayarlar > Mağaza düğmesinde küçük alev + gün sayısı
    if (b) { b.hidden = false; b.innerHTML = '<span class="flame-mini">' + flame(tier) + '</span>' + i.n + ' gün'; }
    var tab = $('seriTabN'); if (tab) tab.textContent = i.n;
    if (!$('seriCard')) return;
    $('seriBig').innerHTML = flame(tier);
    $('seriNum').textContent = i.n;
    $('seriName').textContent = SERI_TIERS[tier].name + (tier < 11 ? ' · sonraki alev ' + seriTierDay(seriTier(i.n) + 1) + '. günde' : '');
    $('seriMsg').textContent = MSG[i.ev] || MSG.up;
    var nx = $('seriNext');   // sıradaki alevin önizlemesi: baskısız, sadece merak uyandırır
    if (nx) {
      if (seriTier(i.n) < 11) {
        var nt = seriTier(i.n) + 1, left = Math.max(1, seriTierDay(nt) - i.n);
        nx.hidden = false; nx.innerHTML = '<span class="seri-next-art">' + flame(nt) + '</span><span><b>Sıradaki: ' + SERI_TIERS[nt].name + '</b><small>' + left + ' gün sonra yanar</small></span>';
      } else nx.hidden = true;
    }
    var into = i.n % i.every === 0 ? i.every : i.n % i.every, nxt = i.n % i.every === 0 ? i.n : seriNextMilestone(i.n);
    $('seriProgBar').style.width = Math.round(into / i.every * 100) + '%';
    $('seriProgTx').textContent = i.n % i.every === 0 && i.n >= i.every ? i.n + '. gün: ' + i.bonus + ' kristal ödülü alındı' : into + '/' + i.every + ' · ' + nxt + '. günde +' + i.bonus + ' kristal';
    var w = '';
    for (var k = 6; k >= 0; k--) {
      var d = seriAddDays(today, -k), run = seriDayDiff(d, i.last), on = run >= 0 && run < i.n;
      w += '<div class="seri-d' + (on ? ' on' : '') + (k === 0 ? ' today' : '') + '"><b>' + dayName(d) + '</b><i></i><span class="seri-sr">' + (on ? 'girdin' : 'girmedin') + '</span></div>';
    }
    $('seriWeek').innerHTML = w;
    $('seriStats').textContent = 'En uzun serin: ' + i.best + ' gün. Siteyi her açtığın gün seri sürer; her ' + i.every + '. günde ' + i.bonus + ' kristal kazanırsın.' + (i.src === 'local' ? ' (Sunucuya ulaşılamadı, yerel sayım gösteriliyor.)' : '');
    if (changed) { $('seriBig').classList.remove('pop'); void $('seriBig').offsetWidth; $('seriBig').classList.add('pop'); }
  }

  /* ===== Mağaza: Alev koleksiyonu rafı ===== */
  function renderShelf() {
    var box = $('flameShelf'); if (!box || !window.MKVitrin) return;
    var i = info(), top = seriTier(i.best), sel = shownTier(i), V = MKVitrin;
    box.textContent = '';
    for (var t = 0; t < 12; t++) (function (t) {
      var open = t <= top, day = seriTierDay(t), nm = SERI_TIERS[t].name;
      box.appendChild(V.card({
        art: flame(t), cap: '', cls: (open ? '' : 'locked ') + (t === sel ? 'sel' : ''), delay: (t % 6) * .35,
        label: nm + (open ? (t === sel ? ', seçili' : ', açık') : ', ' + day + '. günde açılır'),
        badge: open ? '' : 'lock',
        tag: open ? { kind: 'ok', text: t === sel ? 'Seçili' : 'Açık', sm: true } : { kind: 'lock', text: day + '. gün', sm: true },
        onClick: function () {
          var cur = shownTier(info()), auto = prefGet() === 'auto';
          V.open({
            art: flame(t), title: nm, desc: SERI_TIERS[t].info,
            chips: ['Açılış: ' + day + '. gün', 'En uzun serin: ' + info().best + ' gün'].concat(open ? [t === cur ? (auto ? 'Şu an otomatik' : 'Şu an seçili') : 'Açık'] : []),
            note: open ? '' : 'Bu alev, seri ' + day + ' güne ulaşınca açılır. ' + Math.max(0, day - info().n) + ' gün kaldı.',
            primary: open ? (t === cur && !auto ? { label: 'Otomatik yap', cls: 'blue', fn: function () { prefSet('auto'); } } : { label: 'Kullan', fn: function () { prefSet(t); } }) : { label: 'Kilitli', disabled: true }
          });
        }
      }));
    })(t);
  }

  function init() {
    tick(); paint(); renderShelf();
    document.addEventListener('mk:state', function () { paint(); renderShelf(); });
    var s = $('btnStore');
    if (s) s.addEventListener('click', function () { renderShelf(); });
    document.addEventListener('visibilitychange', function () {   // sekme gece yarısından sonra tekrar açılırsa yeni gün say
      if (document.visibilityState === 'visible') { tick(); paint(); }
    });
  }

  window.MKSeri = { flame: flame, info: info, shownTier: shownTier, paint: paint, renderShelf: renderShelf, localHint: function () { return st ? { n: st.n, best: st.best, last: st.last } : null; }, tierName: function (t) { return SERI_TIERS[t].name; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
