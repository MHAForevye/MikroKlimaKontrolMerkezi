/* Mağaza ayrı bir sitede (forevye-market reposu). Bu dosya sadece oraya götürür.
   Eski hesabı olanlar için: kristal hesabının kimliği bu tarayıcıda (mk_kristal2) duruyorsa adrese "#hesap=ID.ANAHTAR" eklenir;
   Mağaza bunu bir kez yükler ve adres çubuğundan siler. "#" sonrası sunucuya gönderilmez. Hesabın yoksa düz adres açılır, Mağaza yeni hesap açar. */
(function () {
  'use strict';
  var MARKET_URL = 'https://mhaforevye.github.io/market/';   // Mağaza sitesinin adresi (sonunda /)
  var KEY = 'mk_kristal2';

  function creds() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY));
      if (o && /^\d{8}$/.test(String(o.id)) && /^[A-Za-z0-9_-]{20,64}$/.test(String(o.token))) return { id: String(o.id), token: String(o.token) };
    } catch (e) {}
    return null;
  }
  function url() { var c = creds(); return MARKET_URL + (c ? '#hesap=' + c.id + '.' + c.token : ''); }
  function open() {
    var u = url();
    if (!window.open(u, '_blank', 'noopener')) location.href = u;
  }
  window.MKMagaza = {
    open: open,
    url: url
  };
})();
