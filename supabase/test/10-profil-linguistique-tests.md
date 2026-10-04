# Tests du profil linguistique sur la base de TEST (4 octobre 2026)

Méthode : un seul bloc SQL qui crée 3 comptes fictifs (A, B contact de A, C inconnu), joue chaque cas avec le vrai
rôle `authenticated` ou `anon` et le vrai jeton simulé (`request.jwt.claims`), puis **annule tout** (exception finale :
rien n'est gardé dans la base, vérifié ensuite : 0 ligne restante).

Résultat brut renvoyé par la base :

```
1 A cree son profil: OK
2 A cree pour B: refuse OK
3 code langue piege: refuse OK
4 niveau piege: refuse OK
5 nom avec < >: refuse OK
6 prefs > 2 Ko: refuse OK
7 B lit la table: 0 (attendu 0)
8 B contact, A prive: 0 (attendu 0)
9 B modifie A: 0 (attendu 0)
10 B contact, A visible contacts: 1 (attendu 1)
11 C non contact: 0 (attendu 0)
12 A avec session inconnue/revoquee: 0 (attendu 0)
13 anon lecture: refuse OK
14 anon fonction: refuse OK
```

14 cas sur 14 conformes. Suppression du compte : vérifiée par la contrainte (`language_profiles.user_id` →
`profiles.id` ON DELETE CASCADE, et `profiles.id` → `auth.users.id` ON DELETE CASCADE), pas par une vraie suppression.
