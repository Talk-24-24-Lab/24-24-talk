# ONE WORLD : cartographie de l'existant et plan de transformation par lots

> © 2026 Sébastien Chevrier. Tous droits réservés.
> Mission : directive maître « 24/24 → ONE WORLD » (5 oct. 2026). Étapes faites ici : INSPECTER, COMPRENDRE,
> CARTOGRAPHIER, CONCEVOIR, PLANIFIER. **Aucune modification** du code ni de la base.
> Périmètre lu : dépôt de test `Talk-24-24-Lab/24-24-talk` (branche `main` + PR n° 17 brouillon, version 0.7.0),
> base Supabase de **test** `tbynnefrrxzxufcptijc` (lecture seule). Production : ni lue, ni touchée.
> Étiquettes : EXISTANT (vérifié dans le code ou la base) · PROTOTYPE (sur le test seulement) · PROPOSITION (rien de construit).

---

## 1. Résumé en 6 lignes

1. Le produit réel est un **site statique sans compilation** (HTML/CSS/JS) + **Supabase** (comptes anonymes, Postgres
   protégé par RLS, temps réel). TALK = un seul fichier `index.html` de 9 345 lignes.
2. Une bonne partie des fondations demandées existe déjà en germe : identité (compte + pseudo + CONNECT), confiance
   (blocage, signalement, suspension, anti-spam, sessions), un mini « bus » vers TALK (`index.html?ew=1&ew_appel=…`).
3. Ce qui **n'existe pas** : groupes, communautés, événements, vidéo, pièces jointes, réactions, présence, recherche
   de personnes inconnues, relations typées (famille/collègue…), préférences « qui peut m'appeler ».
4. La directive **contredit trois décisions déjà prises** (sens du mot CONNECT, place de COMMUNITY/LIVE, navigation).
   Je ne tranche pas : ce sont les décisions D1 à D3 ci-dessous.
5. Plan proposé : 8 lots, du plus sûr au plus ambitieux, tous sur le **test**, chacun réversible, chacun testé.
6. Point d'attention : la **production** a encore des correctifs de sécurité en attente et l'échéance du
   **1er novembre 2026** approche ; ONE WORLD ne doit pas les faire passer au second plan (voir §7).

---

## 2. Cartographie de l'existant (vérifiée)

### 2.1 Stack technique

| Élément | Réalité | État |
|---|---|---|
| Frontend | HTML/CSS/JS « à la main », sans framework ni étape de compilation | EXISTANT |
| TALK | `index.html` (9 345 lignes, tout-en-un), PWA installable, 112 langues d'interface (`i18n/`) | EXISTANT (prod) |
| Coquille ONE WORLD | `everywhere/` : routeur `#/…`, registre d'interfaces `apps.js`, Profil, Paramètres | PROTOTYPE |
| CONNECT (actuel) | e-mail de récupération, connexion sur un autre appareil, mes appareils, supprimer mon compte | PROTOTYPE |
| EVERYWHERE | côte à côte (même sens de lecture), appel TALK traduit, Voyage | PROTOTYPE |
| LEARN | leçons anglais/espagnol, exercices, progression (local) | PROTOTYPE |
| AI LAB | tuile « Bientôt », aucune fonction | PROTOTYPE |
| Administration | `gestion/` (stats, modération, bannissement) | EXISTANT |
| Hébergement | GitHub Pages (gratuit) | EXISTANT |
| Serveur | Supabase gratuit : Auth anonyme, Postgres + RLS, Realtime, 1 fonction Edge `call-push` | EXISTANT |
| Traduction | MyMemory (gratuit, limité, reçoit les textes) | EXISTANT |
| Voix | Web Speech du navigateur (gratuit) | EXISTANT |
| Appels | WebRTC audio seulement, STUN seul (pas de relais TURN) | EXISTANT |
| Tests | Playwright + faux Supabase : 84 e2e, 32 expert, 42 profil-voyage ; 32 essais d'attaque SQL | PROTOTYPE |

### 2.2 Données (base de test, lue le 5 oct. 2026)

Tables publiques : `profiles` (id, pseudo, lang, created_at), `conversations`, `members`, `messages`
(body, lang, kind = text / voice / call), `hidden_messages`, `blocks`, `reports`, `language_profiles` (0.7.0),
`admins`, `stat_*`. Tables privées : `suspensions`, `moderation_log`, `rate_log`, `push_subs`, `push_config`,
`subscriptions`, `billing_settings`, `stats_origins`.

Fonctions serveur : `start_conversation(pseudo)`, `mes_appareils`, `deconnecter_appareil`, `supprimer_mon_compte`,
`langues_de_mes_contacts`, `admin_*`, `mon_acces`, `ping`, `track` ; garde-fous `is_member`, `blocked_in`,
`can_signal`, `is_suspended`, `session_active`, `shares_conversation`.

### 2.3 Correspondance directive ↔ existant

| Bloc de la directive | Ce qui existe vraiment | État |
|---|---|---|
| ONE WORLD ID | compte Supabase anonyme + pseudo + e-mail facultatif (CONNECT) + profil linguistique | EXISTANT / PROTOTYPE (partiel) |
| PROFILE | pseudo, langue ; profil linguistique privé par défaut (nom affiché, langues, visibilité « moi » / « contacts ») | PROTOTYPE (partiel) |
| RELATIONSHIP GRAPH | implicite : « contact » = quelqu'un avec qui on partage une conversation ; blocages | EXISTANT (implicite, sans type ni contexte) |
| CONTEXT ENGINE | rien | absent |
| TALK CORE 1:1 | messages, voix, appels audio, effacement 90 j, masquer, bloquer, signaler, notifications push | EXISTANT |
| TALK groupes, réactions, réponses, fichiers, images, vidéo, présence, recherche | rien (la table `members` permettrait des groupes, mais `start_conversation` ne fait que du 1:1) | absent |
| TALK BUS | lien `index.html?ew=1&ew_appel=<discussion>` utilisé par EVERYWHERE pour lancer un appel | PROTOTYPE (embryon) |
| INTERACTION BRIDGE | invitation par lien (SMS, WhatsApp, e-mail via partage du téléphone), `?ajouter=pseudo` | EXISTANT (embryon) |
| CAPABILITY ENGINE | `can_signal` : seuls les contacts non bloqués peuvent sonner ; pas de préférence par canal | EXISTANT (embryon) |
| CONNECT « découverte humaine » | seulement « ajouter par pseudo exact » ; aucun annuaire | absent (et **conflit de nom**, voir D1) |
| WORLD, EVENT, COMMUNITY, PROFESSIONAL | rien | absent |
| ONE WORLD AI | traduction MyMemory + voix navigateur ; aucun modèle d'IA | EXISTANT (traduction seulement) |
| TRUST LAYER | RLS partout, « session active », suspension, anti-spam (30 msg/min, 1 000/j), 20 signalements/j, journal de modération | EXISTANT / PROTOTYPE |
| NOTIFICATION ENGINE | push des appels (`call-push`) et des messages ; pas de préférences ni de silence | EXISTANT (partiel) |
| SEARCH | recherche dans ses contacts (EVERYWHERE) | PROTOTYPE (partiel) |
| MEDIA ENGINE | rien (aucun Supabase Storage utilisé) | absent |
| TEMPS RÉEL | Realtime : nouveaux messages ; boîte privée `user:<id>` pour la signalisation d'appel, protégée | EXISTANT |
| OFFLINE | coquille en cache (service worker) ; phrases Voyage hors ligne ; pas de file d'envoi hors ligne | PROTOTYPE (partiel) |
| i18n | 112 langues d'interface TALK ; fr/en dans la coquille | EXISTANT |
| DOMAIN EVENTS | `moderation_log`, `rate_log`, statistiques ; pas de journal d'événements général | absent |
| API | pas de backend propre : le site appelle directement Supabase (tables + fonctions RPC) | EXISTANT (c'est l'« API » réelle) |
| BUSINESS MODEL | prototype d'abonnement sur le test (`has_access`), sans Stripe | PROTOTYPE (non recommandé en prod sans Stripe) |

### 2.4 Sécurité : vérifications faites aujourd'hui (lecture seule, test)

- Droits par colonne : un compte ne peut modifier dans `profiles` que `pseudo` et `lang` ; dans `members` que
  `last_read` et `cleared_at`. **Conforme.**
- `messages` et `reports` : la date `created_at` envoyée par le téléphone est **écrasée par le serveur** (`now()`). **Conforme.**
- Signalisation d'appel : seul le titulaire écoute `user:<son id>` ; seuls ses contacts non bloqués peuvent y écrire. **Conforme.**
- Petits écarts relevés (aucun n'expose les données d'autrui) :
  - E1 `profiles.created_at` peut être fixé par le téléphone **à la création** de son propre profil (pas de fuite,
    mais à fermer). *Correction du 5 oct. : `messages.id` n'était pas un écart, la colonne est « generated always ».*
  - E2 Les règles du temps réel n'ont pas la règle « session active » (un jeton d'appareil déconnecté reste valable
    jusqu'à son expiration, environ 1 h).
  - R1 et R2 (déjà connus) : `blocks`/`reports` sans « session active » ; anciennes fonctions avec `search_path=public`.

---

## 3. Où la directive croise ou contredit les décisions déjà prises

| # | Directive | Décision existante | Conséquence |
|---|---|---|---|
| D1 | **CONNECT = découverte humaine** (trouver des personnes) | CONNECT = **identité entre appareils** (e-mail, appareils, suppression), construit et testé | Même mot, deux sens. Proposition : garder ce qui existe sous le nom « Compte et appareils » dans PROFILE, et donner le nom CONNECT à la découverte. |
| D2 | **WORLD** = communautés, groupes, événements | Les 7 espaces prévus incluent **COMMUNITY** (communautés) et **LIVE** (événements en direct) | WORLD peut regrouper COMMUNITY + LIVE, ou rester distinct. À trancher. |
| D3 | Navigation **HOME / CONNECT / WORLD / TALK / PROFILE** | « 1 application, 3 interfaces » (TALK, EVERYWHERE, LEARN) ; barre actuelle : Accueil, Applications, TALK, Profil | Où vont EVERYWHERE et LEARN ? Proposition : EVERYWHERE devient une capacité de TALK (traduction en face à face et appel traduit), LEARN reste une interface à part, accessible depuis HOME. **La règle « ne jamais transférer les fonctions de l'une à l'autre » reste respectée** : EVERYWHERE garde la traduction, LEARN l'apprentissage. |
| D4 | Relations romantiques, découverte par proximité | Aucune décision ; enjeu de protection des mineurs et de sécurité | Je propose de ne **pas** construire ces deux usages avant une couche de confiance plus mûre (vérification d'âge, signalement renforcé). |
| D5 | IA transverse (résumé, organisation…) | Interdiction des services payants sans accord ; AI LAB « Bientôt » | Aucune IA générative possible gratuitement et proprement à ce stade : reste PROPOSITION. |

---

## 4. Architecture cible adaptée au stack réel (CONCEVOIR)

Principe : **ne pas changer de technologie**. Supabase fait déjà office de backend (Postgres + RLS + fonctions + temps
réel). La directive parle d'API `/identity`, `/talk`, `/relationships`… : dans ce stack, chaque « route » devient
**une fonction RPC Postgres** protégée (vérifie `auth.uid()`, la session active, le contexte), et chaque module front
devient **un petit fichier JS** dans `everywhere/core/`.

```
Téléphone (site statique)
  everywhere/core/identite.js    ONE WORLD ID : qui suis-je, mes profils par contexte
  everywhere/core/relations.js   graphe : mes relations, leur type, leur contexte
  everywhere/core/talk.js        TALK BUS : communiquer(personne, contexte) → options autorisées
  everywhere/core/capacites.js   CAPABILITY ENGINE : TEXTE / VOIX / APPEL / (plus tard VIDÉO, FICHIER)
  everywhere/core/passerelles.js INTERACTION BRIDGE : TALK interne, lien d'invitation, sms:, mailto:, partage natif
        │ (clé publique uniquement)
Supabase (test)
  RPC  ow_mes_relations, ow_definir_relation, ow_communiquer(autre, contexte),
       ow_mes_preferences_contact, ow_definir_preferences_contact, …
  Tables relationships, contact_prefs, (plus tard) groups, communities, events, audit_events
  Garde-fous existants réutilisés : session_active, is_suspended, blocked_in, shares_conversation, can_signal
```

Exemple concret du TALK BUS (cas « Alice consulte Bob ») : le front appelle `ow_communiquer(bob, 'personnel')` ; le
serveur répond, à partir de données **réelles** : `{ texte: oui, voix: oui, appel: non (Bob n'accepte les appels que
de sa famille), video: non disponible }`. L'écran n'affiche que les boutons autorisés. Aucune capacité n'est supposée.

Ce qu'on **ne fait pas** maintenant : bus d'événements distribué, microservices, file de messages. Pour le volume
actuel (2 comptes en test, 3 en prod), un simple journal `audit_events` alimenté par des déclencheurs suffit ; il
pourra être branché plus tard sur un vrai bus si le volume l'exige.

---

## 5. Plan par lots (PLANIFIER)

Chaque lot : branche à moi partant de la PR 17, base de **test** seulement, script de retour arrière, tests positifs +
négatifs + inter-comptes, rapport. Rien en production. Rien fusionné sans ton accord écrit.

| Lot | Contenu | Valeur | Risque | Coût | Besoin de toi |
|---|---|---|---|---|---|
| **1. Socle de confiance** | Fermer E1, E2, R1, R2 ; script d'essais d'attaque rejouable (A contre B, non connecté, bloqué, suspendu, session révoquée) | Base saine avant d'ajouter des données relationnelles | Faible (petites migrations, retour arrière prêt) | 0 € | Un « oui » (la base de test change) |
| **2. TALK BUS + capacités v1** | `core/talk.js` + `core/capacites.js` : un seul point d'entrée « communiquer avec X » qui réutilise les liens TALK existants ; capacités lues du réel (texte, voix, appel audio) | TALK devient invocable depuis Profil, EVERYWHERE, HOME | Faible (aucune donnée nouvelle) | 0 € | Rien |
| **3. Préférences de contact** | Table `contact_prefs` : « qui peut m'écrire / m'appeler / me trouver » (défaut : contacts seulement, comme aujourd'hui) ; appliquée **côté serveur** dans `start_conversation` et `can_signal` | Vraie protection de la vie privée, base du Capability Engine | Moyen (touche l'entrée en relation de TALK) | 0 € | Un « oui » |
| **4. Graphe de relations v1** | Table `relationships` privée au titulaire : type (famille, ami, collègue, connaissance…) et contexte (personnel, pro, communauté) ; **aucune exposition** à l'autre personne | Contextes séparés dès le départ | Faible | 0 € | Choix des types de relation (liste proposée) |
| **5. HOME v1** | Accueil = personnes importantes + conversations récentes + actions rapides ; pas de flux, pas de compteur addictif | « Je suis dans mon monde » | Faible | 0 € | Validation d'une maquette |
| **6. Groupes TALK** | Discussions à plusieurs (la table `members` le permet déjà) : créer, inviter, quitter, admin du groupe, blocage | Première brique de WORLD | Moyen (touche `index.html`) | 0 € | Un « oui » |
| **7. Journal d'événements** | `audit_events` (RelationshipCreated, ConversationCreated, SecuritySessionRevoked…) par déclencheurs ; lisible par l'admin seulement | Traçabilité des actions sensibles | Faible | 0 € | Rien |
| **8. WORLD / CONNECT découverte** | Profil public **sur option** (désactivé par défaut), communautés, événements | Croissance relationnelle | Élevé (vie privée, modération, mineurs) | 0 € au début | D1, D2, D4 tranchées |

Hors plan (PROPOSITION, besoin d'un accord de dépense) : vidéo fiable (relais TURN payant), IA générative, fichiers
volumineux (Storage au-delà du gratuit), SMS/e-mails envoyés par le serveur, vérification d'âge.

---

## 6. Le meilleur argument contre ce plan (et ma réponse)

- **« Il faudrait passer à un framework (React, Flutter…) pour tenir à l'échelle mondiale. »** Argument fort : un
  fichier de 9 345 lignes devient difficile à faire évoluer, et une application native gère mieux les appels en
  arrière-plan. Réponse : la directive interdit de remplacer une architecture par préférence, la réécriture casserait
  TALK, et le goulot actuel n'est pas le framework mais le modèle de données (relations, contextes, permissions).
  On extrait des modules `core/` petit à petit ; la question native se reposera quand les appels en arrière-plan
  sur iPhone deviendront le blocage n° 1.
- **« Faire WORLD et la découverte d'abord : c'est ce qui fait grandir un réseau. »** Argument fort : sans découverte,
  pas de croissance. Réponse : ouvrir un annuaire de personnes avant d'avoir les préférences de contact et la couche
  de confiance, c'est exposer des gens (et peut-être des mineurs) à du démarchage. La croissance par invitation
  existe déjà (lien TALK) et suffit pour l'instant.
- **« Ne rien faire de ONE WORLD avant d'avoir sécurisé la production. »** Argument fort, voir §7. Réponse : les
  deux peuvent avancer, mais la production doit passer devant si tu dois choisir.

---

## 7. Risques

1. **Production en retard sur le test** : le plan P0–P7 (correctifs sécurité) attend ton accord ; la période gratuite
   finit le 1er nov. 2026 sans moyen de paiement branché. ONE WORLD ne doit pas éclipser cela.
2. **Dérive de périmètre** : la directive décrit ~20 moteurs ; construits trop tôt, ils restent vides. D'où des lots
   courts, chacun utile seul.
3. **Confusion de noms** (D1 à D3) si on ne tranche pas avant le lot 5.
4. **MyMemory** reçoit les textes traduits : à mentionner dans la politique de confidentialité avant toute
   « traduction native partout ».
5. **Aucun essai sur vrai téléphone** des versions 0.6 et 0.7 à ce jour.

## 8. Coûts

Lots 1 à 8 : **0 €** (GitHub Pages, Supabase gratuit, Web Speech, MyMemory gratuit). Aucun service payant appelé.

## 9. Décisions attendues de toi

1. **Lot 1** (socle de confiance sur la base de test) : je le fais ? (recommandé : oui)
2. **D1** : le mot CONNECT désigne désormais la découverte de personnes, et l'actuel CONNECT devient « Compte et
   appareils » dans PROFILE ? (recommandé : oui)
3. **D2** : WORLD regroupe COMMUNITY et LIVE ? (recommandé : oui, pour éviter deux espaces qui se recouvrent)
4. **D3** : barre HOME / CONNECT / WORLD / TALK / PROFILE, avec EVERYWHERE comme capacité de TALK et LEARN depuis
   HOME ? (recommandé : oui, mais seulement au lot 5, après maquette)
5. **D4** : relations romantiques et découverte par proximité reportées ? (recommandé : oui)
6. La **suite de ta directive** (ton message s'arrête à la section 38) : à m'envoyer si elle contient d'autres consignes.

---

## 10. Mise à jour du 5 oct. 2026 : intégration des sections 39 à 58 de la directive

### 10.1 Ce que ces sections changent, confronté à l'existant

| Section | Exigence | Existant (vérifié) | Conséquence pour le plan |
|---|---|---|---|
| 41–42 Identité / Profil | Séparer authentification, profil, relations | Déjà séparé en pratique : `auth.users` (identité technique), `profiles` (pseudo, langue), `language_profiles` (profil riche) | Garder ce découpage ; ne rien fusionner |
| 43–44 Relations + états | Table `relationship` ; états DISCOVERED → INVITED → PENDING → ACCEPTED / REJECTED / BLOCKED / MUTED / REMOVED ; transitions contrôlées côté serveur | **Aucun consentement aujourd'hui** : `start_conversation(pseudo)` crée la discussion tout de suite, et « contact » = discussion partagée. Le blocage existe (`blocks`) | Changement de fond : une **demande de contact** à accepter. Table modifiable seulement via fonctions serveur (aucune écriture directe). `blocks` reste la source du blocage (pas de doublon) |
| 45 Contexte | Permission globale ou propre à un contexte | Rien | Colonne `context` sur la relation et sur les préférences |
| 46–47 Permission / Policy engine | `can(user, action, ressource, contexte)` centralisé | Les briques existent, éparpillées : `session_active`, `is_member`, `blocked_in`, `is_suspended`, `can_signal`, `shares_conversation`, `is_admin` | Un seul `private.can(action, cible, contexte)` qui **réutilise** ces briques ; les règles RLS et les fonctions l'appellent. Tests d'équivalence : même comportement qu'avant |
| 48 Modèle TALK | Conversation liée à relation / communauté / événement ; pièces jointes, réactions, lu, remis, appels | `conversations`, `members` (dont `last_read` = « lu »), `messages` (kind text/voice/call). Pas de réaction, pièce jointe, remise, table d'appel | Ajouter des colonnes **facultatives** (`space_id`, `context`) sans casser TALK ; réactions et pièces jointes plus tard |
| 49 Cycle de vie + idempotence | Éviter les doublons, clé d'idempotence | Pas de clé : un renvoi après coupure réseau peut créer un doublon | Colonne `client_id` unique par expéditeur (petite migration, compatible) |
| 50–51 Sécurité message / conversation | Identité tirée de la session, jamais du client | Vérifié : `sender_id = auth.uid()` imposé par RLS, appartenance et blocage vérifiés, date imposée par le serveur | Déjà conforme ; ajouter les droits ADD/REMOVE_MEMBER avec les groupes |
| 52 Groupes | Un seul modèle qui évolue (groupe → communauté → équipe → événement) ; réutiliser l'existant | `members` accepte déjà N personnes ; seul `start_conversation` limite à 1:1 | **Un seul modèle** : `spaces` (kind = group / community / organization / event / professional) + `space_members(role)` ; une conversation peut pointer vers un espace |
| 53–54 Découverte | Raison explicable ; DISCOVERABLE / NOT_DISCOVERABLE par contexte | Rien (ajout par pseudo exact seulement) | Par défaut **NOT_DISCOVERABLE** partout ; suggestions seulement avec une raison lisible (« 3 intérêts communs ») |
| 55–56 WORLD + modération | Rôles OWNER / ADMIN / MODERATOR / MEMBER ; permissions distinctes ; pas seulement `is_admin` | `public.admins` = un booléen global (admin de toute l'appli) | Garder `admins` pour la plateforme ; rôles **par espace** avec une table rôle → permissions |
| 57–58 Événements | Event avec fuseau horaire, participants ; « vous participez au même événement » | Rien | Un événement = un `space` de kind event + dates ; la suggestion respecte la découvrabilité |

### 10.2 Plan par lots, version 2 (remplace le §5)

| Lot | Contenu | Besoin de toi |
|---|---|---|
| **1. Socle de confiance** | E1, E2, R1, R2 + essais d'attaque rejouables (inchangé) | « Oui » (carte en attente) |
| **2. Moteur de permissions** | `private.can(action, cible, contexte)` qui regroupe les règles existantes ; RLS et fonctions branchées dessus ; tests prouvant que **rien ne change** pour TALK | Rien |
| **3. Relations avec états + préférences de contact** | Table `relationships` (type, état, contexte) modifiable seulement par fonctions serveur (`inviter`, `accepter`, `refuser`, `mettre en sourdine`, `retirer`) ; préférences « qui peut m'écrire / m'appeler » ; demande de contact au lieu de discussion immédiate (**sur le test seulement, TALK prod inchangé**) | Valider le principe « demande à accepter » (change l'usage de TALK) |
| **4. TALK BUS + capacités** | `communiquer(personne, contexte)` → boutons autorisés, décidés par `can()` | Rien |
| **5. Idempotence + HOME** | `client_id` contre les doublons ; HOME = personnes importantes + conversations | Maquette HOME |
| **6. Espaces (groupes)** | `spaces` + `space_members(role)` + permissions par rôle ; groupes TALK branchés dessus | « Oui » |
| **7. Journal d'événements** | `audit_events` (RelationshipCreated, MemberAdded, SessionRevoked…) | Rien |
| **8. Découverte + événements** | Découvrabilité par contexte (désactivée par défaut), suggestions expliquées, événements | D1, D2, D4 |

Tous les lots restent sur le test, à 0 €, réversibles et testés (positif, négatif, inter-comptes, contexte).

### 10.3 Nouvelle décision à prendre

- **D6** : aujourd'hui, connaître le pseudo de quelqu'un suffit pour lui écrire. La directive (section 44) implique
  une **demande de contact à accepter**. Plus sûr (anti-spam, anti-harcèlement), mais un peu moins direct.
  Recommandé : oui, avec une exception pour les liens d'invitation envoyés par la personne elle-même (le lien vaut
  acceptation).

---

## 11. Mise à jour : intégration des sections 59 à 150 (plan de PR, sécurité, exploitation)

### 11.1 Nouveaux constats vérifiés (base de test et code, lecture seule)

| # | Section | Constat | Gravité |
|---|---|---|---|
| C1 | 146 Dépendances | La bibliothèque Supabase est chargée en `supabase-js@2` **sans version exacte ni empreinte d'intégrité** (TALK `index.html` l. 5643 et `everywhere/config.js`). Toute nouvelle 2.x publiée sur jsDelivr est exécutée telle quelle | HAUTE (chaîne d'approvisionnement) |
| C2 | 138 Pseudo | Pseudo unique et bien filtré (`^[a-z0-9_.]{3,20}$`) ; l'identifiant technique est un UUID (conforme). Mais le pseudo est **modifiable sans limite** et un pseudo libéré est réutilisable aussitôt → usurpation possible | MOYENNE |
| C3 | 114 Drapeaux | Aucun système de drapeaux de fonctionnalités ; seul `EW_CONFIG.env` (test / production) existe | — (à créer) |
| C4 | 139 Suppression | Suppression de compte immédiate, sans délai de grâce (conforme pour l'utilisateur, pas de retour possible) | FAIBLE |
| C5 | 140 Export | Aucun export des données personnelles | MOYENNE (RGPD) |
| C6 | 141 Modération | `reports` sans règle de lecture : un utilisateur ne peut pas lire les signalements. **Conforme** | — |
| C7 | 97 Conservation | Messages effacés à 90 jours (EXISTANT) ; aucune durée fixée pour `rate_log`, `push_log`, `stat_*`, `moderation_log` | FAIBLE |
| C8 | 66–67 Notifications | Push existant, sans priorités, sans horaires silencieux, sans choix par type | — (à créer) |

### 11.2 Le plan de PR de la section 120, adapté au dépôt réel

Le dépôt n'a pas de compilation, pas de backend propre, pas de typage : « lint / typecheck / unit » (section 118)
se traduisent par les tests Playwright existants + des tests SQL d'attaque rejouables. Chaque PR vise la branche de
test, part de l'état 0.7.0 (PR 17) et reste petite.

| PR directive | PR réelle proposée | Contenu concret | Lot |
|---|---|---|---|
| 1 Audit / doc | **PR A** | Ce rapport + registre de dette technique + matrice de tests dans `docs/one-world/` | — |
| 13 Security hardening (avancée) | **PR B** | E1, E2, R1, R2 + **C1 (version figée + empreinte)** + C2 (limite de changement de pseudo, pseudo réservé 30 j) + suite de non-régression sécurité | 1 |
| 2 Foundation | **PR C** | `everywhere/core/` : drapeaux de fonctionnalités (`one_world_*`, tous coupés par défaut), journal `audit_events`, conventions d'événements | 7 avancé |
| 5 Permissions | **PR D** | `private.can(action, cible, contexte)` + tests d'équivalence | 2 |
| 3 Identity | **PR E** | Centre de sécurité (appareils, sessions, déconnexion globale, événements de sécurité) en réutilisant CONNECT ; export de mes données (C5) | nouveau |
| 4 Relationships | **PR F** | `relationships` à états + préférences de contact | 3 |
| 7 Capabilities + 6 TALK core | **PR G** | `getCapabilities()` / résolution A-B-contexte ; bouton unique « Communiquer » ; dégradation propre (pas de vidéo → message + appel vocal) ; `client_id` anti-doublon | 4–5 |
| 8 Integration bridge | **PR H** | Adaptateurs **gratuits et officiels** seulement : TALK interne, lien d'invitation, `sms:`, `mailto:`, partage natif du téléphone. Aucun jeton externe stocké | nouveau |
| 10 WORLD | **PR I** | `spaces` + rôles + groupes TALK | 6 |
| 9 CONNECT + 11 Events | **PR J** | Découvrabilité par contexte (désactivée par défaut), suggestions expliquées, événements | 8 |
| 12 AI | — | Reste PROPOSITION : demande un service payant ; architecture notée (minimisation, AI_READ / AI_ACT séparés) | — |
| 14 i18n | continu | Chaque nouvel écran passe par le système de langues existant (aucune phrase codée en dur) | — |
| 15 Scale | plus tard | Index et pagination **mesurés** sur les vraies requêtes ; rien d'optimisé à l'aveugle | — |

### 11.3 Registre de dette technique (section 147), premier jet

| Niveau | Dette | Impact | Recommandation |
|---|---|---|---|
| CRITIQUE | La **production** n'a pas reçu les correctifs P0–P7 validés sur le test | Failles connues encore ouvertes en prod | Décision de Sébastien sur le plan de mise en production |
| HAUTE | C1 bibliothèque Supabase non figée | Code tiers exécuté sans contrôle | PR B |
| HAUTE | TALK = un fichier de 9 345 lignes | Chaque évolution touche tout | Extraire vers `core/` au fil des PR, sans réécriture |
| HAUTE | Appels : STUN seul, pas de relais TURN | Appels qui échouent derrière certains réseaux mobiles | Relais TURN (payant ou auto-hébergé) : décision de coût |
| MOYENNE | C2 pseudo réutilisable | Usurpation | PR B |
| MOYENNE | C5 pas d'export | RGPD | PR E |
| MOYENNE | MyMemory reçoit les textes | Confidentialité | Mention dans la politique + choix de l'utilisateur |
| FAIBLE | C7 durées de conservation manquantes | Données gardées sans fin | Nettoyage planifié (gratuit, `pg_cron`) |

### 11.4 Matrice de tests (section 123), forme retenue

Chaque ligne = un test SQL rejouable (bloc annulé à la fin, 0 ligne restante) :
`acteur (owner / membre / admin / modérateur / invité / bloqué / anonyme / session révoquée) × action × ressource × contexte → attendu`.
Règle : pour chaque fonction sensible, au moins 1 test autorisé (A→A) et 1 test interdit (A→B).
