# Tester la traduction dans les 112 langues

© 2026 Sébastien Chevrier. Tous droits réservés.

Ce dossier sert à **mesurer** la qualité de traduction de 24/24 ONE WORLD, langue par langue, au lieu de
la supposer. Il teste ce que l'appli fait vraiment : d'abord le dictionnaire de phrases vérifiées, puis le
moteur en ligne (MyMemory) pour tout le reste.

## Ce que contient le dossier

- `phrases.json` : 20 phrases types en français (accueil, hôtel, tourisme, santé, commerce, messagerie).
- `tester-moteur.mjs` : traduit chaque phrase dans chaque langue, puis retraduit en français pour un
  premier contrôle automatique.
- `resultats/` : la grille CSV et le résumé produits à chaque test.

## Lancer un test (depuis GitHub, sans ordinateur)

**Avec Google Translate (recommandé : les 112 langues en une seule fois)**

1. Une seule fois, créez une clé Google :
   - sur https://console.cloud.google.com, créez un projet (ex. « one-world-test ») et ajoutez un moyen de
     paiement (Google l'exige, mais les 500 000 premiers caractères par mois sont gratuits ; un test complet
     en utilise environ 180 000) ;
   - menu **API et services → Bibliothèque**, cherchez **Cloud Translation API**, cliquez **Activer** ;
   - menu **API et services → Identifiants → Créer des identifiants → Clé API** ; copiez la clé, puis
     **Restreindre la clé** à « Cloud Translation API » seulement.
2. Sur GitHub : **Settings → Secrets and variables → Actions → New repository secret**, nom
   `GOOGLE_TRANSLATE_KEY`, valeur : la clé. Ne collez jamais la clé ailleurs (ni dans le code, ni dans un message).
3. Onglet **Actions → Test des 112 langues → Run workflow**, moteur `google`, lot vide.
4. À la fin, le résumé s'affiche dans la page du test, et la grille se télécharge dans **Artifacts**.

**Avec MyMemory (le moteur actuel de l'appli, gratuit mais limité)**

Créez le secret `MYMEMORY_EMAIL` (une adresse e-mail valide : le quota passe de 5 000 à 50 000 caractères
par jour), puis lancez avec le moteur `mymemory` et un lot de 1 à 6 : comptez un lot de 20 langues par jour.
Ce test reste utile, car c'est MyMemory que l'appli utilise aujourd'hui.

En local : `node tests/langues/tester-moteur.mjs --moteur=google --langues=mg,sw` (ou `--lot=1`, ou `--simuler` sans réseau).

## Lire les résultats

Pour chaque phrase, le contrôle automatique donne :

- **dictionnaire vérifié** : la phrase vient du dictionnaire de l'appli (sources citées dans le code) ;
- **aller-retour proche** : le retour en français garde l'essentiel du sens ;
- **aller-retour partiel** : une partie du sens est perdue au retour ;
- **à vérifier** : le sens semble perdu ;
- **suspect : laissé en français** : le moteur n'a pas traduit ;
- **échec** : langue refusée par le moteur ou erreur.

Le contrôle automatique repère les problèmes évidents. **Il ne prouve pas qu'une traduction est juste** :
un aller-retour peut sembler correct alors que la traduction est maladroite. Une langue n'est validée que
quand un locuteur natif a rempli la grille.

## Faire relire par un locuteur natif

Ouvrez la grille CSV (Excel, Google Sheets, LibreOffice), filtrez sur la langue, puis demandez au relecteur
de remplir les trois dernières colonnes pour chaque phrase :

- `verdict_natif` : **OK**, **à corriger** ou **faux** ;
- `correction` : la bonne traduction si besoin ;
- `relecteur` : prénom et lien avec la langue (ex. « Hery, malgache langue maternelle »).

## Premier constat (21 novembre 2026, sans réseau)

Le dictionnaire vérifié couvre 111 langues, mais seulement des **phrases très courtes** (« combien ça
coûte », « où sont les toilettes »…). Sur les 20 phrases types, il en reconnaît 2 dans la plupart des
langues, soit 187 traductions sur 2 220. **Plus de 90 % des traductions dépendent donc du moteur en ligne**,
dont la qualité n'est pas encore mesurée : c'est ce que ce test sert à établir.
