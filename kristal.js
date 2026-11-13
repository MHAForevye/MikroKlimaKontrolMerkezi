/* Kristal ödül sistemi: günlük giriş + Mağaza (Astrophoto Cam aktivasyon talebi + Mantar Pano Pro/Sınırsız kodu) + hediye kodu.
   Bakiye, günlük ödül, satın alma ve hediye kodları artık Cloudflare Worker + D1 üzerinde tutulur (worker/index.js).
   Bu dosya sadece sunucuya ister ve sonucu gösterir; tarayıcıdaki sayıyı değiştirmek hiçbir şeyi değiştirmez.
   Fiyatlar ve günlük ödül sunucuda (worker/index.js içindeki CFG). Buradaki değerler sunucu cevap verene kadar gösterilir. */
(function () {
  'use strict';

  var CFG = {
    mail: ['mustafahakansunum', 'gmail.com'],    // app.js'teki gibi parçalı yazılır (botlar toplamasın)
    app: 'Astrophoto Cam',
    key: 'mk_kristal2',                           // artık sadece ID + gizli anahtar + son bilinen durum
    oldKey: 'mk_kristal',
    owner: 'llbha0uxr6'                           // gizli kelimenin özeti: sadece yönetici bölümünü AÇAR, yetki vermez (yetki sunucuda ADMIN_TOKEN)
  };
  var SCFG = { daily: 30, streak: { every: 7, bonus: 60 }, packs: [{ name: '3 Günlük Paket', short: '3 günlük', cost: 500 }, { name: '7 Günlük Paket (Haftalık)', short: '7 günlük', cost: 1000 }], mantar: { days: 7, tiers: [{ id: 'pro', name: 'Mantar Pano Pro', short: 'Pro', cost: 120 }, { id: 'unl', name: 'Mantar Pano Sınırsız', short: 'Sınırsız', cost: 250 }] } };

  var $ = function (id) { return document.getElementById(id); };
  var timerT = 0, S = blank(), creds = null, todayS = '', offline = false, busy = false, lastSync = 0, reinit = false, madeList = [], lastNo = '';

  function blank() { return { id: '--------', bal: 0, earned: 0, gift: 0, spent: 0, days: 0, first: '', last: '', cam: '', pending: '', reqs: [], codes: [], passes: [], streak: { n: 0, best: 0, shield: 0, paid: 0, last: '' } }; }
  function norm(s) {
    var b = blank(); for (var k in b) if (s && s[k] !== undefined && s[k] !== null) b[k] = s[k];
    if (!Array.isArray(b.reqs)) b.reqs = []; if (!Array.isArray(b.codes)) b.codes = []; if (!Array.isArray(b.passes)) b.passes = [];
    if (!b.streak || typeof b.streak !== 'object') b.streak = blank().streak;
    return b;
  }

  /* ===== Yerel kayıt: sadece kimlik + son bilinen durum (çevrimdışı gösterim için) ===== */
  function loadLocal() {
    try {
      var o = JSON.parse(localStorage.getItem(CFG.key));
      if (o && /^\d{8}$/.test(String(o.id)) && /^[A-Za-z0-9_-]{20,64}$/.test(String(o.token))) {
        creds = { id: String(o.id), token: String(o.token) };
        if (o.cache && o.cache.s) { S = norm(o.cache.s); if (o.cache.cfg) SCFG = o.cache.cfg; }
      }
    } catch (e) {}
  }
  function saveLocal(cfg) {
    if (!creds) return;
    try { localStorage.setItem(CFG.key, JSON.stringify({ id: creds.id, token: creds.token, cache: { s: S, cfg: cfg || SCFG } })); } catch (e) {}
  }

  /* ===== Sunucu ===== */
  function api(path, body, admin) {
    var h = { 'Content-Type': 'application/json' };
    if (creds) h.Authorization = 'Bearer ' + creds.id + '.' + creds.token;
    if (admin) h['X-MK-Admin'] = admin;
    return fetch('https://mikroklimakontrolmerkezi.forevye.workers.dev/api' + path, { method: 'POST', headers: h, body: JSON.stringify(body || {}), cache: 'no-store' }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) { var e = new Error(d.err || 'Sunucu hatası'); e.status = r.status; e.data = d; throw e; }
        return d;
      });
    }, function () { var e = new Error('Sunucuya ulaşılamadı. İnterneti kontrol et.'); e.net = true; throw e; });
  }
  function apply(d) {
    if (d.id && d.token) creds = { id: d.id, token: d.token };
    if (d.s) S = norm(d.s);
    if (d.cfg) SCFG = d.cfg;
    if (d.today) todayS = d.today;
    offline = false; saveLocal(d.cfg);
    if (d.streakBonus > 0) setTimeout(function () { toast('Seri ödülü: +' + d.streakBonus + ' kristal! ' + S.streak.n + '. gün.'); }, 600);
    try { document.dispatchEvent(new CustomEvent('mk:state')); } catch (e) {}
  }
  function sync() {
    if (busy) return Promise.resolve();
    busy = true; lastSync = Date.now();
    return api(creds ? '/sync' : '/init', creds && window.MKSeri && MKSeri.localHint() ? { hint: MKSeri.localHint() } : {}).then(function (d) { apply(d); render(); }, function (e) {
      if (e.status === 401 && creds && !reinit) {      // kimlik sunucuda yok: eskisini yedekle, yeni hesap aç
        reinit = true;
        try { localStorage.setItem(CFG.key + '_old', localStorage.getItem(CFG.key) || ''); } catch (x) {}
        creds = null; S = blank(); busy = false;
        setTimeout(function () { toast('Hesabın sunucuda bulunamadı, yeni hesap açılıyor. Eskisini Mağaza sayfasından geri yükleyebilirsin.'); }, 400);
        return sync();
      }
      if (e.net || !e.status) offline = true;
      else if (e.status === 429) toast(e.message);
      render();
    }).then(function () { busy = false; }, function () { busy = false; });
  }

  /* ===== Eski hesabı geri yükleme: sunucu 401 verince eski kimlik '_old' anahtarına yedeklenir ===== */
  function oldCreds() {
    try {
      var o = JSON.parse(localStorage.getItem(CFG.key + '_old'));
      if (o && /^\d{8}$/.test(String(o.id)) && /^[A-Za-z0-9_-]{20,64}$/.test(String(o.token)) && (!creds || creds.id !== String(o.id))) return { id: String(o.id), token: String(o.token) };
    } catch (e) {}
    return null;
  }
  function restoreOld() {
    var o = oldCreds(); if (!o) return;
    if (!confirm('Şu anki hesabın (ID ' + S.id + ') yerine önceki hesabın (ID ' + o.id + ') yüklensin mi? Şu anki hesabın anahtarı silinir; yeni hesapta kristal biriktirdiysen kaybolur.')) return;
    var cur = creds; creds = o;
    api('/sync').then(function (d) {
      try { localStorage.removeItem(CFG.key + '_old'); } catch (x) {}
      apply(d); render(); toast('Önceki hesap yüklendi. Bakiye: ' + S.bal);
    }, function (e) {
      creds = cur; toast(e.status === 401 ? 'Önceki hesap sunucuda da bulunamadı.' : e.message);
    });
  }

  /* ===== Gizli kelime (sadece yönetici bölümünü açar) ===== */
  function h53n(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  function h53(str) { return h53n(str).toString(36); }
  function isOwnerWord(v) { return h53('mk|' + String(v).trim().toLocaleLowerCase('tr').replace(/\u0131/g, 'i')) === CFG.owner; }

  /* ===== Hediye kodu ===== */
  function normCode(v) { return String(v).toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function fmtCode(c) { return c.slice(0, 4) + '-' + c.slice(4, 8) + '-' + c.slice(8); }
  function adminKey() { var k = $('kAdm') ? $('kAdm').value.trim() : ''; if (!k) toast('Önce yönetici anahtarını yaz.'); return k; }
  function amount() { var n = Math.floor(Number(String($('kGiftAmt').value).replace(/\s/g, '').replace(',', '.'))); return isFinite(n) && n >= 1 && n <= 100000 ? n : 0; }
  function giftMake() {
    var k = adminKey(); if (!k) return;
    var to = String($('kGiftTo').value).replace(/\D/g, '');
    if (!/^\d{8}$/.test(to)) return toast("Arkadaşının Site ID'si 8 haneli bir sayı olmalı.");
    var n = amount(); if (!n) return toast('1 ile 100000 arasında bir sayı yaz.');
    api('/admin/gift', { to: to, n: n }, k).then(function (d) {
      madeList = d.recent || []; render();
      $('kGiftOut').textContent = fmtCode(d.code);
      copy(fmtCode(d.code), 'Kod üretildi ve kopyalandı: ' + fmtCode(d.code) + ' (' + d.n + ' kristal, ID ' + d.to + ')');
    }, function (e) { toast(e.message); });
  }
  function giftAdd() {
    var k = adminKey(); if (!k) return;
    var to = String($('kGiftTo').value).replace(/\D/g, '') || S.id;
    var n = amount(); if (!n) return toast('1 ile 100000 arasında bir sayı yaz.');
    api('/admin/add', { to: to, n: n }, k).then(function (d) {
      toast('+' + d.n + ' kristal eklendi (ID ' + d.to + '). Bakiye: ' + d.bal);
      if (d.to === S.id) sync();
    }, function (e) { toast(e.message); });
  }
  function giftRedeem() {
    var c = normCode($('kCode').value);
    if (c.length !== 13) return toast('Kod XXXX-XXXX-XXXXX biçiminde (13 harf/rakam).');
    api('/redeem', { code: c }).then(function (d) {
      apply(d); render(); $('kCode').value = '';
      toast('+' + d.added + ' kristal hediye edildi! Bakiye: ' + S.bal);
    }, function (e) { toast(e.message); });
  }
  function verify() {
    var k = adminKey(); if (!k) return;
    api('/admin/verify', { text: $('kVerIn').value }, k).then(function (d) {
      lastNo = d.no || ''; $('kVerOut').textContent = d.out;
    }, function (e) { $('kVerOut').textContent = e.message; });
  }
  function reqDone() {
    var k = adminKey(); if (!k) return;
    if (!lastNo) return toast('Önce maili doğrula.');
    api('/admin/done', { no: lastNo }, k).then(function () { toast('#' + lastNo + ' tamamlandı olarak işaretlendi.'); }, function (e) { toast(e.message); });
  }

  /* ===== Küçük bildirim ===== */
  var toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'k-toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 3800);
  }
  function copy(txt, okMsg) {
    var done = function () { toast(okMsg); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { prompt('Elle kopyala:', txt); });
    else prompt('Elle kopyala:', txt);
  }

  /* ===== Mail ===== */
  function mailAddr() { return CFG.mail.join('@'); }
  function mailSubject(r) { return 'Aktivasyon Kodu Talebi - ' + CFG.app + ' (' + r.pack + ') #' + r.no; }
  function mailBody(r) {
    return [
      'Merhaba,', '',
      "Hava durumu sitemdeki ID'm: " + S.id,
      'Mağazadan ' + r.cost + ' kristal harcayarak ' + r.pack + ' ' + CFG.app + ' aktivasyon hakkı aldım.',
      CFG.app + " ID'm: " + r.cam, '',
      'Talep no: ' + r.no,
      'Talep zamanı: ' + r.t,
      'Giriş günü: ' + S.days + ' (giriş ödülü ' + S.earned + ', hediye ' + S.gift + ', harcanan ' + S.spent + ', kalan ' + S.bal + ')', '',
      'Talep sunucuda kayıtlıdır; numarayı kontrol edip aktivasyon kodumu gönderebilir misiniz? Gerekirse ekran görüntüsünü bu maile ekleyeceğim.'
    ].join('\r\n');
  }
  var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
  function openMail(r) {
    if (!isMobile) return openGmail(r);       // bilgisayarda mailto çoğu zaman sessizce hiçbir şey yapmaz
    location.href = 'mailto:' + mailAddr() + '?subject=' + encodeURIComponent(mailSubject(r)) + '&body=' + encodeURIComponent(mailBody(r));
  }
  function openGmail(r) {
    var u = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(mailAddr()) + '&su=' + encodeURIComponent(mailSubject(r)) + '&body=' + encodeURIComponent(mailBody(r).replace(/\r\n/g, '\n'));
    if (!window.open(u, '_blank', 'noopener')) location.href = u;
  }
  function pendingReq() { for (var i = 0; i < S.reqs.length; i++) if (S.reqs[i].no === S.pending) return S.reqs[i]; return null; }

  /* ===== Satın alma ===== */
  function buy(i) {
    var pk = SCFG.packs[i]; if (!pk) return;
    var cam = $('kCamId').value.trim();
    S.cam = cam.slice(0, 60);
    if (S.bal < pk.cost) { render(); return toast('Yetersiz kristal! Günlük giriş yaparak kristal biriktirmeye devam et.'); }
    if (cam.length < 3) { $('kCamId').focus(); return toast('Önce ' + CFG.app + " ID'ni yaz."); }
    if (!confirm(pk.name + ' için ' + pk.cost + ' kristal harcanacak ve mail taslağı açılacak. Devam edilsin mi?')) return;
    api('/buy', { pack: i, cam: S.cam }).then(function (d) {
      apply(d); render(); openMail(d.req);
    }, function (e) {
      if (e.data && e.data.s) { apply(e.data); render(); }
      toast(e.message);
    });
  }

  /* ===== Mantar Pano: Pro / Sınırsız kodu (kristalle alınır, kodu Mantar Pano'da girersin) ===== */
  function mantarCfg() { return (SCFG && SCFG.mantar && SCFG.mantar.tiers) ? SCFG.mantar : { days: 7, tiers: [] }; }
  function fmtDate(sec) { try { return new Date(sec * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
  function passState(p) {
    if (!p.used) return { text: 'Hazır · henüz kullanılmadı', cls: 'new' };
    var left = p.exp - Math.floor(Date.now() / 1000);
    return left > 0 ? { text: 'Aktif · ' + fmtDate(p.exp) + ' tarihine kadar', cls: 'on' } : { text: 'Süresi doldu', cls: 'old' };
  }
  function buyPass(tr) {
    if (S.bal < tr.cost) { render(); return toast('Yetersiz kristal! Günlük giriş yaparak kristal biriktirmeye devam et.'); }
    if (!confirm(tr.name + ' (' + mantarCfg().days + ' gün) için ' + tr.cost + ' kristal harcanacak. Devam edilsin mi?')) return;
    api('/pass/buy', { tier: tr.id }).then(function (d) {
      apply(d); render();
      if (d.pass) showPass(d.pass, tr);
    }, function (e) {
      if (e.data && e.data.s) { apply(e.data); render(); }
      toast(e.message);
    });
  }
  function showPass(p, tr) {
    var code = fmtCode(p.c);
    MKVitrin.open({
      art: MKVitrin.art.pano(tr ? tr.short : ''), title: 'Kodun hazır',
      desc: (tr ? tr.name : 'Mantar Pano') + ' kodun: ' + code + '. Mantar Pano\'da Premium kodu alanına yapıştır; ' + p.days + ' günlük süre, kodu ilk kullandığın anda başlar. Kod burada \'Mantar Pano kodlarım\' bölümünde de durur.',
      chips: ['Kod: ' + code, p.days + ' gün', 'Harcanan: ' + p.cost + ' kristal'],
      primary: { label: 'Kodu kopyala', cls: 'blue', fn: function () { copy(code, 'Kod kopyalandı: ' + code); } }
    });
  }
  function openPass(tr) {
    var ok = S.bal >= tr.cost, need = Math.max(0, tr.cost - S.bal), days = mantarCfg().days;
    MKVitrin.open({
      art: MKVitrin.art.pano(tr.short), title: tr.name,
      desc: days + ' günlük ' + tr.short + ' erişimi. Alınca sana bir kod verilir; kodu Mantar Pano\'da gir, süre ilk kullandığın anda başlar. Mantar Pano\'nun şimdiki özellikleri zaten ücretsiz kalır; bu paket yeni özellikleri açar.',
      chips: ['Fiyat: ' + tr.cost + ' kristal', 'Süre: ' + days + ' gün', 'Bakiyen: ' + S.bal],
      note: ok ? '' : 'Yetersiz kristal · yaklaşık ' + Math.ceil(need / SCFG.daily) + ' gün daha (seri ödülü hesaba katılmadan).',
      primary: { label: 'Al', cost: tr.cost, disabled: !ok, fn: function () { setTimeout(function () { buyPass(tr); }, 30); } }
    });
  }
  function renderPass() {
    var box = $('kPassShelf'); if (!box || !window.MKVitrin) return;
    box.textContent = '';
    mantarCfg().tiers.forEach(function (tr, i) {
      box.appendChild(MKVitrin.card({
        art: MKVitrin.art.pano(tr.short), delay: i * .5, label: tr.name + ', ' + tr.cost + ' kristal',
        tag: { kind: 'price', text: String(tr.cost), off: S.bal < tr.cost },
        onClick: function () { openPass(tr); }
      }));
    });
    var wrap = $('kPassWrap'), list = $('kPassList'); if (!wrap || !list) return;
    list.textContent = ''; wrap.style.display = S.passes.length ? '' : 'none';
    S.passes.forEach(function (p) {
      var tr = mantarCfg().tiers.filter(function (x) { return x.id === p.tier; })[0], st = passState(p), d = document.createElement('div');
      d.appendChild(document.createTextNode((tr ? tr.short : p.tier) + ' · ' + fmtCode(p.c) + ' · ' + st.text + ' '));
      var b = document.createElement('button'); b.type = 'button'; b.className = 'k-mini'; b.textContent = 'Kopyala';
      b.addEventListener('click', function () { copy(fmtCode(p.c), 'Kod kopyalandı: ' + fmtCode(p.c)); });
      d.appendChild(b); list.appendChild(d);
    });
  }
  function passMake() {
    var k = adminKey(); if (!k) return;
    api('/admin/pass', { tier: $('kPassTier').value, days: $('kPassDays').value }, k).then(function (d) {
      $('kPassOut').textContent = fmtCode(d.code);
      copy(fmtCode(d.code), 'Mantar kodu üretildi ve kopyalandı: ' + fmtCode(d.code) + ' (' + d.name + ', ' + d.days + ' gün)');
    }, function (e) { toast(e.message); });
  }

  /* ===== Vitrin: paket penceresi, ücretsiz ödüller, geri sayım ===== */
  function openPack(i) {
    var pk = SCFG.packs[i]; if (!pk) return;
    var ok = S.bal >= pk.cost, n = parseInt(pk.short, 10) || 0, need = Math.max(0, pk.cost - S.bal);
    MKVitrin.open({
      art: MKVitrin.art.camera(n), title: pk.name,
      desc: CFG.app + ' için ' + pk.short + ' aktivasyon hakkı. Alınca talebin sunucuda kayıt altına alınır ve mail taslağı açılır; kod, doğrulamadan sonra mail ile gönderilir.',
      chips: ['Fiyat: ' + pk.cost + ' kristal', 'Bakiyen: ' + S.bal],
      note: ok ? (S.cam.length >= 3 || ($('kCamId') && $('kCamId').value.trim().length >= 3) ? '' : CFG.app + " ID'ni aşağıdaki alana yazmayı unutma.") : 'Yetersiz kristal · yaklaşık ' + Math.ceil(need / SCFG.daily) + ' gün daha (seri ödülü hesaba katılmadan).',
      primary: { label: 'Al', cost: pk.cost, disabled: !ok, fn: function () { setTimeout(function () { buy(i); }, 30); } }
    });
  }
  function nextRewardText() {
    var ms = 864e5 - ((Date.now() + 3 * 3600e3) % 864e5), h = Math.floor(ms / 3600e3), m = Math.floor(ms % 3600e3 / 60e3);
    return (h ? h + ' sa ' : '') + m + ' dk';
  }
  function tickTimer() { var t = $('vtTimer'); if (t) t.textContent = 'Sonraki günlük ödül: ' + nextRewardText(); }
  function renderFree() {
    var box = $('freeShelf'); if (!box || !window.MKVitrin) return;
    box.textContent = '';
    var V = MKVitrin, got = S.last && S.last === todayS, sk = window.MKSeri ? MKSeri.info() : { n: 0, every: 7, bonus: 60, best: 0 };
    var into = sk.n % sk.every === 0 && sk.n ? sk.every : sk.n % sk.every;
    box.appendChild(V.card({
      art: V.art.calendar('+' + SCFG.daily), delay: 0, label: 'Günlük giriş ödülü, +' + SCFG.daily + ' kristal',
      tag: got ? { kind: 'ok', text: 'Alındı', sm: true } : { kind: 'text', text: 'Bekliyor', sm: true },
      onClick: function () { V.open({ art: V.art.calendar('+' + SCFG.daily), title: 'Günlük giriş', desc: 'Siteyi her gün açtığında ' + SCFG.daily + ' kristal kazanırsın. Ödül sunucuda otomatik verilir, bir şey yapman gerekmez.', chips: ['Toplam giriş günü: ' + S.days, got ? 'Bugünkü ödül alındı' : 'Bugünkü ödül hazırlanıyor', 'Sonraki: ' + nextRewardText() + ' sonra'] }); }
    }));
    box.appendChild(V.card({
      art: window.MKSeri ? MKSeri.flame(MKSeri.shownTier()) : V.art.gem(), delay: .4, label: 'Seri ödülü, ' + sk.every + ' günde bir +' + sk.bonus + ' kristal',
      tag: { kind: into === sk.every ? 'ok' : 'text', text: into === sk.every ? 'Alındı' : into + '/' + sk.every, sm: true },
      onClick: function () { V.open({ art: window.MKSeri ? MKSeri.flame(MKSeri.shownTier()) : V.art.gem(), title: 'Seri ödülü', desc: 'Siteyi üst üste her ' + sk.every + '. gün açtığında ' + sk.bonus + ' kristal daha kazanırsın. Tek günü kaçırırsan kalkan seriyi sessizce korur. Seri ' + sk.every + ' günde bir yeni alev kazandırır.', chips: ['Serin: ' + sk.n + ' gün', 'Sonraki ödül: ' + seriNextMilestone(sk.n) + '. gün', 'En uzun serin: ' + sk.best + ' gün'] }); }
    }));
    box.appendChild(V.card({
      art: V.art.gift(), delay: .8, label: 'Hediye kodu',
      tag: { kind: 'text', text: 'Kod gir', sm: true },
      onClick: function () { V.open({ art: V.art.gift(), title: 'Hediye kodu', desc: 'Arkadaşından ya da Forevye\'den bir hediye kodu aldıysan kristalin hesabına eklenir. Kod XXXX-XXXX-XXXXX biçimindedir ve yalnızca kendi Site ID\'n için çalışır.', primary: { label: 'Kodu gir', cls: 'blue', fn: function () { setTimeout(function () { var c = $('kCode'); if (c) { c.scrollIntoView({ behavior: 'smooth', block: 'center' }); c.focus(); } }, 60); } } }); }
    }));
  }

  /* ===== Ekran ===== */
  function render() {
    if (!$('storePage')) return;
    if ($('kVer')) $('kVer').textContent = 'kristal.js v10 yüklü (sunucu)';
    if ($('kOldWrap')) $('kOldWrap').hidden = !oldCreds();
    $('kBal').textContent = S.bal;
    if ($('kBal2')) $('kBal2').textContent = S.bal;
    $('kId').textContent = S.id;
    if (document.activeElement !== $('kCamId')) $('kCamId').value = S.cam;
    $('kToday').textContent = (offline ? 'Sunucuya bağlanılamadı, son bilinen bakiye gösteriliyor. ' : '') +
      (S.last && S.last === todayS ? 'Bugünkü giriş ödülün alındı (+' + SCFG.daily + '). ' : '') + 'Toplam giriş günü: ' + S.days + '.' + (S.gift ? ' Hediye kristal: ' + S.gift + '.' : '');

    var box = $('kPacks'); box.textContent = '';
    SCFG.packs.forEach(function (pk, i) {
      var ok = S.bal >= pk.cost, n = parseInt(pk.short, 10) || 0;
      box.appendChild(MKVitrin.card({
        art: MKVitrin.art.camera(n), cap: '', delay: i * .5, label: pk.name + ', ' + pk.cost + ' kristal',
        tag: { kind: 'price', text: String(pk.cost), off: !ok },
        onClick: function () { openPack(i); }
      }));
    });
    renderFree(); renderPass(); tickTimer();
    $('kLow').hidden = S.bal >= Math.min.apply(null, SCFG.packs.map(function (p) { return p.cost; }));

    var pr = pendingReq(), pb = $('kPending');
    pb.hidden = !pr;
    if (pr) $('kPendingTx').textContent = 'Bekleyen talep: ' + pr.pack + ' · Talep no ' + pr.no + '. Alıcı: ' + mailAddr() + '. Mail açılmadıysa aşağıdaki düğmeleri kullan; kristalin zaten düşüldü.';

    var h = $('kHist'); h.textContent = '';
    $('kHistWrap').style.display = S.reqs.length ? '' : 'none';
    if (S.reqs.length) {
      S.reqs.slice(-5).reverse().forEach(function (r) {
        var d = document.createElement('div'); d.textContent = r.t + ' · ' + r.pack + ' · ' + r.cost + ' kristal · #' + r.no + (r.status === 'done' ? ' · tamamlandı' : ''); h.appendChild(d);
      });
    }
    var m = $('kMade'); m.textContent = '';
    madeList.forEach(function (r) {
      var d = document.createElement('div'); d.textContent = r.t + ' · ID ' + r.to + ' · ' + r.n + ' kristal · ' + fmtCode(r.c); m.appendChild(d);
    });
    if (typeof paintIcons === 'function') paintIcons();
  }

  /* ===== Mağaza sayfası ===== */
  function openStore() {
    var p = $('storePage'); render(); sync(); if (window.MKSeri) MKSeri.renderShelf();
    clearInterval(timerT); timerT = setInterval(tickTimer, 30000);
    p.classList.add('show'); p.scrollTop = 0; document.body.style.overflow = 'hidden'; $('storeBack').focus();
  }
  function closeStore() {
    $('storePage').classList.remove('show'); document.body.style.overflow = ''; clearInterval(timerT); $('kOwner').hidden = true;
    if ($('kAdm')) $('kAdm').value = '';
    var b = $('btnStore'); if (b) b.focus();
  }

  /* ===== Bağlantılar ===== */
  function init() {
    if (typeof ICONS !== 'undefined') {
      ICONS.gem =
        '<path d="M14 6h20l10 12-20 26L4 18z" fill="#7dd3fc"/>' +
        '<path d="M14 6h20l10 12H4z" fill="#e0f2fe" stroke-width="2.4"/>' +
        '<path d="M19 6l-3 12M29 6l3 12" fill="none" stroke-width="2.2"/>' +
        '<path d="M10 14l2-3" fill="none" stroke="#fff" stroke-width="3"/>' +
        '<circle cx="15" cy="28" r="2.4" fill="#f9a8d4" stroke="none"/><circle cx="33" cy="28" r="2.4" fill="#f9a8d4" stroke="none"/>' +
        '<circle cx="19.5" cy="25" r="1.9" fill="#4a3426" stroke="none"/><circle cx="28.5" cy="25" r="1.9" fill="#4a3426" stroke="none"/>' +
        '<path d="M21 30q3 3.2 6 0" fill="none" stroke-width="2.4"/>' +
        '<path d="M43 2.5v7M39.5 6h7" fill="none" stroke="#fde047" stroke-width="3"/>';
      if (typeof BG !== 'undefined') BG.gem = '#7dd3fc';
    }
    document.querySelectorAll('[data-vt]').forEach(function (e) { var f = window.MKVitrin && MKVitrin.art[e.dataset.vt]; if (f) e.outerHTML = f(); });
    loadLocal();
    render();
    sync();                        // ödül sunucuda işlenir; sadece Mağaza sayfasında görünür

    if (!$('storePage')) return;
    $('btnStore').addEventListener('click', openStore);
    $('storeBack').addEventListener('click', closeStore);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('storePage').classList.contains('show')) closeStore(); });
    $('kCamId').addEventListener('input', function () {
      if (!isOwnerWord(this.value)) return;
      this.value = ''; S.cam = '';
      $('kOwner').hidden = false;
      $('kOwner').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    if ($('kRestoreOld')) $('kRestoreOld').addEventListener('click', restoreOld);
    $('kGiftAdd').addEventListener('click', giftAdd);
    $('kGiftMake').addEventListener('click', giftMake);
    if ($('kPassMake')) $('kPassMake').addEventListener('click', passMake);
    $('kVerBtn').addEventListener('click', verify);
    $('kVerDone').addEventListener('click', reqDone);
    $('kCodeUse').addEventListener('click', giftRedeem);
    $('kCode').addEventListener('keydown', function (e) { if (e.key === 'Enter') giftRedeem(); });
    $('kGiftClose').addEventListener('click', function () { $('kOwner').hidden = true; if ($('kAdm')) $('kAdm').value = ''; });
    $('kCamId').addEventListener('change', function () { S.cam = this.value.trim().slice(0, 60); });
    $('kCopyId').addEventListener('click', function () { copy(S.id, 'ID kopyalandı: ' + S.id); });
    $('kMailAgain').addEventListener('click', function () { var r = pendingReq(); if (r) openMail(r); });
    $('kMailGmail').addEventListener('click', function () { var r = pendingReq(); if (r) openGmail(r); });
    $('kMailCopy').addEventListener('click', function () {
      var r = pendingReq(); if (!r) return;
      copy('Alıcı: ' + mailAddr() + '\nKonu: ' + mailSubject(r) + '\n\n' + mailBody(r).replace(/\r\n/g, '\n'), 'Mail metni kopyalandı.');
    });
    $('kMailDone').addEventListener('click', function () {
      api('/mail-done').then(function (d) { apply(d); render(); }, function (e) { toast(e.message); });
    });
    document.addEventListener('visibilitychange', function () {   // sekme gün değişiminden sonra açılırsa ödül ver
      if (document.visibilityState !== 'visible' || Date.now() - lastSync < 60000) return;
      sync();
    });
  }

  /* Yedek / geri yükleme (app.js bunu çağırır). Yedek artık bakiye değil, hesap anahtarını taşır:
     metni gören kişi hesabı açabilir, o yüzden yedek metnini kimseyle paylaşma. */
  window.MKKristal = {
    streak: function () { return S && S.streak ? S.streak : null; },
    cfg: function () { return SCFG; },
    openStore: function () { if ($('storePage')) openStore(); },
    exportData: function () { return creds ? { id: creds.id, token: creds.token } : undefined; },
    importData: function (o) {
      if (!o || !/^\d{8}$/.test(String(o.id)) || !/^[A-Za-z0-9_-]{20,64}$/.test(String(o.token))) {
        toast('Bu yedekteki kristaller geri yüklenemedi (eski sürümden kalan yedekler sunucuya taşınamaz).'); return Promise.resolve(false);
      }
      var old = creds; creds = { id: String(o.id), token: String(o.token) };
      return api('/sync').then(function (d) { apply(d); render(); toast('Kristal hesabı yüklendi. Bakiye: ' + S.bal); return true; }, function (e) {
        creds = old; toast(e.status === 401 ? 'Yedekteki hesap sunucuda bulunamadı.' : e.message); return false;
      });
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
