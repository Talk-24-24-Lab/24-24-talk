# Essais de sécurité ONE WORLD « 3e millénaire » (base de TEST, 5 octobre 2026)

> © 2026 Sébastien Chevrier. Tous droits réservés.

Aucune migration. Bloc `oneworld-3e-millenaire-securite-tests.sql` joué sur `24-24-talk-test` avec les vrais rôles
`authenticated` / `anon` et des jetons simulés, puis **tout annulé** par l'exception finale. Vérifié ensuite :
0 profil d'essai, 2 comptes (ceux d'avant).

```
1 A change son id: OK refuse (42501)
2 A change created_at: OK refuse (42501)
3 A falsifie user_id: OK refuse (42501)
4 A ecrit chez B: OK refuse (42501)
5 A modifie le profil de B: OK refuse (0 ligne)
6 A lit/revoque les appareils de B: OK refuse (1 appareil = le sien ; revocation false)
8 session expiree, suppression du compte: OK refuse (AUTH)
9a anon lit les profils linguistiques: OK refuse (42501)
9b anon liste des appareils: OK refuse (42501)
9c anon supprime un compte: OK refuse (42501)
7 B supprime son compte (compte, profil, profil linguistique, sessions): OK (0 reste)
7b compte A intact: OK
```

12 cas sur 12 conformes. Le même jour, `12-socle-confiance-tests.sql` (lot 1) a été rejoué : 29 cas sur 29 conformes.
