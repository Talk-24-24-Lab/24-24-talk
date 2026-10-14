/* 24/24 ONE WORLD — registre des interfaces (une application, un compte, trois interfaces : TALK, EVERYWHERE, LEARN). © 2026 Sébastien Chevrier.
   Ajouter une application = ajouter une entrée ici (et son dossier). Le portail crée tout seul
   sa carte, sa route (#/app/<id>) et son cadre ; rien d'autre à modifier.

   Champs :
   - id       : identifiant court, utilisé dans l'adresse (#/app/talk)
   - name     : nom affiché
   - tagline  : une phrase, { fr, en }
   - status   : "available" (ouvrable), "soon" (annoncé « Bientôt », page d'information seulement)
                ou "reserved" (emplacement réservé) ; rien n'est simulé
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
    tagline: { fr: "Traduire et connecter partout : conversation côte à côte, appel traduit avec un contact TALK.", en: "Translate and connect everywhere: side-by-side conversation, translated call with a TALK contact." },
    status: "available",
    route: "#/everywhere",
    accent: "#13a05a",
    icon: "globe"
  },
  {
    id: "learn",
    name: "24/24 LEARN",
    tagline: { fr: "Apprendre sans limites : leçons, exercices, progression.", en: "Learn without limits: lessons, exercises, progress." },
    status: "available",
    route: "#/learn",
    accent: "#6b3fd6",
    icon: "learn"
  },
  {
    id: "ailab",
    name: "24/24 AI LAB",
    tagline: { fr: "Innover avec l'IA : espace d'expérimentation, bientôt disponible.", en: "Innovating with AI: an experimentation space, coming soon." },
    status: "soon",
    route: "#/ailab",
    accent: "#b4570f",
    icon: "lab"
  }
];
