/* Kristal hesabı (arayüzsüz). Hava uygulaması her açıldığında sunucuya "sync" gider: günlük ödül ve seri sunucuda işlenir,
   kristal Forevye Mağaza'da (ayrı site, forevye-market reposu) harcanır. Aynı hesap iki sitede de kullanılır:
   hesap, "#hesap=ID.ANAHTAR" bağlantısıyla bir siteden ötekine taşınır (js/magaza.js, Mağaza'daki "Hava uygulamasını aç").
   Bakiye, ödül ve satın alma sunucuda hesaplanır; tarayıcıdaki sayıyı değiştirmek hiçbir şeyi değiştirmez. */
(function () {
  'use strict';
  var KEY = 'mk_kristal2', SEEN = 'mk_kristal2_seen', API = 'https://mikroklimakontrolmerkezi.forevye.workers.dev/api';
  var creds = null, S = null, SCFG = null, busy = false, reinit = false, lastSync = 0;

  function loadLocal() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY));
      if (o && /^\d{8}$/.test(String(o.id)) && /^[A-Za-z0-9_-]{20,64}$/.test(String(o.token))) {
        creds = { id: String(o.id), token: String(o.token) };
        if (o.cache && o.cache.s) { S = o.cache.s; SCFG = o.cache.cfg || null; }
      }
    } catch (e) {}
  }
  function saveLocal() { if (creds) try { localStorage.setItem(KEY, JSON.stringify({ id: creds.id, token: creds.token, cache: { s: S, cfg: SCFG } })); } catch (e) {} }

  function api(path, body) {
    var h = { 'Content-Type': 'application/json' };
    if (creds) h.Authorization = 'Bearer ' + creds.id + '.' + creds.token;
    return fetch(API + path, { method: 'POST', headers: h, body: JSON.stringify(body || {}), cache: 'no-store' }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) { var e = new Error(d.err || 'Sunucu hatası'); e.status = r.status; throw e; }
        return d;
      });
    }, function () { var e = new Error('Sunucuya ulaşılamadı.'); e.net = true; throw e; });
  }

  var toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'k-toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 3800);
  }

  function apply(d) {
    if (d.id && d.token) creds = { id: d.id, token: d.token };
    if (d.s) S = d.s;
    if (d.cfg) SCFG = d.cfg;
    saveLocal();
    if (d.streakBonus > 0) setTimeout(function () { toast('Seri ödülü: +' + d.streakBonus + ' kristal! ' + (S && S.streak ? S.streak.n : '') + '. gün.'); }, 600);
    try { document.dispatchEvent(new CustomEvent('mk:state')); } catch (e) {}
  }
  function sync() {
    if (busy) return Promise.resolve();
    busy = true; lastSync = Date.now();
    var hint = creds && window.MKSeri && MKSeri.localHint ? MKSeri.localHint() : null;
    return api(creds ? '/sync' : '/init', hint ? { hint: hint } : {}).then(apply, function (e) {
      if (e.status === 401 && creds && !reinit) {          // kimlik sunucuda yok: eskisini yedekle, yeni hesap aç
        reinit = true;
        try { localStorage.setItem(KEY + '_old', localStorage.getItem(KEY) || ''); } catch (x) {}
        creds = null; S = null; busy = false;
        return sync();
      }
    }).then(function () { busy = false; }, function () { busy = false; });
  }

  /* ===== Hesap taşıma: Mağaza'dan gelen bağlantı (#hesap=ID.ANAHTAR) ===== */
  function seen() { try { var a = JSON.parse(localStorage.getItem(SEEN)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function markSeen(id) { var a = seen(); if (a.indexOf(id) < 0) { a.push(id); try { localStorage.setItem(SEEN, JSON.stringify(a.slice(-20))); } catch (e) {} } }
  function adopt(c) {
    var cur = creds, curRaw = ''; try { curRaw = localStorage.getItem(KEY) || ''; } catch (e) {}
    creds = c;
    return api('/sync').then(function (d) {
      if (cur && cur.id !== c.id && curRaw) { try { localStorage.setItem(KEY + '_old', curRaw); } catch (e) {} }
      markSeen(c.id); apply(d); toast('Kristal hesabı bağlandı. Bakiye: ' + (S ? S.bal : 0)); return true;
    }, function (e) { creds = cur; toast(e.status === 401 ? 'Bu hesap sunucuda bulunamadı.' : e.message); if (!cur) sync(); return false; });
  }
  function handoff() {
    if (!/(^#|&)hesap=/.test(location.hash)) return false;
    var c = window.MKHesap && MKHesap.parseHash(location.hash);
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}   // anahtar adres çubuğunda kalmasın
    if (!c) { toast('Hesap bağlantısı bozuk.'); return false; }
    if (creds && creds.id === c.id) { markSeen(c.id); return false; }
    if (seen().indexOf(c.id) >= 0) return false;
    if (creds && !confirm('Mağazadaki kristal hesabı (ID ' + c.id + ') bu uygulamaya bağlansın mı? Şu anki hesabın (ID ' + creds.id + (S && S.bal ? ', ' + S.bal + ' kristal' : '') + ') silinmez ama bu cihazda yedeğe alınır.')) { markSeen(c.id); return false; }
    adopt(c); return true;
  }

  function init() {
    loadLocal();
    if (creds) markSeen(creds.id);
    if (!handoff()) sync(); else lastSync = Date.now();
    document.addEventListener('visibilitychange', function () {   // sekme gün değişiminden sonra açılırsa ödül ver
      if (document.visibilityState !== 'visible' || Date.now() - lastSync < 60000) return;
      sync();
    });
  }

  /* Yedek (app.js çağırır): hesap anahtarını taşır, metni gören hesabı açabilir. */
  window.MKKristal = {
    streak: function () { return S && S.streak ? S.streak : null; },
    cfg: function () { return SCFG; },
    exportData: function () { return creds ? { id: creds.id, token: creds.token } : undefined; },
    importData: function (o) {
      var c = window.MKHesap && o ? MKHesap.fromPair(o.id + '.' + o.token) : null;
      if (!c) return Promise.resolve(false);
      return adopt(c);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
