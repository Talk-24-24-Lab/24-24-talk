# 24/24 ONE WORLD — intégration « 3e millénaire » (0.8.0, test seulement)

> © 2026 Sébastien Chevrier. Tous droits réservés. Branche `claude/one-world-third-millennium-integration-p7s84t`,
> partie de la PR n° 18 (lots 1, 2, 4 et lot 3 en cours). **Rien n'est publié, rien n'est en production.**

## 0. Les 10 questions de validation (règle 42.17)

| # | Question | Réponse pour WORLD BRIDGE |
|---|----------|---------------------------|
| 1 | Relation humaine servie | Deux personnes qui ne parlent pas la même langue, souvent en face à face ou par un lien partagé, qui veulent se comprendre tout de suite. |
| 2 | Contexte | Rencontre immédiate (rue, voyage, accueil, travail) ; peut devenir une relation durable dans TALK. |
| 3 | Permissions | Aucune pour traduire. Accord explicite avant tout envoi distant d'un texte. Micro : autorisation du navigateur. Pseudo dans une invitation : case à cocher, décochée par défaut. |
| 4 | Capacités | Phrases vérifiées (local), moteur en ligne existant, dictée et voix du navigateur si présentes, partage du système si présent. Chaque absence est dite à l'écran. |
| 5 | Canal | L'appareil lui-même (écran partagé) et un lien (partage du système ou copie). Les messages et appels restent dans TALK. |
| 6 | Canal remplaçable | Oui : le lien est une simple adresse ; la traduction passe par `OWTraduction`, qui accepte d'autres fournisseurs sans toucher à l'écran. |
| 7 | Disparition du canal | Sans partage système : copie du lien, puis affichage du lien à copier. Sans réseau : phrases vérifiées seulement (mode dégradé annoncé). |
| 8 | Disparition du fournisseur | Si MyMemory disparaît : message d'erreur honnête, les phrases locales marchent, un autre fournisseur s'ajoute par `register()`. Aucune identité ni relation n'en dépend. |
| 9 | Portabilité | Rien de nouveau n'est stocké côté serveur. Sur l'appareil : 2 langues (clé existante `ew_tr_v1`) et l'accord (`ow_tr_distant_v1`). La conversation n'est jamais enregistrée. |
| 10 | Maîtrise par l'utilisateur | Oui : accord demandé puis retirable en un geste ; partage seulement s'il réussit vraiment ; pseudo seulement si coché. |

## 1. Vision

« Vous ne parlez pas la même langue ? Parlez quand même. » ONE WORLD est la porte : on ouvre l'application et on
peut traduire tout de suite, sans compte. TALK reste le moteur (messages, appels), CONNECT la confiance (identité,
appareils, sécurité), EVERYWHERE l'utilité (face à face, appel traduit, voyage), LEARN la progression, AI LAB le futur.

## 2. Architecture réelle (adaptée au dépôt)

```
everywhere/                      portail ONE WORLD (une seule PWA, un seul manifeste, un seul service worker)
├── index.html                   accueil = la porte : WORLD BRIDGE + cartes des espaces
├── app.js                       routes : #/accueil, #/bridge[/<langue>], #/connect (= #/profil), #/everywhere…, #/learn…, #/ailab
├── shell.js / shell.css         barre du bas commune (aussi dans TALK) : One World · Everywhere · Learn · Talk · Connect
├── core/
│   ├── traduction.js            NOUVEAU — adaptateur unique OWTraduction.translate(texte, source, cible)
│   └── communiquer.js           lot 4 (inchangé) — permissions serveur × capacités
├── oneworld/
│   ├── bridge.js / bridge.css   NOUVEAU — WORLD BRIDGE
│   └── index.html               NOUVEAU — adresse courte des invitations, renvoie vers ../#/bridge (pas une 2e appli)
├── traduction/                  EVERYWHERE (inchangé sauf setLangs) : face à face, appel via TALK, voyage, moteur.js
├── learn/                       LEARN (+ lien « Parler pour de vrai »)
├── ailab/                       AI LAB (« Bientôt » + capacités préparées, rien de branché)
└── connect.js                   CONNECT (inchangé)
index.html (racine)              TALK — NON MODIFIÉ par ce travail
```

Le prototype (`index.html`, `styles.css`, `app.js`, `manifest.webmanifest`) n'a pas été fourni. Il n'a donc pas été
copié : WORLD BRIDGE est construit avec les composants, couleurs et conventions du portail. Le dossier
`everywhere/oneworld/` existe, mais ne contient pas de deuxième manifeste ni de deuxième application : une seule
installation sur le téléphone, un seul cache.

## 3. Parcours

1. Ouvrir ONE WORLD → la porte s'affiche, langues déjà proposées (langue maternelle du profil ou du téléphone).
2. Choisir « Sa langue » (⇄ pour inverser).
3. Écrire ou « Dicter » → « Traduire » (ou Entrée).
4. La traduction s'affiche en grand, avec sa provenance ; « Écouter », « Copier », « Partager ».
5. « L'autre répond » : les langues s'inversent, le champ est prêt pour l'autre personne.
6. Continuer : « Face à face » (EVERYWHERE, mêmes langues), « Continuer dans TALK », « Inviter », « Apprendre … » (LEARN).

Invitation : je choisis les deux langues → « Inviter » → « Partager l'invitation » → l'autre ouvre
`…/everywhere/oneworld/?de=fr&vers=ja` → elle arrive dans WORLD BRIDGE avec ja ⇄ fr déjà choisies, sans compte.
Si j'ai coché la case, le lien porte aussi mon pseudo TALK (`&p=…`) : l'autre voit « Continuer dans TALK avec @… »,
qui ouvre l'invitation habituelle de TALK (`index.html?ew=1&ajouter=…`). Aucun nouveau mécanisme de contact.

LEARN : « Apprendre <langue> » n'apparaît que si LEARN a vraiment des leçons dans cette langue (catalogue lu) ;
sinon le lien générique et la liste réelle (« LEARN propose aujourd'hui : Anglais, Espagnol »). Dans LEARN,
« Parler pour de vrai » ramène à WORLD BRIDGE (après une leçon d'espagnol : `#/bridge/es`).

## 4. Traduction

- Constat honnête : le moteur actuel de TALK = dictionnaire de phrases vérifiées (dans `index.html`) + **MyMemory**
  (service gratuit). EVERYWHERE utilise MyMemory seul (`traduction/moteur.js`). MyMemory n'est donc pas introduit
  ici : c'est déjà le moteur en ligne existant, réutilisé tel quel. Il n'a pas été remplacé.
- Nouveau : `everywhere/core/traduction.js`, un seul point d'entrée. Ordre : 1) phrases vérifiées du Voyage (29 × 6
  langues, sur l'appareil) ; 2) moteur existant en ligne, **seulement après l'accord** de la personne.
- Emplacements prévus, non branchés : moteur local sur l'appareil (ex. Bergamot), fournisseur premium par fonction
  serveur protégée, IA. `OWTraduction.register({ id, kind: "local" | "distant", translate })`.
- Limites : le dictionnaire de TALK (plus riche) n'est pas encore partagé avec le portail ; TALK et le face à face
  envoient encore à MyMemory sans demander l'accord. Ce sont les prochaines étapes (voir §10), elles touchent TALK.

## 5. Sécurité

- Aucune migration, aucune règle RLS modifiée, aucune nouvelle table, aucune clé secrète.
- Nouveaux essais rejouables : `supabase/test/oneworld-3e-millenaire-securite-tests.sql` (12 cas, tout annulé).
  Le lot 1 (`12-socle-confiance-tests.sql`, 29 cas) a aussi été rejoué. Résultats : `supabase/test/oneworld-3e-millenaire-securite-tests.md`.
- Invitation : seules les clés `de`, `vers`, `p` sont transmises ; codes de langue vérifiés dans la liste réelle ;
  pseudo limité à `[a-z0-9_.]{3,20}` ; l'adresse est nettoyée après lecture ; tout est affiché par `textContent`/échappement.

## 6. PWA et hors ligne

- Cache du portail passé de `ew-shell-v14` à `ew-shell-v15` ; les 4 nouveaux fichiers y sont ajoutés ; le service
  worker reste « réseau d'abord » (toujours la dernière version, copie seulement hors ligne). Manifeste : raccourci « WORLD BRIDGE ».
- Hors ligne : l'interface, les préférences, les favoris et les 29 phrases du Voyage marchent. **Pas** de traduction
  distante, **pas** d'appel, **pas** de données serveur : un bandeau « Mode dégradé » le dit.

## 7. Accessibilité

Étiquettes visibles et lues, zone vivante pour le résultat, alertes pour les erreurs, langue déclarée sur le texte
traduit, Entrée = Traduire, focus visible, cibles ≥ 44 px (320 px compris), mouvement réduit respecté. axe-core
(WCAG 2.1 AA) : aucune violation grave ou critique (porte vide, accord, résultat + invitation, sombre + contraste).

## 8. Tests (référence au 5 octobre 2026)

| Suite | Avant | Après |
|---|---|---|
| E2E (`tests/e2e.js`) | 95/95 (PR 18) | 95/95 — 4 libellés attendus mis à jour (barre : One World, Connect) |
| Expert (`tests/expert.js`) | 33/33 | 33/33 |
| Profil/Voyage (`tests/profil-voyage.js`) | 42/42 | 42/42 |
| Unitaire permissions (`tests/communiquer.js`) | 11/11 | 11/11 |
| ONE WORLD (`tests/oneworld.js`) — nouveau | — | 59/59 |
| Unitaire traduction (`tests/traduction.js`) — nouveau | — | 17/17 |
| SQL sécurité ONE WORLD (base de test, annulé) — nouveau | — | 12/12 |
| SQL socle de confiance lot 1 (base de test, annulé) | 29/29 | 29/29 |

Les anciennes références « 84/84, 32/32, 42/42 » datent de la PR 17 ; la PR 18 les avait déjà portées à 95 et 33.
Les blocs SQL « 14/14 » et « 18/18 » du 4 octobre n'avaient pas été gardés en fichier : ils sont couverts par les
12 cas ci-dessus (mêmes attaques : id, created_at, user_id, écrire chez l'autre, appareils, suppression, session expirée, anonyme).
Aucun test supprimé. Lancement : `AXE=<chemin>/axe.min.js node everywhere/tests/oneworld.js` (idem pour les autres).

## 9. Limites (dites honnêtement)

- Pas d'essai sur un vrai téléphone Android : tout est simulé dans Chromium.
- Le critère « moins d'une minute avec une vraie personne » n'est mesuré qu'en automatique (3 gestes, < 1 s).
- Interface du portail en français et en anglais seulement ; la personne invitée lit l'accueil dans l'une des deux.
- MyMemory peut conserver les textes ; les phrases es/it/de/pt sont encore à faire relire.
- Le lien avec pseudo passe par l'invitation existante de TALK ; sur la base de test, le lot 3 (demandes de
  contact) peut transformer cet ajout en demande à accepter : comportement du lot 3, non modifié ici.

## 10. Prochaines étapes

1. Essai de Sébastien sur Android : ouvrir la porte, traduire, inviter un proche, continuer dans TALK.
2. Faire passer TALK et le face à face par `OWTraduction` (accord avant envoi partout) et partager le dictionnaire de TALK.
3. Prototype de moteur local (Bergamot) sur un vrai Android, branché par `register()`.
