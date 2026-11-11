# Essais du lot 2 « moteur de permissions » (base de TEST, 5 octobre 2026)

> © 2026 Sébastien Chevrier. Tous droits réservés.

Migration appliquée sur la base de **test** : `13-moteur-permissions.sql` (retour arrière :
`13-moteur-permissions-retour.sql`). Ce qui existe maintenant :

- `private.can(action, cible, contexte)` : **une seule** décision d'autorisation côté serveur. Actions : `read_profile`,
  `message`, `call`, `start_conversation`, `block`, `report`. Contexte : seul `personal` existe ; tout autre contexte est
  refusé tant que le lot 3 ne l'a pas défini. Non appelable directement par le site.
- `public.ow_permissions(autre, contexte)` : ce que le téléphone peut demander (« que puis-je faire avec cette
  personne ? »), réponse oui / non par action. Compte inexistant = tout non (aucune énumération). Réservé aux
  comptes connectés.
- La sonnerie des appels (`can_signal`) passe désormais par le moteur, à l'identique.

Essais : `13-moteur-permissions-tests.sql`. Comptes fictifs : A ; B contact de A ; C inconnu ; D contact de A qui a
bloqué A ; E contact de A, suspendu. Tout est annulé à la fin (vérifié : 0 profil d'essai, 2 comptes).

Résultat brut renvoyé par la base :

```
01 A -> B (contact): OK tout permis
02 A -> C (inconnu): OK ni lecture, ni message, ni appel ; ouvrir une discussion, bloquer, signaler possibles
03 A -> D (D a bloque A): OK ni message, ni appel, ni nouvelle discussion ; signaler possible
04 A -> E (suspendu): OK pas de nouvelle discussion
05 A -> A (soi-meme): OK lit son profil, ne peut ni s ecrire, ni s appeler, ni se bloquer
06 A -> compte inexistant: OK tout non (aucune enumeration)
07 A -> B en contexte professionnel (non defini): OK tout non (confidentialite par defaut)
08 A appelle directement le moteur interne: OK refuse (42501)
09 D -> A (D a bloque A): OK comme avant : D peut ecrire et appeler A, pas de nouvelle discussion
10 A (appareil deconnecte) -> B: OK tout non
11 sans connexion, ow_permissions: OK refuse (42501)
12 equivalence sonnerie (ancienne regle = moteur), 20 couples: OK 0 ecart
13 equivalence ouverture de discussion (start_conversation reel = moteur), 20 couples: OK 0 ecart
14 equivalence lecture de profil (RLS reelle = moteur), 20 couples: OK 0 ecart
15 A sonne D (D a bloque A): OK refuse (42501)
16 A sonne B (contact): OK
```

16 cas sur 16 conformes. Lot 1 rejoué après le lot 2 (message, sonnerie active / déconnectée / non-contact,
écoute de sa boîte) : 5 sur 5 conformes.

Constat (inchangé volontairement, pour ne rien modifier dans TALK) : la personne **qui bloque** peut encore écrire et
appeler celle qu'elle a bloquée (cas 09), comme avant. La directive (section 248) demande que le blocage l'emporte
dans les deux sens : ce sera traité au lot 3, avec les relations.

Première ligne de l'essai 12 au premier passage : un écart venait de l'essai lui-même (l'ancienne règle était
recalculée avec les droits d'un utilisateur, qui ne voit pas les blocages des autres) ; corrigé dans l'essai, pas
dans le moteur.
