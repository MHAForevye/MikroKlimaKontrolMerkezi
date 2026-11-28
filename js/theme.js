/* Tema ve görünüm: sayfa çizilmeden önce çalışır (açılışta yanıp sönmesin). Satır içi betik olmasın diye ayrı dosya.
   mk_theme: "light" | "dark" (yoksa Otomatik: cihazın gece/gündüz ayarı).  mk_skin: "sade" | "classic" (Ayrıntılı). */
(function(){var r=document.documentElement,t=null,k=null;try{t=localStorage.getItem("mk_theme");k=localStorage.getItem("mk_skin")}catch(e){}
var d=!!(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches),p=(t==="light"||t==="dark")?t:"auto";
r.setAttribute("data-theme-pref",p);r.setAttribute("data-theme",p==="auto"?(d?"dark":"light"):p);r.setAttribute("data-skin",k==="classic"?"classic":"sade");})();
