/* 24/24 ONE WORLD — tests unitaires de l'adaptateur de traduction (core/traduction.js). Sans navigateur ni réseau.
   Lancement : node everywhere/tests/traduction.js */
const path = require("path");
const results = [];
function rec(name, ok, detail) { results.push({ name, ok: !!ok }); console.log((ok ? "OK   " : "ÉCHEC") + "  " + name + (detail ? "  — " + detail : "")); }

// Environnement minimal : langues, phrases Voyage et moteur existant remplacé par un faux qui compte les envois.
global.window = global;
global.localStorage = (() => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } }; })();
global.navigator = { onLine: true };
require(path.join(__dirname, "../traduction/langues.js"));
require(path.join(__dirname, "../traduction/phrases.js"));
let sent = [];
let engine = (text) => Promise.resolve("[moteur] " + text);
global.EWMoteur = { translate: (text, from, to) => { sent.push({ text, from, to }); return engine(text, from, to); } };
const TR = require(path.join(__dirname, "../core/traduction.js"));

(async () => {
  const code = (p) => p.then(() => "OK", (e) => e.message);

  sent = [];
  let r = await TR.translate("Merci beaucoup", "fr", "en");
  rec("Phrase vérifiée traduite sur l'appareil, sans envoi", r.text === "Thank you very much" && r.source === "local" && r.provider === "phrases" && sent.length === 0, r.text);
  r = await TR.translate("  merci   BEAUCOUP ! ", "fr", "es");
  rec("Phrase vérifiée reconnue malgré majuscules, espaces et ponctuation", r.text === "Muchas gracias" && sent.length === 0, r.text);
  rec("Texte vide refusé (EMPTY)", (await code(TR.translate("   ", "fr", "en"))) === "EMPTY");
  rec("Langue inconnue refusée (UNSUPPORTED_LANG)", (await code(TR.translate("Bonjour", "fr", "xx"))) === "UNSUPPORTED_LANG");
  r = await TR.translate("Bonjour", "fr", "fr");
  rec("Même langue des deux côtés : texte rendu tel quel, sans envoi", r.text === "Bonjour" && sent.length === 0);

  sent = [];
  rec("Texte libre SANS accord : rien n'est envoyé (CONSENT)", (await code(TR.translate("Le chat dort", "fr", "en"))) === "CONSENT" && sent.length === 0);
  TR.setConsent(true);
  r = await TR.translate("Le chat dort", "fr", "en");
  rec("Texte libre AVEC accord : moteur existant (celui de TALK) appelé une fois", r.provider === "talk" && r.source === "distant" && sent.length === 1 && /MyMemory/.test(r.label.fr), r.text);
  rec("Accord gardé sur l'appareil (une seule clé, aucun texte)", localStorage.getItem("ow_tr_distant_v1") === "1");

  sent = [];
  navigator.onLine = false;
  rec("Hors ligne : texte libre refusé (OFFLINE), rien n'est tenté", (await code(TR.translate("Le chat dort", "fr", "en"))) === "OFFLINE" && sent.length === 0);
  r = await TR.translate("Bonjour", "fr", "de");
  rec("Hors ligne : les phrases vérifiées marchent encore (mode dégradé)", r.text === "Guten Tag", r.text);
  navigator.onLine = true;

  for (const err of ["NETWORK", "SERVER", "QUOTA_PROVIDER", "EMPTY_RESULT"]) {
    engine = () => Promise.reject(new Error(err));
    rec("Erreur du moteur transmise telle quelle (" + err + "), aucune traduction inventée", (await code(TR.translate("Le chat dort", "fr", "en"))) === err);
  }
  engine = (text) => Promise.resolve("[moteur] " + text);

  // Futur fournisseur (ex. moteur local sur l'appareil) : branché sans toucher aux écrans, essayé avant le distant.
  TR.register({ id: "local-test", kind: "local", translate: (t) => Promise.resolve(t === "Le chien" ? "The dog" : null) }, 1);
  sent = [];
  r = await TR.translate("Le chien", "fr", "en");
  rec("Nouveau fournisseur local ajouté par register(), utilisé avant le distant", r.provider === "local-test" && sent.length === 0 && TR.providers().map((p) => p.id).join(",") === "phrases,local-test,talk");
  let bad = false;
  try { TR.register({ id: "x", kind: "magique", translate() {} }); } catch (e) { bad = true; }
  rec("Fournisseur mal décrit refusé", bad);

  TR.setConsent(false);
  sent = [];
  rec("Accord retiré : plus aucun envoi", (await code(TR.translate("Le chat dort", "fr", "en"))) === "CONSENT" && sent.length === 0 && localStorage.getItem("ow_tr_distant_v1") === null);

  const ok = results.filter((x) => x.ok).length;
  console.log("\n" + ok + " / " + results.length + " tests réussis");
  process.exit(ok === results.length ? 0 : 1);
})();
