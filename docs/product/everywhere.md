# 24/24 EVERYWHERE (PROTOTYPE 0.7.0, test uniquement)

> © 2026 Sébastien Chevrier. Tous droits réservés.

**Définition (décision de Sébastien, 4 octobre 2026)** : EVERYWHERE = communication multilingue instantanée entre deux
personnes. L'apprentissage des langues relève de LEARN ; les deux ne s'échangent pas leurs fonctions.

## 1. Écrans

| Écran | Adresse | Ce qu'il fait |
|---|---|---|
| Accueil EVERYWHERE | `#/everywhere` | Grandes entrées : Face à face, Appeler sur TALK, Voyage ; accès aux Langues et aux Réglages |
| Face à face (mode A) | `#/everywhere/face` | Écran coupé en deux, même sens de lecture ; chacun parle ou écrit dans sa langue |
| Appeler sur TALK (mode B) | `#/everywhere/appel` | Contacts TALK ; montre les langues qu'un contact a choisi de partager |
| Langues | `#/everywhere/langues` | Choix des deux langues (favorites en tête) |
| Réglages | `#/everywhere/reglages` | Voix, volume, taille, mains libres, sortie du son |
| **Voyage** | `#/everywhere/voyage` | Parcours décrit ci-dessous |

## 2. Parcours Voyage

1. **Langues** : « Ma langue » (source) et « Langue du pays » (cible), choisies dans Voyage sans changer les réglages
   du face à face ; bouton « ⇄ Inverser » ; si on choisit la même langue des deux côtés, elles s'inversent.
2. **Préparation** : liste de contrôle (langue choisie, phrases hors connexion, voix du téléphone essayée, langue
   ajoutée aux favorites, lien vers LEARN pour l'anglais et l'espagnol).
3. **Recherche** dans les 29 phrases, sur toutes les situations, sans tenir compte des accents ni des majuscules,
   dans le français, l'anglais, ma langue et la langue du pays. Nombre de résultats annoncé ; aucun résultat = message.
4. **Situations** (onglets, flèches du clavier) : Favorites, Essentiel, Transport, Hébergement, Restaurant, Achats,
   Santé et urgence.
5. **Phrases favorites** : bouton ☆/★ à côté de chaque phrase ; onglet « Favorites » ; gardées sur l'appareil.
6. **Écouter** (voix du téléphone) et **Montrer** (phrase en très grand pour la personne en face ; Échap ou
   « Fermer » ; le focus revient au bouton).
7. **Parler avec quelqu'un sur place** : ouvre le face à face avec la langue du pays déjà réglée.

## 3. Hors connexion : ce qui marche vraiment

| Fonction | Sans Internet |
|---|---|
| Phrases intégrées (français, anglais, espagnol, italien, allemand, portugais) | ✅ Oui |
| Phrases d'une autre langue, **après** « Préparer hors connexion » avec Internet | ✅ Oui |
| Recherche, favorites, « Montrer », réglages | ✅ Oui |
| Voix (« Écouter ») | Dépend du téléphone (voix installée ou non) |
| Traduire une phrase nouvelle, micro, appels TALK | ❌ Non, besoin d'Internet |

**Aucune traduction libre hors ligne n'existe dans ce prototype.** L'écran le dit.

## 4. Contenu extensible

Les phrases sont des données (`everywhere/traduction/phrases.js`) : ajouter une phrase ou une situation = ajouter une
ligne, sans toucher au code des écrans. Les traductions es, it, de, pt ont été rédigées par Claude et **doivent être
relues par des personnes de langue maternelle** avant toute production. Le portugais est celui du Portugal.

## 5. Données

`ew_voyage_v1` (langues, situation, favorites, nettoyé à la lecture), `ew_voyage_tr_<langue>` (phrases préparées).
Rien n'est envoyé au serveur du compte. Le texte à traduire est envoyé au service gratuit MyMemory.
