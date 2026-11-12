/* Vitrin: Mağaza ve görünüm seçicinin ortak parçaları (css/vitrin.css ile birlikte).
   - MKVitrin.card(...)  : altın çerçeveli, parıltılı, basılabilir kart (alt etiketi: fiyat / seçili / kilitli)
   - MKVitrin.open(...)  : karta basınca açılan pencere: büyük resim, ad, açıklama, bilgi etiketleri, "Al/Seç" ve "Kapat"
   - MKVitrin.art        : küçük SVG resimleri (kristal, kamera, takvim, hediye, kilit, tik...)
   Metinler textContent ile yazılır; sadece art alanı (içeride üretilen SVG/HTML) innerHTML olur. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  var art = {
    gem: function () {
      return '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M13 7h22l9 12-20 24L4 19z" fill="#2fa8f0"/><path d="M13 7h22l9 12H4z" fill="#a8e8ff"/><path d="M4 19h20L24 43z" fill="#1c86e8"/><path d="M44 19H24l0 24z" fill="#1565c8"/>' +
        '<path d="M24 19L13 7M24 19L35 7M24 19v24" stroke="#fff" stroke-opacity=".6" stroke-width="1.5" fill="none"/><path d="M9.5 15.5l3-5" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M42 3v6M39 6h6" stroke="#fff3a0" stroke-width="2.4" stroke-linecap="round"/></svg>';
    },
    check: function () {
      return '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M6 17l7 7L26 8" fill="none" stroke="#1a5a1f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 17l7 7L26 8" fill="none" stroke="#b6ffb0" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    },
    lock: function () {
      return '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M9.5 14v-4a6.5 6.5 0 0 1 13 0v4" fill="none" stroke="#6b6b86" stroke-width="3.4"/><rect x="6" y="13" width="20" height="15" rx="3.5" fill="#cfcde6" stroke="#4a4866" stroke-width="2"/><circle cx="16" cy="20" r="2.4" fill="#4a4866"/><path d="M16 21v3.2" stroke="#4a4866" stroke-width="2" stroke-linecap="round"/></svg>';
    },
    clock: function () {
      return '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="22" r="14" fill="#fff4cf" stroke="#4a2a04" stroke-width="3"/><rect x="16" y="3" width="8" height="5" rx="1.5" fill="#4a2a04"/><path d="M20 22V13M20 22l6 4" stroke="#4a2a04" stroke-width="3" stroke-linecap="round"/></svg>';
    },
    camera: function (n) {
      return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect x="5" y="19" width="54" height="34" rx="7" fill="#3a3a58" stroke="#1a1a30" stroke-width="2"/><rect x="5" y="19" width="54" height="10" rx="5" fill="#5a5a82"/><path d="M21 19l3-7h16l3 7z" fill="#2a2a44" stroke="#1a1a30" stroke-width="2" stroke-linejoin="round"/>' +
        '<circle cx="30" cy="38" r="12.5" fill="#1f1f36" stroke="#0e0e1c" stroke-width="2"/><circle cx="30" cy="38" r="8.5" fill="#3b82f6"/><circle cx="26.8" cy="34.8" r="2.8" fill="#fff" opacity=".85"/><circle cx="50" cy="26" r="2.4" fill="#ffd34d"/>' +
        '<path d="M9 8l1.6 3.6L14 13l-3.4 1.4L9 18l-1.6-3.6L4 13l3.4-1.4z" fill="#fff"/>' +
        '<circle cx="49" cy="49" r="11" fill="#e8344a" stroke="#fff" stroke-width="2.6"/><text x="49" y="55" text-anchor="middle" font-family="Bebas Neue,Oswald,Impact,sans-serif" font-size="17" fill="#fff">' + (+n || 0) + '</text></svg>';
    },
    calendar: function (txt) {
      var t = String(txt == null ? '' : txt).replace(/[^\w+\-.%: ]/g, '');
      return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect x="7" y="11" width="50" height="46" rx="8" fill="#fffdf2" stroke="#6b3a08" stroke-width="3"/><path d="M7 19a8 8 0 0 1 8-8h34a8 8 0 0 1 8 8v8H7z" fill="#e8344a" stroke="#6b3a08" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M19 5v12M45 5v12" stroke="#6b3a08" stroke-width="5" stroke-linecap="round"/><text x="32" y="50" text-anchor="middle" font-family="Bebas Neue,Oswald,Impact,sans-serif" font-size="22" fill="#2a6dd8" stroke="#fff" stroke-width=".6">' + t + '</text></svg>';
    },
    gift: function () {
      return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect x="8" y="26" width="48" height="30" rx="4" fill="#e8344a" stroke="#6b1020" stroke-width="3"/><rect x="5" y="19" width="54" height="12" rx="4" fill="#ff5a6c" stroke="#6b1020" stroke-width="3"/><rect x="28" y="19" width="8" height="37" fill="#ffd34d" stroke="#8a5a08" stroke-width="2"/>' +
        '<path d="M32 19c-4-10-16-9-14-3s10 4 14 3zM32 19c4-10 16-9 14-3s-10 4-14 3z" fill="#ffd34d" stroke="#8a5a08" stroke-width="2.4" stroke-linejoin="round"/></svg>';
    },
    sack: function () {
      return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M22 10l6 7h8l6-7z" fill="#c98a3a" stroke="#6b3a08" stroke-width="2.4" stroke-linejoin="round"/><path d="M27 17c-12 6-19 18-19 31 0 7 6 11 24 11s24-4 24-11c0-13-7-25-19-31z" fill="#e0a850" stroke="#6b3a08" stroke-width="3" stroke-linejoin="round"/><path d="M26 18h12" stroke="#6b3a08" stroke-width="4" stroke-linecap="round"/>' +
        '<g transform="translate(17 28) scale(.62)"><path d="M13 7h22l9 12-20 24L4 19z" fill="#2fa8f0" stroke="#0e4a8a" stroke-width="3"/><path d="M13 7h22l9 12H4z" fill="#a8e8ff" stroke="#0e4a8a" stroke-width="2"/></g></svg>';
    }
  };

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  /* ===== Kart ===== */
  /* o: { art, cap, label, cls, delay, badge: 'lock'|'check', tag: { kind: 'price'|'ok'|'lock'|'text', text, off, sm }, onClick } */
  function card(o) {
    var b = el('button', 'vt-item' + (o.cls ? ' ' + o.cls : '')); b.type = 'button';
    if (o.label) b.setAttribute('aria-label', o.label);
    if (o.delay != null) b.style.setProperty('--d', o.delay + 's');
    var c = el('span', 'vt-card'), inn = el('span', 'vt-in');
    ['a', 'b', 'c', 'd'].forEach(function (k) { inn.appendChild(el('i', 'vt-orn ' + k)); });
    var a = el('span', 'vt-art'); a.innerHTML = o.art || ''; inn.appendChild(a);
    c.appendChild(inn);
    if (o.badge) { var bd = el('span', 'vt-badge'); bd.innerHTML = art[o.badge] ? art[o.badge]() : ''; c.appendChild(bd); }
    if (o.cap) inn.appendChild(el('span', 'vt-cap', o.cap));
    b.appendChild(c);
    var t = o.tag || {}, tg = el('span', 'vt-tag' + (t.kind === 'ok' ? ' ok' : t.kind === 'lock' ? ' lock' : '') + (t.off ? ' off' : '') + (t.sm ? ' sm' : ''));
    if (t.kind === 'price') { tg.insertAdjacentHTML('beforeend', art.gem()); tg.appendChild(el('b', '', t.text)); }
    else if (t.kind === 'ok') { tg.insertAdjacentHTML('beforeend', art.check()); if (t.text) tg.appendChild(el('b', '', t.text)); }
    else if (t.kind === 'lock') { tg.insertAdjacentHTML('beforeend', art.lock()); tg.appendChild(el('b', '', t.text)); }
    else tg.appendChild(el('b', '', t.text || ''));
    b.appendChild(tg);
    if (o.onClick) b.addEventListener('click', o.onClick);
    return b;
  }

  /* ===== Ayrıntı penceresi ===== */
  var ov = null, lastFocus = null, cur = null;
  function build() {
    ov = el('div', 'vt-ov vt'); ov.id = 'vtSheet';
    ov.innerHTML = '<div class="vt-sheet" role="dialog" aria-modal="true" aria-labelledby="vtSheetT"><div class="vt-sheet-in">' +
      '<div class="vt-stage"><i class="vt-spark"></i><i class="vt-spark"></i><i class="vt-spark"></i><div class="vt-stage-art" id="vtSheetArt"></div></div>' +
      '<div class="vt-sheet-t" id="vtSheetT"></div><p class="vt-desc" id="vtSheetD"></p><div class="vt-chips" id="vtSheetC"></div><p class="vt-note2" id="vtSheetN" hidden></p>' +
      '<div class="vt-sheet-btns" id="vtSheetB"></div></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) {
      if (!ov.classList.contains('show')) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (e.key === 'Tab') {
        var f = ov.querySelectorAll('button:not([disabled])'); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }, true);
  }
  /* o: { art, wide, title, desc, chips: [text], note, primary: { label, cost, cls, disabled, fn }, closeLabel } */
  function open(o) {
    if (!ov) build();
    lastFocus = document.activeElement; cur = o;
    var A = ov.querySelector('#vtSheetArt'); A.className = 'vt-stage-art' + (o.wide ? ' wide' : ''); A.innerHTML = o.art || '';
    ov.querySelector('#vtSheetT').textContent = o.title || '';
    ov.querySelector('#vtSheetD').textContent = o.desc || '';
    var C = ov.querySelector('#vtSheetC'); C.textContent = '';
    (o.chips || []).forEach(function (c) { C.appendChild(el('span', 'vt-chip', c)); }); C.hidden = !(o.chips && o.chips.length);
    var N = ov.querySelector('#vtSheetN'); N.textContent = o.note || ''; N.hidden = !o.note;
    var B = ov.querySelector('#vtSheetB'); B.textContent = '';
    var p = o.primary, pb = null;
    if (p) {
      pb = el('button', 'vt-btn ' + (p.cls || 'go')); pb.type = 'button';
      if (p.cost != null) pb.insertAdjacentHTML('beforeend', art.gem());
      pb.appendChild(el('span', '', p.label + (p.cost != null ? ' · ' + p.cost : '')));
      if (p.disabled) { pb.disabled = true; }
      else pb.addEventListener('click', function () { var r = p.fn && p.fn(); if (r !== false) close(); });
      B.appendChild(pb);
    }
    var cb = el('button', 'vt-btn gold', o.closeLabel || 'Kapat'); cb.type = 'button'; cb.addEventListener('click', close); B.appendChild(cb);
    ov.classList.add('show'); document.body.style.overflow = 'hidden';
    (pb && !pb.disabled ? pb : cb).focus();
  }
  function close() {
    if (!ov || !ov.classList.contains('show')) return;
    ov.classList.remove('show');
    var keepLock = document.querySelector('.studio-page.show, .vt-page.show'); if (!keepLock) document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
    if (cur && cur.onClose) cur.onClose(); cur = null;
  }

  /* ===== Masaüstünde karta hafif eğilme (dokunmatikte yok) ===== */
  if (window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.addEventListener('pointermove', function (e) {
      var it = e.target.closest && e.target.closest('.vt .vt-item'); if (!it) return;
      var c = it.querySelector('.vt-card'), r = c.getBoundingClientRect();
      c.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 14 + 'deg');
      c.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 12 + 'deg');
    });
    document.addEventListener('pointerout', function (e) {
      var it = e.target.closest && e.target.closest('.vt .vt-item'); if (!it || it.contains(e.relatedTarget)) return;
      var c = it.querySelector('.vt-card'); c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg');
    });
  }

  window.MKVitrin = { art: art, card: card, open: open, close: close, el: el };
})();
