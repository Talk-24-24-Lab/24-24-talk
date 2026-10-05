# Journal des changements — 24/24 ONE WORLD (environnement de test)

> © 2026 Sébastien Chevrier. Tous droits réservés. La production n'est concernée par aucune de ces versions.

## 0.8.0 (« 3e millénaire », 5 octobre 2026) — base de TEST, brouillon, non publié

- WORLD BRIDGE : la porte d'entrée de ONE WORLD (`everywhere/oneworld/`). Deux langues, écrire ou dicter, traduire,
  écouter, copier, partager, « l'autre répond », puis face à face, TALK, invitation ou LEARN.
- Adaptateur unique de traduction `everywhere/core/traduction.js` : phrases vérifiées sur l'appareil, puis le moteur
  en ligne EXISTANT (MyMemory) seulement après l'accord de la personne, retirable.
- Invitation sans compte : `everywhere/oneworld/?de=…&vers=…` ; pseudo TALK ajouté seulement si coché.
- Barre du bas : One World · Everywhere · Learn · Talk · Connect. Alias `#/bridge` et `#/connect`.
- LEARN : « Parler pour de vrai ». AI LAB : capacités préparées, toujours « Bientôt ».
- PWA : cache `ew-shell-v15`, raccourci WORLD BRIDGE. TALK (`index.html`), base, RLS et migrations : inchangés.
- Tests : e2e 95, expert 33, profil-voyage 42, unitaires 11 + 17, ONE WORLD 59 ; SQL 12/12 et 29/29 (annulés).
  Voir `docs/ONE_WORLD_3RD_MILLENNIUM.md`.

## 0.7.1 (lot 1 « socle de confiance », 5 octobre 2026) — base de TEST, brouillon, non publié

### Sécurité
- **C1** Bibliothèque Supabase figée : copie locale `vendor/supabase-js-2.117.2.js` (empreinte dans `vendor/README.md`)
  au lieu de « la dernière 2.x » chargée depuis jsDelivr par TALK, ONE WORLD et `gestion/`.
- **E1** La date de création d'un profil est imposée par le serveur (le téléphone ne peut plus l'antidater).
- **E2** Temps réel (sonnerie des appels) : un appareil déconnecté ne peut plus écouter ni faire sonner.
- **R1** `blocks` et `reports` : règle « session active ».
- **R2** 19 anciennes fonctions TALK passées en `search_path` vide.
- **C2** Pseudo : un changement au plus tous les 30 jours ; un pseudo libéré (changé ou compte supprimé) reste réservé
  30 jours à son ancien titulaire. TALK affiche alors « pseudo déjà pris » (code 23505).
- Migration `supabase/test/12-socle-confiance.sql` + retour arrière + 29 essais d'attaque rejouables.
- **Moteur de permissions** (lot 2) : `private.can(action, cible, contexte)` et `public.ow_permissions()` ; la sonnerie
  des appels passe par le moteur, à l'identique (équivalence vérifiée sur 20 couples de comptes). Migration
  `supabase/test/13-moteur-permissions.sql` + retour arrière + 16 essais.
- Tests : nouveau test « kit Supabase figé » ; le test « aucune clé secrète » cherche désormais une vraie clé
  (`sb_secret_` suivi d'au moins 20 caractères) au lieu du simple mot, qui apparaît dans la bibliothèque et l'audit.

### Ajouté (lot 4 « Communiquer »)
- `everywhere/core/communiquer.js` : point d'entrée unique `OWCom.resolve(personne, contexte, permissions, capacités)`.
  Les permissions viennent du serveur (`ow_permissions`), les capacités du canal TALK réel et du téléphone
  (pas de micro ou de WebRTC = pas d'appel ; vidéo, fichiers, réactions : « pas encore »).
- EVERYWHERE, liste des contacts : bouton **Écrire** (ouvre la discussion TALK, lien `?ew_ecrire=`) à côté
  d'**Appeler**, avec la raison affichée quand un moyen n'est pas possible. Base sans moteur : ancien comportement.
- Accessibilité : les deux journaux du mode côte à côte sont atteignables au clavier et nommés (axe : 0 défaut).
- Tests : `everywhere/tests/communiquer.js` (11 tests unitaires) ; 4 nouvelles étapes dans `e2e.js` (88 au total).

## 0.7.0 (prototype, 4 octobre 2026) — PR n° 17, brouillon, non fusionnée, non publiée

### Ajouté
- **Profil linguistique** (`#/profil/linguistique`) : nom affiché, avatar à initiales (aucune photo), langue
  maternelle, langues parlées avec niveau déclaré, langue de l'interface, langues favorites, voix et vitesse de lecture,
  accessibilité, préférences de communication, confidentialité, dates de création et de modification, bouton Annuler.
  Privé par défaut ; sauvegarde sur le compte seulement avec interrupteur **et** case d'accord.
- Table `language_profiles` et fonction `langues_de_mes_contacts()` sur la base de **test** (+ script de retour arrière).
- **Voyage** dans EVERYWHERE : 29 phrases en 6 langues et 6 situations, préparation hors connexion honnête,
  écouter, montrer en grand, parler sur place, **recherche**, **phrases favorites**, **langue source et langue cible**.
- **CONNECT : supprimer mon compte** (pseudo à recopier, erreurs réseau et session expirée gérées : rien n'est supprimé).
- **AI LAB** : 4e tuile « Bientôt » et page d'information sans fonction simulée.
- Tests : `everywhere/tests/profil-voyage.js` (42 tests) ; essais SQL de sécurité (14 + 18 cas).
- Documentation `docs/`, `.env.example` sans valeur secrète.

### Modifié
- TALK : liens et textes pâles foncés (0 défaut de contraste sur 12 écrans).
- Coquille : couleurs du thème clair, dégradé EVERYWHERE assombri, grille 2 puis 4 colonnes.
- Déconnecter un appareil : si le serveur répond « rien changé », l'écran le dit.
- Cache hors connexion `ew-shell-v13`.

### Corrigé
- Identifiant de titre en double sur l'écran du profil linguistique (`h-profil` → `h-lp`).

## Versions précédentes
Voir l'historique Git du dépôt de test (PR n° 10 à n° 16 : coquille commune, CONNECT, accessibilité, EVERYWHERE, LEARN).
