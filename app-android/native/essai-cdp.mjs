// Lit l'état de l'appli dans la WebView (protocole de débogage Chrome) et écrit essai-resultats.json + le résumé du job.
import fs from "node:fs";
const out = { ok: false, checks: [] };
function rec(n, ok, d) { out.checks.push({ n, ok, d }); console.log((ok ? "OK    " : "ÉCHEC ") + n + (d !== undefined ? " — " + d : "")); }
try {
  const list = await (await fetch("http://localhost:9222/json")).json();
  const pg = list.find((p) => p.type === "page" && /^https?:/.test(p.url)) || list[0];
  const ws = new WebSocket(pg.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const wait = {};
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait[d.id]) { wait[d.id](d); delete wait[d.id]; } };
  const ev = (expr) => new Promise((r) => { const i = ++id; wait[i] = (d) => r(d.result && d.result.result ? d.result.result.value : undefined); ws.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression: expr, awaitPromise: true, returnByValue: true } })); });
  const href = await ev("location.href");
  rec("Le site s'ouvre dans l'appli", /sebastienchevrier\.github\.io\/24-24-talk/.test(href || ""), href);
  const title = await ev("document.title");
  rec("Titre de la page", /ONE WORLD/i.test(title || ""), title);
  rec("Appli native (Capacitor)", await ev("!!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform())"));
  rec("Voix native branchée (polyfill injecté avant le site)", await ev("window.__owNative === true && window.SpeechRecognition && window.SpeechRecognition.name === 'Rec'"));
  rec("Moteur d'écoute du téléphone présent (plugin)", await ev("!!(Capacitor.Plugins && Capacitor.Plugins.SpeechRecognition)"));
  rec("Moteur de lecture du téléphone présent (plugin)", await ev("!!(Capacitor.Plugins && Capacitor.Plugins.TextToSpeech)"));
  const avail = await ev("Capacitor.Plugins.SpeechRecognition.available().then(r=>JSON.stringify(r)).catch(e=>'erreur '+e.message)");
  rec("Écoute disponible sur ce téléphone virtuel (info)", true, avail);
  const tts = await ev("new Promise(r=>{const u=new SpeechSynthesisUtterance('Bonjour');u.lang='fr-FR';u.onend=()=>r('lu');u.onerror=e=>r('erreur '+e.error);speechSynthesis.speak(u);setTimeout(()=>r('pas de réponse en 15 s'),15000);})");
  rec("Lecture à voix haute « Bonjour » (info)", true, tts);
  const cam = await ev("navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(st=>{const t=st.getVideoTracks()[0];const c=t.getCapabilities?t.getCapabilities():{};const r='caméra ouverte : '+t.label+' · flash '+(c.torch?'disponible':'non signalé');st.getTracks().forEach(x=>x.stop());return r}).catch(e=>'refus '+e.name)");
  rec("Caméra arrière ouverte dans l'appli (scan de document)", /caméra ouverte/.test(cam || ""), cam);
  const torch = await ev("navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(st=>new Promise(r=>{setTimeout(()=>{const b=document.getElementById('owTorch');if(!b){st.getTracks().forEach(x=>x.stop());return r('pas de bouton')}b.click();setTimeout(()=>{const on=b.dataset.on;st.getVideoTracks()[0].stop();setTimeout(()=>r('bouton présent · allumé='+on+' · retiré à la fermeture='+!document.getElementById('owTorch')),300)},800)},300)})).catch(e=>'refus '+e.name)");
  rec("Bouton lampe 🔦 pendant le scan (info)", true, torch);
  const err = await ev("String((document.body&&document.body.innerText||'').slice(0,160)).replace(/\\s+/g,' ')");
  rec("Texte affiché (début)", !!err, err);
  out.ok = out.checks.slice(0, 6).every((c) => c.ok);
  ws.close();
} catch (e) { rec("Connexion au débogueur de la WebView", false, String(e)); }
fs.writeFileSync("essai-resultats.json", JSON.stringify(out, null, 1));
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, "## Essai sur téléphone virtuel\n\n" + out.checks.map((c) => `- ${c.ok ? "✅" : "❌"} ${c.n}${c.d !== undefined ? " — " + c.d : ""}`).join("\n") + "\n");
