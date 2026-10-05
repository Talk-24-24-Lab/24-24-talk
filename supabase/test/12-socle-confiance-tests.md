# Essais d'attaque du lot 1 « socle de confiance » (base de TEST, 5 octobre 2026)

> © 2026 Sébastien Chevrier. Tous droits réservés.

Migration appliquée sur la base de **test** `24-24-talk-test` : `12-socle-confiance.sql` (retour arrière :
`12-socle-confiance-retour.sql`). Essais : `12-socle-confiance-tests.sql`, un seul bloc qui crée trois comptes fictifs
A, B, C avec une session chacun, joue chaque cas avec le vrai rôle `authenticated` ou `anon` et un jeton simulé
(dont un jeton d'appareil déconnecté), puis **annule tout**. Vérifié ensuite : 0 profil d'essai, 0 ligne
d'historique, 2 comptes (ceux d'avant), 0 signal d'essai.

Résultat brut renvoyé par la base :

```
01 E1 A antidate son profil a la creation: OK (date serveur)
02 R2 A ouvre une discussion avec B (start_conversation): OK
03 R2 A envoie un message (before_message, on_new_message): OK
04 R2 A (non admin) lit les stats admin: OK refuse (NOT_ADMIN)
05 R2 mon_acces repond: OK
06 C2 A change son pseudo (1re fois): OK
07 C2 A change encore son pseudo dans les 30 jours: OK refuse (RATE_LIMIT)
08 C2 C prend l ancien pseudo de A (usurpation): OK refuse (23505 = pseudo deja pris)
09 C change created_at de son profil: OK refuse (42501)
10 C modifie le profil de A: OK (0 ligne)
11 R1 A (session active) bloque C: OK
12 A bloque au nom de B (blocker falsifie): OK refuse (42501)
13 R1 A (appareil deconnecte) bloque B: OK refuse (42501)
14 R1 A (appareil deconnecte) signale B: OK refuse (42501)
15 R1 A (appareil deconnecte) lit ses blocages: OK (0)
16 B lit les blocages de A: OK (0)
17 B (session active) signale A: OK
18 B relit les signalements (moderation privee): OK refuse (42501)
19 sans connexion, bloquer: OK refuse (42501)
20 E2 A (actif) sonne B (contact): OK
21 E2 A (appareil deconnecte) sonne B: OK refuse (42501)
22 E2 C (pas contact de B) sonne B: OK refuse (42501)
23 E2 B (actif) ecoute sa boite: OK (1)
24 E2 B (appareil deconnecte) ecoute sa boite: OK (0)
25 E2 A ecoute la boite de B: OK (0)
26 B supprime son compte: OK
27 C2 C reprend le pseudo du compte supprime B: OK refuse (23505)
28 profils A et C intacts: OK (2)
29 R2 sans connexion, ping statistiques: OK
```

29 cas sur 29 conformes. L'analyseur de sécurité Supabase ne signale plus aucune fonction à `search_path` modifiable.

Correction de l'audit : `messages.id` n'était **pas** un écart (colonne « generated always », le téléphone ne peut pas
choisir l'identifiant). Seul `profiles.created_at` l'était (E1).

Limite connue : le temps réel est vérifié ici par ses règles en base (celles que Supabase Realtime applique) ;
l'essai de bout en bout sur un vrai téléphone (un appel entre deux comptes de test) reste à faire.
