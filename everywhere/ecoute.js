/* 24/24 ONE WORLD — LISTEN : écran gardé allumé pendant l'écoute, et indicateur « lecture en cours ». © 2026 Sébastien Chevrier. Tous droits réservés.
   Chargé par le portail et par TALK. Aucune donnée envoyée, aucune autorisation demandée à la personne.
   - keepAwake(nom, quandInactif) : l'écran ne s'éteint pas tant qu'une écoute est active (Mode vocal de TALK, conversation
     côte à côte d'EVERYWHERE). Après 2 minutes sans parole ni lecture (activity() non appelé), l'écran est libéré et
     quandInactif() est appelé pour arrêter proprement l'écoute. Navigateur sans cette fonction : rien ne change.
   - Indicateur commun : quand le téléphone lit un texte à voix haute, une pastille « 🔊 Lecture en cours » avec un bouton
     « Arrêter » s'affiche en bas de l'écran, partout. */
(function () {
  "use strict";
  var IDLE_MS = window.EW_IDLE_MS || 2 * 60 * 1000; // EW_IDLE_MS : seulement pour les tests automatiques
  var owners = {};   // nom → { onIdle }
  var lock = null, asking = false, lastActivity = Date.now(), idleTimer = null;

  function any() { return Object.keys(owners).length > 0; }
  function acquire() {
    if (lock || asking || !any() || document.visibilityState === "hidden") return;
    if (!navigator.wakeLock || !navigator.wakeLock.request) return;
    asking = true;
    navigator.wakeLock.request("screen").then(function (l) {
      asking = false;
      if (!any()) { l.release().catch(function () {}); return; }
      lock = l;
      l.addEventListener("release", function () { if (lock === l) lock = null; });
    }, function () { asking = false; /* refusé (économie d'énergie) : l'écran suivra le réglage du téléphone */ });
  }
  function drop() {
    if (lock) { var l = lock; lock = null; l.release().catch(function () {}); }
  }
  function armIdle() {
    clearTimeout(idleTimer);
    if (!any()) return;
    idleTimer = setTimeout(function () {
      if (Date.now() - lastActivity < IDLE_MS - 50) { armIdle(); return; }
      var list = owners;
      owners = {};
      drop();
      Object.keys(list).forEach(function (k) { try { if (list[k].onIdle) list[k].onIdle(); } catch (e) { /* l'écoute est déjà arrêtée */ } });
    }, Math.max(1000, IDLE_MS - (Date.now() - lastActivity)));
  }
  function keepAwake(name, onIdle) {
    owners[name] = { onIdle: onIdle || null };
    lastActivity = Date.now();
    acquire();
    armIdle();
  }
  function release(name) {
    delete owners[name];
    if (!any()) { drop(); clearTimeout(idleTimer); }
  }
  function activity() { lastActivity = Date.now(); if (any()) armIdle(); }
  // Retour dans l'appli : le navigateur a rendu l'écran, on le redemande.
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") acquire(); });

  // ---------- Indicateur « lecture en cours » ----------
  var LBL = /^fr/i.test(document.documentElement.lang || navigator.language || "fr") ? { on: "Lecture en cours", stop: "Arrêter" } : { on: "Reading aloud", stop: "Stop" };
  try {
    var ui = localStorage.getItem("lc_uilang");
    if (ui && ui !== "auto") LBL = ui === "fr" ? { on: "Lecture en cours", stop: "Arrêter" } : { on: "Reading aloud", stop: "Stop" };
  } catch (e) { /* langue du téléphone */ }
  var chip = null;
  function ensureChip() {
    if (chip || !document.body) return chip;
    var st = document.createElement("style");
    st.textContent = ".ewl-chip{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:1990;" +
      "display:flex;align-items:center;gap:10px;padding:6px 6px 6px 14px;border-radius:999px;background:#0d1733;color:#fff;" +
      "box-shadow:0 6px 20px rgba(0,0,0,.3);font:600 14px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;border:2px solid #1fe2cd;max-width:calc(100% - 24px);}" +
      ".ewl-chip span,.ewl-chip button{white-space:nowrap;}.ewl-chip[hidden]{display:none;}.ewl-chip button{min-width:44px;min-height:40px;border-radius:999px;border:0;background:#fff;color:#0d1733;font-weight:800;padding:0 14px;cursor:pointer;}" +
      "html.ew-mic-on .ewl-chip{display:none;}";
    document.head.appendChild(st);
    chip = document.createElement("div");
    chip.className = "ewl-chip";
    chip.id = "ewlChip";
    chip.hidden = true;
    chip.setAttribute("role", "status");
    chip.innerHTML = '<span aria-hidden="true">🔊</span><span>' + LBL.on + '</span><button type="button" id="ewlStop">⏸ ' + LBL.stop + "</button>";
    document.body.appendChild(chip);
    chip.querySelector("#ewlStop").addEventListener("click", function () {
      try { window.speechSynthesis.cancel(); } catch (e) { /* rien à couper */ }
      chip.hidden = true;
      try { window.dispatchEvent(new CustomEvent("ew:speech-stop")); } catch (e) { /* ancien navigateur */ }
    });
    return chip;
  }
  var was = false;
  function tick() {
    var on = false;
    try { on = !!(window.speechSynthesis && window.speechSynthesis.speaking); } catch (e) { on = false; }
    if (on) activity();
    if (on !== was) {
      was = on;
      var c = ensureChip();
      if (c) c.hidden = !on;
    }
  }
  if (window.speechSynthesis) setInterval(function () { if (document.visibilityState !== "hidden") tick(); }, 400);

  window.EWEcoute = { keepAwake: keepAwake, release: release, activity: activity, _state: function () { return { locked: !!lock, owners: Object.keys(owners) }; }, IDLE_MS: IDLE_MS };
})();
