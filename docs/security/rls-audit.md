# Audit de sécurité : base de données, fonctions, sessions (4 octobre 2026)

> © 2026 Sébastien Chevrier. Tous droits réservés.
> Périmètre : projet Supabase de **TEST** `24-24-talk-test` (`tbynnefrrxzxufcptijc`) et code du site de test.
> La base de **production** n'a été ni lue ni modifiée.

## 1. Méthode

1. Lecture des droits réels dans la base de test (tables, règles RLS, fonctions, droits d'exécution), en lecture seule.
2. Essais d'attaque **dans la vraie base de test**, avec les vrais rôles `anon` et `authenticated` et un jeton simulé
   (`request.jwt.claims`). Chaque bloc d'essai crée des comptes fictifs puis **annule tout** à la fin
   (vérifié : 0 ligne restante).
3. Tests automatiques du site (faux serveur) pour les écrans : saisies piégées, erreurs réseau, confirmations.

## 2. Résultats des essais d'attaque (vérifiés, sortie brute de la base)

### Série 1 : profil linguistique (14 cas sur 14 conformes) — détail dans `supabase/test/10-profil-linguistique-tests.md`

### Série 2 : comptes, sessions, suppression (18 cas sur 18 conformes)

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

Ce que cela prouve, en clair :
- **Sans connexion**, on ne peut ni supprimer un compte ni déconnecter un appareil.
- **Un compte ne peut pas agir sur un autre** : ni modifier son profil, ni écrire à sa place en falsifiant `user_id`,
  ni déconnecter ses appareils (le serveur répond « false » et ne touche à rien).
- **Champs interdits** : l'identifiant et la date de création d'un profil ne sont pas modifiables (seuls `pseudo` et
  `lang` le sont).
- **Session déconnectée** : son jeton ne permet plus de supprimer le compte (la règle « session active » s'applique).
- **Suppression du compte** : efface le compte, son profil TALK, son profil linguistique et ses sessions, et rien
  d'autre (le compte A reste intact).

## 3. État des tables (base de test, lu le 4 octobre 2026)

| Table | RLS | Règle « session active » | Lecture anonyme | Remarque |
|---|---|---|---|---|
| profiles | oui | oui | non | modifiable : `pseudo`, `lang` seulement |
| conversations | oui | oui | non | |
| members | oui | oui | non | |
| messages | oui | oui | non | + règles « compte non suspendu », « accès abonnement » |
| hidden_messages | oui | oui | non | |
| language_profiles | oui | oui | non | nouvelle en 0.7.0 ; privée par défaut |
| blocks | oui | oui (lot 1, 5 oct.) | non | R1 corrigé |
| reports | oui | oui (lot 1, 5 oct.) | non | R1 corrigé ; aucune lecture possible par le site |
| admins, stat_days, stat_devices, stat_presence | oui | — | non | aucune règle = fermées au site (accès serveur uniquement) |

## 4. Fonctions côté serveur

| Fonction | Qui peut l'appeler | Vérifie | `search_path` |
|---|---|---|---|
| supprimer_mon_compte | connecté | `auth.uid()` + session active | vide (sûr) |
| deconnecter_appareil | connecté | `auth.uid()` + session active + appareil de CE compte + pas l'appareil actuel | vide |
| mes_appareils | connecté | `auth.uid()` + session active | vide |
| langues_de_mes_contacts | connecté | contacts réels, non bloqués, profils « contacts » seulement | vide |
| admin_ban, admin_moderation, admin_stats, mon_acces, start_conversation | connecté | (TALK, existant) | vide depuis le lot 1 (R2 corrigé) |
| ping, track | tout le monde | statistiques anonymes (TALK, existant) | vide depuis le lot 1 (R2 corrigé) |

## 5. Côté site

- Clé publique uniquement ; aucune clé secrète (`sb_secret_`, `service_role`, `sk-…`) dans le code : vérifié par test.
- Tout texte venant de l'utilisateur ou du stockage est échappé avant affichage ; saisies piégées testées
  (`<img onerror>`, `<script>`, JSON abîmé) : rien ne s'exécute.
- Le jeton du lien e-mail est retiré de l'adresse dès son arrivée (il ne reste pas dans l'historique).
- Suppression de compte : confirmation explicite (recopier son pseudo) ; en cas de coupure réseau ou de session
  expirée, **rien n'est supprimé** et un message le dit.
- Déconnexion d'un appareil : si le serveur répond « rien changé », l'écran le dit (pas de faux succès).
- Ré-authentification : les comptes TALK n'ont pas de mot de passe (compte anonyme + e-mail facultatif). Il n'y a donc
  pas de « ressaisir son mot de passe » ; la protection est la session active exigée par le serveur + la confirmation.

## 6. Risques restants

| N° | Risque | Gravité | Proposition (PROPOSITION, non appliquée) |
|---|---|---|---|
| R1 | `blocks` et `reports` n'ont pas la règle « session active » : un appareil déconnecté garde, jusqu'à l'expiration de son jeton (environ 1 h), la possibilité de bloquer ou signaler | Faible | Ajouter la même règle restrictive (une migration de 2 lignes, à tester puis faire valider) |
| R2 | Anciennes fonctions TALK avec `search_path=public` au lieu de vide | Faible (aucun schéma modifiable par les utilisateurs) | Les passer à `search_path=''` avec noms complets |
| R3 | Pas de limite du nombre d'appels sur `supprimer_mon_compte` / `deconnecter_appareil` | Faible (chaque appel n'agit que sur son propre compte) | Rien à faire pour l'instant |
| R4 | Le service MyMemory reçoit le texte à traduire (phrases de voyage, conversations) | Moyenne (confidentialité) | À écrire clairement dans la politique de confidentialité avant toute production |
| R5 | Aucun test sur un vrai téléphone Android ou iPhone pour ces écrans | Moyenne | Essai manuel par Sébastien (voir NEXT-ACTIONS) |

## 7. Ce qui n'a PAS été vérifié

- La base de production (hors périmètre, interdit sans autorisation).
- Les réglages du tableau de bord Supabase (durée des jetons, limites d'e-mails) : non lus.
- Les dépendances : le site charge seulement `@supabase/supabase-js@2` depuis jsDelivr (version majeure, non figée) ;
  figer la version exacte avec une empreinte d'intégrité est une PROPOSITION.

## Mise à jour du 5 octobre 2026 : lot 1 « socle de confiance »

R1, R2 corrigés ; E1, E2, C1, C2 ajoutés et corrigés. Détail et résultats bruts (29 cas sur 29 conformes) :
`supabase/test/12-socle-confiance-tests.md`. Retour arrière : `supabase/test/12-socle-confiance-retour.sql`.
