/* 24/24 EVERYWHERE — registre des applications. © 2026 Sébastien Chevrier.
   Ajouter une application = ajouter une entrée ici (et son dossier). Le portail crée tout seul
   sa carte, sa route (#/app/<id>) et son cadre ; rien d'autre à modifier.

   Champs :
   - id       : identifiant court, utilisé dans l'adresse (#/app/talk)
   - name     : nom affiché
   - tagline  : une phrase, { fr, en }
   - status   : "available" (ouvrable) ou "reserved" (emplacement réservé, rien n'est simulé)
   - src      : page de l'application, relative à EW_CONFIG.basePath (obligatoire si available)
   - accent   : couleur de la carte
   - icon     : clé d'icône (voir ICONS dans app.js) */
window.EW_APPS = [
  {
    id: "talk",
    name: "24/24 TALK",
    tagline: { fr: "Appels et messages traduits en direct, 112 langues.", en: "Live translated calls and messages, 112 languages." },
    status: "available",
    src: "index.html?embed=1",
    accent: "#2ecf8e",
    icon: "talk",
    bottomNav: true
  },
  {
    id: "app2",
    name: { fr: "Application 2", en: "App 2" },
    tagline: { fr: "Emplacement réservé : disponible ultérieurement.", en: "Reserved slot: available later." },
    status: "reserved",
    accent: "#7b8bb8",
    icon: "slot"
  }
];
