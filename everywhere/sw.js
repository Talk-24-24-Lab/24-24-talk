/* 24/24 EVERYWHERE — service worker du portail. © 2026 Sébastien Chevrier.
   Il ne garde en mémoire QUE la coquille publique du portail (pages, styles, icônes) pour qu'elle s'ouvre vite
   et hors ligne. Il ne touche jamais aux applications (TALK a son propre fonctionnement), ni au serveur Supabase,
   ni aux conversations : ces requêtes passent sans être enregistrées. */
var CACHE = "ew-shell-v7";
var SHELL = ["./", "index.html", "shell.css", "style.css", "shell.js", "connect.js", "app.js", "apps.js", "config.js", "logo.svg", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png", "../terre-tech.jpg"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("ew-shell-") === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// Réseau d'abord (toujours la dernière version), copie locale seulement si hors ligne.
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;            // Supabase, CDN… : jamais mis en cache ici
  var scope = new URL(self.registration.scope);
  var isShell = url.pathname.indexOf(scope.pathname) === 0 || /\/terre-tech\.jpg$/.test(url.pathname);
  if (!isShell) return;
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok && res.type === "basic") {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match("index.html"); });
    })
  );
});
