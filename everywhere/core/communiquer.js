/* 24/24 ONE WORLD — point d'entrée unique « Communiquer » (TALK BUS, lot 4). © 2026 Sébastien Chevrier.
   Un écran ne choisit plus lui-même comment joindre quelqu'un : il demande
       OWCom.resolve(personne, contexte, permissions, capacités)
   et reçoit la liste des moyens, dans l'ordre, chacun « disponible » ou non avec sa raison.

   Deux notions séparées (directive, section 212) :
   - PERMISSION = ai-je le droit ? Décidée par le SERVEUR (public.ow_permissions → private.can). Ici on ne fait
     qu'afficher la réponse ; le serveur refait le contrôle à chaque action réelle (message, sonnerie).
   - CAPACITÉ   = le canal et ce téléphone savent-ils le faire ? Déclarée ici d'après le code réel de TALK,
     jamais supposée : la vidéo, les fichiers, les réactions et la présence n'existent pas encore → false.

   Canal unique aujourd'hui : TALK (interne). Les liens d'invitation (partage, SMS, e-mail) restent dans l'écran
   d'invitation : ils servent à joindre quelqu'un qui n'est pas encore sur TALK. */
(function (root) {
  "use strict";

  // Ce que le canal TALK sait faire, d'après index.html (5 octobre 2026).
  var TALK_CHANNEL = { text: true, voice: true, call: true, video: false, files: false, images: false, reactions: false, groups: false, presence: false };

  // Capacités réelles : celles du canal, limitées par ce téléphone (un appel demande micro + WebRTC).
  function capabilities(env) {
    env = env || root;
    var nav = env.navigator || {};
    var webrtc = typeof env.RTCPeerConnection === "function";
    var mic = !!(nav.mediaDevices && typeof nav.mediaDevices.getUserMedia === "function");
    var c = {};
    for (var k in TALK_CHANNEL) c[k] = TALK_CHANNEL[k];
    if (!(webrtc && mic)) c.call = false;
    return c;
  }

  var NONE = { message: false, call: false, start_conversation: false, read_profile: false, block: false, report: false };

  // Permissions décidées par le serveur. Réponses possibles :
  //   { ok: true, perms, source: "serveur" }        réponse du moteur
  //   { ok: true, perms, source: "ancienne-regle" }  base sans moteur (ex. production actuelle) : la liste ne contient
  //                                                  que des contacts autorisés, et le serveur contrôle chaque action
  //   { ok: false, perms: NONE }                     réseau coupé, session expirée… : tout fermé
  function permissions(sb, otherId, context) {
    return Promise.resolve().then(function () {
      return sb.rpc("ow_permissions", { p_other: otherId, p_context: context || "personal" });
    }).then(function (r) {
      if (r && !r.error && r.data && typeof r.data === "object") return { ok: true, perms: r.data, source: "serveur" };
      var code = r && r.error && (r.error.code || "");
      if (code === "PGRST202" || code === "42883") {
        return { ok: true, perms: { message: true, call: true, start_conversation: true, read_profile: true, block: true, report: true }, source: "ancienne-regle" };
      }
      return { ok: false, perms: NONE };
    }, function () { return { ok: false, perms: NONE }; });
  }

  // Le cœur : combine permission et capacité, pour une intention donnée ou toutes.
  // personne = { convId, pseudo } ; liens TALK existants : ?ew_ecrire=<discussion>, ?ew_appel=<discussion>.
  function resolve(person, context, perms, caps, talkUrl) {
    perms = perms || NONE;
    caps = caps || capabilities();
    var conv = person && person.convId ? encodeURIComponent(person.convId) : "";
    var link = function (q) { return typeof talkUrl === "function" ? talkUrl(q) : "index.html" + q; };
    var out = [
      { intent: "message", available: !!(perms.message && caps.text && conv),
        reason: !perms.message ? "permission" : !caps.text ? "capacite" : !conv ? "discussion" : "",
        href: conv ? link("?ew=1&ew_ecrire=" + conv) : "" },
      { intent: "call", available: !!(perms.call && caps.call && conv),
        reason: !perms.call ? "permission" : !caps.call ? "appareil" : !conv ? "discussion" : "",
        href: conv ? link("?ew=1&ew_appel=" + conv) : "" },
      { intent: "video", available: false, reason: "pas-encore", href: "" }
    ];
    // Ordre : ce qui est possible d'abord (dégradation propre : pas de vidéo → message et appel restent).
    return out.filter(function (o) { return o.available; }).concat(out.filter(function (o) { return !o.available; }));
  }

  var api = { capabilities: capabilities, permissions: permissions, resolve: resolve, TALK_CHANNEL: TALK_CHANNEL, NONE: NONE };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.OWCom = api;
})(typeof window !== "undefined" ? window : this);
