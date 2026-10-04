# Tests de sécurité CONNECT sur la base de TEST (4 octobre 2026)

Même méthode que `10-profil-linguistique-tests.md` : un seul bloc SQL crée deux comptes fictifs A et B (avec une
session chacun, un profil TALK et un profil linguistique), joue chaque cas avec le vrai rôle `authenticated` ou `anon`
et un jeton simulé, puis **annule tout** par une exception finale. Vérifié ensuite : 0 profil restant.

Aucune migration : ces tests portent sur les fonctions déjà présentes (`supprimer_mon_compte`, `deconnecter_appareil`,
`mes_appareils`) et sur les droits des tables.

Résultat brut renvoyé par la base :

```
1 A change id de son profil (champ interdit): refuse OK (42501)
2 A change created_at (champ interdit): refuse OK (42501)
3 A reattribue sa ligne a B (user_id falsifie): refuse OK (42501)
4 A ecrit chez B (upsert user_id falsifie): refuse OK (42501)
5 A modifie le pseudo de B: 0 ligne (attendu 0)
6 A liste ses appareils: 1 (attendu 1, pas ceux de B)
7 A revoque la session de B: false (attendu false)
8 session de B toujours la: 1 (attendu 1)
9 sans connexion, suppression de compte: refuse OK (42501)
10 sans connexion, revoquer un appareil: refuse OK (42501)
11 jeton d une session revoquee, suppression: refuse OK (AUTH)
12 compte A toujours la: 1 (attendu 1)
13 B supprime son compte, compte B: 0 (attendu 0)
14 profil TALK de B: 0 (attendu 0)
15 profil linguistique de B: 0 (attendu 0)
16 sessions de B: 0 (attendu 0)
17 compte A intact: 1 (attendu 1)
18 profil linguistique A intact: 1 (attendu 1)
```

18 cas sur 18 conformes.
