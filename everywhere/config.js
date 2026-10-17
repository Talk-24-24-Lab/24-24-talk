/* 24/24 EVERYWHERE — configuration par environnement. © 2026 Sébastien Chevrier.
   C'est le SEUL fichier à changer pour passer du laboratoire à la production (voir everywhere/README.md).
   Aucune clé secrète ici : la connexion au serveur reste celle de chaque application. */
window.EW_CONFIG = {
  env: "production",           // "test" : bandeau orange visible ; "production" : aucun bandeau
  basePath: "../",             // chemin du site 24/24 (où se trouve index.html de TALK) vu depuis everywhere/
  talkReadyTimeoutMs: 15000,   // délai avant d'afficher « TALK ne répond pas »
  // Serveur du compte (le même que TALK). Clé PUBLIQUE uniquement (« publishable »), jamais de clé secrète ici.
  supabase: { url: "https://wsgcumnaltdinchsdovs.supabase.co", key: "sb_publishable_FkPVBXxsT57oNonWUv16_g_9M0eIyxl",
    sdk: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js",
    // Empreinte du fichier ci-dessus (version figée) : le navigateur refuse tout fichier modifié.
    sri: "sha384-Rj26LVGvoeRVR6+mwQmFfcR3QOBEwT+ZmuCWpuiqeTzJpCs0ER4ITAWGb4Hiy3Ok" }
};
// Garde-fou : le laboratoire ne doit jamais parler à la base de production.
if (/wsgcumnaltdinchsdovs/.test(window.EW_CONFIG.supabase.url) && window.EW_CONFIG.env !== "production") window.EW_CONFIG.supabase = null;
