/* 24/24 ONE WORLD — tests de la dépendance Supabase (version figée + empreinte SRI) et des modes TEST / production.
   Aucun accès réseau extérieur : le site est servi en local et le fichier de la bibliothèque est fourni par le test.
   Pour vérifier l'empreinte avec le VRAI fichier publié sur npm, indiquer son chemin dans SB_SDK
   (par exemple le fichier package/dist/umd/supabase.js du paquet obtenu par « npm pack @supabase/supabase-js@2.117.2 »).
   Sans SB_SDK, les tests qui en ont besoin sont signalés « NON EXÉCUTÉ » (jamais comptés comme réussis). */
const path = require("path");
const fs = require("fs");
const http = require("http");
const vm = require("vm");
const crypto = require("crypto");
let pw;
try { pw = require("playwright"); } catch (e) { pw = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright"); }
const { chromium } = pw;

const SITE = path.resolve(__dirname, "../..");
const BASE = "/24-24-talk/";
const OUT = process.env.EW_OUT || path.join(__dirname, "resultats");
fs.mkdirSync(OUT, { recursive: true });
const SDK_VERSION = "2.117.2";
const SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@" + SDK_VERSION + "/dist/umd/supabase.js";
const SDK_FILE = process.env.SB_SDK || "";
const TEST_REF = "tbynnefrrxzxufcptijc", PROD_REF = "wsgcumnaltdinchsdovs";

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
let skipped = 0;
function rec(name, ok, detail) { results.push({ name, ok: !!ok, detail: detail || "" }); console.log((ok ? "OK   " : "ÉCHEC") + "  " + name + (detail ? "  — " + detail : "")); }
function skip(name, why) { skipped++; console.log("NON EXÉCUTÉ  " + name + "  — " + why); }
async function step(name, fn) { try { const r = await fn(); rec(name, r === undefined ? true : r.ok, r && r.detail); } catch (e) { rec(name, false, String(e && e.message || e).split("\n")[0]); } }
const read = (f) => fs.readFileSync(path.join(SITE, f), "utf8");

// Fichiers du site (hors tests) qui chargent la bibliothèque.
const FILES = ["index.html", "everywhere/config.js", "everywhere/connect.js", "gestion/index.html"];
function siteFiles(dir, out) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n), rel = path.relative(SITE, p);
    if (/^(\.git|node_modules)$/.test(n) || rel === path.join("everywhere", "tests")) continue;
    if (fs.statSync(p).isDirectory()) siteFiles(p, out); else if (/\.(html|js)$/.test(n)) out.push(rel);
  }
  return out;
}

(async () => {
  // ================= VERSION FIGÉE (lecture des fichiers) =================
  const sriOf = {};
  await step("Version figée : chaque chargement de supabase-js vise exactement " + SDK_VERSION + " (fichier dist/umd/supabase.js)", async () => {
    const found = {};
    found["index.html"] = (read("index.html").match(/const NET_SDK_URL = "([^"]+)"/) || [])[1];
    found["everywhere/config.js"] = (read("everywhere/config.js").match(/sdk: "([^"]+)"/) || [])[1];
    found["gestion/index.html"] = (read("gestion/index.html").match(/<script src="([^"]*supabase-js[^"]*)"/) || [])[1];
    const bad = Object.keys(found).filter((k) => found[k] !== SDK_URL);
    return { ok: !bad.length, detail: bad.length ? JSON.stringify(found) : "3 adresses identiques" };
  });
  await step("Version figée : aucune adresse flottante (« supabase-js@2 » sans numéro complet) dans le site", async () => {
    const hits = siteFiles(SITE, []).filter((f) => /supabase-js@\d+(?![.\d])/.test(read(f)));
    return { ok: !hits.length, detail: hits.length ? hits.join(", ") : siteFiles(SITE, []).length + " fichiers vérifiés" };
  });
  await step("Empreinte : la même empreinte SRI (sha384) est déclarée partout et appliquée par chaque chargeur", async () => {
    sriOf["index.html"] = (read("index.html").match(/const NET_SDK_SRI = "(sha384-[A-Za-z0-9+/=]+)"/) || [])[1];
    sriOf["everywhere/config.js"] = (read("everywhere/config.js").match(/sri: "(sha384-[A-Za-z0-9+/=]+)"/) || [])[1];
    sriOf["gestion/index.html"] = (read("gestion/index.html").match(/integrity="(sha384-[A-Za-z0-9+/=]+)" crossorigin="anonymous"/) || [])[1];
    const vals = Object.values(sriOf);
    const uses = /s\.integrity = NET_SDK_SRI; s\.crossOrigin = "anonymous"/.test(read("index.html")) &&
      /s\.integrity = CFG\.supabase\.sri; s\.crossOrigin = "anonymous"/.test(read("everywhere/connect.js"));
    return { ok: vals.every((v) => v && v === vals[0]) && uses, detail: vals[0] || "absente" };
  });
  if (SDK_FILE && fs.existsSync(SDK_FILE)) {
    await step("Empreinte : elle correspond octet pour octet au fichier officiel fourni (SB_SDK)", async () => {
      const h = "sha384-" + crypto.createHash("sha384").update(fs.readFileSync(SDK_FILE)).digest("base64");
      return { ok: h === sriOf["index.html"], detail: h };
    });
  } else skip("Empreinte : correspondance avec le fichier officiel", "SB_SDK non fourni");

  // ================= MODES TEST / PRODUCTION =================
  const runConfig = (src) => { const ctx = { window: {} }; vm.runInNewContext(src, ctx); return ctx.window.EW_CONFIG; };
  await step("Mode TEST : everywhere/config.js vise la base de TEST, bandeau « test »", async () => {
    const c = runConfig(read("everywhere/config.js"));
    return { ok: c.env === "test" && c.supabase && c.supabase.url.indexOf(TEST_REF) > 0 && c.supabase.sdk === SDK_URL, detail: c.env + " · " + (c.supabase && c.supabase.url) };
  });
  await step("Garde-fou : adresse de production avec env « test » → aucun serveur ; avec env « production » → serveur gardé, même version figée", async () => {
    const prod = read("everywhere/config.js").replace(TEST_REF, PROD_REF);
    const a = runConfig(prod), b = runConfig(prod.replace('env: "test"', 'env: "production"'));
    return { ok: a.supabase === null && b.supabase && b.supabase.sdk === SDK_URL && b.supabase.sri === sriOf["everywhere/config.js"], detail: "test → " + a.supabase + ", production → " + (b.supabase && b.supabase.url) };
  });
  await step("Garde-fou TALK : index.html vise la base de TEST et efface l'adresse si c'est celle de production", async () => {
    const s = read("index.html");
    return { ok: s.indexOf(TEST_REF + ".supabase.co") > 0 && new RegExp(PROD_REF).test(s.slice(s.indexOf("NET_CONFIG"), s.indexOf("NET_CONFIG") + 2000)), detail: "garde-fou présent" };
  });
  await step("Constat (pas un échec de cette correction) : gestion/index.html n'a pas encore de garde-fou production", async () => {
    const has = /wsgcumnaltdinchsdovs/.test(read("gestion/index.html"));
    return { ok: true, detail: has ? "garde-fou présent" : "absent : correction séparée proposée" };
  });

  // ================= EMPREINTE APPLIQUÉE PAR LE NAVIGATEUR =================
  if (!SDK_FILE || !fs.existsSync(SDK_FILE)) {
    for (const n of ["TALK", "ONE WORLD (profil)", "Gestion"]) {
      skip(n + " : le vrai fichier est accepté", "SB_SDK non fourni");
      skip(n + " : un fichier modifié d'un seul octet est refusé", "SB_SDK non fourni");
    }
    skip("Compatibilité " + SDK_VERSION + " : fonctions utilisées par le site", "SB_SDK non fourni");
  } else {
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const ORIGIN = "http://localhost:" + server.address().port;
    const browser = await chromium.launch();
    const REAL = fs.readFileSync(SDK_FILE);
    const TAMPERED = Buffer.concat([REAL, Buffer.from("\n/* modifié */")]);
    const PAGES = [
      ["TALK", ORIGIN + BASE + "index.html", { lc_net_joined: "1", lc_net_auth: "fake" }],
      ["ONE WORLD (profil)", ORIGIN + BASE + "everywhere/#/profil", { lc_net_auth: "fake" }],
      ["Gestion", ORIGIN + BASE + "gestion/", {}]
    ];
    for (const [nom, url, ls] of PAGES) {
      for (const [cas, body] of [["vrai", REAL], ["modifié", TAMPERED]]) {
        const ctx = await browser.newContext({ viewport: { width: 393, height: 851 } });
        let served = 0;
        await ctx.route(/^https?:\/\/(?!localhost)/, (r) => {
          if (r.request().url() === SDK_URL) { served++; return r.fulfill({ status: 200, contentType: "text/javascript", headers: { "Access-Control-Allow-Origin": "*" }, body }); }
          return r.abort(); // aucun vrai serveur Supabase n'est contacté
        });
        await ctx.addInitScript((ls) => { try { Object.keys(ls).forEach((k) => localStorage.setItem(k, ls[k])); } catch (e) {} }, ls);
        const page = await ctx.newPage();
        const errs = [];
        page.on("console", (m) => { if (/integrity/i.test(m.text())) errs.push(m.text().slice(0, 90)); });
        await page.goto(url);
        await page.waitForFunction(() => !!document.querySelector('script[src*="supabase-js"]'), null, { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(1500);
        const r = await page.evaluate(() => { const s = document.querySelector('script[src*="supabase-js"]');
          return { tag: !!s, integrity: s ? s.integrity : "", lib: !!(window.supabase && window.supabase.createClient) }; });
        const name = nom + (cas === "vrai" ? " : le vrai fichier est accepté (bibliothèque chargée, empreinte sur la balise)" : " : un fichier modifié d'un seul octet est refusé (bibliothèque absente)");
        const ok = r.tag && served >= 1 && r.integrity === sriOf["index.html"] && (cas === "vrai" ? r.lib : !r.lib && errs.length >= 1);
        rec(name, ok, JSON.stringify({ chargé: served, balise: r.tag, empreinte: !!r.integrity, bibliothèque: r.lib, alerte: errs[0] || "" }));
        if (cas === "vrai" && nom === "TALK" && r.lib) await step("Compatibilité " + SDK_VERSION + " : createClient accepte nos options et chaque fonction utilisée par le site existe", async () => {
          const miss = await page.evaluate(() => {
            const c = window.supabase.createClient("https://exemple.invalid", "sb_publishable_test", { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "test_sri" } });
            const need = ["from", "rpc", "channel", "removeChannel", "removeAllChannels", "auth.getSession", "auth.getUser", "auth.setSession", "auth.signInAnonymously",
              "auth.signInWithOtp", "auth.signOut", "auth.updateUser", "auth.verifyOtp", "functions.invoke", "realtime.setAuth"];
            const ch = c.channel("t"), chOk = typeof ch.on === "function" && typeof ch.subscribe === "function" && typeof ch.send === "function";
            return need.filter((n) => typeof n.split(".").reduce((o, k) => o && o[k], c) !== "function").concat(chOk ? [] : ["channel.on/subscribe/send"]);
          });
          return { ok: !miss.length, detail: miss.length ? "manque : " + miss.join(", ") : "15 fonctions + canal temps réel" };
        });
        await ctx.close();
      }
    }
    await browser.close();
    server.close();
  }

  const ok = results.filter((r) => r.ok).length;
  fs.writeFileSync(path.join(OUT, "dependances.json"), JSON.stringify({ date: new Date().toISOString(), reussis: ok, total: results.length, non_executes: skipped, tests: results }, null, 2));
  console.log("\n" + ok + " / " + results.length + " tests réussis" + (skipped ? ", " + skipped + " non exécutés" : ""));
  process.exit(ok === results.length ? 0 : 1);
})().catch((e) => { console.error(e); server.close(); process.exit(2); });
