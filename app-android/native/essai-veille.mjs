// Essai « écran éteint » : phase avant (lance le service micro + un compteur), phase après (écran éteint depuis 40 s).
// Ajoute ses résultats (pour info) à essai-resultats.json et au résumé du job.
import fs from "node:fs";
const phase = process.argv[2];
const out = JSON.parse(fs.readFileSync("essai-resultats.json", "utf8"));
function rec(n, ok, d) { out.checks.push({ n, ok, d, info: true }); console.log((ok ? "OK    " : "ÉCHEC ") + n + (d !== undefined ? " — " + d : "")); }
try {
  const list = await (await fetch("http://localhost:9222/json")).json();
  const pg = list.find((p) => p.type === "page" && /^https?:/.test(p.url)) || list[0];
  const ws = new WebSocket(pg.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const wait = {};
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait[d.id]) { wait[d.id](d); delete wait[d.id]; } };
  const ev = (expr) => new Promise((r) => { const i = ++id; wait[i] = (d) => r(d.result && d.result.result ? d.result.result.value : undefined); ws.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression: expr, awaitPromise: true, returnByValue: true } })); setTimeout(() => r("pas de réponse"), 30000); });
  if (phase === "avant") {
    rec("Service micro présent (plugin)", await ev("!!(Capacitor.Plugins && Capacitor.Plugins.OwVeille)"));
    const st = await ev("window.__owTick=0;window.__owT0=Date.now();setInterval(()=>window.__owTick++,1000);Capacitor.Plugins.OwVeille.start().then(r=>JSON.stringify(r)).catch(e=>'erreur '+e.message)");
    rec("Service micro allumé", /true/.test(st || ""), st);
  } else {
    const t = await ev("JSON.stringify({tick:window.__owTick,sec:Math.round((Date.now()-window.__owT0)/1000)})");
    let ok = false; try { const j = JSON.parse(t); ok = j.tick >= j.sec * 0.6 && j.sec >= 30; } catch (e) {}
    rec("La page continue de tourner écran éteint", ok, t);
    const sr = await ev("new Promise(r=>{const R=new webkitSpeechRecognition();R.lang='fr-FR';let s=[];R.onstart=()=>s.push('start');R.onerror=e=>s.push('erreur:'+e.error);R.onresult=e=>s.push('texte');R.onend=()=>r(s.join(' '));R.start();setTimeout(()=>r(s.join(' ')+' (15 s)'),15000)})");
    rec("Écoute lancée écran éteint (info : pas de vrai son sur le téléphone virtuel)", /start/.test(sr || "") && !/not-allowed/.test(sr || ""), sr);
    const tts = await ev("new Promise(r=>{const u=new SpeechSynthesisUtterance('Bonsoir');u.lang='fr-FR';u.onend=()=>r('lu');u.onerror=e=>r('erreur '+e.error);speechSynthesis.speak(u);setTimeout(()=>r('pas de réponse en 15 s'),15000);})");
    rec("Lecture à voix haute écran éteint", tts === "lu", tts);
    const fg = fs.existsSync("essai-service.txt") ? fs.readFileSync("essai-service.txt", "utf8") : "";
    rec("Android voit le service au premier plan", /isForeground=true/.test(fg), (fg.match(/isForeground=\w+|foregroundServiceType=\w+/g) || []).join(" ") || "non trouvé");
    const ecran = fs.existsSync("essai-ecran-etat.txt") ? fs.readFileSync("essai-ecran-etat.txt", "utf8").trim() : "";
    rec("Écran bien éteint pendant l'essai", /Asleep|OFF|false/i.test(ecran), ecran);
  }
  ws.close();
} catch (e) { rec("Connexion au débogueur (" + phase + ")", false, String(e)); }
const lignes = `\n### Écran éteint (${phase})\n\n` + out.checks.filter((c) => c.info && !c.s).map((c) => { c.s = 1; return `- ${c.ok ? "✅" : "❌"} ${c.n}${c.d !== undefined ? " — " + c.d : ""}`; }).join("\n") + "\n";
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lignes);
fs.writeFileSync("essai-resultats.json", JSON.stringify(out, null, 1));
