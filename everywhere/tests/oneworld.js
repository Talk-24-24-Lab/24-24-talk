/* 24/24 ONE WORLD — tests de bout en bout de l'intégration « 3e millénaire » : WORLD BRIDGE, invitation, CONNECT,
   navigation ONE WORLD → TALK / CONNECT / EVERYWHERE / LEARN / AI LAB, téléphone, accessibilité.
   Lancement : node everywhere/tests/oneworld.js   (axe-core : variable AXE = chemin de axe.min.js)
   Aucun accès Internet : le service de traduction en ligne est remplacé par une réponse simulée et COMPTÉE,
   pour vérifier aussi ce qui n'est PAS envoyé. */
const path = require("path");
const fs = require("fs");
const http = require("http");
let pw;
try { pw = require("playwright"); } catch (e) { pw = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright"); }
const { chromium } = pw;
let AXE = process.env.AXE;
if (!AXE) { try { AXE = require.resolve("axe-core/axe.min.js"); } catch (e) { AXE = null; } }
const AXE_SRC = AXE ? fs.readFileSync(AXE, "utf8") : null;

const SITE = path.resolve(__dirname, "../..");
const BASE = "/24-24-talk/";
const OUT = process.env.EW_OUT || path.join(__dirname, "resultats-oneworld");
const FAKE = fs.readFileSync(path.join(__dirname, "fake-supabase.js"), "utf8");
fs.mkdirSync(OUT, { recursive: true });

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".webmanifest": "application/manifest+json" };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (!u.pathname.startsWith(BASE)) { res.writeHead(404); return res.end(); }
  let p = path.join(SITE, decodeURIComponent(u.pathname.slice(BASE.length)));
  if (!p.startsWith(SITE)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
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
  const browser = await chromium.launch();
  const MOBILE = { viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "fr-FR" };

  // mm = { mode: "ok" | "500" | "quota" | "slow", n: nombre d'envois, last: dernier texte envoyé }
  async function newCtx(opts, extra) {
    extra = extra || {};
    const ctx = await browser.newContext(Object.assign({}, MOBILE, opts || {}));
    ctx.mm = { mode: "ok", n: 0, last: null };
    await ctx.route(/^https?:\/\/(?!localhost)/, async (r) => {
      const url = r.request().url();
      if (/api\.mymemory\.translated\.net/.test(url)) {
        ctx.mm.n += 1;
        ctx.mm.last = new URL(url).searchParams.get("q");
        if (ctx.mm.mode === "500") return r.fulfill({ status: 500, body: "erreur" });
        if (ctx.mm.mode === "quota") return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ quotaFinished: true }) });
        if (ctx.mm.mode === "slow") await sleep(900);
        const map = { "Le chat dort": "The cat sleeps", "Je cherche la pharmacie": "I am looking for the pharmacy" };
        return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ responseData: { translatedText: map[ctx.mm.last] || "[EN] " + ctx.mm.last } }) });
      }
      if (extra.fake && /supabase-js/.test(url)) return r.fulfill({ status: 200, contentType: "text/javascript", body: FAKE });
      return r.abort();
    });
    await ctx.route(/\/vendor\/supabase-js-[\d.]+\.js$/, (r) => extra.fake ? r.fulfill({ status: 200, contentType: "text/javascript", body: FAKE }) : r.abort());
    return ctx;
  }
  async function open(ctx, hash) {
    const page = await ctx.newPage();
    page._errors = [];
    page.on("pageerror", (e) => page._errors.push(String(e)));
    await page.goto(URL_EW + (hash || ""));
    await page.waitForSelector("#owText");
    return page;
  }
  const prefs = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("ew_tr_v1") || "{}"));
  async function setLangs(page, me, other) {
    await page.selectOption("#owMe", me);
    await page.selectOption("#owOther", other);
  }
  async function translate(page, text) {
    await page.fill("#owText", text);
    await page.tap("#owGo");
  }
  async function axe(page, label) {
    if (!AXE_SRC) return { ok: false, detail: "axe-core introuvable (variable AXE)" };
    await page.addScriptTag({ content: AXE_SRC });
    const r = await page.evaluate(async () => {
      const res = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
      return res.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id + " (" + v.nodes.length + ")");
    });
    return { ok: r.length === 0, detail: label + " : " + (r.length ? r.join(", ") : "aucune violation grave ou critique") };
  }

  // =============== 1. Ouverture : la porte ===============
  let ctx = await newCtx();
  let page = await open(ctx);
  await step("Ouverture : ONE WORLD s'ouvre sur WORLD BRIDGE (« Vous ne parlez pas la même langue ? Parlez quand même. »), zone de saisie visible sans défiler", async () => {
    const r = await page.evaluate(() => ({ h: document.getElementById("h-bridge").textContent.replace(/\s+/g, " ").trim(), view: document.querySelector(".view.active").id,
      bottom: document.getElementById("owGo").getBoundingClientRect().bottom, vh: innerHeight }));
    await page.screenshot({ path: path.join(OUT, "telephone-porte.png") });
    return { ok: r.view === "view-accueil" && r.h === "Vous ne parlez pas la même langue ? Parlez quand même." && r.bottom <= r.vh, detail: r.h + " · bouton Traduire à " + Math.round(r.bottom) + " px (écran " + r.vh + ")" };
  });
  await step("Ouverture : tous les espaces restent sur l'accueil (TALK, EVERYWHERE, LEARN, AI LAB « Bientôt », CONNECT)", async () => {
    const r = await page.evaluate(() => ({ cards: [...document.querySelectorAll("#homeDuo .duo-card b")].map((b) => b.textContent).join(","),
      soon: document.querySelector("#cardAilab .duo-btn").textContent, connect: !!document.querySelector('.quick a[href="#/profil"]') }));
    return { ok: r.cards === "TALK,EVERYWHERE,LEARN,AI LAB" && r.soon === "Bientôt" && r.connect, detail: r.cards + " · CONNECT par « CONNECT · Profil »" };
  });

  // =============== 2. Langues ===============
  await step("Langue source : « Ma langue » = espagnol → le champ invite à écrire en espagnol, réglage gardé (même que le face à face)", async () => {
    await page.selectOption("#owMe", "es");
    const ph = await page.getAttribute("#owText", "placeholder");
    const lg = await page.getAttribute("#owText", "lang");
    const p = await prefs(page);
    return { ok: /Espagnol/.test(ph) && lg === "es-ES" && p.me === "es", detail: ph };
  });
  await step("Langue cible : « Sa langue » = allemand", async () => {
    await page.selectOption("#owOther", "de");
    const p = await prefs(page);
    return { ok: p.other === "de" && p.me === "es" };
  });
  await step("Même langue choisie des deux côtés : les langues s'inversent au lieu de bloquer", async () => {
    await page.selectOption("#owOther", "es");
    const p = await prefs(page);
    return { ok: p.me === "de" && p.other === "es", detail: p.me + " ⇄ " + p.other };
  });
  await step("Inversion : le bouton ⇄ échange les deux langues", async () => {
    await setLangs(page, "fr", "en");
    await page.tap("#owSwap");
    const p = await prefs(page);
    const sel = await page.evaluate(() => [document.getElementById("owMe").value, document.getElementById("owOther").value]);
    await page.tap("#owSwap");
    return { ok: p.me === "en" && p.other === "fr" && sel.join() === "en,fr" };
  });

  // =============== 3. Saisie, traduction, états ===============
  await step("Saisie vide : message clair, rien n'est envoyé", async () => {
    await page.fill("#owText", "   ");
    await page.tap("#owGo");
    const t = await page.textContent("#owState");
    return { ok: /Écrivez ou dictez/.test(t) && ctx.mm.n === 0 && await page.isHidden("#owResult"), detail: t.trim() };
  });
  await step("Traduction locale : « Merci beaucoup » → « Thank you very much » (phrase vérifiée, sans envoi)", async () => {
    await translate(page, "Merci beaucoup");
    await page.waitForSelector("#owResult:not([hidden])");
    const r = await page.evaluate(() => ({ out: document.getElementById("owOut").textContent, src: document.getElementById("owSrc").textContent, lang: document.getElementById("owOut").getAttribute("lang") }));
    return { ok: r.out === "Thank you very much" && /sans envoi/.test(r.src) && r.lang === "en-US" && ctx.mm.n === 0, detail: r.out + " · " + r.src };
  });
  await step("Texte libre sans accord : demande d'accord, AUCUN envoi, aucune traduction affichée", async () => {
    await translate(page, "Le chat dort");
    await page.waitForSelector("#owConsentYes");
    const r = await page.evaluate(() => ({ txt: document.getElementById("owState").textContent, hidden: document.getElementById("owResult").hidden, focus: document.activeElement.id }));
    return { ok: /MyMemory/.test(r.txt) && /confidentiel/.test(r.txt) && r.hidden && ctx.mm.n === 0 && r.focus === "owConsentYes", detail: "envois : " + ctx.mm.n };
  });
  await step("« Non merci » : rien n'est envoyé, message honnête (traduction indisponible), pas de fausse traduction", async () => {
    await page.tap("#owConsentNo");
    const r = await page.evaluate(() => ({ txt: document.getElementById("owState").textContent, hidden: document.getElementById("owResult").hidden }));
    return { ok: /rien n'a été envoyé/.test(r.txt) && r.hidden && ctx.mm.n === 0, detail: r.txt.trim() };
  });
  await step("Chargement puis succès : « Autoriser et traduire » → état de chargement, puis la traduction du moteur existant (étiquetée MyMemory)", async () => {
    ctx.mm.mode = "slow";
    await translate(page, "Le chat dort");
    await page.waitForSelector("#owConsentYes");
    await page.tap("#owConsentYes");
    const loading = await page.waitForSelector(".ow-loading", { timeout: 2000 }).then(() => true, () => false);
    await page.waitForSelector("#owResult:not([hidden])");
    const r = await page.evaluate(() => ({ out: document.getElementById("owOut").textContent, src: document.getElementById("owSrc").textContent, consent: localStorage.getItem("ow_tr_distant_v1") }));
    ctx.mm.mode = "ok";
    return { ok: loading && r.out === "The cat sleeps" && /MyMemory/.test(r.src) && r.consent === "1" && ctx.mm.n === 1 && ctx.mm.last === "Le chat dort", detail: r.out + " · envois : " + ctx.mm.n };
  });
  await step("Erreur du service (500) : message d'erreur et bouton Réessayer, aucune traduction affichée", async () => {
    ctx.mm.mode = "500";
    await translate(page, "Je cherche la pharmacie");
    await page.waitForSelector("#owRetry");
    const r = await page.evaluate(() => ({ txt: document.querySelector("#owState [role=alert]").textContent, hidden: document.getElementById("owResult").hidden, out: document.getElementById("owOut").textContent }));
    return { ok: /indisponible/.test(r.txt) && r.hidden && r.out === "", detail: r.txt.trim() };
  });
  await step("Réessayer après l'erreur : la traduction arrive", async () => {
    ctx.mm.mode = "ok";
    await page.tap("#owRetry");
    await page.waitForSelector("#owResult:not([hidden])");
    return { ok: (await page.textContent("#owOut")) === "I am looking for the pharmacy" };
  });
  await step("Limite du service gratuit atteinte : message honnête, rien d'inventé", async () => {
    ctx.mm.mode = "quota";
    await translate(page, "Une phrase de plus");
    await page.waitForSelector("#owState [role=alert]");
    const t = await page.textContent("#owState");
    ctx.mm.mode = "ok";
    return { ok: /Limite quotidienne/.test(t) && await page.isHidden("#owResult"), detail: t.trim() };
  });
  await step("Réseau indisponible : bandeau « mode dégradé », phrase vérifiée toujours traduite, texte libre refusé sans envoi", async () => {
    await ctx.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    const banner = await page.isVisible("#owDegraded");
    const before = ctx.mm.n;
    await translate(page, "Bonjour");
    await page.waitForSelector("#owResult:not([hidden])");
    const ok1 = (await page.textContent("#owOut")) === "Hello";
    await translate(page, "Où est mon hôtel exactement");
    await page.waitForSelector("#owState [role=alert]");
    const t = await page.textContent("#owState");
    await ctx.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    const gone = await page.isHidden("#owDegraded");
    return { ok: banner && ok1 && /Hors ligne/.test(t) && ctx.mm.n === before && await page.isHidden("#owResult") && gone, detail: "bandeau, « Bonjour » → « Hello », texte libre : " + t.trim().slice(0, 60) + "…" };
  });
  await step("Langue indisponible : une langue inconnue n'est jamais acceptée", async () => {
    const r = await page.evaluate(() => OWTraduction.translate("Bonjour", "fr", "klingon").then(() => "OK", (e) => e.message));
    return { ok: r === "UNSUPPORTED_LANG", detail: r };
  });
  await step("Retirer l'accord : plus aucun envoi, l'accord est redemandé", async () => {
    await page.tap("#owRevoke");
    const before = ctx.mm.n;
    await translate(page, "Le chat dort");
    await page.waitForSelector("#owConsentYes");
    const r = await page.evaluate(() => localStorage.getItem("ow_tr_distant_v1"));
    return { ok: r === null && ctx.mm.n === before };
  });
  await ctx.close();

  // =============== 4. Écouter, copier, partager, l'autre répond ===============
  ctx = await newCtx();
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: ORIGIN });
  await ctx.addInitScript(() => {
    window.__spoken = [];
    window.speechSynthesis.speak = function (u) { window.__spoken.push({ text: u.text, lang: u.lang }); if (u.onend) setTimeout(() => u.onend(), 10); };
  });
  page = await open(ctx);
  await setLangs(page, "fr", "en");
  await translate(page, "Merci beaucoup");
  await page.waitForSelector("#owResult:not([hidden])");
  await step("Audio : « Écouter » lit la traduction dans la langue de l'autre", async () => {
    await page.tap("#owListen");
    await sleep(100);
    const s = await page.evaluate(() => window.__spoken);
    return { ok: s.length === 1 && s[0].text === "Thank you very much" && /^en/.test(s[0].lang), detail: JSON.stringify(s[0]) };
  });
  await step("Copier : la traduction est dans le presse-papiers, message « Traduction copiée. »", async () => {
    await page.tap("#owCopy");
    await page.waitForFunction(() => /copiée/.test(document.getElementById("owToolMsg").textContent));
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    return { ok: clip === "Thank you very much", detail: clip };
  });
  await step("Partager : « Partagé. » seulement quand le partage a vraiment réussi", async () => {
    await page.evaluate(() => { window.__shared = null; navigator.share = (d) => { window.__shared = d; return Promise.resolve(); }; });
    await page.tap("#owShare");
    await page.waitForFunction(() => document.getElementById("owToolMsg").textContent === "Partagé.");
    const d = await page.evaluate(() => window.__shared);
    return { ok: d && d.text === "Thank you very much" };
  });
  await step("Partager annulé par la personne : rien n'est annoncé", async () => {
    await page.evaluate(() => { navigator.share = () => Promise.reject(Object.assign(new Error("x"), { name: "AbortError" })); });
    await page.tap("#owShare");
    await sleep(150);
    return { ok: (await page.textContent("#owToolMsg")) === "" };
  });
  await step("Partager en échec : jamais « Partagé », la traduction est copiée à la place", async () => {
    await page.evaluate(() => { navigator.share = () => Promise.reject(new Error("NotAllowed")); });
    await page.tap("#owShare");
    await page.waitForFunction(() => /copiée/.test(document.getElementById("owToolMsg").textContent));
    const t = await page.textContent("#owToolMsg");
    return { ok: !/^Partagé/.test(t), detail: t };
  });
  await step("L'autre répond : langues inversées, champ vidé et prêt, conversation gardée sur la page seulement", async () => {
    await page.tap("#owReply");
    const r = await page.evaluate(() => ({ me: document.getElementById("owMe").value, other: document.getElementById("owOther").value, val: document.getElementById("owText").value,
      focus: document.activeElement.id, log: document.querySelectorAll("#owLog li").length, hint: document.getElementById("owState").textContent }));
    await translate(page, "Thank you very much");
    await page.waitForSelector("#owResult:not([hidden])");
    const back = await page.textContent("#owOut");
    const stored = await page.evaluate(() => Object.keys(localStorage).map((k) => localStorage.getItem(k)).join("|"));
    return { ok: r.me === "en" && r.other === "fr" && r.val === "" && r.focus === "owText" && r.log === 1 && /Anglais/.test(r.hint) && back === "Merci beaucoup" && !/Thank you very much|Merci beaucoup/.test(stored),
      detail: "réponse « " + back + " » ; aucune phrase dans le stockage de l'appareil" };
  });
  await ctx.close();

  // =============== 5. Lecture et micro indisponibles, dictée ===============
  ctx = await newCtx();
  await ctx.addInitScript(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; window.webkitSpeechRecognition = undefined; delete window.speechSynthesis; window.speechSynthesis = undefined; });
  page = await open(ctx);
  await step("Microphone indisponible : « Dicter » explique quoi faire (écrire, ouvrir dans Chrome), rien ne plante", async () => {
    const desc = await page.getAttribute("#owMic", "aria-describedby");
    await page.tap("#owMic");
    const t = await page.textContent("#owState");
    return { ok: desc === "owMicHelp" && /Dictée vocale indisponible/.test(t) && page._errors.length === 0, detail: t.trim() };
  });
  await step("Lecture à voix haute indisponible : message honnête au lieu d'un faux son", async () => {
    await setLangs(page, "fr", "en");
    await translate(page, "Bonjour");
    await page.waitForSelector("#owResult:not([hidden])");
    await page.tap("#owListen");
    const t = await page.textContent("#owToolMsg");
    return { ok: /pas disponible/.test(t), detail: t };
  });
  await ctx.close();

  ctx = await newCtx();
  await ctx.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.resolve({ getTracks: () => [] });
    window.webkitSpeechRecognition = window.SpeechRecognition = function () {
      const r = this;
      r.start = () => { window.__recLang = r.lang; setTimeout(() => { r.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: "Bonjour" }], { isFinal: true })] }); r.onend && r.onend(); }, 50); };
      r.stop = r.abort = () => {};
    };
  });
  page = await open(ctx);
  await step("Dictée : la phrase dictée (dans MA langue) est écrite puis traduite", async () => {
    await setLangs(page, "fr", "es");
    await page.tap("#owMic");
    await page.waitForSelector("#owResult:not([hidden])");
    const r = await page.evaluate(() => ({ v: document.getElementById("owText").value, out: document.getElementById("owOut").textContent, lang: window.__recLang, pressed: document.getElementById("owMic").getAttribute("aria-pressed") }));
    return { ok: r.v === "Bonjour" && r.out === "Hola" && r.lang === "fr-FR" && r.pressed === "false", detail: JSON.stringify(r) };
  });
  await ctx.close();

  ctx = await newCtx();
  await ctx.addInitScript(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error("refus"), { name: "NotAllowedError" })); });
  page = await open(ctx);
  await step("Micro refusé par la personne : message pour l'autoriser, pas d'écoute lancée", async () => {
    await page.tap("#owMic");
    await page.waitForSelector("#owState [role=alert]");
    const t = await page.textContent("#owState");
    return { ok: /bloqué/.test(t) && (await page.getAttribute("#owMic", "aria-pressed")) === "false", detail: t.trim() };
  });
  await ctx.close();

  // =============== 6. Invitation ===============
  ctx = await newCtx();
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: ORIGIN });
  page = await open(ctx);
  let link = null;
  await step("Invitation : je choisis les deux langues, « Inviter » → lien partagé (langues dedans, aucun compte, aucun pseudo)", async () => {
    await setLangs(page, "fr", "ja");
    await page.evaluate(() => { window.__shared = null; navigator.share = (d) => { window.__shared = d; return Promise.resolve(); }; });
    await page.tap("#owInvite");
    await page.waitForSelector("#owInvShare");
    const hasPseudo = await page.$("#owInvPseudo");
    await page.tap("#owInvShare");
    await page.waitForFunction(() => /partagée/.test(document.getElementById("owInvMsg").textContent));
    const d = await page.evaluate(() => window.__shared);
    link = d && d.url;
    return { ok: !!link && /\/everywhere\/oneworld\/\?de=fr&vers=ja$/.test(link) && !hasPseudo && (await page.getAttribute("#owInvite", "aria-expanded")) === "true", detail: link && link.replace(ORIGIN, "") };
  });
  await step("Invitation sans partage possible : lien copié (jamais « partagé »)", async () => {
    await page.evaluate(() => { delete navigator.share; navigator.share = undefined; });
    await page.tap("#owInvShare");
    await page.waitForFunction(() => /copié/.test(document.getElementById("owInvMsg").textContent));
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    return { ok: clip === link, detail: (await page.textContent("#owInvMsg")).trim() };
  });
  await ctx.close();

  ctx = await newCtx({ locale: "ja-JP" });
  page = await ctx.newPage();
  page._errors = [];
  page.on("pageerror", (e) => page._errors.push(String(e)));
  await step("L'autre ouvre le lien : elle arrive directement dans WORLD BRIDGE, ses langues déjà choisies, sans compte", async () => {
    await page.goto(link);
    await page.waitForSelector("#owGot:not([hidden])");
    const r = await page.evaluate(() => ({ me: document.getElementById("owMe").value, other: document.getElementById("owOther").value, url: location.pathname + location.search + location.hash,
      got: document.getElementById("owGot").textContent, view: document.querySelector(".view.active").id }));
    await page.screenshot({ path: path.join(OUT, "invitation-recue.png") });
    return { ok: r.me === "ja" && r.other === "fr" && r.view === "view-accueil" && /Invitation reçue|Invitation received/.test(r.got) && r.url === BASE + "everywhere/#/bridge" && page._errors.length === 0,
      detail: r.me + " ⇄ " + r.other + " · adresse nettoyée : " + r.url };
  });
  await ctx.close();

  ctx = await newCtx();
  page = await ctx.newPage();
  await step("Lien d'invitation abîmé ou piégé : refusé proprement, rien n'est exécuté, langues inchangées", async () => {
    await page.goto(URL_EW + "oneworld/?de=xx&vers=fr&p=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E");
    await page.waitForSelector("#owGot:not([hidden])");
    const r = await page.evaluate(() => ({ t: document.getElementById("owGot").textContent, img: !!document.querySelector("#owGot img"), p: localStorage.getItem("ew_tr_v1"), url: location.search }));
    return { ok: /pas proposée/.test(r.t) && !r.img && !r.p && r.url === "", detail: r.t.trim() };
  });
  await ctx.close();

  ctx = await newCtx({}, { fake: true });
  await ctx.addInitScript(() => { try { if (localStorage.getItem("lc_net_auth") === null) localStorage.setItem("lc_net_auth", "fake"); } catch (e) {} });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: ORIGIN });
  page = await open(ctx);
  await step("Invitation avec compte TALK : le pseudo n'est ajouté QUE si je coche la case", async () => {
    await page.evaluate(() => { delete navigator.share; navigator.share = undefined; });
    await page.tap("#owInvite");
    await page.waitForSelector("#owInvPseudo", { timeout: 8000 });
    const checked = await page.isChecked("#owInvPseudo");
    await page.tap("#owInvShare");
    await page.waitForFunction(() => /copié/.test(document.getElementById("owInvMsg").textContent));
    const a = await page.evaluate(() => navigator.clipboard.readText());
    await page.check("#owInvPseudo");
    await page.tap("#owInvShare");
    await sleep(200);
    const b = await page.evaluate(() => navigator.clipboard.readText());
    return { ok: !checked && !/[?&]p=/.test(a) && /&p=sebtest$/.test(b), detail: "sans case : " + a.replace(ORIGIN, "") + " · avec : …" + b.slice(-12) };
  });
  await ctx.close();

  ctx = await newCtx();
  page = await ctx.newPage();
  await step("Lien avec pseudo reçu : « Continuer dans TALK avec @sebtest » mène à l'invitation habituelle de TALK", async () => {
    await page.goto(URL_EW + "oneworld/?de=fr&vers=en&p=sebtest");
    await page.waitForSelector("#owGotTalk");
    const href = await page.getAttribute("#owGotTalk", "href");
    return { ok: href === "../index.html?ew=1&ajouter=sebtest", detail: href };
  });
  await ctx.close();

  // =============== 7. Navigation ONE WORLD → … ===============
  ctx = await newCtx();
  page = await open(ctx);
  await step("ONE WORLD → EVERYWHERE : « Face à face » ouvre la conversation côte à côte avec les MÊMES langues", async () => {
    await setLangs(page, "fr", "it");
    await page.tap("#owFace");
    await page.waitForSelector("#trFace");
    const r = await page.evaluate(() => [...document.querySelectorAll("#trFace select[data-lang-of]")].map((s) => s.getAttribute("data-lang-of") + "=" + s.value).sort().join(","));
    return { ok: r === "1=fr,2=it" && (await page.evaluate(() => location.hash)) === "#/everywhere/face", detail: r };
  });
  await step("ONE WORLD → EVERYWHERE par la barre du bas, puis retour à la porte par « One World »", async () => {
    await page.tap('#mainnav a[data-nav="everywhere"]');
    await page.waitForSelector("#view-everywhere.active #trGoFace");
    await page.tap('#mainnav a[data-nav="accueil"]');
    await page.waitForSelector("#view-accueil.active");
    return { ok: (await page.getAttribute('#mainnav a[data-nav="accueil"]', "aria-current")) === "page" };
  });
  await step("ONE WORLD → LEARN : « Apprendre Italien » n'est pas proposé (pas de leçons), LEARN annonce honnêtement ses langues", async () => {
    await page.waitForFunction(() => !document.getElementById("owLearnNote").hidden, null, { timeout: 5000 });
    const r = await page.evaluate(() => ({ t: document.getElementById("owLearnT").textContent, n: document.getElementById("owLearnNote").textContent, href: document.getElementById("owLearn").getAttribute("href") }));
    return { ok: r.t === "Apprendre une langue" && /Anglais, Espagnol/.test(r.n) && r.href === "#/learn", detail: r.n };
  });
  await step("ONE WORLD → LEARN : avec l'anglais, « Apprendre Anglais » ouvre le choix des leçons LEARN", async () => {
    await page.selectOption("#owOther", "en");
    const t = await page.textContent("#owLearnT");
    await page.tap("#owLearn");
    await page.waitForSelector("#view-learn.active [data-lang]");
    return { ok: t === "Apprendre Anglais" && (await page.evaluate(() => location.hash)) === "#/learn/apprendre", detail: t };
  });
  await step("LEARN → retour à une vraie conversation : « Parler pour de vrai » ouvre WORLD BRIDGE", async () => {
    await page.tap('#mainnav a[data-nav="learn"]');
    await page.waitForSelector("#lxReal");
    const href = await page.getAttribute("#lxReal", "href");
    await page.tap("#lxReal");
    await page.waitForSelector("#view-accueil.active");
    await sleep(100);
    const f = await page.evaluate(() => document.activeElement.id);
    return { ok: /^#\/bridge/.test(href) && f === "owText", detail: href + " · curseur dans la zone de saisie" };
  });
  await step("#/bridge/es (depuis une leçon d'espagnol) : la langue de l'autre devient l'espagnol", async () => {
    await page.evaluate(() => { location.hash = "#/bridge/es"; });
    await page.waitForFunction(() => document.getElementById("owOther").value === "es");
    return { ok: (await prefs(page)).other === "es" };
  });
  await step("ONE WORLD → CONNECT : « Connect » (barre du bas) et #/connect ouvrent profil, appareils et sécurité", async () => {
    await page.tap('#mainnav a[data-nav="profil"]');
    await page.waitForSelector("#view-profil.active");
    const lbl = await page.textContent('#mainnav a[data-nav="profil"]');
    await page.evaluate(() => { location.hash = "#/accueil"; });
    await page.waitForSelector("#view-accueil.active");
    await page.evaluate(() => { location.hash = "#/connect"; });
    await page.waitForSelector("#view-profil.active");
    return { ok: lbl.trim() === "Connect", detail: "libellé « " + lbl.trim() + " »" };
  });
  await step("ONE WORLD → AI LAB : « Bientôt », capacités préparées non branchées, aucun appel à un service d'IA", async () => {
    await page.evaluate(() => { location.hash = "#/accueil"; });
    await page.waitForSelector("#view-accueil.active");
    const before = ctx.mm.n;
    await page.tap("#cardAilab");
    await page.waitForSelector("#aiCaps");
    const r = await page.evaluate(() => ({ b: document.querySelector("#view-ailab .ai-badge").textContent, caps: document.querySelectorAll("#aiCaps li").length, txt: document.getElementById("aiCaps").textContent }));
    return { ok: r.b === "BIENTÔT" && r.caps === 6 && /aucune n'est branchée/.test(r.txt) && ctx.mm.n === before, detail: r.caps + " capacités, toutes « Bientôt »" };
  });
  await step("ONE WORLD → TALK : « Continuer dans TALK » ouvre TALK (le moteur existant) dans la coquille ONE WORLD", async () => {
    await page.evaluate(() => { location.hash = "#/accueil"; });
    await page.waitForSelector("#owTalk");
    const href = await page.getAttribute("#owTalk", "href");
    await Promise.all([page.waitForNavigation(), page.tap("#owTalk")]);
    await page.waitForSelector("#ewsNav", { timeout: 15000 });
    const r = await page.evaluate(() => ({ shell: document.documentElement.classList.contains("ew-shell"), cur: document.querySelector('#ewsNav [aria-current="page"]').dataset.nav }));
    return { ok: href === "../index.html?ew=1" && r.shell && r.cur === "talk", detail: href };
  });
  await step("TALK → ONE WORLD : « One World » dans la barre de TALK ramène à la porte", async () => {
    await Promise.all([page.waitForNavigation(), page.tap('#ewsNav a[data-nav="accueil"]')]);
    await page.waitForSelector("#owText");
    return { ok: (await page.evaluate(() => document.querySelector(".view.active").id)) === "view-accueil" };
  });
  await ctx.close();

  // =============== 8. Mobile, ordinateur, anglais ===============
  for (const [name, vp] of [["petit téléphone 320 px", { width: 320, height: 640 }], ["téléphone 360 px", { width: 360, height: 740 }]]) {
    ctx = await newCtx({ viewport: vp });
    page = await open(ctx);
    await step("Mobile " + name + " : aucune barre de défilement horizontale, toutes les cibles de WORLD BRIDGE ≥ 44 px", async () => {
      await setLangs(page, "fr", "en");
      await translate(page, "Merci beaucoup");
      await page.waitForSelector("#owResult:not([hidden])");
      const r = await page.evaluate(() => {
        const small = [...document.querySelectorAll("#bridge button, #bridge a, #bridge select, #bridge textarea")].filter((e) => e.offsetParent).map((e) => {
          const b = e.getBoundingClientRect(); return { id: e.id || e.tagName, s: Math.min(b.width, b.height) };
        }).filter((x) => x.s < 44);
        return { sw: document.documentElement.scrollWidth, w: innerWidth, vw: document.querySelector(".view.active").scrollWidth <= document.querySelector(".view.active").clientWidth, small };
      });
      await page.screenshot({ path: path.join(OUT, "mobile-" + vp.width + ".png"), fullPage: false });
      return { ok: r.sw <= r.w && r.vw && r.small.length === 0, detail: r.small.length ? JSON.stringify(r.small) : "rien ne dépasse, cibles ≥ 44 px" };
    });
    await ctx.close();
  }

  ctx = await newCtx();
  page = await ctx.newPage();
  await step("Parcours principal sur téléphone, chronométré : ouvrir → choisir la langue de l'autre → écrire → traduction affichée", async () => {
    const t0 = Date.now();
    await page.goto(URL_EW);
    await page.waitForSelector("#owText");
    await page.selectOption("#owOther", "es");
    await page.fill("#owText", "Où est la gare ?");
    await page.tap("#owGo");
    await page.waitForSelector("#owResult:not([hidden])");
    const ms = Date.now() - t0;
    const out = await page.textContent("#owOut");
    return { ok: out === "¿Dónde está la estación de tren?" && ms < 10000, detail: out + " · " + ms + " ms (3 gestes ; moins d'une minute avec une vraie personne reste à confirmer sur Android)" };
  });
  await ctx.close();

  ctx = await newCtx({ viewport: { width: 1366, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
  page = await open(ctx);
  await step("Ordinateur 1366 px : menu latéral, WORLD BRIDGE lisible, suites en 4 colonnes", async () => {
    const r = await page.evaluate(() => ({ dir: getComputedStyle(document.getElementById("mainnav")).flexDirection, cols: getComputedStyle(document.querySelector(".ow-next")).gridTemplateColumns.split(" ").length,
      sw: document.documentElement.scrollWidth, w: innerWidth }));
    await page.screenshot({ path: path.join(OUT, "ordinateur-porte.png") });
    return { ok: r.dir === "column" && r.cols === 4 && r.sw <= r.w, detail: "menu latéral, " + r.cols + " colonnes" };
  });
  await ctx.close();

  ctx = await newCtx({ locale: "en-US" });
  page = await open(ctx);
  await step("Interface en anglais : « Don't speak the same language? Talk anyway. »", async () => {
    const h = (await page.textContent("#h-bridge")).replace(/\s+/g, " ").trim();
    return { ok: h === "Don't speak the same language? Talk anyway.", detail: h };
  });
  await ctx.close();

  // =============== 9. Accessibilité ===============
  ctx = await newCtx({ reducedMotion: "reduce" });
  page = await open(ctx);
  await step("Accessibilité (axe-core, WCAG 2.1 AA) : porte vide, thème clair", async () => axe(page, "porte vide"));
  await step("Accessibilité : demande d'accord affichée", async () => {
    await page.evaluate(() => { document.querySelectorAll("script[data-axe]").forEach((s) => s.remove()); });
    await translate(page, "Le chat dort");
    await page.waitForSelector("#owConsentYes");
    return axe(page, "accord");
  });
  await step("Accessibilité : traduction affichée, invitation ouverte", async () => {
    await page.tap("#owConsentYes");
    await page.waitForSelector("#owResult:not([hidden])");
    await page.tap("#owInvite");
    await page.waitForSelector("#owInvShare");
    return axe(page, "résultat + invitation");
  });
  await step("Accessibilité : thème sombre et contraste renforcé", async () => {
    await page.evaluate(() => { window.EWPrefs.set("theme", "dark"); window.EWPrefs.set("contrast", true); });
    const a = await axe(page, "sombre + contraste");
    await page.evaluate(() => { window.EWPrefs.set("theme", "light"); window.EWPrefs.set("contrast", false); });
    return a;
  });
  await step("Clavier : Tab parcourt Ma langue → ⇄ → Sa langue → texte ; Entrée traduit ; focus visible", async () => {
    await page.focus("#owMe");
    const seq = [];
    for (let i = 0; i < 3; i++) { await page.keyboard.press("Tab"); seq.push(await page.evaluate(() => document.activeElement.id)); }
    await page.fill("#owText", "Bonjour");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.getElementById("owOut").textContent === "Hello");
    const outline = await page.evaluate(() => { document.getElementById("owGo").focus(); return getComputedStyle(document.getElementById("owGo")).outlineStyle; });
    return { ok: seq.join(",") === "owSwap,owOther,owText" && outline !== "none", detail: seq.join(" → ") + " · Entrée = Traduire" };
  });
  await step("Lecteur d'écran : résultat annoncé (zone vivante), erreurs en alerte, langue du texte traduit déclarée", async () => {
    const r = await page.evaluate(() => ({ live: document.getElementById("owState").getAttribute("aria-live"), tool: document.getElementById("owToolMsg").getAttribute("role"),
      lang: document.getElementById("owOut").getAttribute("lang"), lbl: document.getElementById("owTextLbl").textContent }));
    return { ok: r.live === "polite" && r.tool === "status" && /^[a-z]{2}/.test(r.lang) && /Texte à traduire/.test(r.lbl), detail: JSON.stringify(r) };
  });
  await step("Mouvement réduit : aucune animation (indicateur de chargement figé)", async () => {
    await page.evaluate(() => { document.getElementById("owState").innerHTML = '<p class="ow-loading"><span class="spinner"></span> …</p>'; });
    const a = await page.evaluate(() => getComputedStyle(document.querySelector(".ow-loading .spinner")).animationName);
    return { ok: a === "none", detail: "animation : " + a };
  });
  await ctx.close();

  // =============== 10. Code, PWA, confidentialité ===============
  await step("PWA : le service worker garde la nouvelle porte (cache versionné v15), chaque fichier listé existe", async () => {
    const sw = fs.readFileSync(path.join(SITE, "everywhere/sw.js"), "utf8");
    const list = JSON.parse("[" + /var SHELL = \[([\s\S]*?)\];/.exec(sw)[1] + "]");
    const missing = list.filter((f) => f !== "./" && !fs.existsSync(path.join(SITE, "everywhere", f)));
    return { ok: /ew-shell-v15/.test(sw) && ["core/traduction.js", "oneworld/bridge.js", "oneworld/bridge.css", "oneworld/index.html"].every((f) => list.indexOf(f) !== -1) && missing.length === 0,
      detail: list.length + " fichiers, manquants : " + (missing.join(", ") || "aucun") };
  });
  await step("PWA : un seul manifeste, raccourci « WORLD BRIDGE », la page oneworld/ n'est pas une deuxième application", async () => {
    const m = JSON.parse(fs.readFileSync(path.join(SITE, "everywhere/manifest.webmanifest"), "utf8"));
    const html = fs.readFileSync(path.join(SITE, "everywhere/oneworld/index.html"), "utf8");
    return { ok: m.shortcuts[0].name === "WORLD BRIDGE" && m.shortcuts[0].url === "./#/bridge" && !fs.existsSync(path.join(SITE, "everywhere/oneworld/manifest.webmanifest")) && /\.\.\/manifest\.webmanifest/.test(html) };
  });
  await step("Code : aucune clé secrète, aucun « service_role », aucun service d'IA, aucun nouvel appel WebRTC dans les nouveaux fichiers", async () => {
    const files = ["everywhere/core/traduction.js", "everywhere/oneworld/bridge.js", "everywhere/oneworld/bridge.css", "everywhere/oneworld/index.html"];
    const bad = files.filter((f) => /service_role|sk-[A-Za-z0-9]{10}|eyJhbGciOi|openai|anthropic|RTCPeerConnection|getDisplayMedia/i.test(fs.readFileSync(path.join(SITE, f), "utf8")));
    return { ok: bad.length === 0, detail: files.length + " fichiers vérifiés" + (bad.length ? " · problème : " + bad.join(", ") : "") };
  });
  await step("Code : WORLD BRIDGE ne dépend d'aucun fournisseur (pas d'adresse de service dans l'écran, tout passe par OWTraduction)", async () => {
    const src = fs.readFileSync(path.join(SITE, "everywhere/oneworld/bridge.js"), "utf8");
    return { ok: !/https?:\/\/|fetch\(["']https|mymemory\.translated/i.test(src.replace(/\/\*[\s\S]*?\*\//g, "")) && /TR\.translate\(/.test(src) };
  });

  const ok = results.filter((x) => x.ok).length;
  fs.writeFileSync(path.join(OUT, "resultats.json"), JSON.stringify({ date: new Date().toISOString(), total: results.length, ok, results }, null, 2));
  console.log("\n" + ok + " / " + results.length + " tests réussis");
  await browser.close();
  server.close();
  process.exit(ok === results.length ? 0 : 1);
})();
