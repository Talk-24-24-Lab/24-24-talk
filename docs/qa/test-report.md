# Rapport de tests — ONE WORLD 0.7.0 (4 octobre 2026)

> © 2026 Sébastien Chevrier. Tous droits réservés. Environnement de TEST uniquement.

## 1. Résumé

| Série | Type | Résultat |
|---|---|---|
| `everywhere/tests/e2e.js` (anciens tests) | Automatique, navigateur Chromium simulé (téléphone 393 px, tablette, ordinateur) | **84 / 84** |
| `everywhere/tests/expert.js` (anciens tests, 21 écrans) | Automatique, Chromium + axe-core (WCAG 2.1 AA) | **32 / 32** |
| `everywhere/tests/profil-voyage.js` (nouveaux) | Automatique, Chromium + axe-core | **42 / 42** |
| Base de test : profil linguistique | Essais d'attaque SQL réels, annulés à la fin | **14 / 14** |
| Base de test : comptes, sessions, suppression | Essais d'attaque SQL réels, annulés à la fin | **18 / 18** |
| Vrai téléphone Android ou iPhone | Manuel | **Non fait** (voir §5) |

Total automatique : **158 tests navigateur + 32 essais base de données, tous réussis** à la dernière exécution.

## 2. Défauts trouvés par les anciens tests, puis corrigés

1. **Identifiant en double** (`h-profil`) sur 3 écrans : l'écran du profil linguistique réutilisait le titre de
   l'écran Profil. Corrigé (`h-lp`). Détecté par `expert.js` (4 tests en échec → 32/32 après correction).
2. **Page Applications** : le test attendait 3 interfaces ; il y en a 4 depuis l'ajout d'AI LAB « Bientôt ».
   Changement voulu : l'attente du test a été mise à jour.
3. (Nouveau test) Le premier essai « appareil déjà retiré » n'avait pas vraiment préparé la situation : le test a
   été corrigé, puis il a réussi. Le code du site n'était pas en cause.

## 3. Ce que couvrent les 42 nouveaux tests

- **AI LAB** : 4e carte « Bientôt », page d'information, aucun bouton qui ferait semblant.
- **Profil linguistique** : privé par défaut ; langues, niveaux, favorites, voix, lecture, accessibilité,
  communication ; résumé gardé après rechargement ; nom piégé refusé ; effacement en deux appuis ;
  sauvegarde sur le compte **seulement avec la case d'accord cochée** (refus sinon, rien envoyé) ; arrêt de la
  sauvegarde = copie du serveur supprimée ; sans compte TALK ; nouvel appareil ; serveur injoignable ; stockage abîmé
  ou piégé ; avatar à initiales ; dates ; « Annuler » n'enregistre rien.
- **EVERYWHERE / Voyage** : 7 onglets (Favorites + 6 situations) ; écouter ; « Montrer » en très grand (Échap ferme,
  le focus revient) ; hors connexion ; japonais préparé ; quota du service gratuit atteint ; arabe de droite à gauche ;
  **recherche** sans accents ni majuscules ; recherche piégée ; **phrases favorites** gardées après rechargement ;
  favorites abîmées dans le stockage ; **langue source et langue cible** au choix, « Inverser ».
- **CONNECT** : supprimer mon compte (explication, pseudo à recopier, mauvais pseudo refusé, Annuler) ; **coupure
  réseau** et **session révoquée** : rien n'est supprimé, message clair ; suppression confirmée : appareil
  déconnecté, sauvegarde du profil coupée ; appareil déjà retiré ailleurs : pas de faux succès.
- **Écrans** en 320 px clair, 393 px sombre, contraste renforcé + très grand texte, anglais 360 px : aucune erreur,
  aucun débordement ; **axe-core** : aucune violation grave ou critique.
- **TALK** : plus aucun texte trop pâle (12 écrans, clair et sombre).
- **Code** : aucune clé secrète, aucun appel à un service d'IA (6 fichiers dont `connect.js`).

## 4. Comment relancer

```
node everywhere/tests/e2e.js
AXE=chemin/vers/axe.min.js node everywhere/tests/expert.js
AXE=chemin/vers/axe.min.js node everywhere/tests/profil-voyage.js
```
Variable facultative `EW_OUT=dossier` pour les résultats JSON et les captures. Les tests utilisent un faux serveur
Supabase et un faux service de traduction : ils ne touchent aucune vraie base.

## 5. Ce qui n'a PAS été testé (à ne pas présenter comme vérifié)

- **Aucun vrai téléphone** : tout est en Chromium simulé. Ce n'est pas un test matériel Android ni iPhone.
- **Vraie voix et vrai micro** : simulés dans les tests (la voix réelle dépend du téléphone).
- **Vrai service MyMemory** : simulé (réponses imitées, quota imité).
- **Lecteurs d'écran réels** (TalkBack, VoiceOver) : non testés ; seul axe-core a vérifié les règles automatiques.
- **Écran CONNECT avec la vraie base de test** depuis le site : les fonctions serveur ont été testées en SQL, et
  l'écran avec le faux serveur ; l'enchaînement réel complet sur le site de test reste à faire à la main.
- **Les phrases de voyage** (es, it, de, pt) n'ont pas été relues par des personnes de langue maternelle.
