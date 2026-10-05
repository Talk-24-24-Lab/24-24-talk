# ONE WORLD — étude « intention → relation → contexte → permissions → capacités → routage → canal → secours »

> © 2026 Sébastien Chevrier. Tous droits réservés. 5 octobre 2026. **Étude + démonstrateur, rien n'est branché aux
> écrans, rien n'est changé dans la base.** Le prototype n'a pas été joint ; la directive reçue s'arrête au point 5.
> S'appuie sur la veille (`analyse/veille/ONE_WORLD_COMMUNICATION_EVOLUTION_ASSESSMENT.md`, §1, §16, §17, registres).

## 0. Les 10 questions (règle 42.17)

1. **Relation servie** : deux personnes qui se connaissent déjà (contact TALK), quel que soit le moyen de se joindre.
2. **Contexte** : aujourd'hui un seul, « personnel » (paramètre de `can()`).
3. **Permissions** : celles du serveur (`ow_permissions` → `private.can`) ; le routeur ne fait que les lire.
4. **Capacités** : celles du canal × celles du téléphone ; inconnue = non.
5. **Canal** : TALK seul existe. SMS et e-mail sont décrits mais fermés.
6. **Remplaçable** : oui, un canal = une ligne du registre.
7. **Canal disparu** : le routeur recalcule et le dit (« aucun canal ») ; il n'invente rien.
8. **Fournisseur disparu** : même chose ; mais sans table des relations, la relation disparaît avec TALK (écart G1 de la veille).
9. **Portabilité** : pas encore (pas d'export, I3).
10. **Maîtrise** : la personne choisit l'intention ; un secours n'ajoute jamais de droit ; un canal relais ne s'ouvre que si elle l'a partagé.

## 1. Ce qui existe déjà (vérifié dans le code)

| Étape du modèle | Aujourd'hui | Où |
|---|---|---|
| INTENTION | Oui, en petit : écrire, appeler, vidéo | `everywhere/core/communiquer.js` (lot 4) |
| RELATION | **Non** : la relation EST la conversation TALK | — (I1, lot 3 du fil Transformation) |
| CONTEXTE | Un seul : « personnel » | `private.can(action, cible, contexte)` |
| PERMISSIONS | Oui, décidées par le serveur | `private.can()`, `public.ow_permissions()` (lot 2) |
| CAPACITÉS | Oui pour TALK × téléphone | `OWCom.capabilities()` |
| ROUTAGE | Une seule route possible | `OWCom.resolve()` |
| CANAL | TALK en dur | `TALK_CHANNEL` |
| SECOURS | Aucun | — |
| DISPONIBILITÉ | **Non** (aucune présence, choix de vie privée) | — |
| TRADUIRE | Oui | `everywhere/core/traduction.js` (PR 19) |

Conclusion : le cœur va déjà dans le bon sens. Il manque la relation, la disponibilité et un second canal réel.

## 2. Démonstrateur ajouté (PR 19)

`everywhere/core/routeur.js` : `OWRouteur.route(demande)` → `CommunicationRoute`. Évolution de `OWCom.resolve`,
pas un deuxième système. **Non branché aux écrans.** 15 tests (`everywhere/tests/routeur.js`) prouvent :

- MESSAGE : TALK disponible → TALK ; TALK hors ligne → SMS seulement si la relation a partagé son numéro ; sinon e-mail s'il est partagé ; sinon « aucun canal ».
- **Un secours n'augmente jamais les droits** : capacités = droits de la relation ∩ capacités du canal ∩ capacités du téléphone, recalculées pour chaque canal. En secours SMS : texte seulement (ni vidéo, ni fichier, ni localisation, ni contacts, ni données privées).
- Un APPEL ne devient jamais un SMS ; une permission refusée par le serveur n'est contournée par aucun canal ; serveur muet = tout fermé.
- Chaque demande recalcule tout : aucun canal mémorisé.
- Confidentialité exigée (chiffrement de bout en bout) : TALK ne l'a pas pour les messages, donc refus dit honnêtement.

Capacités représentées : `text, media, file, voice, call, video, group, reaction, encryption, translation, location, contacts, private_data`.

## 3. Écran « personne » (proposition, pas encore construit)

Partir de la personne, jamais du fournisseur. Pour un contact TALK, avec les données qui existent VRAIMENT :

```
@maria                       ← identité : pseudo TALK (le nom réel n'existe pas)
Relation : contact TALK      ← « Personnel » exigera la table des relations (I1)
Langue : espagnol
Disponibilité : inconnue     ← pas de présence (vie privée) : on ne l'inventera pas
Je peux : Écrire · Appeler   ← permissions serveur × capacités
Pas encore : Vidéo           ← raison affichée
Canal : TALK · Secours : aucun (aucun autre moyen partagé)
```

## 4. Ce qui demande la base (analyse avant toute modification, accord de Sébastien)

1. **Table des relations (I1)** : type (personnel, travail…), état, canal préféré et moyens partagés de chaque côté. Propriété : fil « Transformation vers ONE WORLD » (lot 3). Je n'y touche pas.
2. **`can()` étendu** aux capacités `video`, `file`, `location`… une par une, indépendantes. Sans cela, le routeur les refuse toutes (c'est voulu).
3. **Disponibilité** : à décider (vie privée). Proposition : « inconnue » par défaut, jamais déduite en cachette.

## 5. Ordre proposé (test seulement, une étape à la fois)

1. Recevoir le prototype et la fin de la directive (après le point 5), comparer l'UX.
2. Brancher `OWRouteur` à la liste des contacts d'EVERYWHERE à la place de `OWCom.resolve` (même résultat visible tant qu'il n'y a qu'un canal).
3. Construire l'écran « personne » (§3) avec les vraies données.
4. Après I1 (lot 3) : canal préféré et moyens partagés par relation, puis premier relais SMS / e-mail (ouverts par le téléphone).

À ne pas faire maintenant (veille §1) : moteur d'intentions complet, RCS (inaccessible depuis le web), routeur d'IA.
