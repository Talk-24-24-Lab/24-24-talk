/* 24/24 EVERYWHERE — coquille commune. © 2026 Sébastien Chevrier. Tous droits réservés.
   Une seule barre du haut et une seule barre du bas, partagées par toutes les pages de 24/24 ONE WORLD :
   le portail (everywhere/) et 24/24 TALK (index.html). Chaque application reste une page à part entière
   (pas de cadre) : on change de page, pas d'univers. Aucune donnée, aucune connexion au serveur ici. */
(function () {
  "use strict";
  var ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    apps: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    talk: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
    learn: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/><path d="M22 9v6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>',
    profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
  };
  var LABELS = {
    fr: { home: "Accueil", apps: "Applications", talk: "Talk", everywhere: "Everywhere", profile: "Profil", settings: "Paramètres", nav: "Navigation principale", brand: "24/24 EVERYWHERE, accueil" },
    en: { home: "Home", apps: "Apps", talk: "Talk", everywhere: "Everywhere", profile: "Profile", settings: "Settings", nav: "Main navigation", brand: "24/24 EVERYWHERE, home" }
  };
  function svg(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || "") + "</svg>"; }
  function langOf() {
    var p = null;
    try { p = localStorage.getItem("lc_uilang"); } catch (e) { p = null; }
    var l = p && p !== "auto" ? p : (navigator.language || "fr");
    return /^fr/i.test(l) ? "fr" : "en";
  }

  // Les quatre entrées de la barre du bas (cahier des charges du 4 oct. 2026 : Accueil · TALK · EVERYWHERE · Profil). root = chemin vers la racine du site ; inPortal = liens internes du portail (#/…).
  function items(root, inPortal) {
    var ew = inPortal ? "" : root + "everywhere/";
    return [
      { id: "accueil", href: ew + "#/accueil", icon: "home", key: "home" },
      { id: "talk", href: root + "index.html?ew=1", icon: "mic", key: "talk" },
      { id: "everywhere", href: ew + "#/everywhere", icon: "learn", key: "everywhere" },
      { id: "profil", href: ew + "#/profil", icon: "profile", key: "profile" }
    ];
  }
  function navHtml(root, inPortal, active, lang) {
    var L = LABELS[lang || langOf()];
    return items(root, inPortal).map(function (n) {
      return '<a href="' + n.href + '" data-nav="' + n.id + '"' + (n.id === active ? ' aria-current="page"' : "") + ">" +
        svg(n.icon) + "<span>" + L[n.key] + "</span></a>";
    }).join("");
  }

  // TALK dans la coquille : barre du haut (logo, nom, roue dentée = réglages de TALK) et barre du bas, TALK actif.
  function mountTalk() {
    if (document.getElementById("ewsTop")) return;
    var root = "./";
    var lang = langOf(), L = LABELS[lang];
    var top = document.createElement("header");
    top.className = "topbar ews-top";
    top.id = "ewsTop";
    top.innerHTML = '<a class="brand" href="' + root + 'everywhere/#/accueil" aria-label="' + L.brand + '">' +
      '<img src="' + root + 'everywhere/logo.svg" alt="" width="36" height="36">' +
      '<span class="brand-txt"><b>24/24</b> <span>TALK</span></span></a>' +
      '<span class="topbar-title"></span>' +
      '<button type="button" class="icon-btn" id="ewsSettings" aria-label="' + L.settings + '">' + svg("gear") + "</button>";
    var banner = document.querySelector(".test-banner");
    if (banner && banner.parentNode === document.body) banner.insertAdjacentElement("afterend", top);
    else document.body.insertBefore(top, document.body.firstChild);
    top.querySelector("#ewsSettings").addEventListener("click", function () {
      var b = document.getElementById("settingsBtn");
      if (b) b.click();
    });
    var nav = document.createElement("nav");
    nav.className = "mainnav ews-nav";
    nav.id = "ewsNav";
    nav.setAttribute("aria-label", L.nav);
    nav.innerHTML = navHtml(root, false, "talk", lang);
    // Toucher TALK quand on est déjà dans TALK : retour à l'accueil de TALK, sans recharger la page.
    nav.querySelector('[data-nav="talk"]').addEventListener("click", function (e) {
      e.preventDefault();
      var h = document.querySelector('nav.tabs button[data-view="home"]');
      if (h) h.click();
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (err) { window.scrollTo(0, 0); }
    });
    document.body.appendChild(nav);
  }

  window.EWShell = { navHtml: navHtml, items: items, mountTalk: mountTalk, icons: ICONS, lang: langOf };
  if (document.documentElement.classList.contains("ew-shell")) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountTalk);
    else mountTalk();
  }
})();
