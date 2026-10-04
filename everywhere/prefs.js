/* 24/24 ONE WORLD — préférences d'affichage et d'accessibilité. © 2026 Sébastien Chevrier. Tous droits réservés.
   Chargé dans <head> avant l'affichage (pas de flash) : thème, contraste renforcé, taille du texte.
   Gardées sur cet appareil (clé ew_prefs). Rien n'est envoyé au serveur. */
(function () {
  "use strict";
  var KEY = "ew_prefs";
  var DEF = { theme: "light", contrast: false, text: 0 }; // fond clair par défaut (cahier des charges)
  function read() {
    var p = {};
    try { p = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { p = {}; }
    return {
      theme: ["light", "dark", "auto"].indexOf(p.theme) !== -1 ? p.theme : DEF.theme,
      contrast: p.contrast === true,
      text: [0, 1, 2].indexOf(p.text) !== -1 ? p.text : DEF.text
    };
  }
  function apply(p) {
    var h = document.documentElement;
    h.classList.remove("theme-light", "theme-dark", "theme-auto");
    h.classList.add("theme-" + p.theme);
    h.classList.toggle("contrast-high", !!p.contrast);
    h.setAttribute("data-ts", String(p.text));
  }
  function set(k, v) {
    var p = read();
    p[k] = v;
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* stockage indisponible : réglage pour cette visite seulement */ }
    apply(p);
    return p;
  }
  apply(read());
  window.EWPrefs = { read: read, set: set, apply: apply };
})();
