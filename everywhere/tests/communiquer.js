/* Tests unitaires du point d'entrée « Communiquer » (everywhere/core/communiquer.js). © 2026 Sébastien Chevrier.
   Sans navigateur ni réseau : node everywhere/tests/communiquer.js */
const OWCom = require("../core/communiquer.js");
const results = [];
function step(name, fn) {
  let r; try { r = fn(); } catch (e) { r = { ok: false, detail: String(e) }; }
  results.push(Object.assign({ name }, r)); console.log((r.ok ? "OK     " : "ÉCHEC  ") + name + (r.detail ? "  — " + r.detail : ""));
}
const ALL = { message: true, call: true, start_conversation: true, read_profile: true, block: true, report: true };
const person = { convId: "aaaaaaaa-0000-4000-8000-000000000001", pseudo: "kenji" };
const phone = { RTCPeerConnection: function () {}, navigator: { mediaDevices: { getUserMedia: function () {} } } };
const noMic = { RTCPeerConnection: function () {}, navigator: {} };
const url = (q) => "../index.html" + q;

step("Capacités : TALK déclare texte, voix, appel ; vidéo, fichiers, réactions, présence = non (rien de supposé)", () => {
  const c = OWCom.capabilities(phone);
  return { ok: c.text && c.voice && c.call && !c.video && !c.files && !c.images && !c.reactions && !c.presence && !c.groups };
});
step("Capacités : téléphone sans micro → appel impossible, texte toujours possible", () => {
  const c = OWCom.capabilities(noMic);
  return { ok: !c.call && c.text };
});
step("Contact autorisé : Écrire puis Appeler, vidéo « pas encore » en dernier", () => {
  const o = OWCom.resolve(person, "personal", ALL, OWCom.capabilities(phone), url);
  return { ok: o.map((x) => x.intent + ":" + x.available).join() === "message:true,call:true,video:false" && o[0].href === "../index.html?ew=1&ew_ecrire=aaaaaaaa-0000-4000-8000-000000000001" && o[1].href === "../index.html?ew=1&ew_appel=aaaaaaaa-0000-4000-8000-000000000001", detail: o.map((x) => x.intent).join(" > ") };
});
step("Permission d'appel refusée par le serveur : appel indisponible (raison « permission »), message reste", () => {
  const o = OWCom.resolve(person, "personal", Object.assign({}, ALL, { call: false }), OWCom.capabilities(phone), url);
  const call = o.find((x) => x.intent === "call");
  return { ok: !call.available && call.reason === "permission" && o[0].intent === "message" && o[0].available };
});
step("Sans micro : appel indisponible (raison « appareil »), dégradation propre vers le message", () => {
  const o = OWCom.resolve(person, "personal", ALL, OWCom.capabilities(noMic), url);
  const call = o.find((x) => x.intent === "call");
  return { ok: !call.available && call.reason === "appareil" && o[0].intent === "message" && o[0].available };
});
step("Aucune permission (réseau coupé, appareil déconnecté) : rien n'est proposé", () => {
  const o = OWCom.resolve(person, "personal", OWCom.NONE, OWCom.capabilities(phone), url);
  return { ok: o.every((x) => !x.available) };
});
step("Identifiant de discussion piégé : encodé dans le lien, rien ne s'injecte", () => {
  const o = OWCom.resolve({ convId: '"><img src=x onerror=alert(1)>' }, "personal", ALL, OWCom.capabilities(phone), url);
  return { ok: o[0].href.indexOf("<") === -1 && o[0].href.indexOf('"') === -1, detail: o[0].href };
});
const runAsync = async () => {
  const mk = (r) => ({ rpc: () => (r instanceof Error ? Promise.reject(r) : Promise.resolve(r)) });
  const a = await OWCom.permissions(mk({ data: Object.assign({ context: "personal" }, ALL), error: null }), "x");
  const b = await OWCom.permissions(mk({ data: null, error: { code: "PGRST202" } }), "x");
  const c = await OWCom.permissions(mk(new TypeError("Failed to fetch")), "x");
  const d = await OWCom.permissions(mk({ data: null, error: { code: "P0001", message: "AUTH" } }), "x");
  step("Permissions : réponse du serveur utilisée telle quelle", () => ({ ok: a.ok && a.source === "serveur" && a.perms.call }));
  step("Permissions : base sans moteur → ancienne règle (la liste ne contient que des contacts autorisés)", () => ({ ok: b.ok && b.source === "ancienne-regle" }));
  step("Permissions : réseau coupé → tout fermé", () => ({ ok: !c.ok && !c.perms.message && !c.perms.call }));
  step("Permissions : session refusée par le serveur → tout fermé", () => ({ ok: !d.ok && !d.perms.message }));
  const ok = results.filter((r) => r.ok).length;
  console.log("\n" + ok + " / " + results.length + " tests réussis");
  process.exit(ok === results.length ? 0 : 1);
};
runAsync();
