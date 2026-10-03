/* 24/24 EVERYWHERE — tests automatiques de bout en bout (Playwright + Chromium).
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
  const browser = await chromium.launch();
  const MOBILE = { viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "fr-FR" };

  async function newCtx(opts, fake) {
    const ctx = await browser.newContext(Object.assign({}, MOBILE, opts || {}));
    // Rien ne sort vers Internet ; le kit Supabase est remplacé par le faux client si demandé.
    await ctx.route(/^https?:\/\/(?!localhost)/, (r) => (fake && /supabase-js/.test(r.request().url()))
      ? r.fulfill({ status: 200, contentType: "text/javascript", body: FAKE }) : r.abort());
    return ctx;
  }
  async function openPortal(ctx, hash) {
    const page = await ctx.newPage();
    page._errors = [];
    page.on("pageerror", (e) => page._errors.push(String(e)));
    await page.goto(URL_EW + (hash || ""));
    return page;
  }
  const talkFrame = (page) => page.frames().find((f) => /index\.html\?embed=1/.test(f.url()));
  async function waitTalkReady(page) {
    await page.waitForFunction(() => window.EW && EW.frames.talk && EW.frames.talk.ready, null, { timeout: 20000 });
    return talkFrame(page);
  }

  // ---------- Téléphone ----------
  let ctx = await newCtx();
  let page = await openPortal(ctx);
  await step("Accueil : logo, nom EVERYWHERE, carte TALK, carte module 2", async () => {
    await page.waitForSelector("#view-accueil.active");
    const h1 = await page.textContent("#h-accueil");
    const cards = await page.$$eval("#homeApps .app-card", (n) => n.map((x) => x.className + "|" + x.textContent.trim()));
    const ok = /24\/24 EVERYWHERE/.test(h1) && cards.length === 2 && /TALK/.test(cards[0]) && /reserved/.test(cards[1]) && /RÉSERVÉ/.test(cards[1]);
    return { ok, detail: cards.length + " cartes" };
  });
  await step("Barre basse commune : Accueil, Applications, TALK, Profil", async () => {
    const labels = await page.$$eval("#mainnav a", (n) => n.map((a) => a.textContent.trim()));
    const pos = await page.$eval("#mainnav", (n) => { const r = n.getBoundingClientRect(); return { bottom: Math.round(r.bottom), h: innerHeight, dir: getComputedStyle(n).flexDirection }; });
    return { ok: labels.join(",") === "Accueil,Applications,TALK,Profil" && pos.bottom === pos.h && pos.dir === "row", detail: labels.join(", ") + " · collée en bas" };
  });
  await step("Zones tactiles ≥ 44 px (barre basse, roue dentée)", async () => {
    const sizes = await page.$$eval("#mainnav a, #topSettings", (n) => n.map((a) => { const r = a.getBoundingClientRect(); return Math.min(r.width, r.height); }));
    return { ok: sizes.every((s) => s >= 44), detail: "plus petite : " + Math.round(Math.min.apply(null, sizes)) + " px" };
  });
  for (const [label, route, view] of [["Applications", "#/applications", "view-applications"], ["Profil", "#/profil", "view-profil"], ["Accueil", "#/accueil", "view-accueil"]]) {
    await step("Navigation : " + label, async () => {
      await page.click('#mainnav a[href="' + route + '"]');
      await page.waitForSelector("#" + view + ".active");
      const cur = await page.$eval('#mainnav a[href="' + route + '"]', (a) => a.getAttribute("aria-current"));
      return { ok: (await page.evaluate(() => location.hash)) === route && cur === "page" };
    });
  }
  await step("Paramètres par la roue dentée", async () => {
    await page.click("#topSettings");
    await page.waitForSelector("#view-parametres.active");
    const push = await page.textContent("#pushState");
    return { ok: !!push, detail: "état des appels affiché : « " + push + " »" };
  });
  await page.screenshot({ path: path.join(OUT, "telephone-parametres.png") });
  await page.goto(URL_EW + "#/accueil");
  await page.waitForSelector("#view-accueil.active");
  await page.screenshot({ path: path.join(OUT, "telephone-accueil.png") });

  await step("Applications → carte TALK : TALK s'ouvre en pleine page et répond au toucher", async () => {
    await page.click('#mainnav a[href="#/applications"]');
    await page.waitForSelector("#view-applications.active");
    await page.tap("#appList .app-card:not(.reserved)");
    await page.waitForURL((u) => /\/index\.html$/.test(u.pathname), { timeout: 10000 });
    await page.waitForSelector("#tileMsg");
    const emb = await page.evaluate(() => document.documentElement.classList.contains("embedded"));
    await page.waitForSelector("#ewsNav");
    await page.tap("#tileMsg");
    await page.waitForSelector("#net.view.active", { timeout: 5000 });
    await page.screenshot({ path: path.join(OUT, "telephone-talk.png") });
    return { ok: !emb, detail: "adresse " + page.url().replace(ORIGIN, "") + ", Messagerie ouverte" };
  });
  await step("TALK dans la coquille : même barre du bas (TALK actif), barre du haut, sans grand en-tête", async () => {
    const r = await page.evaluate(() => {
      const nav = document.getElementById("ewsNav");
      const labels = [...nav.querySelectorAll("a")].map((a) => a.textContent.trim()).join(",");
      const cur = nav.querySelector('[aria-current="page"]');
      const nr = nav.getBoundingClientRect();
      return { shell: document.documentElement.classList.contains("ew-shell"), labels, cur: cur && cur.dataset.nav,
        bottom: Math.round(nr.bottom) === innerHeight, top: !!document.getElementById("ewsTop"),
        hero: getComputedStyle(document.querySelector("header.hero-earth")).display === "none",
        sizes: [...nav.querySelectorAll("a")].every((a) => a.getBoundingClientRect().height >= 44) };
    });
    return { ok: r.shell && r.labels === "Accueil,Applications,TALK,Profil" && r.cur === "talk" && r.bottom && r.top && r.hero && r.sizes, detail: r.labels + " · actif : " + r.cur };
  });
  await step("Roue dentée de la coquille dans TALK : ouvre les réglages de TALK", async () => {
    await page.tap("#ewsSettings");
    await page.waitForSelector("#settings.view.active", { timeout: 5000 });
    return { ok: true };
  });
  await step("Depuis TALK, la barre du bas ramène à l'accueil du portail", async () => {
    await page.tap('#ewsNav a[data-nav="accueil"]');
    await page.waitForSelector("#view-accueil.active", { timeout: 10000 });
    await page.tap('#mainnav a[data-nav="talk"]');
    await page.waitForURL((u) => /\/index\.html$/.test(u.pathname), { timeout: 10000 });
    await page.waitForSelector("#ewsNav");
    await page.tap('#ewsNav a[data-nav="applications"]');
    await page.waitForSelector("#view-applications.active", { timeout: 10000 });
    return { ok: true, detail: "Accueil, puis TALK, puis Applications" };
  });
  await step("Retour arrière : TALK puis portail", async () => {
    await page.goBack();
    await page.waitForURL((u) => /\/index\.html$/.test(u.pathname), { timeout: 10000 });
    await page.goBack();
    await page.waitForFunction(() => /everywhere/.test(location.pathname), null, { timeout: 10000 });
    return { ok: true };
  });
  await step("Ancienne adresse #/app/talk → TALK en pleine page", async () => {
    await page.goto(URL_EW + "#/app/talk");
    await page.waitForURL((u) => /\/index\.html$/.test(u.pathname), { timeout: 10000 });
    return { ok: true };
  });
  await page.goto(URL_EW + "#/accueil");
  await page.waitForSelector("#view-accueil.active");
  await step("Profil sans compte : invitation à créer son profil dans TALK", async () => {
    await page.click('#mainnav a[href="#/profil"]');
    await page.waitForSelector("#profileCard [data-open-talk='net']", { timeout: 20000 });
    const txt = await page.textContent("#profileCard");
    return { ok: /pas encore de profil/.test(txt), detail: txt.trim().slice(0, 60) };
  });
  await step("« Créer mon profil » ouvre la messagerie de TALK", async () => {
    await page.click("#profileCard [data-open-talk='net']");
    await page.waitForURL((u) => /\/index\.html$/.test(u.pathname), { timeout: 10000 });
    await page.goto(URL_EW + "#/accueil");
    return { ok: true };
  });
  await step("Sécurité du pont : message d'une autre origine ignoré", async () => {
    await page.click('#mainnav a[href="#/accueil"]');
    await page.waitForSelector("#view-accueil.active");
    await page.evaluate(() => window.dispatchEvent(new MessageEvent("message", { data: { t: "ew:ring" }, origin: "https://pirate.example" })));
    await sleep(300);
    return { ok: (await page.evaluate(() => location.hash)) === "#/accueil" };
  });
  await step("Adresse inconnue → page « introuvable »", async () => {
    await page.goto(URL_EW + "#/nimporte-quoi");
    await page.waitForSelector("#view-404.active");
    await page.goto(URL_EW + "#/app/inconnue");
    await page.waitForSelector("#view-404.active");
    return { ok: true };
  });
  await step("Module 2 : emplacement réservé, sans fonction simulée", async () => {
    await page.goto(URL_EW + "#/app/app2");
    await page.waitForSelector('.app-frame-wrap[data-app="app2"].active');
    const txt = await page.textContent('.app-frame-wrap[data-app="app2"]');
    const hasFrame = await page.$('.app-frame-wrap[data-app="app2"] iframe');
    return { ok: /n'existe pas encore/.test(txt) && !hasFrame };
  });
  await step("Pas de défilement horizontal (téléphone, tous les écrans)", async () => {
    const bad = [];
    for (const r of ["#/accueil", "#/applications", "#/profil", "#/parametres"]) {
      await page.goto(URL_EW + r);
      await page.waitForSelector(".view.active");
      const w = await page.evaluate(() => { const v = document.querySelector(".view.active"); return [document.documentElement.scrollWidth, innerWidth, v.scrollWidth, v.clientWidth]; });
      if (w[0] > w[1] || w[2] > w[3]) bad.push(r + " " + w.join("/"));
    }
    return { ok: !bad.length, detail: bad.join("; ") || "4 écrans vérifiés à 393 px" };
  });
  await step("Aucune erreur JavaScript dans le portail", async () => ({ ok: page._errors.length === 0, detail: page._errors.join(" | ").slice(0, 200) }));

  // ---------- PWA ----------
  await step("Manifeste valide (nom, start_url, standalone, icônes 192/512/maskable)", async () => {
    const m = await page.evaluate(async () => (await fetch("manifest.webmanifest")).json());
    const sizes = m.icons.map((i) => i.sizes + ":" + (i.purpose || "any"));
    return { ok: m.scope === "../" && m.display === "standalone" && !!m.start_url && sizes.includes("192x192:any") && sizes.includes("512x512:any") && sizes.includes("512x512:maskable"), detail: m.name };
  });
  await step("Icônes : fichiers présents et aux bonnes dimensions", async () => {
    const dims = await page.evaluate(async () => {
      const out = [];
      for (const [src, s] of [["icons/icon-192.png", 192], ["icons/icon-512.png", 512], ["icons/maskable-512.png", 512], ["icons/apple-touch-icon.png", 180]]) {
        const img = new Image(); img.src = src; await img.decode(); out.push(img.naturalWidth === s && img.naturalHeight === s);
      }
      return out;
    });
    return { ok: dims.every(Boolean) };
  });
  await step("Service worker du portail actif, coquille mise en cache", async () => {
    await page.goto(URL_EW);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await sleep(500);
    const keys = await page.evaluate(async () => { const c = await caches.open("ew-shell-v5"); return (await c.keys()).map((r) => new URL(r.url).pathname); });
    const priv = keys.filter((k) => !/everywhere\/|terre-tech/.test(k));
    return { ok: keys.length >= 10 && !priv.length, detail: keys.length + " fichiers publics en cache, aucun hors du portail" };
  });
  await step("Hors ligne : le portail s'ouvre quand même, avec un bandeau", async () => {
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    await ctx.setOffline(true);
    await page.reload();
    await page.waitForSelector("#view-accueil.active");
    const off = await page.isVisible("#offline");
    await ctx.setOffline(false);
    return { ok: off };
  });
  await step("Liens et ressources du portail : tous accessibles", async () => {
    await page.goto(URL_EW);
    const urls = await page.evaluate(() => [...document.querySelectorAll("a[href], img[src], link[href], script[src]")]
      .map((e) => e.href || e.src).filter((u) => u && !u.includes("#")));
    const bad = [];
    for (const u of [...new Set(urls)]) { const r = await page.request.get(u); if (r.status() !== 200) bad.push(r.status() + " " + u); }
    return { ok: !bad.length, detail: bad.join(", ") || urls.length + " ressources" };
  });
  await ctx.close();

  // ---------- Compte connecté (faux client Supabase, aucune donnée réelle) ----------
  ctx = await newCtx({}, true);
  await ctx.addInitScript(() => { try { localStorage.setItem("lc_net_joined", "1"); } catch (e) {} });
  page = await openPortal(ctx, "#/profil");
  await step("Profil connecté : pseudo et langue lus dans TALK (pas de copie)", async () => {
    await page.waitForFunction(() => /@sebtest/.test(document.querySelector("#profileCard").textContent), null, { timeout: 25000 });
    const txt = (await page.textContent("#profileCard")).trim();
    const keys = await page.evaluate(() => Object.keys(localStorage));
    const copies = keys.filter((k) => /^ew/i.test(k));
    return { ok: /Français/.test(txt) && !copies.length, detail: txt.replace(/\s+/g, " ").slice(0, 70) + " · aucune donnée recopiée par le portail" };
  });
  await page.screenshot({ path: path.join(OUT, "telephone-profil.png") });
  await ctx.close();

  // ---------- Anglais ----------
  ctx = await newCtx({ locale: "en-US" });
  page = await openPortal(ctx);
  await step("Interface en anglais selon la langue du téléphone", async () => {
    const labels = await page.$$eval("#mainnav a", (n) => n.map((a) => a.textContent.trim()));
    return { ok: labels.join(",") === "Home,Apps,TALK,Profile", detail: labels.join(", ") };
  });
  await ctx.close();

  // ---------- Tablette et ordinateur ----------
  for (const [name, vp, mobile] of [["tablette", { width: 820, height: 1180 }, true], ["ordinateur", { width: 1366, height: 900 }, false]]) {
    ctx = await newCtx({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
    page = await openPortal(ctx);
    await step("Mise en page " + name + " (" + vp.width + " px)", async () => {
      await page.waitForSelector("#view-accueil.active");
      const r = await page.evaluate(() => ({ dir: getComputedStyle(document.getElementById("mainnav")).flexDirection, sw: document.documentElement.scrollWidth, w: innerWidth,
        cols: getComputedStyle(document.getElementById("homeApps")).gridTemplateColumns.split(" ").length }));
      await page.screenshot({ path: path.join(OUT, name + "-accueil.png") });
      const want = name === "ordinateur" ? "column" : "row";
      return { ok: r.dir === want && r.sw <= r.w && r.cols === 2, detail: "menu " + (r.dir === "column" ? "latéral" : "bas") + ", " + r.cols + " colonnes" };
    });
    await ctx.close();
  }

  // ---------- Non-régression : TALK seul, comme aujourd'hui ----------
  ctx = await newCtx();
  page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await step("Non-régression : TALK ouvert seul garde son en-tête, son bandeau et ses touches", async () => {
    await page.goto(ORIGIN + BASE);
    await page.waitForSelector("#tilePhone");
    await sleep(800);
    const r = await page.evaluate(() => ({ emb: document.documentElement.classList.contains("embedded") || document.documentElement.classList.contains("ew-shell") || !!document.getElementById("ewsNav"),
      hero: getComputedStyle(document.querySelector("header.hero-earth")).display !== "none", banner: !!document.querySelector(".test-banner") && getComputedStyle(document.querySelector(".test-banner")).display !== "none" }));
    return { ok: !r.emb && r.hero && r.banner && !errs.length, detail: errs.join(" | ").slice(0, 160) || "aucune erreur" };
  });
  await page.screenshot({ path: path.join(OUT, "talk-seul.png") });
  await ctx.close();

  await browser.close();
  server.close();
  const ok = results.filter((r) => r.ok).length;
  fs.writeFileSync(path.join(OUT, "resultats.json"), JSON.stringify({ date: new Date().toISOString(), reussis: ok, total: results.length, tests: results }, null, 2));
  console.log("\n" + ok + " / " + results.length + " tests réussis");
  process.exit(ok === results.length ? 0 : 1);
})().catch((e) => { console.error(e); server.close(); process.exit(2); });
