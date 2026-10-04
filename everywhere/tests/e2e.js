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
  await step("Accueil : « 24/24 Everywhere », « Un monde sans barrières. », cartes TALK et EVERYWHERE avec bouton Ouvrir", async () => {
    await page.waitForSelector("#view-accueil.active");
    const h1 = (await page.textContent("#h-accueil")).trim();
    const lead = (await page.textContent("#view-accueil .lead")).trim();
    const cards = await page.$$eval("#homeDuo .duo-card", (n) => n.map((x) => ({ t: x.querySelector("b").textContent, d: x.textContent, href: x.getAttribute("href"), w: x.getBoundingClientRect().width, h: x.getBoundingClientRect().height })));
    const ok = h1 === "24/24 Everywhere" && lead === "Un monde sans barrières." && cards.length === 2 && cards[0].t === "TALK" && /Communiquer sans barrières/.test(cards[0].d) &&
      cards[1].t === "EVERYWHERE" && /Accéder au monde sans limites/.test(cards[1].d) && cards.every((c) => /Ouvrir/.test(c.d) && c.w >= 330 && c.h >= 150);
    return { ok, detail: cards.map((c) => c.t + " → " + c.href + " (" + Math.round(c.w) + "×" + Math.round(c.h) + " px)").join(" · ") };
  });
  await step("Fond clair, bleu principal (TALK), vert (EVERYWHERE)", async () => {
    const c = await page.evaluate(() => ({ bg: getComputedStyle(document.body).backgroundColor, talk: getComputedStyle(document.getElementById("cardTalk")).backgroundImage, ew: getComputedStyle(document.getElementById("cardEverywhere")).backgroundImage }));
    const light = /rgb\((24[0-9]|25[0-5]), (24[0-9]|25[0-5]), 255\)/.test(c.bg);
    return { ok: light && /31, 95, 224/.test(c.talk) && /19, 160, 90/.test(c.ew), detail: "fond " + c.bg };
  });
  await step("Barre basse commune : Accueil, Talk, Everywhere, Profil", async () => {
    const labels = await page.$$eval("#mainnav a", (n) => n.map((a) => a.textContent.trim()));
    const pos = await page.$eval("#mainnav", (n) => { const r = n.getBoundingClientRect(); return { bottom: Math.round(r.bottom), h: innerHeight, dir: getComputedStyle(n).flexDirection }; });
    return { ok: labels.join(",") === "Accueil,Talk,Everywhere,Profil" && pos.bottom === pos.h && pos.dir === "row", detail: labels.join(", ") + " · collée en bas" };
  });
  await step("Zones tactiles ≥ 44 px (barre basse, roue dentée)", async () => {
    const sizes = await page.$$eval("#mainnav a, #topSettings", (n) => n.map((a) => { const r = a.getBoundingClientRect(); return Math.min(r.width, r.height); }));
    return { ok: sizes.every((s) => s >= 44), detail: "plus petite : " + Math.round(Math.min.apply(null, sizes)) + " px" };
  });
  for (const [label, route, view] of [["Everywhere", "#/everywhere", "view-everywhere"], ["Profil", "#/profil", "view-profil"], ["Accueil", "#/accueil", "view-accueil"]]) {
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

  await step("Accueil → carte TALK : TALK s'ouvre en pleine page et répond au toucher", async () => {
    await page.tap("#cardTalk .duo-btn");
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
    return { ok: r.shell && r.labels === "Accueil,Talk,Everywhere,Profil" && r.cur === "talk" && r.bottom && r.top && r.hero && r.sizes, detail: r.labels + " · actif : " + r.cur };
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
    await page.tap('#ewsNav a[data-nav="everywhere"]');
    await page.waitForSelector("#view-everywhere.active .lx-mods", { timeout: 10000 });
    return { ok: true, detail: "Accueil, puis TALK, puis EVERYWHERE" };
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
    await page.waitForSelector("#profileCard #cxCreate", { timeout: 20000 });
    const txt = await page.textContent("#profileCard");
    return { ok: /pas encore de profil/.test(txt), detail: txt.trim().slice(0, 60) };
  });
  await step("« Créer mon profil » ouvre la messagerie de TALK", async () => {
    await page.click("#profileCard #cxCreate");
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
  await step("Page Applications : TALK et EVERYWHERE ; #/app/everywhere mène au module", async () => {
    await page.goto(URL_EW + "#/applications");
    await page.waitForSelector("#view-applications.active");
    const names = await page.$$eval("#appList .app-card b", (n) => n.map((b) => b.textContent));
    await page.goto(URL_EW + "#/app/everywhere");
    await page.waitForSelector("#view-everywhere.active");
    return { ok: names.join(",") === "24/24 TALK,24/24 EVERYWHERE" && (await page.evaluate(() => location.hash)) === "#/everywhere", detail: names.join(", ") };
  });
  await step("Pas de défilement horizontal (téléphone, tous les écrans)", async () => {
    const bad = [];
    for (const r of ["#/accueil", "#/applications", "#/profil", "#/parametres", "#/everywhere", "#/everywhere/apprendre", "#/everywhere/lecon/en-deb-1", "#/everywhere/progression", "#/everywhere/conversation"]) {
      await page.goto(URL_EW + r);
      await page.waitForSelector(".view.active");
      await sleep(250);
      const w = await page.evaluate(() => { const v = document.querySelector(".view.active"); return [document.documentElement.scrollWidth, innerWidth, v.scrollWidth, v.clientWidth]; });
      if (w[0] > w[1] || w[2] > w[3]) bad.push(r + " " + w.join("/"));
    }
    return { ok: !bad.length, detail: bad.join("; ") || "9 écrans vérifiés à 393 px" };
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
    const keys = await page.evaluate(async () => { const c = await caches.open("ew-shell-v8"); return (await c.keys()).map((r) => new URL(r.url).pathname); });
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
  await ctx.addInitScript(() => { try { localStorage.setItem("lc_net_joined", "1"); if (localStorage.getItem("lc_net_auth") === null) localStorage.setItem("lc_net_auth", "fake"); } catch (e) {} });
  page = await openPortal(ctx, "#/profil");
  await step("Profil connecté : pseudo et langue lus dans TALK (pas de copie)", async () => {
    await page.waitForFunction(() => /@sebtest/.test(document.querySelector("#profileCard").textContent), null, { timeout: 25000 });
    const txt = (await page.textContent("#profileCard")).trim();
    const keys = await page.evaluate(() => Object.keys(localStorage));
    const copies = keys.filter((k) => /^ew/i.test(k));
    return { ok: /Français/.test(txt) && !copies.length, detail: txt.replace(/\s+/g, " ").slice(0, 70) + " · aucune donnée recopiée par le portail" };
  });
  await page.screenshot({ path: path.join(OUT, "telephone-profil.png") });

  // ---------- CONNECT (faux serveur : le bon code est 123456) ----------
  const card = (p) => p.textContent("#profileCard");
  await step("CONNECT : compte sans e-mail signalé honnêtement, appareils listés", async () => {
    await page.waitForSelector("#cxDevices .cx-dev", { timeout: 15000 });
    const txt = await card(page);
    const devs = await page.$$eval("#cxDevices .cx-dev", (n) => n.map((d) => d.textContent.replace(/\s+/g, " ").trim()));
    const honest = /n'est relié à aucune adresse e-mail/.test(txt) && /ne pourra pas être retrouvé/.test(txt) && !/entièrement récupérable/.test(txt);
    return { ok: honest && devs.length === 2 && /Cet appareil/.test(devs[0]) && /Windows · Chrome/.test(devs[1]) && /restent sur cet appareil/.test(txt), detail: devs.join(" | ") };
  });
  await step("CONNECT : « Sécuriser mon compte » refuse une adresse invalide et une adresse déjà prise", async () => {
    await page.click("#cxSecure");
    await page.fill("#cxEmail", "pas-une-adresse");
    await page.click("#cxSend");
    const a = await page.textContent("#cxMsg");
    await page.fill("#cxEmail", "pris@exemple.fr");
    await page.click("#cxSend");
    await page.waitForFunction(() => /déjà reliée/.test(document.querySelector("#cxMsg").textContent));
    return { ok: /invalide/.test(a), detail: (await page.textContent("#cxMsg")).trim().slice(0, 60) };
  });
  await step("CONNECT : code faux refusé, bon code accepté, compte sécurisé", async () => {
    await page.fill("#cxEmail", "sebastien@exemple.fr");
    await page.click("#cxSend");
    await page.waitForSelector("#cxCode");
    await page.fill("#cxCode", "000000");
    await page.click("#cxVerify");
    await page.waitForFunction(() => /incorrect ou expiré/.test(document.querySelector("#cxMsg").textContent));
    await page.fill("#cxCode", "123456");
    await page.click("#cxVerify");
    await page.waitForSelector("#profileCard .cx-ok", { timeout: 10000 });
    const txt = await card(page);
    return { ok: /relié à se•••@exemple\.fr/.test(txt) && /Compte sécurisé/.test(txt) && !(await page.$("#cxSecure")), detail: (await page.textContent("#profileCard .cx-ok")).trim() };
  });
  await page.screenshot({ path: path.join(OUT, "connect-securise.png") });
  await step("CONNECT : déconnecter l'autre appareil (deux appuis)", async () => {
    await page.waitForSelector("#cxDevices [data-out]");
    await page.click("#cxDevices [data-out]");
    const sure = await page.textContent("#cxDevices [data-out]");
    await page.click("#cxDevices [data-out]");
    await page.waitForFunction(() => /Aucun autre appareil/.test(document.querySelector("#cxDevices").textContent));
    const n = await page.$$eval("#cxDevices .cx-dev", (x) => x.length);
    return { ok: /Confirmer/.test(sure) && n === 1, detail: (await page.textContent("#cxDevices .cx-msg")).trim().slice(0, 70) };
  });
  await step("CONNECT : aucune erreur JavaScript dans le portail", async () => ({ ok: !page._errors.length, detail: page._errors.join(" | ").slice(0, 160) || "aucune" }));
  await ctx.close();

  // ---------- CONNECT : nouvel appareil (aucune session enregistrée) ----------
  ctx = await newCtx({}, true);
  page = await openPortal(ctx, "#/profil");
  await step("Nouvel appareil : invitation affichée sans attendre le serveur", async () => {
    await page.waitForSelector("#cxHave", { timeout: 5000 });
    return { ok: /pas encore de profil/.test(await card(page)) };
  });
  await step("Nouvel appareil : adresse inconnue refusée, adresse reliée + code → compte retrouvé", async () => {
    await page.click("#cxHave");
    await page.fill("#cxEmail", "inconnu@exemple.fr");
    await page.click("#cxSend");
    await page.waitForFunction(() => /Aucun compte/.test(document.querySelector("#cxMsg").textContent));
    await page.fill("#cxEmail", "connu@exemple.fr");
    await page.click("#cxSend");
    await page.waitForSelector("#cxCode");
    await page.fill("#cxCode", "123456");
    await page.click("#cxVerify");
    await page.waitForFunction(() => /Connecté : bienvenue @sebtest/.test(document.querySelector("#profileCard").textContent), null, { timeout: 10000 });
    const joined = await page.evaluate(() => localStorage.getItem("lc_net_joined"));
    return { ok: joined === "1" && /Compte sécurisé/.test(await card(page)), detail: "TALK se reconnectera à ce compte" };
  });
  await page.screenshot({ path: path.join(OUT, "connect-nouvel-appareil.png") });
  await step("Lien de l'e-mail : l'e-mail renvoie vers le portail (Profil)", async () => {
    const r = await page.evaluate(() => localStorage.getItem("fake_redirect"));
    return { ok: r === URL_EW, detail: r };
  });
  await step("Lien « J'ai déjà un compte » de TALK : ouvre directement la connexion", async () => {
    await page.evaluate(() => { localStorage.removeItem("fake_sb"); localStorage.removeItem("lc_net_auth"); sessionStorage.setItem("ew_connect_login", "1"); });
    await page.goto(URL_EW + "#/accueil");
    await page.goto(URL_EW + "#/profil");
    await page.waitForSelector("#cxEmail", { timeout: 5000 });
    const left = await page.evaluate(() => sessionStorage.getItem("ew_connect_login"));
    const src = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
    return { ok: left === null && /id="netHaveAccount"/.test(src) && /ew_connect_login/.test(src) };
  });
  await ctx.close();

  // ---------- CONNECT : retour par le lien de l'e-mail ----------
  ctx = await newCtx({}, true);
  page = await openPortal(ctx, "#access_token=aaa.bbb.ccc&expires_in=3600&refresh_token=rrr&token_type=bearer&type=magiclink");
  await step("Lien de l'e-mail (nouvel appareil) : compte retrouvé, jeton effacé de l'adresse", async () => {
    await page.waitForFunction(() => /Connecté : bienvenue @sebtest/.test(document.querySelector("#profileCard").textContent), null, { timeout: 10000 });
    const r = await page.evaluate(() => ({ h: location.hash, j: localStorage.getItem("lc_net_joined") }));
    return { ok: r.h === "#/profil" && r.j === "1" && !page._errors.length, detail: "adresse : " + r.h };
  });
  await ctx.close();
  ctx = await newCtx({}, true);
  page = await openPortal(ctx, "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");
  await step("Lien de l'e-mail périmé : message clair, rien d'autre ne change", async () => {
    await page.waitForFunction(() => /n'a pas fonctionné/.test(document.querySelector("#profileCard").textContent), null, { timeout: 10000 });
    const txt = await page.textContent("#profileCard .cx-msg");
    return { ok: /expired/.test(txt) && (await page.evaluate(() => location.hash)) === "#/profil", detail: txt.trim().slice(0, 80) };
  });
  await step("Lien de l'e-mail arrivé sur l'adresse principale (TALK) : renvoyé vers Profil", async () => {
    await page.goto(ORIGIN + BASE + "#access_token=aaa.bbb.ccc&refresh_token=rrr&type=email_change");
    await page.waitForFunction(() => /relié à/.test((document.querySelector("#profileCard") || {}).textContent || ""), null, { timeout: 15000 });
    return { ok: /everywhere\/$/.test(new URL(page.url()).pathname) && new URL(page.url()).hash === "#/profil", detail: new URL(page.url()).pathname + new URL(page.url()).hash };
  });
  await ctx.close();

  // ---------- EVERYWHERE : apprendre (phase 1 + MVP de la phase 2) ----------
  const CONTENT = path.join(__dirname, "..", "learn", "content");
  const CAT = JSON.parse(fs.readFileSync(path.join(CONTENT, "catalogue.json"), "utf8"));
  const LESSONS = {};
  CAT.languages.filter((l) => l.status === "available").forEach((l) => { LESSONS[l.id] = JSON.parse(fs.readFileSync(path.join(CONTENT, l.file), "utf8")).lessons; });
  await step("Contenus : chaque exercice a une réponse parmi ses choix, chaque langue a des leçons aux 3 niveaux", async () => {
    const bad = [];
    let nLessons = 0, nEx = 0;
    for (const [code, ls] of Object.entries(LESSONS)) {
      for (const lv of CAT.levels) if (!ls.some((l) => l.level === lv.id)) bad.push(code + " sans leçon " + lv.id);
      for (const l of ls) {
        nLessons++;
        if (!l.id.startsWith(code + "-") || !l.vocab.length || !l.exercises.length) bad.push(l.id + " incomplète");
        for (const ex of l.exercises) {
          nEx++;
          if (ex.type === "match") { if (ex.pairs.length < 3) bad.push(l.id + " paires"); continue; }
          if (!ex.options.includes(ex.answer) || new Set(ex.options).size !== ex.options.length) bad.push(l.id + " : " + ex.answer);
          if (ex.type === "complete" && ex.sentence.split("___").length !== 2) bad.push(l.id + " phrase à trou");
        }
      }
    }
    return { ok: !bad.length, detail: bad.join(", ") || Object.keys(LESSONS).length + " langues, " + nLessons + " leçons, " + nEx + " exercices" };
  });

  ctx = await newCtx();
  page = await openPortal(ctx);
  // Répond à l'exercice affiché. wrong = true : choisit volontairement une mauvaise réponse.
  async function answer(p, ex, wrong) {
    if (ex.type === "match") {
      for (let i = 0; i < ex.pairs.length; i++) {
        await p.tap('#lxEx .lx-m[data-side="l"][data-i="' + i + '"]');
        await p.tap('#lxEx .lx-m[data-side="r"][data-i="' + i + '"]');
      }
      return;
    }
    const target = wrong ? ex.options.find((o) => o !== ex.answer) : ex.answer;
    const opts = await p.$$("#lxEx .lx-opt");
    for (const o of opts) if ((await o.textContent()).trim() === target) { await o.tap(); return; }
    throw new Error("option introuvable : " + target);
  }
  await step("Carte EVERYWHERE de l'accueil → tableau de bord EVERYWHERE (modules, invitation à choisir une langue)", async () => {
    await page.tap("#cardEverywhere .duo-btn");
    await page.waitForSelector("#view-everywhere.active #lxStart", { timeout: 10000 });
    const mods = await page.$$eval("#view-everywhere .lx-mod", (n) => n.map((m) => m.textContent.replace(/\s+/g, " ").trim()));
    const soon = mods.filter((m) => /Bientôt/.test(m));
    const cur = await page.$eval('#mainnav a[data-nav="everywhere"]', (a) => a.getAttribute("aria-current"));
    await page.screenshot({ path: path.join(OUT, "everywhere-tableau-de-bord.png") });
    return { ok: mods.length === 6 && soon.length === 2 && /Conversation avec l'IA/.test(soon[0]) && /Cultures du monde/.test(soon[1]) && cur === "page" && (await page.evaluate(() => location.hash)) === "#/everywhere",
      detail: "6 modules, dont 2 marqués « Bientôt » (IA, cultures)" };
  });
  await step("Choix de la langue (anglais) et du niveau (débutant) : leçons du niveau affichées", async () => {
    await page.tap("#lxStart");
    await page.waitForSelector("#view-everywhere [data-lang]");
    const soonLangs = await page.$$eval("#view-everywhere [data-lang]:disabled", (n) => n.length);
    await page.tap('#view-everywhere [data-lang="en"]');
    await page.waitForSelector("#lxLessons .lx-lesson");
    const checked = await page.$eval('#view-everywhere [data-lang="en"]', (b) => b.getAttribute("aria-checked"));
    const lvl = await page.$eval('#view-everywhere [data-level="debutant"]', (b) => b.getAttribute("aria-checked"));
    const n = await page.$$eval("#lxLessons .lx-lesson", (x) => x.length);
    await page.tap('#view-everywhere [data-level="avance"]');
    await page.waitForFunction(() => /Expressions idiomatiques/.test(document.querySelector("#lxLessons").textContent));
    await page.tap('#view-everywhere [data-level="debutant"]');
    await page.waitForFunction(() => document.querySelectorAll("#lxLessons .lx-lesson").length === 3);
    await page.screenshot({ path: path.join(OUT, "everywhere-apprendre.png") });
    const want = LESSONS.en.filter((l) => l.level === "debutant").length;
    return { ok: checked === "true" && lvl === "true" && n === want && soonLangs === 2, detail: n + " leçons débutant, niveau avancé vérifié, 2 langues « Bientôt » non sélectionnables" };
  });
  const L1 = LESSONS.en[0];
  await step("Leçon : vocabulaire, expressions courantes, boutons d'écoute, puis exercices", async () => {
    await page.tap('#lxLessons a[href="#/everywhere/lecon/' + L1.id + '"]');
    await page.waitForSelector("#lxGo");
    const words = await page.$$eval("#view-everywhere .lx-word", (n) => n.length);
    const says = await page.$$eval("#view-everywhere .lx-word [data-say]", (n) => n.length);
    const h1 = await page.textContent("#view-everywhere h1");
    await page.screenshot({ path: path.join(OUT, "everywhere-lecon.png") });
    return { ok: words === L1.vocab.length + L1.phrases.length && says === words && h1.includes(L1.title), detail: words + " mots et phrases, chacun avec son bouton d'écoute" };
  });
  await step("Exercice : une mauvaise réponse est signalée en texte, avec la bonne réponse", async () => {
    await page.tap("#lxGo");
    await page.waitForSelector("#lxEx .lx-opt");
    await answer(page, L1.exercises[0], true);
    await page.waitForSelector("#lxNext:not([hidden])");
    const fb = (await page.textContent("#lxFb")).trim();
    const good = await page.$eval("#lxEx .lx-opt.good", (b) => b.textContent.trim());
    const dis = await page.$$eval("#lxEx .lx-opt", (n) => n.every((b) => b.disabled));
    await page.screenshot({ path: path.join(OUT, "everywhere-exercice-faux.png") });
    return { ok: fb.includes("La bonne réponse : " + L1.exercises[0].answer) && good.startsWith(L1.exercises[0].answer) && dis, detail: fb };
  });
  await step("Exercices suivants (associer, compléter, écouter, expression) : réussis, puis résultat affiché", async () => {
    const types = [];
    for (let i = 1; i < L1.exercises.length; i++) {
      await page.tap("#lxNext");
      await page.waitForFunction((n) => document.querySelector(".lx-count") && document.querySelector(".lx-count").textContent.includes(String(n)), i + 1);
      const ex = L1.exercises[i];
      types.push(ex.type);
      await answer(page, ex, false);
      await page.waitForSelector("#lxNext:not([hidden])");
      const fb = await page.$eval("#lxFb", (f) => f.className);
      if (!/ok/.test(fb)) throw new Error("exercice " + (i + 1) + " non validé");
      if (i === 1) await page.screenshot({ path: path.join(OUT, "everywhere-exercice-associer.png") });
    }
    await page.tap("#lxNext");
    await page.waitForSelector("#lxScore");
    const score = (await page.textContent("#lxScore")).trim();
    const stars = await page.$eval(".lx-stars", (s) => s.getAttribute("aria-label"));
    await page.screenshot({ path: path.join(OUT, "everywhere-resultat.png") });
    const n = L1.exercises.length;
    return { ok: score === (n - 1) + " bonnes réponses sur " + n && stars === "2 / 3" && !!(await page.$("#lxNextLesson")), detail: score + " · types : " + [...new Set(types)].join(", ") };
  });
  await step("Progression consultable : XP, leçon terminée, exercices, historique", async () => {
    await page.goto(URL_EW + "#/everywhere/progression");
    await page.waitForSelector("#lxStXp");
    const r = await page.evaluate(() => ({ xp: document.querySelector("#lxStXp b").textContent, les: document.querySelector("#lxStLessons b").textContent,
      ex: document.querySelector("#lxStEx b").textContent, hist: document.querySelector("#lxHist") && document.querySelector("#lxHist").textContent }));
    await page.screenshot({ path: path.join(OUT, "everywhere-progression.png"), fullPage: true });
    const n = L1.exercises.length, xp = (n - 1) * 10 + 20;
    return { ok: r.xp === String(xp) && r.les === "1" && r.ex === String(n) && r.hist && r.hist.includes(L1.title), detail: r.xp + " XP, " + r.les + " leçon, " + r.ex + " exercices, historique à jour" };
  });
  await step("Progression gardée après fermeture et réouverture de la page", async () => {
    await page.reload();
    await page.waitForSelector("#lxStXp");
    await page.goto(URL_EW + "#/everywhere/apprendre");
    await page.waitForSelector("#lxLessons .badge.ok");
    const b = await page.textContent("#lxLessons .badge.ok");
    return { ok: /Terminée · 5\/6/.test(b), detail: b.trim() };
  });
  await step("Tableau de bord : leçon suivante proposée, objectif du jour", async () => {
    await page.goto(URL_EW + "#/everywhere");
    await page.waitForSelector("#lxContinue");
    const href = await page.getAttribute("#lxContinue", "href");
    const bar = await page.$eval("#view-everywhere .lx-today [role=progressbar]", (b) => b.getAttribute("aria-valuenow"));
    return { ok: href === "#/everywhere/lecon/" + LESSONS.en[1].id && +bar > 0, detail: "suivante : " + LESSONS.en[1].title };
  });
  await step("Réviser : questions tirées de la leçon terminée (dont le mot raté)", async () => {
    await page.goto(URL_EW + "#/everywhere/reviser");
    await page.tap("#lxGo");
    await page.waitForSelector("#lxEx .lx-q");
    const pool = L1.vocab.map((v) => v.w).concat(L1.vocab.map((v) => v.t));
    let seenMissed = false, n = 0;
    for (;;) {
      n++;
      const q = await page.evaluate(() => ({ q: document.querySelector("#lxEx .lx-q").textContent, e: (document.querySelector("#lxEx .lx-expr span") || {}).textContent || "", o: [...document.querySelectorAll("#lxEx .lx-opt")].map((b) => b.textContent.trim()) }));
      if (/Thank you|Merci/.test(q.q + q.e + q.o.join())) seenMissed = true;
      if (!q.o.every((o) => pool.includes(o))) throw new Error("choix hors leçon : " + q.o.join(" | "));
      await page.tap("#lxEx .lx-opt");
      await page.waitForSelector("#lxNext:not([hidden])");
      const last = /résultat/.test(await page.textContent("#lxNext"));
      await page.tap("#lxNext");
      if (last) break;
      await page.waitForFunction((k) => document.querySelector(".lx-count") && document.querySelector(".lx-count").textContent.startsWith("Exercice " + k), n + 1);
    }
    await page.waitForSelector("#lxScore");
    return { ok: n === 6 && seenMissed, detail: n + " questions, le mot raté (« Thank you ») revient en révision" };
  });
  await step("Défi rapide : 8 questions, résultat affiché", async () => {
    await page.goto(URL_EW + "#/everywhere/defi");
    await page.tap("#lxGo");
    for (let i = 0; i < 8; i++) {
      await page.waitForSelector("#lxEx .lx-opt:not([disabled])");
      await page.tap("#lxEx .lx-opt");
      await page.waitForSelector("#lxNext:not([hidden])");
      await page.tap("#lxNext");
    }
    await page.waitForSelector("#lxScore");
    return { ok: /sur 8$/.test((await page.textContent("#lxScore")).trim()) };
  });
  await step("Conversation avec l'IA et Cultures : annoncées « Bientôt », sans fausse IA ni clé dans le site", async () => {
    await page.goto(URL_EW + "#/everywhere/conversation");
    await page.waitForSelector("#view-everywhere .lx-soon");
    const txt = await page.textContent("#view-everywhere");
    const inputs = await page.$$eval("#view-everywhere input, #view-everywhere textarea", (n) => n.length);
    const src = ["learn/learn.js", "learn/exercises.js", "learn/progress.js", "app.js", "config.js"].map((f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8")).join("\n");
    const secret = /sk-ant-|sk-[A-Za-z0-9]{20}|service_role|api[_-]?key\s*[:=]/i.test(src);
    await page.goto(URL_EW + "#/everywhere/cultures");
    await page.waitForSelector("#view-everywhere .lx-soon");
    return { ok: /Bientôt/.test(txt) && /clé doit rester secrète/.test(txt) && inputs === 0 && !secret, detail: "aucune zone de saisie simulée, aucune clé dans le code" };
  });
  await step("Clavier : un exercice se fait entièrement au clavier (Tab, Entrée)", async () => {
    await page.goto(URL_EW + "#/everywhere/lecon/" + L1.id);
    await page.waitForSelector("#lxGo");
    await page.focus("#lxGo");
    await page.keyboard.press("Enter");
    await page.waitForSelector("#lxEx .lx-opt");
    const focusedQ = await page.evaluate(() => document.activeElement.classList.contains("lx-q"));
    await page.keyboard.press("Tab");
    const onOpt = await page.evaluate(() => document.activeElement.classList.contains("lx-opt"));
    await page.keyboard.press("Enter");
    await page.waitForSelector("#lxNext:not([hidden])");
    const onNext = await page.evaluate(() => document.activeElement.id === "lxNext");
    const live = await page.$eval("#lxFb", (f) => f.getAttribute("aria-live"));
    return { ok: focusedQ && onOpt && onNext && live === "polite", detail: "question annoncée, choix au clavier, résultat lu par le lecteur d'écran" };
  });
  await step("Accessibilité : taille du texte, contraste renforcé et thème sombre (Paramètres)", async () => {
    await page.goto(URL_EW + "#/parametres");
    await page.waitForSelector("#view-parametres.active");
    await page.tap('button[data-ts="2"]');
    await page.tap("#contrastToggle");
    await page.tap('button[data-theme="dark"]');
    const r = await page.evaluate(() => ({ ts: document.documentElement.getAttribute("data-ts"), c: document.documentElement.classList.contains("contrast-high"),
      dark: document.documentElement.classList.contains("theme-dark"), zoom: getComputedStyle(document.querySelector("#view-parametres .pad")).zoom, bg: getComputedStyle(document.body).backgroundColor }));
    await page.screenshot({ path: path.join(OUT, "parametres-accessibilite.png") });
    await page.goto(URL_EW + "#/everywhere");
    await page.reload();
    await page.waitForSelector("#view-everywhere .lx-mods");
    const kept = await page.evaluate(() => document.documentElement.getAttribute("data-ts") === "2" && document.documentElement.classList.contains("theme-dark"));
    const sw = await page.evaluate(() => { const v = document.querySelector(".view.active"); return v.scrollWidth <= v.clientWidth && document.documentElement.scrollWidth <= innerWidth; });
    await page.screenshot({ path: path.join(OUT, "everywhere-grand-texte-sombre.png") });
    await page.tap('#mainnav a[data-nav="accueil"]');
    await page.evaluate(() => { localStorage.removeItem("ew_prefs"); });
    return { ok: r.ts === "2" && r.c && r.dark && +r.zoom > 1.2 && r.bg === "rgb(5, 9, 19)" && kept && sw, detail: "texte ×" + r.zoom + ", réglages gardés après rechargement, pas de défilement horizontal" };
  });
  await step("EVERYWHERE : aucune erreur JavaScript", async () => ({ ok: !page._errors.length, detail: page._errors.join(" | ").slice(0, 200) || "aucune" }));
  await ctx.close();

  // ---------- Anglais ----------
  ctx = await newCtx({ locale: "en-US" });
  page = await openPortal(ctx);
  await step("Interface en anglais selon la langue du téléphone", async () => {
    const labels = await page.$$eval("#mainnav a", (n) => n.map((a) => a.textContent.trim()));
    return { ok: labels.join(",") === "Home,Talk,Everywhere,Profile", detail: labels.join(", ") };
  });
  await ctx.close();

  // ---------- Tablette et ordinateur ----------
  for (const [name, vp, mobile] of [["tablette", { width: 820, height: 1180 }, true], ["ordinateur", { width: 1366, height: 900 }, false]]) {
    ctx = await newCtx({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
    page = await openPortal(ctx);
    await step("Mise en page " + name + " (" + vp.width + " px)", async () => {
      await page.waitForSelector("#view-accueil.active");
      const r = await page.evaluate(() => ({ dir: getComputedStyle(document.getElementById("mainnav")).flexDirection, sw: document.documentElement.scrollWidth, w: innerWidth,
        cols: getComputedStyle(document.getElementById("homeDuo")).gridTemplateColumns.split(" ").length }));
      await page.screenshot({ path: path.join(OUT, name + "-accueil.png") });
      const want = name === "ordinateur" ? "column" : "row";
      return { ok: r.dir === want && r.sw <= r.w && r.cols === 2, detail: "menu " + (r.dir === "column" ? "latéral" : "bas") + ", " + r.cols + " colonnes" };
    });
    await step("EVERYWHERE sur " + name + " : leçon et exercice utilisables, sans défilement horizontal", async () => {
      await page.goto(URL_EW + "#/everywhere/lecon/es-deb-1");
      await page.waitForSelector("#lxGo");
      await page.click("#lxGo");
      await page.waitForSelector("#lxEx .lx-opt");
      await page.click("#lxEx .lx-opt");
      await page.waitForSelector("#lxNext:not([hidden])");
      const r = await page.evaluate(() => { const v = document.querySelector(".view.active"); return { ok: v.scrollWidth <= v.clientWidth && document.documentElement.scrollWidth <= innerWidth,
        cols: getComputedStyle(document.querySelector(".lx-opts")).gridTemplateColumns.split(" ").length }; });
      await page.screenshot({ path: path.join(OUT, name + "-everywhere-exercice.png") });
      return { ok: r.ok, detail: "espagnol, choix sur " + r.cols + " colonnes" };
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
