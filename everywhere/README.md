# 24/24 EVERYWHERE

Portail de **24/24 ONE WORLD** : un seul site, une interface commune, plusieurs applications.
Première application intégrée : **24/24 TALK**. Un deuxième emplacement est réservé.

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
│   ├── e2e.js              31 tests automatiques (Playwright)
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

## 9. Limites connues

- Le portail est traduit en français et en anglais (TALK garde ses 31 langues).
- Le compte reste lié à un navigateur sur un appareil (comme TALK aujourd'hui). La continuité entre appareils est la prochaine étape d'EVERYWHERE.
- Une notification d'appel touchée quand rien n'est ouvert ouvre TALK seul (pas le portail).
- Sur iPhone, l'installation passe par Partager → « Sur l'écran d'accueil » ; les notifications n'y marchent qu'une fois l'appli installée.
- Tests exécutés dans Chromium (moteur de Chrome et d'Android). Safari/iPhone et un vrai téléphone n'ont pas été testés par Claude.
