-- Essais d'attaque rejouables du lot 1 « socle de confiance » (base de TEST). © 2026 Sébastien Chevrier.
-- Un seul bloc : crée des comptes fictifs A, B, C (+ sessions), joue chaque cas avec le vrai rôle
-- `authenticated` ou `anon` et un jeton simulé, puis ANNULE TOUT par l'exception finale (rien ne reste en base).
-- Le résultat est le texte de l'exception finale : une ligne par cas, « OK » ou « ECHEC ».
do $t$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid();
  sa uuid := gen_random_uuid(); sb uuid := gen_random_uuid(); sc uuid := gen_random_uuid();
  dead uuid := gen_random_uuid();          -- session qui n'existe pas (= appareil déconnecté)
  pa text := 'zt_a' || substr(md5(random()::text), 1, 8);
  pb text := 'zt_b' || substr(md5(random()::text), 1, 8);
  pc text := 'zt_c' || substr(md5(random()::text), 1, 8);
  conv uuid; n int; d timestamptz; st text; r text := E'\n';
begin
  -- ===== préparation (rôle postgres) =====
  insert into auth.users (id, instance_id, aud, role, is_anonymous, created_at, updated_at)
  values (a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', true, now(), now()),
         (b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', true, now(), now()),
         (c, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', true, now(), now());
  insert into auth.sessions (id, user_id, created_at, updated_at)
  values (sa, a, now(), now()), (sb, b, now(), now()), (sc, c, now(), now());

  -- ===== E1 : la date de création du profil est imposée par le serveur =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', sa)::text, true);
  set local role authenticated;
  insert into public.profiles (id, pseudo, lang, created_at) values (a, pa, 'fr', '2000-01-01');
  reset role;
  select created_at into d from public.profiles where id = a;
  r := r || '01 E1 A antidate son profil a la creation: ' || case when d > now() - interval '1 minute' then 'OK (date serveur)' else 'ECHEC ' || d end || E'\n';

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated', 'session_id', sb)::text, true);
  set local role authenticated;
  insert into public.profiles (id, pseudo, lang) values (b, pb, 'en');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated', 'session_id', sc)::text, true);
  set local role authenticated;
  insert into public.profiles (id, pseudo, lang) values (c, pc, 'es');
  reset role;

  -- ===== R2 : les fonctions TALK marchent toujours avec search_path vide =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', sa)::text, true);
  set local role authenticated;
  conv := public.start_conversation(pb);
  r := r || '02 R2 A ouvre une discussion avec B (start_conversation): ' || case when conv is not null then 'OK' else 'ECHEC' end || E'\n';
  insert into public.messages (conversation_id, sender_id, body, lang, kind) values (conv, a, 'bonjour', 'fr', 'text');
  select count(*) into n from public.messages where conversation_id = conv;
  r := r || '03 R2 A envoie un message (before_message, on_new_message): ' || case when n = 1 then 'OK' else 'ECHEC ' || n end || E'\n';
  begin
    perform public.admin_stats();
    r := r || '04 R2 A (non admin) lit les stats admin: ECHEC (autorise)' || E'\n';
  exception when others then
    r := r || '04 R2 A (non admin) lit les stats admin: ' || case when sqlerrm like '%NOT_ADMIN%' then 'OK refuse (NOT_ADMIN)' else 'ECHEC ' || sqlerrm end || E'\n';
  end;
  begin
    perform public.mon_acces();
    r := r || '05 R2 mon_acces repond: OK' || E'\n';
  exception when others then r := r || '05 R2 mon_acces repond: ECHEC ' || sqlerrm || E'\n'; end;
  reset role;

  -- ===== C2 : pseudo (changement limité, pseudo libéré réservé) =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', sa)::text, true);
  set local role authenticated;
  update public.profiles set pseudo = pa || 'x' where id = a;
  get diagnostics n = row_count;
  r := r || '06 C2 A change son pseudo (1re fois): ' || case when n = 1 then 'OK' else 'ECHEC' end || E'\n';
  begin
    update public.profiles set pseudo = pa || 'y' where id = a;
    r := r || '07 C2 A change encore son pseudo dans les 30 jours: ECHEC (autorise)' || E'\n';
  exception when others then
    r := r || '07 C2 A change encore son pseudo dans les 30 jours: ' || case when sqlerrm = 'RATE_LIMIT' then 'OK refuse (RATE_LIMIT)' else 'ECHEC ' || sqlerrm end || E'\n';
  end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated', 'session_id', sc)::text, true);
  set local role authenticated;
  begin
    update public.profiles set pseudo = pa where id = c;
    r := r || '08 C2 C prend l ancien pseudo de A (usurpation): ECHEC (autorise)' || E'\n';
  exception when others then
    get stacked diagnostics st = returned_sqlstate;
    r := r || '08 C2 C prend l ancien pseudo de A (usurpation): ' || case when st = '23505' then 'OK refuse (23505 = pseudo deja pris)' else 'ECHEC ' || st end || E'\n';
  end;
  begin
    update public.profiles set created_at = '2000-01-01' where id = c;
    r := r || '09 C change created_at de son profil: ECHEC (autorise)' || E'\n';
  exception when insufficient_privilege then r := r || '09 C change created_at de son profil: OK refuse (42501)' || E'\n'; end;
  update public.profiles set pseudo = pc where id = a;
  get diagnostics n = row_count;
  r := r || '10 C modifie le profil de A: ' || case when n = 0 then 'OK (0 ligne)' else 'ECHEC' end || E'\n';
  reset role;

  -- ===== R1 : session déconnectée sur blocks et reports =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', sa)::text, true);
  set local role authenticated;
  insert into public.blocks (blocker, blocked) values (a, c);
  get diagnostics n = row_count;
  r := r || '11 R1 A (session active) bloque C: ' || case when n = 1 then 'OK' else 'ECHEC' end || E'\n';
  begin
    insert into public.blocks (blocker, blocked) values (b, c);
    r := r || '12 A bloque au nom de B (blocker falsifie): ECHEC (autorise)' || E'\n';
  exception when insufficient_privilege then r := r || '12 A bloque au nom de B (blocker falsifie): OK refuse (42501)' || E'\n'; end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', dead)::text, true);
  set local role authenticated;
  begin
    insert into public.blocks (blocker, blocked) values (a, b);
    r := r || '13 R1 A (appareil deconnecte) bloque B: ECHEC (autorise)' || E'\n';
  exception when insufficient_privilege then r := r || '13 R1 A (appareil deconnecte) bloque B: OK refuse (42501)' || E'\n'; end;
  begin
    insert into public.reports (reporter, reported, reason) values (a, b, 'test');
    r := r || '14 R1 A (appareil deconnecte) signale B: ECHEC (autorise)' || E'\n';
  exception when insufficient_privilege then r := r || '14 R1 A (appareil deconnecte) signale B: OK refuse (42501)' || E'\n'; end;
  select count(*) into n from public.blocks;
  r := r || '15 R1 A (appareil deconnecte) lit ses blocages: ' || case when n = 0 then 'OK (0)' else 'ECHEC ' || n end || E'\n';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated', 'session_id', sb)::text, true);
  set local role authenticated;
  select count(*) into n from public.blocks;
  r := r || '16 B lit les blocages de A: ' || case when n = 0 then 'OK (0)' else 'ECHEC ' || n end || E'\n';
  insert into public.reports (reporter, reported, reason) values (b, a, 'test');
  get diagnostics n = row_count;
  r := r || '17 B (session active) signale A: ' || case when n = 1 then 'OK' else 'ECHEC' end || E'\n';
  begin
    select count(*) into n from public.reports;
    r := r || '18 B relit les signalements (moderation privee): ECHEC (lisible, ' || n || ')' || E'\n';
  exception when insufficient_privilege then r := r || '18 B relit les signalements (moderation privee): OK refuse (42501)' || E'\n'; end;
  reset role;

  set local role anon;
  begin
    insert into public.blocks (blocker, blocked) values (a, b);
    r := r || '19 sans connexion, bloquer: ECHEC (autorise)' || E'\n';
  exception when insufficient_privilege then r := r || '19 sans connexion, bloquer: OK refuse (42501)' || E'\n'; end;
  reset role;

  -- ===== E2 : temps réel, boîte privée user:<id> =====
  -- A envoie un signal d'appel à B (contacts) : autorisé si session active, refusé si appareil déconnecté
  perform set_config('realtime.topic', 'user:' || b, true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', sa)::text, true);
  set local role authenticated;
  begin
    insert into realtime.messages (topic, extension, event, payload, private) values ('user:' || b, 'broadcast', 'sig', '{}'::jsonb, true);
    r := r || '20 E2 A (actif) sonne B (contact): OK' || E'\n';
  exception when others then r := r || '20 E2 A (actif) sonne B (contact): ECHEC ' || sqlerrm || E'\n'; end;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', dead)::text, true);
  set local role authenticated;
  begin
    insert into realtime.messages (topic, extension, event, payload, private) values ('user:' || b, 'broadcast', 'sig', '{}'::jsonb, true);
    r := r || '21 E2 A (appareil deconnecte) sonne B: ECHEC (autorise)' || E'\n';
  exception when insufficient_privilege then r := r || '21 E2 A (appareil deconnecte) sonne B: OK refuse (42501)' || E'\n'; end;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated', 'session_id', sc)::text, true);
  set local role authenticated;
  begin
    insert into realtime.messages (topic, extension, event, payload, private) values ('user:' || b, 'broadcast', 'sig', '{}'::jsonb, true);
    r := r || '22 E2 C (pas contact de B) sonne B: ECHEC (autorise)' || E'\n';
  exception when insufficient_privilege then r := r || '22 E2 C (pas contact de B) sonne B: OK refuse (42501)' || E'\n'; end;
  reset role;

  -- écoute de la boîte : B (actif) voit le signal, B (appareil déconnecté) et A ne voient rien
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated', 'session_id', sb)::text, true);
  set local role authenticated;
  select count(*) into n from realtime.messages where topic = 'user:' || b;
  r := r || '23 E2 B (actif) ecoute sa boite: ' || case when n >= 1 then 'OK (' || n || ')' else 'ECHEC 0' end || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated', 'session_id', dead)::text, true);
  set local role authenticated;
  select count(*) into n from realtime.messages where topic = 'user:' || b;
  r := r || '24 E2 B (appareil deconnecte) ecoute sa boite: ' || case when n = 0 then 'OK (0)' else 'ECHEC ' || n end || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', sa)::text, true);
  set local role authenticated;
  select count(*) into n from realtime.messages where topic = 'user:' || b;
  r := r || '25 E2 A ecoute la boite de B: ' || case when n = 0 then 'OK (0)' else 'ECHEC ' || n end || E'\n';
  reset role;
  perform set_config('realtime.topic', '', true);

  -- ===== C2 : un compte supprimé libère son pseudo, réservé 30 jours =====
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated', 'session_id', sb)::text, true);
  set local role authenticated;
  perform public.supprimer_mon_compte();
  reset role;
  select count(*) into n from auth.users where id = b;
  r := r || '26 B supprime son compte: ' || case when n = 0 then 'OK' else 'ECHEC' end || E'\n';
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated', 'session_id', sc)::text, true);
  set local role authenticated;
  begin
    update public.profiles set pseudo = pb where id = c;
    r := r || '27 C2 C reprend le pseudo du compte supprime B: ECHEC (autorise)' || E'\n';
  exception when others then
    get stacked diagnostics st = returned_sqlstate;
    r := r || '27 C2 C reprend le pseudo du compte supprime B: ' || case when st = '23505' then 'OK refuse (23505)' else 'ECHEC ' || st end || E'\n';
  end;
  reset role;
  select count(*) into n from public.profiles where id in (a, c);
  r := r || '28 profils A et C intacts: ' || case when n = 2 then 'OK (2)' else 'ECHEC ' || n end || E'\n';

  -- ===== anonyme : les statistiques restent possibles (R2 sur ping) =====
  set local role anon;
  begin
    perform public.ping(gen_random_uuid(), false);
    r := r || '29 R2 sans connexion, ping statistiques: OK' || E'\n';
  exception when others then r := r || '29 R2 sans connexion, ping statistiques: ECHEC ' || sqlerrm || E'\n'; end;
  reset role;

  raise exception 'RESULTATS (tout est annule)%', r;
end
$t$;
