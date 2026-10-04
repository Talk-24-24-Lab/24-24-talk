# Architecture de 24/24 ONE WORLD (version 0.7.0, prototype de test)

> © 2026 Sébastien Chevrier. Tous droits réservés. Environnement de TEST uniquement.

## 1. En une phrase

Un **site statique** (HTML, CSS et JavaScript sans framework ni compilation) publié par GitHub Pages, avec un
**serveur Supabase** (comptes, base de données protégée par RLS) partagé avec 24/24 TALK. « 1 application, 3 interfaces » :
TALK, EVERYWHERE et LEARN, plus la tuile AI LAB « Bientôt ».

## 2. Fichiers

| Fichier | Rôle | État |
|---|---|---|
| `index.html` | 24/24 TALK (application historique, ~9 200 lignes) | EXISTANT (seuls les contrastes ont changé en 0.7.0) |
| `everywhere/index.html` | Coquille commune ONE WORLD : accueil, Applications, Profil, Paramètres, vues des interfaces | PROTOTYPE |
| `everywhere/app.js` | Routeur par adresse (`#/…`), écrans communs, ouverture de TALK | PROTOTYPE |
| `everywhere/apps.js` | Liste des interfaces (TALK, EVERYWHERE, LEARN, AI LAB) : nom, état, couleur, icône | PROTOTYPE |
| `everywhere/config.js` | **Seul** fichier qui change entre test et production (adresse Supabase, clé publique) | PROTOTYPE |
| `everywhere/connect.js` | CONNECT : sécuriser le compte par e-mail, se connecter ailleurs, mes appareils, supprimer mon compte | PROTOTYPE |
| `everywhere/prefs.js` | Thème, contraste renforcé, taille du texte, animations réduites | PROTOTYPE |
| `everywhere/profil/profil.js` + `.css` | Profil linguistique (privé par défaut) | PROTOTYPE |
| `everywhere/traduction/moteur.js` | Traduction (service gratuit MyMemory), voix (Web Speech) | PROTOTYPE |
| `everywhere/traduction/everywhere.js` | EVERYWHERE : côte à côte, appel TALK traduit, langues, réglages | PROTOTYPE |
| `everywhere/traduction/voyage.js` + `phrases.js` | Parcours Voyage et ses 29 phrases en 6 langues | PROTOTYPE |
| `everywhere/learn/` | LEARN (apprentissage des langues) | PROTOTYPE |
| `everywhere/ailab/ailab.js` | Page d'information AI LAB « Bientôt » (aucune fonction) | PROTOTYPE |
| `everywhere/sw.js`, `manifest.webmanifest` | Application installable, coquille disponible hors connexion (cache `ew-shell-v13`) | PROTOTYPE |
| `everywhere/tests/` | Tests automatiques (Playwright) et faux serveur Supabase pour les tests | PROTOTYPE |
| `supabase/test/10-profil-linguistique*.sql` | Table `language_profiles` (+ retour arrière) appliquée sur la base de TEST | PROTOTYPE |

## 3. Adresses (routes)

`#/accueil` · `#/applications` · `#/profil` · `#/profil/linguistique` · `#/parametres` ·
`#/everywhere` (+ `/face`, `/appel`, `/langues`, `/reglages`, `/voyage`) · `#/learn` (+ `/apprendre`, `/lecon/<id>`,
`/progression`, `/conversation`) · `#/ailab`. TALK s'ouvre en pleine page (`../index.html`), pas dans un cadre
(décision du 4 octobre 2026 : le cadre figeait sur un vrai téléphone).

## 4. Où sont les données

| Donnée | Où | Qui peut la lire |
|---|---|---|
| Session du compte | `localStorage` `lc_net_auth` (partagée avec TALK) | Ce navigateur |
| Profil linguistique | `localStorage` `ow_profile_v1` | Ce navigateur |
| Copie du profil linguistique (si la personne coche « Sauvegarder sur mon compte » **et** donne son accord) | table `public.language_profiles` | La personne seule ; ses contacts TALK seulement si elle choisit « Mes contacts » (nom affiché, langue maternelle, langues parlées) |
| Préférences d'affichage | `ew_prefs` | Ce navigateur |
| Réglages EVERYWHERE | `ew_tr_v1` | Ce navigateur |
| Voyage : langues, situation, phrases favorites | `ew_voyage_v1` | Ce navigateur |
| Voyage : phrases préparées hors connexion | `ew_voyage_tr_<langue>` | Ce navigateur |
| Pseudo, contacts, messages, appareils | tables TALK (`profiles`, `conversations`, `members`, `messages`…) et `auth.sessions` | Protégé par RLS (voir l'audit) |

## 5. Serveur (Supabase de TEST `tbynnefrrxzxufcptijc`)

- Le site n'utilise que la clé **publique** (« publishable »). Aucune clé `service_role` dans le code (vérifié par test).
- Toutes les tables `public` ont la RLS activée. Les tables du compte ont en plus une règle **restrictive**
  « session active » : un jeton d'une session déconnectée ne lit plus rien.
- Fonctions sensibles (exécutées côté serveur, avec `auth.uid()`, jamais un identifiant envoyé par le téléphone) :
  `mes_appareils()`, `deconnecter_appareil(sid)`, `supprimer_mon_compte()`, `langues_de_mes_contacts()`.
- Garde-fou dans `config.js` : si l'adresse de la base de **production** est mise alors que `env` n'est pas
  `production`, la connexion est coupée.

## 6. Services extérieurs

| Service | Usage | Coût |
|---|---|---|
| GitHub Pages | Héberge le site de test | Gratuit |
| Supabase (offre gratuite) | Comptes et base de test | Gratuit |
| MyMemory | Traduction en ligne | Gratuit, limité par jour (message clair quand la limite est atteinte) |
| jsDelivr | Charge la bibliothèque Supabase | Gratuit |

Aucun service d'IA payant n'est appelé (vérifié par test : aucune adresse OpenAI, Anthropic ou Google IA dans le code).

## 7. Lancer le site et les tests sur un ordinateur

```
python3 -m http.server 8080
```
puis ouvrir `http://localhost:8080/everywhere/` dans Chrome. Tests (Node + Playwright + Chromium) :
```
node everywhere/tests/e2e.js
AXE=chemin/vers/axe.min.js node everywhere/tests/expert.js
AXE=chemin/vers/axe.min.js node everywhere/tests/profil-voyage.js
```
Les tests utilisent un **faux serveur Supabase** (`everywhere/tests/fake-supabase.js`) : ils ne touchent ni la base de
test ni la production.
