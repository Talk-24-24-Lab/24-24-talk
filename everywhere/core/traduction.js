/* 24/24 ONE WORLD — adaptateur unique de traduction. © 2026 Sébastien Chevrier. Tous droits réservés.
   Les écrans demandent    OWTraduction.translate(texte, langueSource, langueCible)
   et ne connaissent jamais le fournisseur. Réponse : { text, source: "local" | "distant", provider, label }.

   Fournisseurs essayés dans l'ordre (le premier qui sait répondre gagne) :
     1. "phrases"  LOCAL    — les 29 phrases vérifiées du parcours Voyage (traduction/phrases.js), 6 langues.
                              Aucun envoi, marche hors connexion.
     2. "talk"     DISTANT  — le moteur en ligne DÉJÀ utilisé par TALK et EVERYWHERE : le service gratuit MyMemory
                              (traduction/moteur.js). Ce n'est pas un nouveau moteur : c'est l'existant, tel quel.
                              N'est appelé qu'après l'ACCORD de la personne (le texte quitte l'appareil).
   Emplacements prévus, NON branchés (rien n'est simulé) : moteur local sur l'appareil (ex. Bergamot),
   fournisseur premium via une fonction serveur protégée, IA. Les ajouter = OWTraduction.register({...}),
   sans toucher aux écrans.

   Erreurs (message de l'Error) : EMPTY, UNSUPPORTED_LANG, CONSENT (envoi distant non autorisé), OFFLINE, NETWORK,
   SERVER, QUOTA_PROVIDER, EMPTY_RESULT, NO_PROVIDER. */
(function (root) {
  "use strict";
  var CONSENT_KEY = "ow_tr_distant_v1"; // "1" = la personne accepte l'envoi au service en ligne ; rien d'autre n'est gardé

  var store = {
    get: function (k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { if (v === null) root.localStorage.removeItem(k); else root.localStorage.setItem(k, v); } catch (e) { /* pour cette visite */ } }
  };
  var memConsent = null; // repli si le stockage est bloqué

  function norm(s) {
    return String(s || "").toLowerCase().replace(/[’']/g, "'").replace(/[¿¡?!.,;:«»"]/g, "").replace(/\s+/g, " ").trim();
  }
  function known(code) {
    var L = root.EW_LANGS || [];
    return L.some(function (l) { return l.code === code; });
  }

  // ---------- 1. Phrases vérifiées (local) ----------
  var phrases = {
    id: "phrases", kind: "local",
    label: { fr: "Phrase vérifiée, traduite sur l'appareil", en: "Verified phrase, translated on the device" },
    translate: function (text, from, to) {
      var P = root.EW_PHRASES;
      if (!P || P.langs.indexOf(from) === -1 || P.langs.indexOf(to) === -1) return Promise.resolve(null);
      var k = norm(text);
      var hit = P.list.filter(function (e) { return norm(e[from]) === k; })[0];
      return Promise.resolve(hit && hit[to] ? hit[to] : null);
    }
  };

  // ---------- 2. Moteur existant de TALK / EVERYWHERE (distant) ----------
  var talk = {
    id: "talk", kind: "distant",
    label: { fr: "Traduction automatique en ligne (MyMemory, le service gratuit déjà utilisé par TALK) : vérifiez les informations importantes.",
      en: "Automatic online translation (MyMemory, the free service TALK already uses): check important details." },
    translate: function (text, from, to) {
      if (!root.EWMoteur) return Promise.reject(new Error("NO_PROVIDER"));
      return root.EWMoteur.translate(text, from, to);
    }
  };

  var providers = [phrases, talk];

  function consent() {
    if (memConsent !== null) return memConsent;
    return store.get(CONSENT_KEY) === "1";
  }
  function setConsent(on) {
    memConsent = !!on;
    store.set(CONSENT_KEY, on ? "1" : null);
  }

  function translate(text, from, to) {
    text = String(text || "").trim();
    if (!text) return Promise.reject(new Error("EMPTY"));
    if (!known(from) || !known(to)) return Promise.reject(new Error("UNSUPPORTED_LANG"));
    if (from === to) return Promise.resolve({ text: text, source: "local", provider: "identique", label: null });
    var i = 0, blocked = null;
    function next() {
      var p = providers[i++];
      if (!p) return Promise.reject(new Error(blocked || "NO_PROVIDER"));
      if (p.kind === "distant") {
        // Règle 42.7 : rien ne quitte l'appareil sans l'accord de la personne. Hors ligne : inutile d'essayer.
        if (!consent()) { blocked = blocked || "CONSENT"; return next(); }
        if (root.navigator && root.navigator.onLine === false) { blocked = blocked || "OFFLINE"; return next(); }
      }
      return p.translate(text, from, to).then(function (out) {
        if (out == null || out === "") return next();
        return { text: String(out), source: p.kind, provider: p.id, label: p.label };
      });
    }
    return next();
  }

  // Ajouter un fournisseur (futur moteur local, premium, IA) sans modifier les écrans.
  function register(p, position) {
    if (!p || !p.id || typeof p.translate !== "function" || (p.kind !== "local" && p.kind !== "distant")) throw new Error("FOURNISSEUR_INVALIDE");
    providers = providers.filter(function (x) { return x.id !== p.id; });
    var at = typeof position === "number" ? Math.max(0, Math.min(providers.length, position)) : providers.length;
    providers.splice(at, 0, p);
  }

  var api = {
    translate: translate, register: register, consent: consent, setConsent: setConsent,
    providers: function () { return providers.map(function (p) { return { id: p.id, kind: p.kind }; }); },
    _norm: norm
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.OWTraduction = api;
})(typeof window !== "undefined" ? window : this);
