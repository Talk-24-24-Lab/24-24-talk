# 24/24 ONE WORLD — principes produit

> © 2026 Sébastien Chevrier. Tous droits réservés.

**Une seule idée : la langue ne doit plus être une frontière.**

## Le test fondamental

Une personne qui ne parle pas la même langue peut-elle comprendre l'application et commencer une vraie
conversation en moins d'une minute ? Si non : on simplifie. On n'ajoute pas une fonction.

## Les rôles

| Espace | Rôle | Ce qu'il ne fait pas |
|---|---|---|
| ONE WORLD / WORLD BRIDGE | La porte : comprendre tout de suite | Pas de compte exigé, pas de messagerie à lui |
| TALK | Le moteur : messages, appels, traduction | Jamais recopié ailleurs (un seul WebRTC) |
| CONNECT | La confiance : identité, appareils, sécurité, suppression du compte | Ne crée pas de profil ailleurs que TALK |
| EVERYWHERE | L'utilité : face à face, appel traduit, voyage | Pas d'apprentissage |
| LEARN | La progression : apprendre une langue | Pas de traduction de conversation |
| AI LAB | Le futur | « Bientôt » tant que rien n'est branché ; aucune IA simulée |

COMMUNIQUER → APPRENDRE → RECOMMUNIQUER : WORLD BRIDGE mène à LEARN, LEARN ramène à WORLD BRIDGE.

## Règles de conception

1. **Comprendre → agir → communiquer → faire confiance.** L'écran d'accueil sert d'abord à traduire.
2. **Honnêteté.** Une fonction absente est dite (micro, voix, partage, réseau, langue). Jamais de traduction
   inventée, jamais « partagé » si le partage a échoué, jamais « IA » sans IA.
3. **Accord avant envoi.** Un texte ne quitte l'appareil qu'après l'accord de la personne, retirable en un geste.
4. **Le moins de stockage possible.** La conversation reste sur la page ; seuls les réglages sont gardés.
5. **Réutiliser.** Un seul moteur de traduction (adaptateur), un seul TALK, un seul compte, une seule PWA.
6. **Mobile d'abord.** Cibles ≥ 44 px, lisible à 320 px, barre du bas, rien d'animé pour décorer.
7. **Réversible.** Chaque changement s'annule par un retour de commit ; aucune donnée serveur n'est touchée.
8. **Relation > canal, identité > fournisseur** (règle 42) : changer de fournisseur ne doit rien casser d'autre.
