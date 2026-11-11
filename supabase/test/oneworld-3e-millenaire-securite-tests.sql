-- Essais de sécurité « ONE WORLD 3e millénaire » (directive, section 19 : tests 1 à 9). Base de TEST seulement.
-- © 2026 Sébastien Chevrier. Aucune migration : ces essais portent sur les droits et fonctions déjà présents.
-- Méthode identique aux essais 10, 11 et 12 : un seul bloc crée deux comptes fictifs A et B (session, profil TALK,
-- profil linguistique), joue chaque cas avec le vrai rôle `authenticated` ou `anon` et un jeton simulé, puis
-- ANNULE TOUT par l'exception finale (rien ne reste en base). Résultat = texte de l'exception, une ligne par cas.
do $t$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid();
  sa uuid := gen_random_uuid(); sb uuid := gen_random_uuid();
  dead uuid := gen_random_uuid();           -- session inconnue = session expirée ou appareil déconnecté
  pa text := 'zo_a' || substr(md5(random()::text), 1, 8);
  pb text := 'zo_b' || substr(md5(random()::text), 1, 8);
  n int; ok boolean; st text; r text := E'\n';
begin
  insert into auth.users (id, instance_id, aud, role, is_anonymous, created_at, updated_at)
  values (a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', true, now(), now()),
         (b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', true, now(), now());
  insert into auth.sessions (id, user_id, created_at, updated_at) values (sa, a, now(), now()), (sb, b, now(), now());

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', sa)::text, true);
  set local role authenticated;
  insert into public.profiles (id, pseudo, lang) values (a, pa, 'fr');
  insert into public.language_profiles (user_id, display_name, native_lang, spoken, ui_lang, favorites, prefs, visibility)
  values (a, 'A', 'fr', '[]', 'fr', '{}', '{}', 'private');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated', 'session_id', sb)::text, true);
  set local role authenticated;
  insert into public.profiles (id, pseudo, lang) values (b, pb, 'en');
  insert into public.language_profiles (user_id, display_name, native_lang, spoken, ui_lang, favorites, prefs, visibility)
  values (b, 'B', 'en', '[]', 'en', '{}', '{}', 'private');
  reset role;

  -- A connecté
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', sa)::text, true);
  set local role authenticated;
  begin
    update public.profiles set id = gen_random_uuid() where id = a;
    get diagnostics n = row_count;
    r := r || '1 A change son id: ' || case when n = 0 then 'OK refuse (0 ligne)' else 'ECHEC (autorise)' end || E'\n';
  exception when others then get stacked diagnostics st = returned_sqlstate; r := r || '1 A change son id: OK refuse (' || st || ')' || E'\n'; end;
  begin
    update public.profiles set created_at = '2000-01-01' where id = a;
    get diagnostics n = row_count;
    r := r || '2 A change created_at: ' || case when n = 0 then 'OK refuse (0 ligne)' else 'ECHEC (autorise)' end || E'\n';
  exception when others then get stacked diagnostics st = returned_sqlstate; r := r || '2 A change created_at: OK refuse (' || st || ')' || E'\n'; end;
  begin
    update public.language_profiles set user_id = b where user_id = a;
    get diagnostics n = row_count;
    r := r || '3 A falsifie user_id: ' || case when n = 0 then 'OK refuse (0 ligne)' else 'ECHEC (autorise)' end || E'\n';
  exception when others then get stacked diagnostics st = returned_sqlstate; r := r || '3 A falsifie user_id: OK refuse (' || st || ')' || E'\n'; end;
  begin
    insert into public.language_profiles (user_id, display_name, native_lang, spoken, ui_lang, favorites, prefs, visibility)
    values (b, 'pirate', 'fr', '[]', 'fr', '{}', '{}', 'contacts')
    on conflict (user_id) do update set display_name = 'pirate';
    select count(*) into n from public.language_profiles where user_id = b and display_name = 'pirate';
    r := r || '4 A ecrit chez B: ' || case when n = 0 then 'OK refuse (0 ligne)' else 'ECHEC (ecrit)' end || E'\n';
  exception when others then get stacked diagnostics st = returned_sqlstate; r := r || '4 A ecrit chez B: OK refuse (' || st || ')' || E'\n'; end;
  update public.profiles set lang = 'ja' where id = b;
  get diagnostics n = row_count;
  r := r || '5 A modifie le profil de B: ' || case when n = 0 then 'OK refuse (0 ligne)' else 'ECHEC' end || E'\n';
  select count(*) into n from public.mes_appareils();
  ok := not exists (select 1 from public.mes_appareils() m where m.id = sb);
  select public.deconnecter_appareil(sb) into ok;
  r := r || '6 A lit/revoque les appareils de B: ' || case when n = 1 and not coalesce(ok, false) then 'OK refuse (1 appareil = le sien ; revocation false)' else 'ECHEC ' || n end || E'\n';
  reset role;

  -- 8 : session expirée / appareil déconnecté (jeton encore signé mais session absente)
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', dead)::text, true);
  set local role authenticated;
  begin
    perform public.supprimer_mon_compte();
    r := r || '8 session expiree, suppression du compte: ECHEC (autorise)' || E'\n';
  exception when others then r := r || '8 session expiree, suppression du compte: OK refuse (' || sqlerrm || ')' || E'\n'; end;
  reset role;

  -- 9 : utilisateur déconnecté (anon)
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  set local role anon;
  begin
    select count(*) into n from public.language_profiles;
    r := r || '9a anon lit les profils linguistiques: ' || case when n = 0 then 'OK (0 ligne)' else 'ECHEC ' || n end || E'\n';
  exception when insufficient_privilege then r := r || '9a anon lit les profils linguistiques: OK refuse (42501)' || E'\n'; end;
  begin
    select count(*) into n from public.mes_appareils();
    r := r || '9b anon liste des appareils: ' || case when n = 0 then 'OK (0 ligne)' else 'ECHEC ' || n end || E'\n';
  exception when others then get stacked diagnostics st = returned_sqlstate; r := r || '9b anon liste des appareils: OK refuse (' || st || ')' || E'\n'; end;
  begin
    perform public.supprimer_mon_compte();
    r := r || '9c anon supprime un compte: ECHEC (autorise)' || E'\n';
  exception when others then get stacked diagnostics st = returned_sqlstate; r := r || '9c anon supprime un compte: OK refuse (' || st || ')' || E'\n'; end;
  reset role;

  -- 7 : suppression de compte par le flux sécurisé (B, session active)
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated', 'session_id', sb)::text, true);
  set local role authenticated;
  perform public.supprimer_mon_compte();
  reset role;
  select (select count(*) from auth.users where id = b) + (select count(*) from public.profiles where id = b)
       + (select count(*) from public.language_profiles where user_id = b) + (select count(*) from auth.sessions where user_id = b) into n;
  r := r || '7 B supprime son compte (compte, profil, profil linguistique, sessions): ' || case when n = 0 then 'OK (0 reste)' else 'ECHEC ' || n || ' restes' end || E'\n';
  select count(*) into n from public.profiles where id = a;
  r := r || '7b compte A intact: ' || case when n = 1 then 'OK' else 'ECHEC' end || E'\n';

  raise exception 'RESULTATS (tout est annule) :%', r;
end
$t$;
