# Journal des changements — 24/24 ONE WORLD (environnement de test)

> © 2026 Sébastien Chevrier. Tous droits réservés. La production n'est concernée par aucune de ces versions.

## 0.8.4 (prototype, 15 octobre 2026) — « Gratuit pour tous » sur l'accueil, site de test seulement

### Modifié
- **Accueil** : le compte à rebours « Gratuit encore » jusqu'au 1er novembre est remplacé par « Gratuit pour tous », dans
  les 11 langues. L'appli reste gratuite tant que le paiement (Stripe) et une structure juridique n'existent pas (choix de
  Sébastien, 15 octobre 2026) ; le compte à rebours laissait croire que la gratuité s'arrêtait le 1er novembre.
- Pas encore changé : le bandeau de TALK, son pied de page et les CGV disent toujours « gratuit jusqu'au 1er novembre,
  puis 1,99 €/mois » (décision à part, avec relecture juridique pour les CGV).
- Cache hors connexion `ew-shell-v28`.

## 0.8.3 (prototype, 15 octobre 2026) — EVERYWHERE, Voyage, Apprendre et Profil dans les langues de TALK, site de test seulement

### Ajouté
- **Écrans EVERYWHERE, Voyage, Apprendre (LEARN), Profil linguistique et compte (CONNECT)** traduits dans les mêmes 11 langues que l'accueil
  (nouveau fichier `everywhere/langues-ecrans.js`), ainsi que la fenêtre de choix de la langue, les niveaux et noms de
  langues de LEARN et les situations de Voyage.
- **Noms des langues** dans les listes (EVERYWHERE, Voyage, Profil) affichés dans la langue de l'interface, d'après le
  navigateur ; le français garde la liste de TALK.
- **Profil linguistique** : la langue de l'interface se choisit parmi les 11 langues (au lieu de français ou anglais).

### Corrigé (incohérences relevées en passant chaque écran dans les 9 langues)
- **Voyage** : avant préparation, la colonne « ma langue » montrait le français à tout le monde ; elle montre maintenant la
  langue de l'interface si ses phrases sont intégrées, sinon l'anglais (le français pour le malgache).
- **Page Applications** : descriptions de TALK, EVERYWHERE, LEARN et AI LAB traduites (elles restaient en anglais).
- **Arabe** : flèche « Ouvrir » dans le bon sens ; logo 24/24 ONE WORLD lu de gauche à droite.
- **Lecteur d'écran** : logo et barre du bas annoncés dans la langue de l'interface (ils l'étaient en français).
- **Profil linguistique** : « Enregistrer » remettait la langue de l'interface sur « Automatique » quand elle avait été
  choisie dans TALK (ex. espagnol, coréen). Le menu montre maintenant le vrai réglage et le garde.

### Pas encore traduit
- Le contenu des leçons LEARN (cours pour francophones) et AI LAB restent en français ou en anglais. La commande vocale
  ne comprend que le français et l'anglais : elle reste en anglais pour les autres langues.
- Traductions faites sans relecteur natif ; le malgache est le moins sûr.
- Cache hors connexion `ew-shell-v27`.

## 0.8.2 (prototype, 14 octobre 2026) — accueil dans les langues de TALK, site de test seulement

### Ajouté
- **Accueil, barres du haut et du bas, Paramètres, profil et compte à rebours** traduits dans les 11 langues de TALK :
  français, anglais, espagnol, portugais, allemand, italien, chinois, japonais, arabe (de droite à gauche), russe et
  malgache. Les autres langues voient l'anglais. « One world. Every voice. » reste en anglais (signature de la marque).
- Les écrans EVERYWHERE, Voyage, Apprendre et Profil linguistique restent en français ou en anglais pour l'instant.
- Cache hors connexion `ew-shell-v26`.

## 0.8.1 (prototype, 14 octobre 2026) — TALK au même look, site de test seulement

### Modifié
- **TALK, écran d'entrée** : Messagerie puis Téléphone en deux lignes, icône carrée en dégradé, comme les tuiles de l'accueil.
- **TALK, thème** : suit le thème choisi dans Paramètres du portail (bleu nuit par défaut, clair au choix, « Auto » suit le
  téléphone) au lieu de suivre toujours le réglage clair ou sombre du téléphone.
- Cache hors connexion `ew-shell-v25`.

## 0.8.0 (prototype, 14 octobre 2026) — nouveau look, site de test seulement

### Modifié
- **Accueil** refait d'après la maquette validée par Sébastien : ciel bleu nuit et planète lumineuse dessinés en CSS
  (aucune image), titre « One world. Every voice. », quatre tuiles TALK, EVERYWHERE, VOYAGE et APPRENDRE.
- **Compte à rebours** « Gratuit encore » (jours, heures, minutes, secondes) jusqu'au 1er novembre 2026 à 0 h, heure de
  La Réunion (même date que la base et les CGV) ; il disparaît une fois la date passée. Le lecteur d'écran n'annonce
  que les jours et les heures.
- **Thème** : bleu nuit par défaut (au lieu du clair), onglet actif cyan ; le thème clair reste au choix dans Paramètres.
- TALK : mêmes couleurs bleu nuit dans le thème sombre.
- Cache hors connexion `ew-shell-v24`.

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
