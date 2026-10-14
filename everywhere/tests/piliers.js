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
//@@NEXT@@

  await browser.close();
  server.close();
  const ok = results.filter((r) => r.ok).length;
  fs.writeFileSync(path.join(OUT, "piliers.json"), JSON.stringify({ date: new Date().toISOString(), reussis: ok, total: results.length, tests: results }, null, 2));
  console.log("\n" + ok + " / " + results.length + " tests réussis");
  process.exit(ok === results.length ? 0 : 1);
})().catch((e) => { console.error(e); server.close(); process.exit(2); });
