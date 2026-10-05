/* 24/24 Talk — tableau de bord. © 2026 Sébastien Chevrier.
   Garde une copie de l'écran pour qu'il s'ouvre même sans réseau ; les chiffres, eux, viennent toujours du serveur. */
var CACHE = "stats2424-v4";
var SHELL = ["./", "manifest.json", "icon-192.png", "icon-512.png", "../vendor/supabase-js-2.117.2.js"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).catch(function () {}).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  var mine = u.origin === location.origin && u.pathname.indexOf("/24-24-talk/gestion/") === 0;
  // Bibliothèque Supabase : copie locale figée (vendor/), plus aucun téléchargement depuis jsDelivr.
  var sdk = u.origin === location.origin && /\/24-24-talk\/vendor\/supabase-js-[\d.]+\.js$/.test(u.pathname);
  if (!mine && !sdk) return; // les chiffres (Supabase) ne passent jamais par le cache
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(r, { ignoreSearch: true }).then(function (m) {
      if (m) return m;
      return r.mode === "navigate" ? caches.match("./").then(function (h) { return h || Response.error(); }) : Response.error();
    });
  }));
});
