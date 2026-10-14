/* 24/24 ONE WORLD — tests des piliers (accessibilité, voix, écoute, gestes), Playwright + Chromium.
   Lancement : voir everywhere/README.md (« Lancer les tests »). Aucun accès réseau extérieur n'est nécessaire :
   le site est servi en local, et le serveur Supabase est soit absent, soit remplacé par tests/fake-supabase.js. */
const path = require("path");
const fs = require("fs");
const http = require("http");
let pw;
try { pw = require("playwright"); } catch (e) { pw = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright"); }
const { chromium } = pw;

const SITE = path.resolve(__dirname, "../..");             // racine du dépôt (index.html de TALK)
const BASE = "/24-24-talk/";                                // même chemin que sur GitHub Pages
const OUT = process.env.EW_OUT || path.join(__dirname, "resultats");
const FAKE = fs.readFileSync(path.join(__dirname, "fake-supabase.js"), "utf8");
fs.mkdirSync(OUT, { recursive: true });

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".webmanifest": "application/manifest+json" };
let blockTalk = false;
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (!u.pathname.startsWith(BASE)) { res.writeHead(404); return res.end(); }
  let p = path.join(SITE, decodeURIComponent(u.pathname.slice(BASE.length)));
  if (!p.startsWith(SITE)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
  if (blockTalk && p === path.join(SITE, "index.html")) { req.socket.destroy(); return; }
  if (!fs.existsSync(p)) { res.writeHead(404); return res.end("404"); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});

const results = [];
function rec(name, ok, detail) { results.push({ name, ok: !!ok, detail: detail || "" }); console.log((ok ? "OK   " : "ÉCHEC") + "  " + name + (detail ? "  — " + detail : "")); }
async function step(name, fn) { try { const r = await fn(); rec(name, r === undefined ? true : r.ok, r && r.detail); } catch (e) { rec(name, false, String(e && e.message || e).split("\n")[0]); } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://localhost:" + server.address().port;
  const URL_EW = ORIGIN + BASE + "everywhere/";
  const URL_TALK = ORIGIN + BASE + "index.html";
  const browser = await chromium.launch();
  const MOBILE = { viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "fr-FR" };
  async function newCtx(opts, fake, init) {
    const ctx = await browser.newContext(Object.assign({}, MOBILE, opts || {}));
    await ctx.route(/^https?:\/\/(?!localhost)/, (r) => (fake && /supabase-js/.test(r.request().url()))
      ? r.fulfill({ status: 200, contentType: "text/javascript", body: FAKE }) : r.abort());
    if (init) await ctx.addInitScript(init);
    return ctx;
  }
  async function open(ctx, url) {
    const page = await ctx.newPage();
    page._errors = [];
    page.on("pageerror", (e) => page._errors.push(String(e)));
    await page.goto(url);
    return page;
  }

  // ================= ACCESSIBILITÉ =================
  let ctx = await newCtx();
  let page = await open(ctx, URL_EW + "#/parametres");
  await step("Accessibilité : le portail propose taille du texte, contraste et « Réduire les animations »", async () => {
    await page.waitForSelector("#motionToggle");
    await page.click('button[data-ts="2"]');
    await page.click("#contrastToggle");
    await page.click("#motionToggle");
    const r = await page.evaluate(() => ({ p: JSON.parse(localStorage.getItem("ew_prefs")), m: document.documentElement.classList.contains("motion-off"),
      a: document.getElementById("motionToggle").getAttribute("aria-checked") }));
    return { ok: r.p.text === 2 && r.p.contrast === true && r.p.motion === true && r.m && r.a === "true", detail: JSON.stringify(r.p) };
  });
  await step("Accessibilité : TALK ouvert ensuite suit les mêmes réglages dès l'affichage (texte très grand, contraste, animations)", async () => {
    await page.goto(URL_TALK + "?ew=1");
    await page.waitForSelector("#tilePhone");
    const r = await page.evaluate(() => ({ ts: document.documentElement.getAttribute("data-ts"), c: document.documentElement.classList.contains("contrast-high"),
      m: document.documentElement.classList.contains("motion-off"), z: getComputedStyle(document.querySelector("main")).zoom,
      muted: getComputedStyle(document.documentElement).getPropertyValue("--muted").trim(), text: getComputedStyle(document.documentElement).getPropertyValue("--text").trim(),
      tr: getComputedStyle(document.querySelector(".toggle")).transitionDuration, sw: document.documentElement.scrollWidth, w: innerWidth }));
    await page.screenshot({ path: path.join(OUT, "a11y-talk-tres-grand.png") });
    return { ok: r.ts === "2" && r.c && r.m && +r.z > 1.25 && r.muted === r.text && /^0s/.test(r.tr) && r.sw <= r.w, detail: "zoom " + r.z + ", largeur " + r.sw + "/" + r.w };
  });
  await step("Accessibilité : réglages de TALK (Paramètres) lisent et changent les mêmes préférences", async () => {
    await page.click("#ewsSettings");
    await page.waitForSelector("#settings.active, #settings:not([hidden])");
    const before = await page.$eval('[data-a11y-ts="2"]', (b) => b.getAttribute("aria-checked") + "/" + b.getAttribute("aria-label"));
    await page.click('[data-a11y-ts="0"]');
    await page.click("#a11yMotion");
    const r = await page.evaluate(() => ({ p: JSON.parse(localStorage.getItem("ew_prefs")), ts: document.documentElement.getAttribute("data-ts"),
      m: document.documentElement.classList.contains("motion-off"), lbl: document.getElementById("a11yMotionLbl").textContent }));
    return { ok: before === "true/Très grand" && r.p.text === 0 && r.p.motion === false && r.p.contrast === true && r.ts === null && !r.m && r.lbl === "Réduire les animations", detail: before + " → " + JSON.stringify(r.p) };
  });
  await step("Accessibilité : le portail retrouve le réglage changé dans TALK", async () => {
    await page.goto(URL_EW + "#/parametres");
    await page.waitForSelector("#motionToggle");
    const r = await page.evaluate(() => ({ ts: document.querySelector('button[data-ts="0"]').getAttribute("aria-checked"), m: document.getElementById("motionToggle").getAttribute("aria-checked"),
      c: document.getElementById("contrastToggle").getAttribute("aria-checked") }));
    return { ok: r.ts === "true" && r.m === "false" && r.c === "true", detail: JSON.stringify(r) };
  });
  await step("Accessibilité : TALK ouvert seul (sans le portail) applique aussi les réglages ; réglage abîmé = affichage normal", async () => {
    await page.evaluate(() => localStorage.setItem("ew_prefs", JSON.stringify({ text: 1 })));
    await page.goto(URL_TALK);
    await page.waitForSelector("#tilePhone");
    const a = await page.evaluate(() => document.documentElement.getAttribute("data-ts"));
    await page.evaluate(() => localStorage.setItem("ew_prefs", "{abîmé"));
    await page.reload();
    await page.waitForSelector("#tilePhone");
    const b = await page.evaluate(() => [document.documentElement.getAttribute("data-ts"), document.documentElement.classList.contains("contrast-high")]);
    return { ok: a === "1" && b[0] === null && b[1] === false && !page._errors.length, detail: a + " puis " + JSON.stringify(b) + " " + page._errors.join("|").slice(0, 120) };
  });
  await step("Accessibilité : texte très grand en anglais, aucun défilement horizontal dans TALK (360 px)", async () => {
    const c2 = await newCtx({ viewport: { width: 360, height: 780 }, locale: "en-US" }, false, () => { try { localStorage.setItem("ew_prefs", JSON.stringify({ text: 2, contrast: true })); } catch (e) {} });
    const p2 = await open(c2, URL_TALK + "?ew=1");
    await p2.waitForSelector("#tilePhone");
    await p2.click("#ewsSettings");
    await sleep(300);
    const r = await p2.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: innerWidth, lbl: document.getElementById("a11yContrastLbl").textContent }));
    await p2.screenshot({ path: path.join(OUT, "a11y-talk-reglages-en.png"), fullPage: true });
    await c2.close();
    return { ok: r.sw <= r.w && r.lbl === "High contrast", detail: r.sw + "/" + r.w + " " + r.lbl };
  });
  await ctx.close();

  // ================= VOICE =================
  // Fausse reconnaissance vocale : chaque appui sur le micro « entend » la phrase suivante de window.__srQueue.
  const FAKE_SR = () => {
    window.__srQueue = JSON.parse(sessionStorage.getItem("__srq") || "[]");
    window.__spoken = [];
    try { speechSynthesis.speak = (u) => { window.__spoken.push(u.text); setTimeout(() => u.onend && u.onend(), 10); }; } catch (e) {}
    class FakeSR {
      start() {
        window.__srStarted = (window.__srStarted || 0) + 1; window.__srLang = this.lang;
        const n = window.__srQueue.shift();
        sessionStorage.setItem("__srq", JSON.stringify(window.__srQueue));
        setTimeout(() => {
          if (!n) return;
          if (n.error) { this.onerror && this.onerror({ error: n.error }); this.onend && this.onend(); return; }
          const mk = (t, fin) => { const a = (Array.isArray(t) ? t : [t]).map((x) => ({ transcript: x, confidence: 0.9 })); a.isFinal = fin; return { results: [a] }; };
          this.onresult && this.onresult(mk(n.text, false));
          setTimeout(() => { this.onresult && this.onresult(mk(n.text, true)); this.onend && this.onend(); }, 40);
        }, 40);
      }
      abort() { window.__srAborted = (window.__srAborted || 0) + 1; }
      stop() {}
    }
    window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  };
  const say = (pg, list) => pg.evaluate((l) => { window.__srQueue.push(...l); sessionStorage.setItem("__srq", JSON.stringify(window.__srQueue)); }, list);

  ctx = await newCtx({}, false, FAKE_SR);
  page = await open(ctx, URL_EW + "#/accueil");
  await step("Voice : compréhension de 34 phrases écrites (français et anglais, politesse, accents, fautes de la dictée)", async () => {
    await page.waitForSelector("#ewvBtn");
    const cases = [
      ["Ouvre TALK", "open:talk"], ["ouvre talk s'il te plaît", "open:talk"], ["Ouvre la messagerie", "open:msg"], ["va dans mes messages", "open:msg"],
      ["Ouvre EVERYWHERE", "open:everywhere"], ["ouvre every where", "open:everywhere"], ["Ouvre mon profil", "open:profil"], ["Ouvre les réglages", "open:parametres"],
      ["accueil", "open:accueil"], ["Peux-tu ouvrir Learn", "open:learn"], ["affiche la conversation côte à côte", "open:face"], ["ouvre mes langues", "open:langues"],
      ["Traduis en anglais", "translate:en"], ["traduis vers l'espagnol", "translate:es"], ["Traduire en japonais s'il vous plaît", "translate:ja"], ["traduis en malgache", "translate:mg"],
      ["traduis du français en allemand", "translate:de"], ["Translate to Spanish", "translate:es"], ["translate into Chinese", "translate:zh"], ["traduis en klingon", "unknown_lang"],
      ["Appelle Maria", "call:maria"], ["appelle arobase kenji", "call:kenji"], ["Call Kenji please", "call:kenji"], ["téléphone à seb 1975", "call:seb1975"],
      ["Arrête", "stop"], ["stop", "stop"], ["Lis mon dernier message", "read"], ["read my last message", "read"], ["Aide", "help"], ["what can I say", "help"],
      ["Open my profile", "open:profil"], ["go to settings", "open:parametres"], ["quelle heure est-il", "none"], ["", "none"]
    ];
    const got = await page.evaluate((c) => c.map(([t]) => { const r = EWVoix.parse(t); return r.act + (r.target ? ":" + r.target : r.lang ? ":" + r.lang : r.who ? ":" + r.who : ""); }), cases);
    const bad = cases.filter((c, i) => got[i] !== c[1]).map((c, i) => c[0] + " → " + got[cases.indexOf(c)]);
    return { ok: !bad.length, detail: bad.length ? bad.join(" | ") : cases.length + " phrases" };
  });
  await step("Voice : bouton micro dans la barre du haut (44 px, nommé), bandeau « Je vous écoute… » et texte entendu en direct", async () => {
    const r0 = await page.$eval("#ewvBtn", (b) => ({ l: b.getAttribute("aria-label"), w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height, next: b.nextElementSibling.id }));
    await say(page, [{ text: "ouvre mon profil" }]);
    await page.tap("#ewvBtn");
    const live = await page.evaluate(() => ({ t: document.getElementById("ewvTxt").textContent, on: document.getElementById("ewvBtn").getAttribute("aria-pressed"), lang: window.__srLang }));
    await page.waitForFunction(() => /🎤 ouvre mon profil/.test(document.getElementById("ewvTxt").textContent));
    await page.screenshot({ path: path.join(OUT, "voice-ecoute.png") });
    return { ok: r0.l === "Commande vocale" && r0.w >= 44 && r0.h >= 44 && r0.next === "topSettings" && live.t === "Je vous écoute…" && live.on === "true" && live.lang === "fr-FR", detail: JSON.stringify(live) };
  });
  await step("Voice : « Ouvre mon profil » → action annoncée puis écran Profil ; micro coupé tout seul", async () => {
    await page.waitForFunction(() => location.hash === "#/profil", null, { timeout: 5000 });
    const r = await page.evaluate(() => ({ t: document.getElementById("ewvTxt").textContent, on: document.getElementById("ewvBtn").getAttribute("aria-pressed"), mic: document.documentElement.classList.contains("ew-mic-on") }));
    return { ok: r.t === "J'ouvre votre profil" && r.on === "false" && !r.mic, detail: r.t };
  });
  await step("Voice : « Traduis en espagnol » → conversation côte à côte, autre langue = espagnol (gardée)", async () => {
    await say(page, [{ text: "traduis en espagnol" }]);
    await page.tap("#ewvBtn");
    await page.waitForFunction(() => location.hash === "#/everywhere/face", null, { timeout: 5000 });
    const p = await page.evaluate(() => JSON.parse(localStorage.getItem("ew_tr_v1") || "{}"));
    await page.screenshot({ path: path.join(OUT, "voice-traduis-espagnol.png") });
    return { ok: p.other === "es" && p.me === "fr", detail: JSON.stringify({ me: p.me, other: p.other }) };
  });
  await step("Voice : phrase non comprise → « Je n'ai pas compris » avec trois exemples ; aucune action", async () => {
    const before = await page.evaluate(() => location.hash);
    await say(page, [{ text: ["quelle heure est-il", "quel air est-il"] }]);
    await page.tap("#ewvBtn");
    await page.waitForFunction(() => /pas compris/.test(document.getElementById("ewvTxt").textContent));
    await sleep(1100);
    const r = await page.evaluate(() => ({ t: document.getElementById("ewvTxt").textContent, h: location.hash }));
    return { ok: /« quelle heure est-il ».*Ouvre TALK.*Traduis en anglais.*Appelle maria/.test(r.t) && r.h === before, detail: r.t.slice(0, 90) };
  });
  await step("Voice : 2e alternative de la dictée utilisée si la 1re ne veut rien dire (« ouvre tolk » / « ouvre talk »)", async () => {
    await say(page, [{ text: ["ouvre le tolkien", "ouvre talk"] }]);
    await page.tap("#ewvBtn");
    await page.waitForURL((u) => /\/index\.html$/.test(u.pathname), { timeout: 6000 });
    return { ok: /\?ew=1$/.test(page.url()), detail: new URL(page.url()).pathname + new URL(page.url()).search };
  });
  await step("Voice : dans TALK (coquille), même bouton micro ; « Ouvre la messagerie » ouvre la messagerie de TALK", async () => {
    await page.waitForSelector("#ewvBtn", { timeout: 8000 });
    const pos = await page.$eval("#ewvBtn", (b) => b.nextElementSibling.id);
    await say(page, [{ text: "ouvre la messagerie" }]);
    await page.tap("#ewvBtn");
    await page.waitForFunction(() => /J'ouvre la messagerie/.test(document.getElementById("ewvTxt").textContent), null, { timeout: 5000 });
    await sleep(400);
    const on = await page.evaluate(() => { const b = document.querySelector('.bbar button[data-b="msg"]'); return b && b.classList.contains("on"); });
    return { ok: pos === "ewsSettings" && on, detail: "bouton avant " + pos };
  });
  await step("Voice : micro refusé → explication pour l'autoriser dans Chrome ; pas de réseau → message clair", async () => {
    await say(page, [{ error: "not-allowed" }]);
    await page.tap("#ewvBtn");
    await page.waitForFunction(() => /micro est bloqué/.test(document.getElementById("ewvTxt").textContent));
    await say(page, [{ error: "network" }]);
    await page.tap("#ewvBtn");
    await page.waitForFunction(() => /besoin d'Internet/.test(document.getElementById("ewvTxt").textContent));
    return { ok: !page._errors.length, detail: page._errors.join("|").slice(0, 120) || "aucune erreur" };
  });
  await step("Voice : ✕ Arrêter coupe le micro tout de suite (rien n'est fait ensuite)", async () => {
    await say(page, [{ text: "ouvre mon profil" }]);
    await page.tap("#ewvBtn");
    await page.tap("#ewvStop");
    await sleep(600);
    const r = await page.evaluate(() => ({ ab: window.__srAborted || 0, hid: document.getElementById("ewvBar").hidden, p: location.pathname }));
    return { ok: r.ab >= 1 && r.hid && /index\.html$/.test(r.p), detail: JSON.stringify(r) };
  });
  await ctx.close();

  ctx = await newCtx({}, true, FAKE_SR);
  await ctx.addInitScript(() => { localStorage.setItem("fake_contacts", "1"); localStorage.setItem("lc_net_joined", "1"); if (localStorage.getItem("lc_net_auth") === null) localStorage.setItem("lc_net_auth", "fake"); });
  page = await open(ctx, URL_EW + "#/accueil");
  await step("Voice : « Appelle Kenji » → Appeler sur TALK, recherche « kenji », fiche d'appel ouverte : rien n'appelle sans toucher « Appeler »", async () => {
    await page.waitForSelector("#ewvBtn");
    await say(page, [{ text: "appelle Kenji" }]);
    await page.tap("#ewvBtn");
    await page.waitForSelector("#trSheet", { timeout: 10000 });
    const r = await page.evaluate(() => ({ q: document.getElementById("trSearch").value, h: location.hash, href: document.getElementById("trCGo").getAttribute("href"), p: location.pathname }));
    await page.screenshot({ path: path.join(OUT, "voice-appelle-kenji.png") });
    return { ok: r.q === "kenji" && r.h === "#/everywhere/appel" && /ew_appel=aaaaaaaa-0000-4000-8000-000000000001/.test(r.href) && /everywhere\/$/.test(r.p), detail: JSON.stringify({ q: r.q, h: r.h }) };
  });
  await step("Voice : « Ouvre la messagerie » depuis le portail → TALK s'ouvre directement sur la messagerie", async () => {
    await page.goto(URL_EW + "#/accueil");
    await page.waitForSelector("#ewvBtn");
    await say(page, [{ text: "ouvre la messagerie" }]);
    await page.tap("#ewvBtn");
    await page.waitForURL((u) => /\/index\.html$/.test(u.pathname), { timeout: 6000 });
    await page.waitForFunction(() => { const b = document.querySelector('.bbar button[data-b="msg"]'); return b && b.classList.contains("on"); }, null, { timeout: 10000 });
    return { ok: true };
  });
  await step("Voice : « Lis mon dernier message » dans une discussion → le message reçu de @kenji est lu à voix haute", async () => {
    await page.waitForSelector(".net-row", { timeout: 10000 });
    await page.click(".net-row");
    await page.waitForSelector("#netLog .bubble.them", { timeout: 10000 });
    await page.waitForSelector("#ewvBtn");
    await say(page, [{ text: "lis mon dernier message" }]);
    await page.tap("#ewvBtn");
    await page.waitForFunction(() => window.__spoken.length > 0, null, { timeout: 5000 });
    const r = await page.evaluate(() => ({ s: window.__spoken, t: document.getElementById("ewvTxt").textContent }));
    return { ok: r.s[0] === "Bonjour depuis Tokyo" && r.t === "Je lis le dernier message.", detail: JSON.stringify(r) };
  });
  await ctx.close();

  ctx = await newCtx({}, false, () => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; });
  page = await open(ctx, URL_EW + "#/accueil");
  await step("Voice : navigateur sans reconnaissance vocale → pas de bouton micro, rien ne casse (portail et TALK)", async () => {
    await page.waitForSelector("#view-accueil.active");
    const a = await page.$("#ewvBtn");
    await page.goto(URL_TALK + "?ew=1");
    await page.waitForSelector("#ewsSettings");
    await sleep(500);
    const b = await page.$("#ewvBtn");
    return { ok: !a && !b && !page._errors.length, detail: page._errors.join("|").slice(0, 100) || "aucune erreur" };
  });
  await ctx.close();
//@@NEXT@@

  await browser.close();
  server.close();
  const ok = results.filter((r) => r.ok).length;
  fs.writeFileSync(path.join(OUT, "piliers.json"), JSON.stringify({ date: new Date().toISOString(), reussis: ok, total: results.length, tests: results }, null, 2));
  console.log("\n" + ok + " / " + results.length + " tests réussis");
  process.exit(ok === results.length ? 0 : 1);
})().catch((e) => { console.error(e); server.close(); process.exit(2); });
