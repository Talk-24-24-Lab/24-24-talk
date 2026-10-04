/* 24/24 EVERYWHERE — registre des applications. © 2026 Sébastien Chevrier.
   Ajouter une application = ajouter une entrée ici (et son dossier). Le portail crée tout seul
   sa carte, sa route (#/app/<id>) et son cadre ; rien d'autre à modifier.

   Champs :
   - id       : identifiant court, utilisé dans l'adresse (#/app/talk)
   - name     : nom affiché
   - tagline  : une phrase, { fr, en }
   - status   : "available" (ouvrable) ou "reserved" (emplacement réservé, rien n'est simulé)
   - src      : page de l'application, relative à EW_CONFIG.basePath (application ouverte en pleine page)
   - route    : OU écran interne du portail (#/…), pour un module construit dans le portail lui-même
   - accent   : couleur de la carte
   - icon     : clé d'icône (voir ICONS dans app.js) */
window.EW_APPS = [
  {
    id: "talk",
    name: "24/24 TALK",
    tagline: { fr: "Communiquer sans barrières : appels et messages traduits, 112 langues.", en: "Communicate without barriers: translated calls and messages, 112 languages." },
    status: "available",
    src: "index.html?embed=1",
    accent: "#1f5fe0",
    icon: "talk",
    bottomNav: true
  },
  {
    id: "everywhere",
    name: "24/24 EVERYWHERE",
    tagline: { fr: "Accéder au monde sans limites : langues, exercices, progression.", en: "Access the world without limits: languages, exercises, progress." },
    status: "available",
    route: "#/everywhere",
    accent: "#13a05a",
    icon: "learn"
  }
];
