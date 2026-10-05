/* 24/24 ONE WORLD — routeur de communication, DÉMONSTRATEUR (non branché aux écrans). © 2026 Sébastien Chevrier.
   Modèle : INTENTION → RELATION → CONTEXTE → PERMISSIONS → CAPACITÉS → ROUTAGE → CANAL → SECOURS.
   C'est l'évolution de OWCom.resolve (core/communiquer.js, lot 4), pas un deuxième système :
     - les PERMISSIONS viennent toujours du serveur (ow_permissions → private.can) ; ici on ne fait que les lire ;
     - les CAPACITÉS d'un canal sont déclarées d'après le code réel ; inconnue = false (ADR-002) ;
     - chaque appel recalcule tout depuis zéro : aucun canal n'est mémorisé (ADR-04 de la veille).

   RÈGLE ABSOLUE : UN SECOURS N'AUGMENTE JAMAIS LES DROITS.
   Ce qu'un canal peut faire = (droits accordés par la relation) ∩ (capacités du canal) ∩ (capacités de l'appareil).
   Passer à un canal de secours ne peut que RETIRER des capacités, jamais en ajouter. Chaque capacité est indépendante.

   Canaux : seul TALK existe vraiment. Les canaux relais (SMS, e-mail) sont décrits mais restent FERMÉS tant que
   la personne n'a pas partagé ce moyen avec CETTE relation : aujourd'hui, aucune relation ne le permet (pas de table
   des relations, lot 3 / I1). Rien n'est simulé : le routeur répond honnêtement « aucun canal ». */
(function (root) {
  "use strict";

  // Capacités représentées (directive « Capability engine ») ; toute autre clé est refusée.
  var CAPS = ["text", "media", "file", "voice", "call", "video", "group", "reaction", "encryption", "translation", "location", "contacts", "private_data"];
  // Intention → capacités indispensables. Liste fermée, petite (veille §16.4).
  var INTENTS = {
    message: ["text"],
    call: ["call", "voice"],
    video: ["video", "voice"],
    translate: ["translation", "text"],
    file: ["file"]
  };
  // Registre des canaux. type : "pilote" (ONE WORLD le conduit) ou "relais" (le téléphone ouvre une autre appli).
  var CHANNELS = [
    { id: "talk", type: "pilote", needs: { online: true, account: true },
      caps: { text: true, voice: true, call: true, translation: true, encryption: false, video: false, file: false, media: false, group: false, reaction: false } },
    { id: "sms", type: "relais", needs: { shared: "phone" }, caps: { text: true } },
    { id: "email", type: "relais", needs: { shared: "email" }, caps: { text: true } }
  ];

  function only(obj) {
    var out = {};
    CAPS.forEach(function (k) { out[k] = !!(obj && obj[k] === true); });
    return out;
  }
  function and(a, b, c) {
    var out = {};
    CAPS.forEach(function (k) { out[k] = !!(a[k] && b[k] && c[k]); });
    return out;
  }

  // Droits accordés par la relation, à partir de la réponse du serveur (ow_permissions). Inconnu = refusé.
  function grantedFrom(perms) {
    perms = perms || {};
    return only({ text: perms.message === true, translation: perms.message === true, voice: perms.call === true, call: perms.call === true });
  }

  // Pourquoi un canal ne peut pas servir (vide = il peut).
  function blocker(ch, req) {
    var env = req.env || {};
    var rel = req.relationship || {};
    if (ch.needs.online && env.online === false) return "hors-ligne";
    if (ch.needs.account && !env.account) return "pas-de-compte";
    if (ch.needs.shared && !(rel.shared && rel.shared[ch.needs.shared] === true)) return "non-partage";
    if (req.privacy && req.privacy.encryption === true && !(ch.caps.encryption === true)) return "confidentialite";
    return "";
  }

  // Entrée : { intent, relationship: { id, kind, shared: { phone, email } }, context, permissions, device, env: { online, account },
  //            preferences: { order: [canaux] }, privacy: { encryption } }
  // Sortie (CommunicationRoute) : { intent, status: "ok" | "aucun-canal" | "refuse", channel, capabilities, fallback, tried: [{ channel, reason }] }
  function route(req) {
    req = req || {};
    var need = INTENTS[req.intent];
    if (!need) return { intent: req.intent, status: "refuse", reason: "intention-inconnue", channel: null, capabilities: only({}), fallback: false, tried: [] };
    var granted = grantedFrom(req.permissions);
    var device = only(req.device || {});
    // Permission d'abord : si la relation ne le permet pas, AUCUN canal ne peut le rendre possible.
    var missing = need.filter(function (k) { return !granted[k]; });
    if (missing.length) return { intent: req.intent, status: "refuse", reason: "permission", channel: null, capabilities: only({}), fallback: false, tried: [] };
    var order = (req.preferences && req.preferences.order) || [];
    var list = CHANNELS.slice().sort(function (a, b) {
      var ia = order.indexOf(a.id), ib = order.indexOf(b.id);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || CHANNELS.indexOf(a) - CHANNELS.indexOf(b);
    });
    var tried = [];
    for (var i = 0; i < list.length; i++) {
      var ch = list[i];
      var why = blocker(ch, req);
      // Capacités effectives : intersection, recalculée pour CE canal (jamais héritée du canal précédent).
      var eff = and(granted, only(ch.caps), device);
      if (!why) why = need.filter(function (k) { return !eff[k]; }).length ? "capacite" : "";
      if (why) { tried.push({ channel: ch.id, reason: why }); continue; }
      return { intent: req.intent, status: "ok", channel: ch.id, type: ch.type, capabilities: eff, fallback: tried.length > 0, tried: tried };
    }
    return { intent: req.intent, status: "aucun-canal", reason: tried.length ? tried[tried.length - 1].reason : "aucun", channel: null, capabilities: only({}), fallback: false, tried: tried };
  }

  var api = { route: route, CAPS: CAPS, INTENTS: INTENTS, CHANNELS: CHANNELS, grantedFrom: grantedFrom };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.OWRouteur = api;
})(typeof window !== "undefined" ? window : this);
