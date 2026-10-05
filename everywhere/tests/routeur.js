/* 24/24 ONE WORLD — tests unitaires du routeur démonstrateur (core/routeur.js). Sans navigateur ni réseau.
   Lancement : node everywhere/tests/routeur.js */
const R = require("../core/routeur.js");
const results = [];
function rec(name, ok, detail) { results.push(!!ok); console.log((ok ? "OK   " : "ÉCHEC") + "  " + name + (detail ? "  — " + detail : "")); }

const DEVICE = { text: true, voice: true, call: true, translation: true, video: true, file: true, media: true, location: true, contacts: true };
const ALL = { message: true, call: true };
const base = (o) => Object.assign({ intent: "message", relationship: { id: "r1", kind: "personnel" }, context: "personal", permissions: ALL, device: DEVICE,
  env: { online: true, account: true } }, o);

let r = R.route(base());
rec("MESSAGE, TALK disponible → TALK", r.status === "ok" && r.channel === "talk" && !r.fallback);

r = R.route(base({ env: { online: false, account: true } }));
rec("MESSAGE, TALK indisponible, aucun autre moyen partagé → « aucun canal » (rien d'inventé)", r.status === "aucun-canal" && r.channel === null && r.tried.map((x) => x.channel + ":" + x.reason).join() === "talk:hors-ligne,sms:non-partage,email:non-partage", JSON.stringify(r.tried));

r = R.route(base({ env: { online: false, account: true }, relationship: { id: "r1", shared: { phone: true } } }));
rec("MESSAGE, TALK indisponible, téléphone partagé par la relation → SMS (secours)", r.status === "ok" && r.channel === "sms" && r.fallback && r.type === "relais");

r = R.route(base({ env: { online: false, account: true }, relationship: { id: "r1", shared: { email: true } } }));
rec("MESSAGE, TALK et SMS indisponibles, e-mail autorisé → e-mail", r.status === "ok" && r.channel === "email");

const leak = ["video", "file", "location", "contacts", "private_data", "voice", "call", "media"].filter((k) => r.capabilities[k]);
rec("Règle absolue : le secours n'augmente JAMAIS les droits (pas de vidéo, fichier, localisation, contacts, données privées)", leak.length === 0 && r.capabilities.text === true, "capacités en secours : " + Object.keys(r.capabilities).filter((k) => r.capabilities[k]).join(","));

r = R.route(base({ intent: "call", env: { online: false, account: true }, relationship: { id: "r1", shared: { phone: true, email: true } } }));
rec("APPEL, TALK indisponible : le SMS ne devient pas un appel → « aucun canal »", r.status === "aucun-canal" && r.tried.every((x) => x.channel === "talk" ? x.reason === "hors-ligne" : x.reason === "capacite"));

r = R.route(base({ permissions: { message: false, call: true }, relationship: { id: "r1", shared: { phone: true, email: true } } }));
rec("Permission refusée par le serveur : aucun canal ne la contourne (pas même un relais)", r.status === "refuse" && r.reason === "permission" && r.tried.length === 0);

r = R.route(base({ permissions: null }));
rec("Permissions inconnues (serveur muet) : tout fermé", r.status === "refuse");

r = R.route(base({ intent: "video" }));
rec("VIDÉO : autorisée nulle part aujourd'hui (aucun canal n'a la vidéo) → refus honnête", r.status === "refuse" && r.reason === "permission");

r = R.route(base({ intent: "call", device: { text: true } }));
rec("APPEL sur un téléphone sans micro : refusé pour raison d'appareil (capacité)", r.status === "aucun-canal" && r.tried[0].reason === "capacite");

r = R.route(base({ privacy: { encryption: true } }));
rec("Confidentialité exigée (chiffrement de bout en bout) : TALK ne l'a pas → refusé, dit honnêtement", r.status === "aucun-canal" && r.tried[0].reason === "confidentialite");

r = R.route(base({ preferences: { order: ["email", "talk"] }, relationship: { id: "r1", shared: { email: true } } }));
rec("Canal préféré de la relation respecté (e-mail avant TALK quand c'est son choix)", r.status === "ok" && r.channel === "email" && r.fallback === false);

const a = R.route(base({ env: { online: false, account: true }, relationship: { id: "r1", shared: { phone: true } } }));
const b = R.route(base());
rec("Recalcul à chaque fois : après un secours SMS, le retour du réseau redonne TALK (aucun canal mémorisé)", a.channel === "sms" && b.channel === "talk");

r = R.route(base({ intent: "localisation" }));
rec("Intention inconnue refusée", r.status === "refuse" && r.reason === "intention-inconnue");

r = R.route(base({ permissions: { message: true, call: true, video: true, file: true, location: true } }));
rec("Le serveur ne peut accorder que ce que le modèle connaît : « video », « file », « location » ignorés tant que can() ne les gère pas", !r.capabilities.video && !r.capabilities.file && !r.capabilities.location);

const ok = results.filter(Boolean).length;
console.log("\n" + ok + " / " + results.length + " tests réussis");
process.exit(ok === results.length ? 0 : 1);
