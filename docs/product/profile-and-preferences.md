# Profil et préférences (PROTOTYPE 0.7.0, test uniquement)

> © 2026 Sébastien Chevrier. Tous droits réservés.

## 1. Où le trouver

Profil → carte « Profil linguistique » → « Modifier mon profil linguistique » (`#/profil/linguistique`).
Le profil marche **sans compte**, sur l'appareil seulement.

## 2. Contenu

| Champ | Détail |
|---|---|
| Nom affiché | 40 caractères au plus, sans `<` ni `>` (refusé avec un message) |
| Avatar | Initiales du nom affiché. **Aucune photo** n'est envoyée ni stockée (pas de stockage de fichiers pour l'instant) |
| Langue maternelle | Une langue de la liste EVERYWHERE |
| Langues parlées | Jusqu'à 12, chacune avec un niveau **déclaré** A1 à C2 (aucun test de niveau n'est fait) |
| Langue de l'interface | Automatique, français ou anglais (la page se recharge si elle change) |
| Langues favorites | Jusqu'à 6 ; elles passent en tête des listes de langues d'EVERYWHERE et de Voyage |
| Voix | Vitesse 70 % à 130 % |
| Lecture | Lente, normale, rapide (nombre de phrases visibles dans le côte à côte) |
| Accessibilité | Taille du texte, thème, contraste renforcé, animations réduites (appliqués à tout ONE WORLD) |
| Communication | Parler ou écrire, mains libres, haut-parleur ou écouteurs |
| Confidentialité | Sauvegarde sur le compte (désactivée par défaut) ; qui voit mes langues (personne par défaut) |
| Dates | « Créé le … · modifié le … » affiché dans le résumé et l'écran de modification |

## 3. Confidentialité et accords

- **Privé par défaut** : rien ne quitte l'appareil.
- **Sauvegarde sur le compte** : il faut un compte TALK, activer l'interrupteur **et** cocher la case d'accord
  (texte : enregistrement sur le serveur du projet, Supabase, Union européenne ; retrait possible à tout moment).
  Sans la case, l'enregistrement est refusé avec un message. La date de l'accord est gardée et affichée.
- **Retrait** : désactiver la sauvegarde efface la copie du serveur au prochain « Enregistrer ».
- **Visibilité** « Mes contacts TALK » : possible seulement avec la sauvegarde ; montre le nom affiché, la langue
  maternelle et les langues parlées, rien d'autre ; uniquement aux personnes avec qui une discussion existe et qui ne
  sont pas bloquées.
- **Effacer mon profil linguistique** : deux appuis ; efface l'appareil et la copie du serveur.
- **Supprimer mon compte** (Profil → CONNECT) efface aussi la copie du serveur.

## 4. États de l'écran

Lecture, modification, validation (nom), **Annuler** (retour sans rien enregistrer), Enregistrer, erreur du serveur
(« Enregistré sur cet appareil. Le compte n'a pas pu être mis à jour »), hors connexion (enregistré sur l'appareil,
message), nouvel appareil (le profil sauvegardé sur le compte est repris).

## 5. Données techniques

- Appareil : `localStorage` `ow_profile_v1` (nettoyé à chaque lecture : valeurs inconnues ou piégées ignorées).
- Serveur : table `public.language_profiles` (voir `supabase/test/10-profil-linguistique.sql`), RLS : chacun ne lit et
  n'écrit que sa ligne, et seulement avec une session active.
