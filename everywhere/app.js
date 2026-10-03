/* 24/24 EVERYWHERE — coquille commune : navigation, routes internes, profil, paramètres, applications intégrées.
   © 2026 Sébastien Chevrier. Tous droits réservés. Sans bibliothèque ni étape de compilation (comme 24/24 TALK). */
(function () {
  "use strict";
  var CFG = window.EW_CONFIG || { env: "test", basePath: "../", talkReadyTimeoutMs: 15000 };
  var APPS = window.EW_APPS || [];
  var VERSION = "0.2.0 (prototype)";
  var VERSION_TAG = "0.2.0";

  // ---------- Stockage (peut être indisponible : navigation privée stricte, etc.) ----------
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignoré */ } }
  };

  // ---------- Langue : même réglage que 24/24 TALK (clé lc_uilang) ; le portail existe en français et en anglais ----------
  var pref = store.get("lc_uilang") || "auto";
  var lang = (pref !== "auto" ? pref : (navigator.language || "fr")).slice(0, 2).toLowerCase() === "fr" ? "fr" : "en";
  if (pref === "auto" && /^fr/i.test(navigator.language || "")) lang = "fr";
  document.documentElement.lang = lang;
  var STR = {
    fr: {
      skip: "Aller au contenu", offline: "Hors ligne : certaines fonctions sont indisponibles.",
      home: "Accueil", apps: "Applications", profile: "Profil", settings: "Paramètres", open_full: "Ouvrir en plein écran",
      lead: "Toutes vos applications 24/24, au même endroit.", your_apps: "Vos applications",
      apps_lead: "Chaque application s'ouvre ici, sans quitter 24/24 EVERYWHERE.",
      open: "Ouvrir", reserved: "Disponible ultérieurement", reserved_badge: "EMPLACEMENT RÉSERVÉ",
      reserved_txt: "Cet emplacement accueillera une prochaine application de 24/24 ONE WORLD. Elle n'existe pas encore.",
      profile_note: "Votre profil est celui de 24/24 TALK : il n'est pas copié ailleurs. Il est lié à ce navigateur, sur cet appareil.",
      ui_lang: "Langue de l'interface", set_in_talk: "Régler dans TALK", theme: "Thème", theme_auto: "Suit votre appareil",
      stats: "Statistiques de visite anonymes", calls_closed: "Appels quand l'appli est fermée",
      push_on: "Activés", push_denied: "Bloqués par le navigateur", push_off: "Pas encore activés", push_unsup: "Non disponibles ici",
      install_title: "Installer 24/24 EVERYWHERE", install_btn: "📲 Installer sur l'écran d'accueil",
      install_ios: "Sur iPhone : touchez Partager, puis « Sur l'écran d'accueil ».",
      install_other: "Dans Chrome : menu ⋮, puis « Ajouter à l'écran d'accueil » ou « Installer l'application ».",
      install_done: "Installé ✓",
      talk_settings: "Réglages de 24/24 TALK", version: "Version",
      nf_title: "Page introuvable", nf_txt: "Cette adresse n'existe pas dans 24/24 EVERYWHERE.", back_home: "Revenir à l'accueil",
      loading_app: "Ouverture de {app}…", app_error: "{app} ne répond pas.", app_error_txt: "Vérifiez votre connexion, puis réessayez.", retry: "Réessayer",
      prof_loading: "Lecture de votre profil TALK…", prof_error: "Impossible de lire votre profil pour le moment.",
      prof_none: "Vous n'avez pas encore de profil.", prof_none_txt: "Créez-le dans 24/24 TALK : un pseudo et votre langue suffisent, sans e-mail ni numéro.",
      prof_create: "Créer mon profil dans TALK", prof_lang: "Langue parlée : {l}", prof_chats: "Ouvrir mes discussions",
      prof_off: "La messagerie de TALK n'est pas activée sur ce site.",
      env_test: "24/24 EVERYWHERE · SITE DE TEST · données fictives · ne pas partager",
      title_app: "{app}"
    },
    en: {
      skip: "Skip to content", offline: "Offline: some features are unavailable.",
      home: "Home", apps: "Apps", profile: "Profile", settings: "Settings", open_full: "Open full screen",
      lead: "All your 24/24 apps, in one place.", your_apps: "Your apps",
      apps_lead: "Each app opens right here, without leaving 24/24 EVERYWHERE.",
      open: "Open", reserved: "Available later", reserved_badge: "RESERVED SLOT",
      reserved_txt: "This slot will host a future 24/24 ONE WORLD app. It does not exist yet.",
      profile_note: "Your profile is your 24/24 TALK profile: it is not copied anywhere else. It is tied to this browser, on this device.",
      ui_lang: "Interface language", set_in_talk: "Set in TALK", theme: "Theme", theme_auto: "Follows your device",
      stats: "Anonymous visit statistics", calls_closed: "Calls when the app is closed",
      push_on: "On", push_denied: "Blocked by the browser", push_off: "Not on yet", push_unsup: "Not available here",
      install_title: "Install 24/24 EVERYWHERE", install_btn: "📲 Add to home screen",
      install_ios: "On iPhone: tap Share, then “Add to Home Screen”.",
      install_other: "In Chrome: menu ⋮, then “Add to home screen” or “Install app”.",
      install_done: "Installed ✓",
      talk_settings: "24/24 TALK settings", version: "Version",
      nf_title: "Page not found", nf_txt: "This address does not exist in 24/24 EVERYWHERE.", back_home: "Back to home",
      loading_app: "Opening {app}…", app_error: "{app} is not responding.", app_error_txt: "Check your connection, then try again.", retry: "Try again",
      prof_loading: "Reading your TALK profile…", prof_error: "Your profile can't be read right now.",
      prof_none: "You don't have a profile yet.", prof_none_txt: "Create it in 24/24 TALK: a username and your language are enough, no email or phone number.",
      prof_create: "Create my profile in TALK", prof_lang: "Spoken language: {l}", prof_chats: "Open my chats",
      prof_off: "TALK messaging is not enabled on this site.",
      env_test: "24/24 EVERYWHERE · TEST SITE · fake data · do not share",
      title_app: "{app}"
    }
  };
  function t(k, vars) {
    var s = (STR[lang] && STR[lang][k]) || STR.fr[k] || k;
    if (vars) Object.keys(vars).forEach(function (v) { s = s.split("{" + v + "}").join(vars[v]); });
    return s;
  }
  function loc(v) { return v && typeof v === "object" ? (v[lang] || v.fr || "") : (v || ""); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function $(id) { return document.getElementById(id); }

  document.querySelectorAll("[data-t]").forEach(function (el) { el.textContent = t(el.getAttribute("data-t")); });
  document.querySelectorAll("[data-t-aria]").forEach(function (el) { el.setAttribute("aria-label", t(el.getAttribute("data-t-aria"))); });

  // ---------- Bandeau d'environnement ----------
  if (CFG.env !== "production") { $("envBanner").textContent = t("env_test"); $("envBanner").hidden = false; }
  else document.body.classList.add("no-banner");
  $("versionTxt").textContent = VERSION + (CFG.env !== "production" ? " · " + CFG.env : "");

  // ---------- Icônes ----------
  var ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    apps: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    talk: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/>',
    profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    slot: '<rect x="4" y="4" width="16" height="16" rx="4" stroke-dasharray="3 3"/><path d="M12 9v6M9 12h6"/>'
  };
  function svg(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.slot) + "</svg>"; }

  // ---------- Navigation principale (barre basse sur téléphone, menu latéral sur ordinateur) ----------
  var talkApp = APPS.filter(function (a) { return a.bottomNav && a.status === "available"; })[0];
  // Barre du bas commune (shell.js) : Accueil · Applications · TALK · Profil, la même dans TALK.
  // TALK s'ouvre en pleine page (pas dans un cadre, qui restait figé sur téléphone) mais garde cette barre.
  $("mainnav").innerHTML = window.EWShell.navHtml(CFG.basePath, true, null, lang);

  // Adresse de l'application seule (pleine page, hors du portail). Dans un cadre, TALK restait figé sur le téléphone de Sébastien.
  function fullHref(a) { return CFG.basePath + a.src.replace(/([?&])embed=1\b/, "$1ew=1"); }

  // ---------- Cartes d'applications (accueil et page Applications) ----------
  function appCard(a) {
    var name = esc(loc(a.name));
    var style = ' style="--accent:' + esc(a.accent || "#3d7bff") + '"';
    if (a.status === "available") {
      return '<a class="app-card" href="' + esc(fullHref(a)) + '"' + style + '><span class="app-ic">' + svg(a.icon) + "</span>" +
        "<span><b>" + name + "</b><small>" + esc(loc(a.tagline)) + '</small></span><span class="go">' + esc(t("open")) + " →</span></a>";
    }
    return '<div class="app-card reserved"' + style + ' aria-disabled="true"><span class="app-ic">' + svg(a.icon) + "</span>" +
      "<span><b>" + name + "</b><small>" + esc(loc(a.tagline)) + '</small><span class="badge">' + esc(t("reserved_badge")) + "</span></span></div>";
  }
  $("homeApps").innerHTML = APPS.map(appCard).join("");
  $("appList").innerHTML = APPS.map(appCard).join("");

  // ---------- Applications intégrées : un cadre par application, gardé chargé entre les écrans ----------
  var frames = {}; // id -> { wrap, iframe, overlay, ready, timer }
  function appById(id) { return APPS.filter(function (a) { return a.id === id; })[0]; }
  function overlayHtml(kind, a) {
    var name = esc(loc(a.name));
    if (kind === "loading") return '<div class="state"><div class="spinner" aria-hidden="true"></div><p>' + esc(t("loading_app", { app: loc(a.name) })) + "</p></div>";
    if (kind === "reserved") return '<div class="state"><p><b>' + name + '</b></p><span class="badge">' + esc(t("reserved_badge")) + "</span><p>" + esc(t("reserved_txt")) +
      '</p><a class="btn primary" href="#/applications">' + esc(t("apps")) + "</a></div>";
    return '<div class="state" role="alert"><p><b>' + esc(t("app_error", { app: loc(a.name) })) + "</b></p><p class=\"muted\">" + esc(t("app_error_txt")) +
      '</p><button type="button" class="btn primary" data-retry="' + esc(a.id) + '">' + esc(t("retry")) + "</button></div>";
  }
  function ensureFrame(a) {
    if (frames[a.id]) return frames[a.id];
    var wrap = document.createElement("div");
    wrap.className = "app-frame-wrap";
    wrap.dataset.app = a.id;
    var f = { wrap: wrap, iframe: null, overlay: document.createElement("div"), ready: false, timer: null };
    f.overlay.className = "app-overlay";
    wrap.appendChild(f.overlay);
    $("appFrames").appendChild(wrap);
    frames[a.id] = f;
    if (a.status !== "available") { f.overlay.innerHTML = overlayHtml("reserved", a); return f; }
    loadFrame(a, f);
    return f;
  }
  function loadFrame(a, f) {
    f.ready = false;
    f.overlay.hidden = false;
    f.overlay.innerHTML = overlayHtml("loading", a);
    if (f.iframe) f.iframe.remove();
    var ifr = document.createElement("iframe");
    ifr.title = loc(a.name);
    // Micro (dictée, appels), lecture audio, presse-papiers et plein écran : nécessaires à TALK.
    ifr.setAttribute("allow", "microphone; camera; autoplay; clipboard-read; clipboard-write; fullscreen; screen-wake-lock");
    // Numéro de version dans l'adresse : le téléphone ne réutilise pas une ancienne copie de l'application.
    ifr.src = CFG.basePath + a.src + (a.src.indexOf("?") === -1 ? "?" : "&") + "v=" + encodeURIComponent(VERSION_TAG);
    f.iframe = ifr;
    // Filet de sécurité : si l'application s'affiche mais ne répond pas au pont (ancienne version en cache,
    // script bloqué…), on l'affiche quand même au lieu de rester sur l'écran de chargement.
    ifr.addEventListener("load", function () {
      setTimeout(function () {
        if (f.ready || f.iframe !== ifr) return;
        var doc = null;
        try { doc = ifr.contentDocument; } catch (e) { doc = null; }
        if (doc && doc.body && doc.body.children.length) {
          f.ready = true;
          clearTimeout(f.timer);
          f.overlay.hidden = true;
          flushPending(a.id);
        }
      }, 3000);
    });
    f.wrap.insertBefore(ifr, f.overlay);
    clearTimeout(f.timer);
    f.timer = setTimeout(function () { if (!f.ready) f.overlay.innerHTML = overlayHtml("error", a); }, CFG.talkReadyTimeoutMs || 15000);
  }
  $("appFrames").addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-retry]") : null;
    if (!b) return;
    var a = appById(b.getAttribute("data-retry"));
    if (a && frames[a.id]) loadFrame(a, frames[a.id]);
  });

  // ---------- Pont avec les applications (même site uniquement) ----------
  var waiting = []; // demandes de profil en attente
  function frameOf(source) {
    for (var id in frames) if (frames[id].iframe && frames[id].iframe.contentWindow === source) return id;
    return null;
  }
  function postTo(id, msg) {
    var f = frames[id];
    if (f && f.iframe && f.iframe.contentWindow) f.iframe.contentWindow.postMessage(msg, location.origin);
  }
  window.addEventListener("message", function (e) {
    if (e.origin !== location.origin) return;
    var id = frameOf(e.source);
    if (!id) return;
    var d = e.data || {};
    if (d.t === "ew:hello") {
      var f = frames[id];
      f.ready = true;
      clearTimeout(f.timer);
      f.overlay.hidden = true;
      flushPending(id);
    } else if (d.t === "ew:me") {
      var w = waiting; waiting = [];
      w.forEach(function (cb) { cb(d); });
    } else if (d.t === "ew:ring") {
      // Appel entrant : on montre TALK, où qu'on soit dans le portail.
      var ra = appById(id);
      if (ra) location.href = fullHref(ra);
    }
  });
  var pending = {}; // id -> messages à envoyer quand l'application sera prête
  function sendWhenReady(id, msg) {
    if (frames[id] && frames[id].ready) postTo(id, msg);
    else (pending[id] = pending[id] || []).push(msg);
  }
  function flushPending(id) { (pending[id] || []).forEach(function (m) { postTo(id, m); }); pending[id] = []; }
  function openTalk(view) {
    if (!talkApp) return;
    location.href = fullHref(talkApp);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-open-talk]") : null;
    if (b) { e.preventDefault(); openTalk(b.getAttribute("data-open-talk")); }
  });

  // ---------- Profil (lu dans TALK, jamais recopié) ----------
  var LANG_NAMES = { fr: "Français", en: "English", es: "Español", pt: "Português", de: "Deutsch", it: "Italiano", mg: "Malagasy", zh: "中文", ja: "日本語", ar: "العربية", ru: "Русский" };
  function renderProfile() {
    var card = $("profileCard");
    if (!talkApp) { card.innerHTML = '<div class="state"><p>' + esc(t("prof_off")) + "</p></div>"; return; }
    card.innerHTML = '<div class="state"><div class="spinner" aria-hidden="true"></div><p>' + esc(t("prof_loading")) + "</p></div>";
    ensureFrame(talkApp);
    var done = false;
    var timer = setTimeout(function () {
      if (done) return;
      done = true;
      card.innerHTML = '<div class="state" role="alert"><p>' + esc(t("prof_error")) + '</p><button type="button" class="btn primary" id="profRetry">' + esc(t("retry")) + "</button></div>";
      $("profRetry").addEventListener("click", renderProfile);
    }, (CFG.talkReadyTimeoutMs || 15000) + 2000);
    waiting.push(function (me) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (!me.configured) { card.innerHTML = '<div class="state"><p>' + esc(t("prof_off")) + "</p></div>"; return; }
      if (!me.pseudo) {
        card.innerHTML = '<div class="state"><p><b>' + esc(t("prof_none")) + "</b></p><p class=\"muted\">" + esc(t("prof_none_txt")) +
          '</p><button type="button" class="btn primary" data-open-talk="net">' + esc(t("prof_create")) + "</button></div>";
        return;
      }
      var l = LANG_NAMES[me.lang] || String(me.lang || "").toUpperCase();
      card.innerHTML = '<div class="profile-head"><span class="avatar" aria-hidden="true">' + esc(me.pseudo.charAt(0).toUpperCase()) + "</span>" +
        "<span><b dir=\"ltr\">@" + esc(me.pseudo) + '</b><span class="muted">' + esc(t("prof_lang", { l: l })) + "</span></span></div>" +
        '<button type="button" class="btn primary wide" data-open-talk="net">' + esc(t("prof_chats")) + "</button>";
    });
    sendWhenReady(talkApp.id, { t: "ew:who" });
  }

  // ---------- Paramètres ----------
  var statsBtn = $("statsToggle");
  function paintStats() { statsBtn.setAttribute("aria-checked", store.get("lc_stats_off") === "1" ? "false" : "true"); }
  statsBtn.addEventListener("click", function () {
    store.set("lc_stats_off", store.get("lc_stats_off") === "1" ? "0" : "1"); // même réglage que dans TALK
    paintStats();
  });
  function paintPush() {
    var s;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) s = t("push_unsup");
    else if (Notification.permission === "denied") s = t("push_denied");
    else if (Notification.permission === "granted" && store.get("lc_push") === "1") s = t("push_on");
    else s = t("push_off");
    $("pushState").textContent = s; // état réel lu dans le navigateur : rien n'est affiché comme actif s'il ne l'est pas
  }
  var installEvt = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); installEvt = e; paintInstall(); });
  window.addEventListener("appinstalled", function () { installEvt = null; $("installHelp").textContent = t("install_done"); paintInstall(); });
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
  function paintInstall() {
    var btn = $("installBtn");
    btn.hidden = !installEvt;
    if (!installEvt && !$("installHelp").textContent) $("installHelp").textContent = isIOS() ? t("install_ios") : t("install_other");
  }
  $("installBtn").addEventListener("click", function () {
    if (!installEvt) return;
    installEvt.prompt();
    installEvt.userChoice.then(function () { installEvt = null; paintInstall(); }).catch(function () {});
  });
  // Roue dentée : dans une application, ouvre ses propres réglages ; ailleurs, les paramètres du portail.
  $("topSettings").addEventListener("click", function () {
    var m = /^#\/app\/([^/]+)/.exec(location.hash || "");
    var a = m && appById(m[1]);
    if (a && a.status === "available") sendWhenReady(a.id, { t: "ew:view", view: "settings" });
    else location.hash = "#/parametres";
  });

  // ---------- Routes internes (#/accueil, #/applications, #/app/<id>, #/profil, #/parametres) ----------
  var TITLES = { accueil: "", applications: t("apps"), profil: t("profile"), parametres: t("settings"), "404": "" };
  var first = true;
  function route() {
    var h = (location.hash || "").replace(/^#\/?/, "");
    if (!h) h = "accueil";
    var parts = h.split("/");
    var view = parts[0], appId = parts[1];
    var target = view;
    if (view === "app") {
      var a = appById(appId);
      if (!a) target = "404";
      else if (a.status === "available") { location.replace(fullHref(a)); return; } // ancienne adresse #/app/talk
      else {
        ensureFrame(a);
        Object.keys(frames).forEach(function (id) { frames[id].wrap.classList.toggle("active", id === a.id); });
      }
    } else if (["accueil", "applications", "profil", "parametres"].indexOf(view) === -1) target = "404";
    document.querySelectorAll(".view").forEach(function (v) {
      var on = v.getAttribute("data-route") === target;
      v.classList.toggle("active", on);
      v.setAttribute("aria-hidden", on ? "false" : "true");
      // Pas de « inert » sur l'écran des applications : sur certains téléphones, une application affichée dans un
      // cadre restait insensible au toucher après coup. visibility + pointer-events suffisent à la masquer.
      if ("inert" in v && !v.classList.contains("view-app")) v.inert = !on;
    });
    document.querySelectorAll("[data-nav]").forEach(function (n) {
      if (n.getAttribute("data-nav") === (target === "app" ? "app/" + appId : target)) n.setAttribute("aria-current", "page");
      else n.removeAttribute("aria-current");
    });
    // Bouton « ouvrir en plein écran » : l'application seule, hors du portail (solution de secours si besoin).
    var openBtn = $("topOpen");
    if (target === "app" && appById(appId).status === "available") {
      openBtn.href = CFG.basePath + appById(appId).src.replace(/[?&]embed=1\b/, "").replace(/\?$/, "");
      openBtn.hidden = false;
    } else openBtn.hidden = true;
    if (target === "parametres") $("topSettings").setAttribute("aria-current", "page");
    else $("topSettings").removeAttribute("aria-current");
    var title = target === "app" ? loc(appById(appId).name) : TITLES[target] || "";
    $("topTitle").textContent = title;
    document.title = (title ? title + " · " : "") + "24/24 EVERYWHERE";
    if (target === "profil") renderProfile();
    if (target === "parametres") { paintStats(); paintPush(); paintInstall(); }
    if (!first) {
      var active = document.querySelector(".view.active");
      var h1 = active && active.querySelector("h1");
      if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
      if (active) active.scrollTop = 0;
    }
    first = false;
  }
  window.addEventListener("hashchange", route);
  route();

  // TALK est préparé en arrière-plan juste après l'affichage : appels et messages arrivent même depuis l'accueil.
  // (TALK n'est plus préparé dans un cadre en arrière-plan : les appels arrivent par la notification de TALK.)

  // ---------- Hors ligne ----------
  function paintOnline() { $("offline").hidden = navigator.onLine !== false; }
  window.addEventListener("online", paintOnline);
  window.addEventListener("offline", paintOnline);
  paintOnline();

  // ---------- Installation (PWA) et notification d'appel touchée ----------
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(function () { /* le portail marche sans */ });
    navigator.serviceWorker.addEventListener("message", function (e) {
      var d = e.data || {};
      if (d.t === "answer" && d.call && talkApp) {
        // TALK reçoit lui-même ce message (sw.js l'envoie à toutes ses fenêtres) : ici on l'affiche seulement.
        location.href = fullHref(talkApp);
      }
    });
  }
  window.EW = { version: VERSION, frames: frames, openTalk: openTalk }; // utile aux tests
})();
