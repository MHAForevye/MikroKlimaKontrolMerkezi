/* Paylaşım kartı: ekrandaki bilgilerden (konum, sıcaklık, karne, seri) 1080x1350 bir resim çizer, paylaşır ya da indirir.
   Hiçbir şey sunucuya gitmez: kart tarayıcıda canvas ile çizilir. Üç tür: Hava, Karne, Seri. */
(function () {
  'use strict';
  var W = 1080, H = 1350, KINDS = [['hava', 'Hava'], ['karne', 'Karne'], ['seri', 'Seri']];
  var $ = function (id) { return document.getElementById(id); };
  var kind = 'hava', ov = null, cv = null, lastBlob = null;

  function txt(id) { var e = $(id); return e ? (e.textContent || '').trim() : ''; }
  function snap() {
    var sel = $('locationSelect'), loc = sel && sel.selectedOptions && sel.selectedOptions[0] ? sel.selectedOptions[0].textContent.trim() : 'Konumum';
    var temp = txt('heroTemp'); if (!/\d/.test(temp)) temp = '';
    var si = window.MKSeri ? MKSeri.info() : { n: 1, best: 1 }, tier = window.MKSeri ? MKSeri.shownTier(si) : 0;
    var sum = txt('karneSum'), m = /^(\d+) gün · en iyi: (.+)$/.exec(sum);
    var top = document.querySelector('#karneTable tr.cons td'), cells = top ? top.parentNode.querySelectorAll('td') : [];
    return {
      loc: loc, temp: temp, desc: txt('heroDesc'), feels: txt('heroFeels'), hilo: txt('heroHiLo'), line: txt('sadeLine'),
      days: m ? +m[1] : 0, best: m ? m[2] : '', mae: cells[1] ? cells[1].textContent : '', csi: cells[2] ? cells[2].textContent : '',
      streak: si.n, bestStreak: si.best, tier: tier, tierName: window.MKSeri ? MKSeri.tierName(tier) : ''
    };
  }

  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function fit(c, t, maxW, size, weight, fam) { do { c.font = weight + ' ' + size + 'px ' + fam; size -= 4; } while (c.measureText(t).width > maxW && size > 28); }
  var SANS = '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', DISP = '"Bebas Neue", "Oswald", Impact, "Arial Narrow", sans-serif';
  var TC = [['#ea580c', '#fb923c', '#fde68a'], ['#f97316', '#fbbf24', '#fff7cc'], ['#dc2626', '#f97316', '#fde047'], ['#991b1b', '#ef4444', '#fbbf24'], ['#2563eb', '#38bdf8', '#e0f2fe'], ['#0e7490', '#22d3ee', '#ecfeff'],
    ['#15803d', '#4ade80', '#f0fdf4'], ['#6d28d9', '#a78bfa', '#f5f3ff'], ['#be185d', '#f472b6', '#fff1f2'], ['#b45309', '#fcd34d', '#fffbeb'], ['#7c93b3', '#bae6fd', '#ffffff'], ['#e11d48', '#f59e0b', '#fef9c3']];
  var PO = 'M16 2C17 9 26 13 26 25C26 33 21 38 16 38C11 38 6 33 6 25C6 20 9 17 10 12C12 15 13 17 14 17C14 11 14 6 16 2Z';
  var PM = 'M16 16C17 21 22 23 22 29C22 33.5 19.5 36 16 36C12.5 36 10 33.5 10 29C10 25 13 24 13.5 20C14.5 21 15.5 21 16 16Z';
  var PC = 'M16 26C17 29 19 30 19 32.5C19 34.5 17.7 35.5 16 35.5C14.3 35.5 13 34.5 13 32.5C13 30 15 29 16 26Z';
  function drawFlame(c, tier, cx, cy, size) {
    var col = TC[Math.max(0, Math.min(11, tier))], k = size / 40;
    c.save(); c.translate(cx - 16 * k, cy - 20 * k); c.scale(k, k);
    c.shadowColor = col[1]; c.shadowBlur = 40;
    [[PO, col[0]], [PM, col[1]], [PC, col[2]]].forEach(function (p) { c.fillStyle = p[1]; c.fill(new Path2D(p[0])); c.shadowBlur = 0; });
    c.restore();
  }
  var BG = { hava: ['#0ea5e9', '#6366f1', '#1e1b4b'], karne: ['#0f766e', '#2563eb', '#172554'], seri: ['#7c2d12', '#be185d', '#1e1b4b'] };

  function draw() {
    var d = snap(), c = cv.getContext('2d'), bg = BG[kind];
    var g = c.createLinearGradient(0, 0, W * .6, H); g.addColorStop(0, bg[0]); g.addColorStop(.55, bg[1]); g.addColorStop(1, bg[2]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (var i = 0; i < 38; i++) { c.fillStyle = 'rgba(255,255,255,' + (.04 + (i * 7 % 10) / 90) + ')'; c.beginPath(); c.arc((i * 337) % W, (i * 521) % H, 3 + (i * 13) % 14, 0, 7); c.fill(); }
    var r = c.createRadialGradient(W / 2, 560, 40, W / 2, 560, 620); r.addColorStop(0, 'rgba(255,255,255,.22)'); r.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = r; c.fillRect(0, 0, W, H);
    c.textAlign = 'center'; c.fillStyle = '#fff';
    c.font = '700 40px ' + SANS; c.globalAlpha = .9; c.fillText('MİKRO-KLİMA KONTROL MERKEZİ', W / 2, 96); c.globalAlpha = 1;

    if (kind === 'hava') {
      fit(c, d.loc, W - 160, 110, 800, SANS); c.fillText(d.loc, W / 2, 290);
      c.font = '800 360px ' + SANS; c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 30; c.fillText(d.temp || '--°', W / 2, 700); c.shadowBlur = 0;
      c.font = '600 72px ' + SANS; c.fillText(d.desc, W / 2, 810);
      c.font = '500 46px ' + SANS; c.globalAlpha = .9; c.fillText(d.feels, W / 2, 890); c.fillText(d.hilo, W / 2, 955); c.globalAlpha = 1;
      if (d.line) { rr(c, 80, 1030, W - 160, 150, 32); c.fillStyle = 'rgba(255,255,255,.16)'; c.fill(); c.fillStyle = '#fff'; fit(c, d.line, W - 220, 54, 600, SANS); c.fillText(d.line, W / 2, 1122); }
    } else if (kind === 'karne') {
      fit(c, d.loc, W - 160, 96, 800, SANS); c.fillText(d.loc, W / 2, 230);
      c.font = '400 150px ' + DISP; c.fillText('HAVA KARNESİ', W / 2, 400);
      if (d.best) {
        c.font = '600 48px ' + SANS; c.globalAlpha = .85; c.fillText('Son ' + d.days + ' günde bu konumda en çok haklı çıkan', W / 2, 520); c.globalAlpha = 1;
        fit(c, d.best, W - 200, 130, 800, SANS); c.fillStyle = '#fde68a'; c.fillText(d.best, W / 2, 680); c.fillStyle = '#fff';
        var bx = [[d.mae || '–', 'Sıcaklık hatası'], [d.csi || '–', 'Yağış başarısı']];
        bx.forEach(function (b, k) { var x = 80 + k * 470; rr(c, x, 780, 450, 250, 36); c.fillStyle = 'rgba(255,255,255,.16)'; c.fill(); c.fillStyle = '#fff'; fit(c, b[0], 400, 84, 800, SANS); c.fillText(b[0], x + 225, 910); c.font = '500 40px ' + SANS; c.globalAlpha = .85; c.fillText(b[1], x + 225, 980); c.globalAlpha = 1; });
      } else { c.font = '600 56px ' + SANS; c.fillText('Karne henüz hazırlanıyor…', W / 2, 700); }
      c.font = '500 40px ' + SANS; c.globalAlpha = .8; c.fillText('14 kaynak yan yana, geçmişte kim haklı çıktı?', W / 2, 1130); c.globalAlpha = 1;
    } else {
      drawFlame(c, d.tier, W / 2, 430, 430);
      c.font = '800 250px ' + SANS; c.fillText(String(d.streak), W / 2, 860);
      c.font = '600 64px ' + SANS; c.fillText('gün üst üste', W / 2, 940);
      rr(c, W / 2 - 250, 990, 500, 96, 48); c.fillStyle = 'rgba(255,255,255,.18)'; c.fill(); c.fillStyle = '#fde68a'; c.font = '700 54px ' + SANS; c.fillText(d.tierName, W / 2, 1058);
      c.fillStyle = '#fff'; c.font = '500 42px ' + SANS; c.globalAlpha = .85; c.fillText('En uzun serim: ' + d.bestStreak + ' gün', W / 2, 1150); c.globalAlpha = 1;
    }
    c.font = '600 40px ' + SANS; c.globalAlpha = .9; c.fillText('mikroklimakontrolmerkezi.forevye.workers.dev', W / 2, 1290); c.globalAlpha = 1;
  }

  function toBlob() { return new Promise(function (ok) { cv.toBlob(function (b) { lastBlob = b; ok(b); }, 'image/png'); }); }
  function share() {
    toBlob().then(function (b) {
      if (!b) return;
      var f = new File([b], 'mikro-klima-' + kind + '.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [f] }) && navigator.share) {
        navigator.share({ files: [f], title: 'Mikro-Klima Kontrol Merkezi' }).catch(function () {});
        track('paylasim-kart/' + kind);
      } else save();
    });
  }
  function save() {
    toBlob().then(function (b) {
      if (!b) return; var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'mikro-klima-' + kind + '.png';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000); track('indir-kart/' + kind);
    });
  }
  function track(p) { try { if (window.goatcounter && goatcounter.count) goatcounter.count({ path: p, title: 'Olay: ' + p, event: true }); } catch (e) {} }

  function build() {
    ov = document.createElement('div'); ov.className = 'kart-ov'; ov.id = 'kartOv';
    ov.innerHTML = '<div class="kart-box" role="dialog" aria-modal="true" aria-label="Paylaşım kartı"><div class="kart-kinds" id="kartKinds"></div><canvas width="' + W + '" height="' + H + '" id="kartCv" role="img" aria-label="Paylaşım kartı önizlemesi"></canvas>' +
      '<div class="kart-btns"><button type="button" class="go" id="kartShare">Paylaş</button><button type="button" id="kartSave">Resmi indir</button><button type="button" class="wide2" id="kartClose">Kapat</button></div></div>';
    document.body.appendChild(ov); cv = $('kartCv');
    var K = $('kartKinds');
    KINDS.forEach(function (k) { var b = document.createElement('button'); b.type = 'button'; b.textContent = k[1]; b.dataset.k = k[0]; b.addEventListener('click', function () { kind = k[0]; mark(); draw(); }); K.appendChild(b); });
    $('kartShare').addEventListener('click', share); $('kartSave').addEventListener('click', save); $('kartClose').addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.classList.contains('show')) close(); });
  }
  function mark() { document.querySelectorAll('#kartKinds button').forEach(function (b) { var on = b.dataset.k === kind; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
  function open(k) {
    if (!ov) build(); if (k) kind = k; mark();
    ov.classList.add('show'); document.body.style.overflow = 'hidden'; draw();
    if (document.fonts && document.fonts.load) document.fonts.load('80px "Bebas Neue"').then(draw, function () {});
    $('kartShare').focus(); track('kart-ac/' + kind);
  }
  function close() { if (ov) ov.classList.remove('show'); if (!document.querySelector('.studio-page.show, .vt-page.show')) document.body.style.overflow = ''; }

  window.MKKart = { open: open, close: close, snap: snap };
})();
