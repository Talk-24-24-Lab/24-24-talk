/* 24/24 EVERYWHERE — configuration par environnement. © 2026 Sébastien Chevrier.
   C'est le SEUL fichier à changer pour passer du laboratoire à la production (voir everywhere/README.md).
   Aucune clé secrète ici : la connexion au serveur reste celle de chaque application. */
window.EW_CONFIG = {
  env: "test",                 // "test" : bandeau orange visible ; "production" : aucun bandeau
  basePath: "../",             // chemin du site 24/24 (où se trouve index.html de TALK) vu depuis everywhere/
  talkReadyTimeoutMs: 15000    // délai avant d'afficher « TALK ne répond pas »
};
