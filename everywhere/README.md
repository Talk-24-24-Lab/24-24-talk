# 24/24 ONE WORLD (dossier `everywhere/`)

**24/24 ONE WORLD** : une seule application, trois interfaces (**TALK**, **EVERYWHERE**, **LEARN**), un seul compte.
Le dossier garde le nom `everywhere/` pour ne pas casser les adresses déjà utilisées (site de test, raccourcis installés).

> Mentions : © 2026 Sébastien Chevrier. Titularité revendiquée par Sébastien Chevrier, sous réserve des droits des tiers
> (Supabase JS, service MyMemory, voix et reconnaissance vocale du navigateur, image Terre dont les droits restent à vérifier)
> et des contributions dont le transfert reste à formaliser. Les licences des dépendances s'appliquent.

> Statut : **PROTOTYPE fonctionnel, laboratoire uniquement** (dépôt `Talk-24-24-Lab/24-24-talk`, base Supabase `24-24-talk-test`).
> Rien n'est publié en production. © 2026 Sébastien Chevrier. Tous droits réservés.

## 1. Architecture réelle du dépôt (audit du 4 octobre 2026)

| Élément | Constat (EXISTANT) |
|---|---|
| Framework | Aucun. Site statique servi par GitHub Pages, sans étape de compilation ni dépendance installée. |
| TALK | Tout dans `index.html` (≈ 9 200 lignes : HTML, CSS, JavaScript). Langues supplémentaires dans `i18n/`. |
| Routes de TALK | Écrans internes (`.view`) affichés par JavaScript ; pas d'adresse par écran. |
| Authentification | Supabase, compte **anonyme** + pseudo. Session gardée dans le navigateur (clé `lc_net_auth`). Kit Supabase chargé depuis jsDelivr au premier usage. |
| Configuration | En dur dans `index.html` (`NET_CONFIG` : adresse du projet + clé **publique**). Aucune clé secrète côté client. |
| Notifications d'appel | `sw.js` à la racine + fonction serveur `call-push`. |
| Tableau de bord | `gestion/` (page séparée, admin). |

## 2. Choix techniques

- **Même technologie que TALK** (HTML, CSS, JavaScript sans bibliothèque) : rien à installer, rien à compiler, aucune migration.
- **Le portail est dans `everywhere/`**, à côté de TALK, sur le **même site** : TALK reste à son adresse actuelle, rien ne casse pour les utilisateurs existants. Retour arrière = supprimer le dossier.
- **TALK est affiché dans le portail** (cadre du même site, adresse `index.html?embed=1`) : on réutilise TALK tel quel au lieu de le réécrire. La session, les conversations et les réglages restent ceux de TALK : **aucune donnée dupliquée**.
- **TALK reste chargé en arrière-plan** quand on passe d'un écran à l'autre : messages et appels continuent d'arriver. Un appel entrant ramène automatiquement sur TALK.
- **Routes internes** : `#/accueil`, `#/applications`, `#/app/talk`, `#/app/app2`, `#/profil`, `#/parametres` (adresse inconnue → page « introuvable »).
- **Registre d'applications** (`apps.js`) : ajouter une application = une entrée + son dossier, sans refonte.

## 3. Arborescence

```
everywhere/
├── index.html              coquille : barre haute, écrans, navigation
├── style.css               styles (mobile d'abord, puis tablette ≥ 640 px, ordinateur ≥ 960 px)
├── app.js                  routes, navigation, profil, paramètres, cadres d'applications, pont avec TALK
├── apps.js                 registre des applications (TALK + emplacement réservé)
├── config.js               configuration par environnement (test / production)
├── logo.svg                logo 24/24 ONE WORLD
├── manifest.webmanifest    fiche d'installation (PWA)
├── sw.js                   service worker du portail (coquille publique seulement)
├── icons/                  icônes 192, 512, 512 « maskable », 180 (iPhone)
├── tests/
│   ├── e2e.js              27 tests automatiques (Playwright)
│   └── fake-supabase.js    faux serveur, pour les tests uniquement
└── README.md               ce fichier
```

Fichiers existants modifiés (petits ajouts, rien de supprimé) :
- `index.html` (TALK) : mode « intégré » (`?embed=1`, même site uniquement) qui masque le grand en-tête, le bandeau de test et le bouton d'installation en double ; **pont** de messages avec le portail (`ew:hello`, `ew:who` → `ew:me`, `ew:view`, `ew:ring`). Ouvert seul, TALK est inchangé.
- `sw.js` (racine) : quand on touche une notification d'appel, toutes les fenêtres TALK sont prévenues (y compris TALK dans le portail) et la fenêtre principale passe au premier plan.

## 4. Lancement local

Aucune installation n'est nécessaire pour le site lui-même. Depuis la racine du dépôt :

```
python3 -m http.server 8000
```

puis ouvrir `http://localhost:8000/everywhere/`. En local, TALK s'affiche mais ne se connecte au serveur que si Internet est accessible.

## 5. Lancer les tests

Prérequis : Node.js et Playwright avec Chromium (`npm i -D playwright && npx playwright install chromium`).

```
node everywhere/tests/e2e.js
```

Les captures et `resultats.json` sont écrits dans `everywhere/tests/resultats/` (non versionné). Aucun accès Internet n'est utilisé : un faux serveur simule un compte connecté.

## 6. Configuration du laboratoire

- Site de test : `https://talk-24-24-lab.github.io/24-24-talk/everywhere/` (une fois la branche fusionnée sur la copie de test).
- `config.js` : `env: "test"` affiche le bandeau orange.
- TALK utilise toujours le projet Supabase de test (configuré dans `index.html`, inchangé par cette mission).

## 7. Procédure de déploiement proposée (NON exécutée, validation humaine requise)

1. Valider le portail sur le site de test (étapes de validation ci-dessous).
2. Vérifier les droits de l'image Terre (`terre-tech.jpg`, mention « sleepcycle »), ou la remplacer.
3. Préparer une branche pour le dépôt de production avec : le dossier `everywhere/` ; dans `config.js`, `env: "production"` ; dans `manifest.webmanifest`, le nom sans « (TEST) » ; les ajouts de `index.html` (mode intégré et pont) et de `sw.js`, **sans** la configuration de test de TALK.
4. Ouvrir une demande de fusion sur le dépôt de production, relue par Sébastien. Rien n'est fusionné sans son accord écrit.
5. Après publication : ouvrir le portail sur un téléphone Android et un iPhone, refaire les étapes de validation.
6. Retour arrière : annuler la fusion (le dossier `everywhere/` disparaît ; TALK n'a jamais changé d'adresse).

## 8. Étapes de validation humaine (sur le site de test)

1. Ouvrir le portail sur le téléphone : accueil, logo, cartes TALK et Application 2.
2. Toucher TALK dans la barre basse : TALK s'ouvre dans le portail, avec ses touches Téléphone et Messagerie.
3. Aller sur Profil puis revenir sur TALK : TALK ne se recharge pas.
4. Profil : votre pseudo @sebtest et votre langue s'affichent.
5. Ajouter le portail à l'écran d'accueil, puis l'ouvrir depuis l'icône.
6. Depuis un 2e appareil, appeler @sebtest pendant que le portail est sur Accueil : le portail bascule sur TALK et sonne.

## 9. Changement du 3 octobre 2026 (version 0.1.3)

À la demande de Sébastien : TALK ne figure plus dans la barre basse et s'ouvre **en pleine page** depuis la carte TALK (Accueil ou Applications). Dans le portail (cadre), TALK restait figé sur son téléphone. Le bouton « retour » du téléphone ramène au portail. Le profil est toujours lu dans TALK, sans copie. Les appels quand le portail est ouvert arrivent par la notification de TALK.

## 10. Limites connues

- Le portail est traduit en français et en anglais (TALK garde ses 31 langues).
- Le compte reste lié à un navigateur sur un appareil (comme TALK aujourd'hui). La continuité entre appareils est la prochaine étape d'EVERYWHERE.
- Une notification d'appel touchée quand rien n'est ouvert ouvre TALK seul (pas le portail).
- Sur iPhone, l'installation passe par Partager → « Sur l'écran d'accueil » ; les notifications n'y marchent qu'une fois l'appli installée.
- Tests exécutés dans Chromium (moteur de Chrome et d'Android). Safari/iPhone et un vrai téléphone n'ont pas été testés par Claude.

## CONNECT (0.3.0, site de test uniquement)

Écran **Profil** : sécuriser son compte en le reliant à un e-mail (code à 6 chiffres), retrouver son compte
sur un autre appareil (« J'ai déjà un compte »), voir ses appareils et en déconnecter un (coupure immédiate).
Serveur : scripts `analyse/mission-6/connect/` (partie A appliquée sur la base de test, partie B à coller),
retour arrière complet dans `09-connect-retour-arriere.sql`. Ce qui suit un compte sur un autre appareil :
pseudo, contacts, conversations, messages des 90 derniers jours. Ce qui reste sur l'appareil : historique de
traduction, favoris, réglages. Tests : 38 tests automatiques (faux serveur, code 123456).

## Version 0.5.0 (4 oct. 2026, ordre OW-MASTER-001, missions C et D, site de test uniquement)

Rectification de Sébastien : **LEARN = apprendre une langue**, **EVERYWHERE = parler avec quelqu'un qui ne parle pas
ma langue**, **TALK = appeler**. Aucune fonction ne passe de l'une à l'autre.

- **Accueil** : « 24/24 One World », trois cartes TALK (bleu), EVERYWHERE (vert), LEARN (violet).
  Barre du bas commune (portail et TALK) : Accueil · Everywhere · Learn · Talk · Profil.
- **LEARN (mission D)** : le module 0.4.0 est isolé tel quel sous `#/learn/…` (dossier `learn/`, couleur violette).
  Fonctions, contenus et tests conservés ; la progression déjà enregistrée garde sa clé `ew_learn_v1` (rien n'est perdu).
- **EVERYWHERE (mission C)**, dossier `traduction/`, écrans `#/everywhere/…` :

| Fichier | Rôle |
|---|---|
| `traduction/langues.js` | copie exacte de la liste des 112 langues de TALK (codes de traduction et de voix) |
| `traduction/moteur.js` | traduction MyMemory (gratuit, sans clé, comme TALK), écoute et voix du navigateur |
| `traduction/everywhere.js` | accueil, côte à côte (mode A), appeler sur TALK (mode B), mes langues, configurations |
| `traduction/everywhere.css` | styles |

  - **Mode A, côte à côte** (`#/everywhere/face`) : écran coupé en deux, personne 2 en haut, personne 1 en bas,
    **même sens de lecture** ; un micro et un clavier par personne ; chaque moitié lit la conversation dans sa langue
    (en grand) avec l'autre langue en petit ; traduction lue à voix haute (son, volume) ; taille du texte ; inverser.
    Un seul micro à la fois (limite du téléphone). Conversation gardée en mémoire seulement, jamais enregistrée.
  - **Mode B, appeler sur TALK** (`#/everywhere/appel`) : contacts TALK déjà en discussion (lus avec la session de
    TALK, contacts bloqués exclus), recherche, **Inviter un contact** (même lien que « Inviter un ami » de TALK,
    `…/?ajouter=<pseudo>`, par le partage du téléphone), langues « je parle / je lis » réglées avant l'appel
    (même réglage que TALK, clé `lc_convlang_<discussion>`), puis **l'appel traduit de TALK** :
    `index.html?ew=1&ew_appel=<discussion>`. À la fin de l'appel, retour dans EVERYWHERE.
  - Réglages sur l'appareil : clé `ew_tr_v1` (langues, son, volume, taille).
- **Changement dans TALK** (`index.html`, ~25 lignes) : lecture de `?ew_appel=` (ouvre la discussion et lance
  `startCall()` existant), retour vers EVERYWHERE en fin d'appel. Rien d'autre ne change dans TALK.
- **Non fait (prochaines étapes proposées)** : réglages pendant l'appel (taille des sous-titres, audio traduit
  marche/arrêt, changer de langue en appel), fichier commun TALK/EVERYWHERE pour le moteur (dictionnaire hors ligne
  de TALK compris), synchronisation des réglages avec le compte.

## LEARN (anciennement « EVERYWHERE : apprendre et découvrir », 0.4.0, site de test uniquement)

> Depuis la 0.5.0, ce module est LEARN : les adresses `#/everywhere/…` ci-dessous sont devenues `#/learn/…`.

Cahier des charges du 4 octobre 2026 : **une seule plateforme, deux applications** (TALK pour communiquer,
EVERYWHERE pour apprendre et découvrir). Phase 1 (socle) et MVP de la phase 2 réalisés.

**Socle (phase 1)** : accueil « 24/24 Everywhere · Un monde sans barrières. » avec deux grandes cartes
(TALK en bleu, EVERYWHERE en vert, bouton « Ouvrir ») ; barre commune Accueil · Talk · Everywhere · Profil
(la même dans TALK) ; fond clair par défaut ; Paramètres → taille du texte (3 niveaux), thème clair / sombre /
auto, contraste renforcé (`prefs.js`, gardés sur l'appareil, clé `ew_prefs`).

**MVP (phase 2)**, module `learn/`, écrans `#/everywhere/…` dans le portail (pas de nouvelle page) :

| Fichier | Rôle |
|---|---|
| `learn/content/catalogue.json` | langues (anglais, espagnol ; italien et allemand « bientôt »), niveaux |
| `learn/content/en.json`, `es.json` | leçons : thème, vocabulaire, expressions, exercices (5 leçons par langue, 3 niveaux) |
| `learn/exercises.js` | moteur d'exercices : choix, associer, compléter, écoute (synthèse vocale du navigateur, gratuite) |
| `learn/progress.js` | progression sur l'appareil (clé `ew_learn_v1`) : XP, leçons, exercices, objectif, série, historique, mots ratés |
| `learn/learn.js` | écrans : tableau de bord, choix langue/niveau, leçon, résultat, révision, défi, progression |
| `learn/learn.css` | styles du module |

- **Ajouter une langue** : une entrée dans `catalogue.json` + un fichier `<code>.json` (même format). Aucun code à changer.
- **Ajouter une leçon** : un bloc de plus dans le fichier de la langue. Le test « Contenus » vérifie chaque exercice.
- **Ajouter un type d'exercice** : une fonction dans `TYPES` (`learn/exercises.js`).
- **Synchronisation (phase 3, PROPOSITION)** : `EWProgress.onChange()` prévient de chaque changement ; une table
  Supabase protégée par compte (même compte que TALK et CONNECT) pourra s'y brancher sans toucher aux écrans.
- **Conversation avec l'IA (phase 3, PROPOSITION)** : écran « Bientôt » seulement. Besoin : une fonction serveur
  (Supabase Edge Function) qui garde la clé secrète et appelle un modèle d'IA. Aucun service activé, aucune clé dans le site.
- **Cultures du monde (phase 3)** : écran « Bientôt », contenus prévus comme les leçons (un fichier par thème).

Tests (0.4.0) : 60 tests automatiques (`node everywhere/tests/e2e.js`), dont 18 pour ce module (contenus, leçon complète,
mauvaise réponse, résultat, progression gardée, révision, défi, clavier, accessibilité, tablette, ordinateur).

Tests (0.5.0) : **79 tests automatiques**, dont 20 pour EVERYWHERE (côte à côte, voix, un micro à la fois, clavier,
son, taille, langues, panne de traduction, navigateur sans micro, contacts, invitation, langues avant l'appel,
appel ouvert dans TALK, retour dans EVERYWHERE, absence de fonctions LEARN et de clé). Micro, voix et traduction
sont simulés dans les tests : un essai sur un vrai téléphone reste nécessaire.

## Version 0.6.0 (4 oct. 2026, dossier « Universal AI Connect », site de test uniquement)

Demande de Sébastien : haut-parleur, plus des écouteurs Bluetooth du commerce en option, en reprenant dans l'appli
ce que font les écouteurs traducteurs. Tout est dans EVERYWHERE (conversation côte à côte) et ses Configurations.

| Fonction d'un écouteur traducteur | Dans l'appli (PROTOTYPE testé) |
|---|---|
| Traduction dans l'oreille | Bouton **🔈 Haut-parleur / 🎧 Écouteurs**. Haut-parleur : chaque traduction est lue. Écouteurs (portés par la personne 1) : seule la traduction de ce que dit la personne 2 est lue ; la personne 2 lit la sienne en haut de l'écran. |
| Conversation fluide sans toucher | **🙌 Mains libres** : après chaque phrase traduite (et lue jusqu'au bout), le micro de l'autre personne s'ouvre tout seul. Un micro allumé touché = pause. Rien entendu = pause. |
| Bouton « répéter » | **↻ Répéter** dans chaque moitié : relit la dernière traduction destinée à cette personne. |
| Audio haute qualité | **Voix** au choix par langue (ou « Automatique » = la plus naturelle du téléphone) et **vitesse** 70 à 130 %, bouton **▶ Essayer**. |

Limites (honnêtes) : le son sort là où Android l'envoie (une page web ne choisit pas la sortie et ne pilote pas les
écouteurs) ; le micro utilisé dépend d'Android ; pas de réduction de bruit propre à l'appli ; pas de traduction hors
ligne ; pas de mode groupe. Traduction toujours MyMemory (1 à 3 s).

Réglages ajoutés dans `ew_tr_v1` : `out` (speaker | earbuds), `hands`, `rate`, `voices` ({ langue: voix }).
Fichiers : `traduction/moteur.js` (voix, vitesse, fin de lecture), `traduction/everywhere.js`, `traduction/everywhere.css`.
Tests : **84 tests automatiques** (5 nouveaux : écouteurs, répéter, mains libres, réglages audio, voix automatique).
Non testé : vrai téléphone Android avec de vrais écouteurs Bluetooth.

## Version 0.6.1 (4 oct. 2026) : campagne de tests « expert » sur tout ONE WORLD

Nouveau fichier `tests/expert.js` (32 tests, en plus des 84 de `e2e.js`) : 18 écrans × 4 variantes (320 px, sombre,
contraste renforcé + très grand texte, anglais), accessibilité automatique axe-core (WCAG 2.1 AA), réglages abîmés,
pannes (hors ligne, quota, service en panne), touches répétées, texte et pseudo piégés, CONNECT avec saisies hostiles,
leçon LEARN complète, TALK seul dans ses 31 langues, recherche de clés secrètes.
Lancement : `npm i axe-core` (dans un dossier de travail) puis `AXE=<chemin>/axe.min.js node everywhere/tests/expert.js`.

Défauts trouvés et corrigés :
- Paramètres : les 3 boutons « taille du texte » avaient un nom décalé pour les lecteurs d'écran (« Grand » lu sur Normal…),
  et la page entière recevait le nom « Normal » (`app.js`).
- Interrupteurs (Paramètres, EVERYWHERE) : zone à toucher portée de 30 à 44 px de haut, même dessin (`style.css`).
- EVERYWHERE, appeler sur TALK : texte vert trop pâle (« Inviter un contact », boutons « Appeler ») → contraste suffisant.
- Test du cache hors ligne : nom du cache lu dans `sw.js` au lieu d'être écrit en dur (cassé par la 0.6.0).

Constaté dans TALK, NON corrigé (fichier de TALK, apparence à décider) : 2 contrastes insuffisants
(lien « CGV » du bandeau, bouton de traduction `data-tr`).

## 0.6.3 — ACCESSIBILITY (pilier 3)
Les réglages d'affichage sont communs au portail et à TALK (clé `ew_prefs`, gardée sur l'appareil, rien n'est envoyé) :
taille du texte (Normal, Grand, Très grand), contraste renforcé, et nouveau réglage **Réduire les animations**.
TALK les applique avant l'affichage, ouvert seul ou dans la coquille, et les propose dans ses Paramètres (11 langues).
Le thème clair/sombre du portail n'est pas repris dans TALK (TALK suit l'appareil).
Tests : `node everywhere/tests/piliers.js` (6 tests accessibilité).

## 0.6.4 — VOICE (pilier 4)
Bouton micro dans la barre du haut, dans le portail et dans TALK (`voix.js`). Un appui = une phrase écoutée, puis l'action
comprise est affichée avant d'être faite. Aucune écoute permanente, aucun mot magique, aucune IA ni service payant :
une courte liste de commandes en français et en anglais (reconnaissance vocale du téléphone, Google sur Android).
Commandes : « Ouvre TALK / la messagerie / EVERYWHERE / LEARN / mon profil / les réglages / l'accueil / mes langues »,
« Traduis en anglais » (112 langues du portail), « Appelle maria » (ouvre sa fiche d'appel : on confirme avec « Appeler »),
« Lis mon dernier message » (dans une discussion TALK), « Arrête », « Aide ». Micro refusé ou pas de réseau : explication claire.
Navigateur sans reconnaissance vocale : pas de bouton, tout reste faisable au toucher.
Tests : `node everywhere/tests/piliers.js` (13 tests voix, dont 34 phrases comprises).

## 0.6.5 — LISTEN (pilier 5)
- TALK : bouton 🔊 sur chaque message reçu (lu dans la langue affichée, la traduction quand elle est affichée) ;
  nouveau réglage « Lire à voix haute les messages reçus » (discussion ouverte, gardé sur le téléphone).
- Écran gardé allumé (`ecoute.js`, Wake Lock du navigateur, sans autorisation) pendant le Mode vocal de TALK et la
  conversation côte à côte d'EVERYWHERE ; après 2 minutes sans parole ni lecture, l'écoute se met en pause et l'écran
  peut de nouveau s'éteindre (message clair). Toucher un micro reprend.
- Indicateur commun « 🔊 Lecture en cours » avec ⏸ Arrêter, partout où le téléphone lit à voix haute.
- Limites : écran éteint ou appli en arrière-plan = l'écoute s'arrête (limite du navigateur) ; les voix dépendent du téléphone.
Tests : `node everywhere/tests/piliers.js` (6 tests écoute).

## 0.6.6 — TOUCH (pilier 6)
- TALK : appui prolongé sur un message = le même menu que le toucher (Écouter, Copier, Original/Traduction, Supprimer),
  avec une petite vibration (Android) et sans sélection de texte gênante. Nouveau : « ⚠️ Signaler ce message »
  (confirmation, puis le texte exact part à la modération, motif « message », visible dans gestion/).
- Geste « retour » d'Android dans une discussion : retour à la liste, l'appli reste ouverte (pendant un appel : on reste).
  Une seule entrée d'historique par discussion, même en passant par « ← Retour » ou la barre du bas.
- En-tête de discussion : boutons portés à 44 px de haut. Aucun geste caché indispensable : chaque geste a un bouton.
- Pas de glissement horizontal entre espaces (conflit avec le geste retour d'Android), comme prévu.
Tests : `node everywhere/tests/piliers.js` (5 tests gestes ; 30 tests au total pour les 4 piliers).

## 0.6.7 — Conversation côte à côte plus rapide
Demande de Sébastien (« temps de réaction trop long »). La phrase est considérée finie après 0,55 s de silence (au lieu de 0,7 s) ;
la traduction part en avance dès que la phrase est stable 0,25 s ; chaque traduction est gardée (200 dernières) et réutilisée
sans nouvel appel ; connexion au service ouverte d'avance ; en mains libres, le micro suivant s'ouvre 0,12 s après la lecture.
Mesuré en test (service répondant en 0,8 s) : 1,52 s → 1,07 s après la dernière parole ; phrase déjà dite : 0,55 s.
Le reste du délai dépend du service gratuit MyMemory et de la reconnaissance vocale du téléphone.

## 0.6.8 — Captation de la voix plus tolérante
Demande de Sébastien (« la voix a du mal à être détectée »). Conversation côte à côte : si le téléphone n'entend rien
(parlé trop tôt, trop bas, coupure d'Android), l'écoute repart toute seule pendant 20 s au plus, sans message d'erreur ;
la fin de phrase attend 0,9 s de calme quand la phrase fait moins de 3 mots (0,6 s sinon) ; en mains libres, le micro
suivant s'ouvre 0,35 s après la lecture (laisse Android rendre le micro). Commandes vocales : réécoute automatique 8 s au plus.

## 0.6.9 — Micro : on voit quand il écoute et quand il entend
Demande de Sébastien (« le bouton micro, pas de différence entre activité et non activité »). Tous les boutons micro
(conversation côte à côte, commande vocale du haut, dictée de TALK et de la messagerie) : éteint = couleur normale ;
écoute = rouge avec une onde lente qui s'élargit ; voix captée = bouton grossi et onde rapide (événements
« son / parole détectés » de la reconnaissance vocale, ou premier mot reconnu). « Réduire les animations » : anneau fixe,
plus épais quand une voix est captée.

## 0.7.0 — Personne 1 en haut, choix des langues avec recherche
Demande de Sébastien. Conversation côte à côte : Personne 1 en haut, Personne 2 en bas. Partout (portail et TALK), chaque
liste de langues (20 choix ou plus) s'ouvre dans une fenêtre avec une barre de recherche (sans accents ni majuscules, sur le
nom ou le code ; Entrée choisit la première) : « Vos langues » (choisie + 5 récentes) puis toutes les langues de A à Z
(`everywhere/choixlangue.js`). Le menu d'origine reste caché dans la page et reçoit « change » comme avant.
Corrigé aussi : l'écran côte à côte était plus large que le téléphone (titre long dans la barre du haut), ce qui coupait
le bouton ⚙ et la barre du bas à droite.

## 0.7.1 — Profil linguistique et Voyage rejoignent la version actuelle
Demande de Sébastien (« fini one world », choix « Termine tout »). Le travail 0.7.0 resté en brouillon (PR 17 : profil
linguistique privé par défaut, Voyage avec recherche et phrases favorites, « Supprimer mon compte », AI LAB « Bientôt »)
est fusionné avec la version actuelle. L'accueil garde ses deux grandes tuiles (TALK, EVERYWHERE) ; AI LAB se trouve dans
Applications. Corrigé aussi : deux textes bleus trop pâles dans TALK (onglet actif, heure d'un message non lu).
Tests : e2e 85/85, expert 32/32, piliers 40/40, profil-voyage 42/42.
