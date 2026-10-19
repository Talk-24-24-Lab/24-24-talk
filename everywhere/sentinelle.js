/* 24/24 ONE WORLD — signalement anonyme des erreurs techniques à Sentry (serveurs dans l'Union européenne).
   Pourquoi : savoir quand l'application plante sur le téléphone d'un vrai utilisateur, pour la corriger.
   Ce qui part : le message d'erreur, les fichiers et lignes en cause, l'écran (sans paramètres), la langue,
   le navigateur. Ce qui ne part JAMAIS : messages, pseudo, contacts, adresse e-mail, texte traduit.
   Aucun script extérieur n'est chargé : un simple envoi au service, au plus 5 par page ouverte.
   Désactivé sur les copies locales et le site de test (le DSN est public par nature, comme une adresse). */
(function () {
  "use strict";
  var DSN_KEY = "4d236be6953a509f6a9fc5e80fee3ec8";
  var URL_ENVOI = "https://o4512271356788736.ingest.de.sentry.io/api/4512271364194384/envelope/?sentry_key=" + DSN_KEY + "&sentry_version=7";
  var VERSION = "one-world@0.8.5";
  if (location.hostname !== "sebastienchevrier.github.io" && !window.__SENTINELLE_TEST) return;

  var envoyes = 0, deja = {};
  // Retire tout ce qui pourrait désigner une personne : paramètres d'adresse (?ajouter=pseudo), jetons, adresses e-mail.
  function propre(t) {
    return String(t || "").replace(/[?#][^\s)'"]*/g, "").replace(/[^\s@]+@[^\s@]+\.[a-z]{2,}/gi, "[e-mail]").slice(0, 600);
  }
  function ecran() {
    var h = (location.hash || "").split("?")[0].replace(/[=&].*$/, "").slice(0, 60);
    return location.pathname.replace(/^\/24-24-talk/, "") + h;
  }
  function pile(err) {
    var s = err && err.stack ? String(err.stack).split("\n") : [];
    var cadres = [];
    s.forEach(function (l) {
      var m = l.match(/(?:at\s+(?:(.*?)\s+\()?)?((?:https?:\/\/)[^\s)]+?):(\d+):(\d+)\)?\s*$/) || l.match(/^(.*?)@((?:https?:\/\/)[^\s]+?):(\d+):(\d+)$/);
      if (m) cadres.unshift({ "function": propre(m[1] || "?").slice(0, 80) || "?", filename: propre(m[2]), lineno: +m[3], colno: +m[4], in_app: /24-24-talk/.test(m[2]) });
    });
    return cadres.slice(-20);
  }
  function hex(n) { var s = ""; for (var i = 0; i < n; i++) s += "0123456789abcdef"[Math.floor(Math.random() * 16)]; return s; }

  function envoyer(type, message, err, fichier, ligne) {
    try {
      var cle = type + "|" + message + "|" + (fichier || "") + "|" + (ligne || "");
      if (envoyes >= 5 || deja[cle]) return;
      // Bruit sans intérêt : extensions du navigateur, scripts d'autres sites, erreurs muettes.
      if (/^Script error\.?$/.test(message) || /extension:\/\/|ResizeObserver loop/.test(message + (fichier || ""))) return;
      deja[cle] = 1; envoyes++;
      var id = hex(32), maintenant = new Date().toISOString();
      var cadres = pile(err);
      if (!cadres.length && fichier) cadres = [{ "function": "?", filename: propre(fichier), lineno: ligne || 0, in_app: true }];
      var ev = {
        event_id: id, timestamp: maintenant, platform: "javascript", level: "error", release: VERSION,
        environment: "production",
        // Demande à Sentry de ne jamais déduire ni garder l'adresse IP de la personne.
        sdk: { name: "one-world.sentinelle", version: "1.0.0", settings: { infer_ip: "never" } },
        tags: { ecran: ecran(), langue: (document.documentElement.lang || "?").slice(0, 8), en_ligne: navigator.onLine === false ? "non" : "oui", type: type },
        request: { url: location.origin + location.pathname, headers: { "User-Agent": navigator.userAgent } },
        exception: { values: [{ type: propre(err && err.name ? err.name : type).slice(0, 80), value: propre(message), stacktrace: cadres.length ? { frames: cadres } : undefined }] }
      };
      var corps = JSON.stringify({ event_id: id, sent_at: maintenant }) + "\n" + JSON.stringify({ type: "event" }) + "\n" + JSON.stringify(ev);
      if (navigator.sendBeacon && navigator.sendBeacon(URL_ENVOI, new Blob([corps], { type: "text/plain;charset=UTF-8" }))) return;
      fetch(URL_ENVOI, { method: "POST", body: corps, keepalive: true, mode: "no-cors" }).catch(function () {});
    } catch (e) { /* le signalement ne doit jamais casser l'application */ }
  }

  window.addEventListener("error", function (e) {
    if (!e || !e.message) return; // erreur de chargement d'image ou de fichier : ignorée
    envoyer("erreur", e.message, e.error, e.filename, e.lineno);
  });
  window.addEventListener("unhandledrejection", function (e) {
    var r = e && e.reason;
    // Refus normaux (pas de réseau, micro refusé, quota de traduction) : ce ne sont pas des pannes.
    var msg = r && r.message ? r.message : String(r);
    if (/^(OFFLINE|NETWORK|DENIED|QUOTA_PROVIDER|NO_SPEECH|ABORT)$/.test(msg) || (r && r.name === "AbortError")) return;
    envoyer("promesse", msg, r instanceof Error ? r : null);
  });
  window.EWSentinelle = { signaler: function (err) { envoyer("signalé", err && err.message ? err.message : String(err), err); } };
})();
