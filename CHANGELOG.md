# Journal des changements — 24/24 ONE WORLD (environnement de test)

> © 2026 Sébastien Chevrier. Tous droits réservés. La production n'est concernée par aucune de ces versions.

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
- Tests : nouveau test « kit Supabase figé » ; le test « aucune clé secrète » cherche désormais une vraie clé
  (`sb_secret_` suivi d'au moins 20 caractères) au lieu du simple mot, qui apparaît dans la bibliothèque et l'audit.

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
