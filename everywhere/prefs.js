/* 24/24 ONE WORLD — préférences d'affichage et d'accessibilité. © 2026 Sébastien Chevrier. Tous droits réservés.
   Chargé dans <head> avant l'affichage (pas de flash) : thème, contraste renforcé, taille du texte, animations réduites.
   Les mêmes réglages (sauf le thème) s'appliquent aussi dans TALK (index.html).
   Gardées sur cet appareil (clé ew_prefs). Rien n'est envoyé au serveur. */
(function () {
  "use strict";
  var KEY = "ew_prefs";
  var DEF = { theme: "dark", contrast: false, text: 0, motion: false }; // bleu nuit par défaut depuis 0.8.0 (maquette validée par Sébastien)
  function read() {
    var p = {};
    try { p = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { p = {}; }
    return {
      theme: ["light", "dark", "auto"].indexOf(p.theme) !== -1 ? p.theme : DEF.theme,
      contrast: p.contrast === true,
      motion: p.motion === true,
      text: [0, 1, 2].indexOf(p.text) !== -1 ? p.text : DEF.text
    };
  }
  function apply(p) {
    var h = document.documentElement;
    h.classList.remove("theme-light", "theme-dark", "theme-auto");
    h.classList.add("theme-" + p.theme);
    h.classList.toggle("contrast-high", !!p.contrast);
    h.classList.toggle("motion-off", !!p.motion);
    h.setAttribute("data-ts", String(p.text));
    h.classList.toggle("reduce-motion", !!p.motion);
  }
  function set(k, v) {
    var p = read(), raw = {};
    try { raw = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { raw = {}; }
    Object.keys(raw).forEach(function (x) { if (!(x in p)) p[x] = raw[x]; });
    p[k] = v;
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* stockage indisponible : réglage pour cette visite seulement */ }
    apply(p);
    return p;
  }
  apply(read());
  window.EWPrefs = { read: read, set: set, apply: apply };
})();
