-- Essais du lot 2 « moteur de permissions » (base de TEST). © 2026 Sébastien Chevrier.
-- Comptes fictifs : A ; B contact de A ; C inconnu ; D contact de A qui a bloqué A ; E contact de A, suspendu.
-- Matrice acteur × action × cible × contexte, plus essais d'ÉQUIVALENCE : pour chaque couple de comptes, la réponse du
-- moteur doit être exactement celle des anciennes règles (sonnerie, ouverture de discussion, lecture de profil).
-- Tout est annulé par l'exception finale.
do $t$
declare
  ids uuid[] := array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
  sids uuid[] := array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
  ps text[]; nm text[] := array['A','B','C','D','E'];
  a uuid; b uuid; c uuid; d uuid; e uuid;
  i int; j int; n int; j1 jsonb; old_ok boolean; new_ok boolean; st text;
  mism_call int := 0; mism_start int := 0; mism_read int := 0; pairs int := 0;
  r text := E'\n';
begin
  a := ids[1]; b := ids[2]; c := ids[3]; d := ids[4]; e := ids[5];
  ps := array['zt2a' || substr(md5(random()::text),1,8), 'zt2b' || substr(md5(random()::text),1,8),
              'zt2c' || substr(md5(random()::text),1,8), 'zt2d' || substr(md5(random()::text),1,8),
              'zt2e' || substr(md5(random()::text),1,8)];
  for i in 1..5 loop
    insert into auth.users (id, instance_id, aud, role, is_anonymous, created_at, updated_at)
      values (ids[i], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', true, now(), now());
    insert into auth.sessions (id, user_id, created_at, updated_at) values (sids[i], ids[i], now(), now());
    insert into public.profiles (id, pseudo, lang) values (ids[i], ps[i], 'fr');
  end loop;

  -- A ouvre une discussion avec B, D et E (avant blocage et suspension)
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', sids[1])::text, true);
  set local role authenticated;
  perform public.start_conversation(ps[2]);
  perform public.start_conversation(ps[4]);
  perform public.start_conversation(ps[5]);
  reset role;
  insert into public.blocks (blocker, blocked) values (d, a);          -- D bloque A
  insert into private.suspensions (user_id, suspended_by) values (e, a); -- E suspendu

  -- ===== matrice (A agit, session active) =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', sids[1])::text, true);
  set local role authenticated;
  j1 := public.ow_permissions(b);
  r := r || '01 A -> B (contact): ' || case when j1 = '{"context":"personal","read_profile":true,"message":true,"call":true,"start_conversation":true,"block":true,"report":true}'::jsonb then 'OK tout permis' else 'ECHEC ' || j1::text end || E'\n';
  j1 := public.ow_permissions(c);
  r := r || '02 A -> C (inconnu): ' || case when j1 = '{"context":"personal","read_profile":false,"message":false,"call":false,"start_conversation":true,"block":true,"report":true}'::jsonb then 'OK ni lecture, ni message, ni appel ; ouvrir une discussion, bloquer, signaler possibles' else 'ECHEC ' || j1::text end || E'\n';
  j1 := public.ow_permissions(d);
  r := r || '03 A -> D (D a bloque A): ' || case when (j1->>'message')::boolean = false and (j1->>'call')::boolean = false and (j1->>'start_conversation')::boolean = false and (j1->>'report')::boolean then 'OK ni message, ni appel, ni nouvelle discussion ; signaler possible' else 'ECHEC ' || j1::text end || E'\n';
  j1 := public.ow_permissions(e);
  r := r || '04 A -> E (suspendu): ' || case when (j1->>'start_conversation')::boolean = false then 'OK pas de nouvelle discussion' else 'ECHEC ' || j1::text end || E'\n';
  j1 := public.ow_permissions(a);
  r := r || '05 A -> A (soi-meme): ' || case when (j1->>'read_profile')::boolean and not (j1->>'message')::boolean and not (j1->>'call')::boolean and not (j1->>'block')::boolean then 'OK lit son profil, ne peut ni s ecrire, ni s appeler, ni se bloquer' else 'ECHEC ' || j1::text end || E'\n';
  j1 := public.ow_permissions(gen_random_uuid());
  r := r || '06 A -> compte inexistant: ' || case when not (j1->>'read_profile')::boolean and not (j1->>'message')::boolean and not (j1->>'start_conversation')::boolean and not (j1->>'block')::boolean and not (j1->>'report')::boolean then 'OK tout non (aucune enumeration)' else 'ECHEC ' || j1::text end || E'\n';
  j1 := public.ow_permissions(b, 'professional');
  r := r || '07 A -> B en contexte professionnel (non defini): ' || case when not (j1->>'read_profile')::boolean and not (j1->>'message')::boolean and not (j1->>'call')::boolean then 'OK tout non (confidentialite par defaut)' else 'ECHEC ' || j1::text end || E'\n';
  begin
    perform private.can('tout_effacer', b, 'personal');
    r := r || '08 A appelle directement le moteur interne: ECHEC (autorise)' || E'\n';
  exception when insufficient_privilege then r := r || '08 A appelle directement le moteur interne: OK refuse (42501)' || E'\n'; end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated', 'session_id', sids[4])::text, true);
  set local role authenticated;
  j1 := public.ow_permissions(a);
  r := r || '09 D -> A (D a bloque A): ' || case when (j1->>'call')::boolean and (j1->>'message')::boolean and not (j1->>'start_conversation')::boolean then 'OK comme avant : D peut ecrire et appeler A, pas de nouvelle discussion' else 'ECHEC ' || j1::text end || E'\n';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', gen_random_uuid())::text, true);
  set local role authenticated;
  j1 := public.ow_permissions(b);
  r := r || '10 A (appareil deconnecte) -> B: ' || case when j1 = '{"context":"personal","read_profile":false,"message":false,"call":false,"start_conversation":false,"block":false,"report":false}'::jsonb then 'OK tout non' else 'ECHEC ' || j1::text end || E'\n';
  reset role;

  set local role anon;
  begin
    perform public.ow_permissions(b);
    r := r || '11 sans connexion, ow_permissions: ECHEC (autorise)' || E'\n';
  exception when insufficient_privilege then r := r || '11 sans connexion, ow_permissions: OK refuse (42501)' || E'\n'; end;
  reset role;

  -- ===== équivalence avec les anciennes règles, pour les 20 couples (X agit sur Y) =====
  for i in 1..5 loop
    for j in 1..5 loop
      continue when i = j;
      pairs := pairs + 1;
      perform set_config('request.jwt.claims', json_build_object('sub', ids[i], 'role', 'authenticated', 'session_id', sids[i])::text, true);
      -- sonnerie : ancienne règle de can_signal, recalculée ici avec les mêmes droits qu'elle (sans RLS)
      old_ok := not exists (select 1 from public.blocks where blocker = ids[j] and blocked = ids[i])
                and exists (select 1 from public.members m1 join public.members m2 on m2.conversation_id = m1.conversation_id
                             where m1.user_id = ids[i] and m2.user_id = ids[j]);
      set local role authenticated;
      new_ok := (public.ow_permissions(ids[j])->>'call')::boolean;
      if old_ok is distinct from new_ok then mism_call := mism_call + 1; r := r || '   ecart appel ' || nm[i] || '->' || nm[j] || E'\n'; end if;
      -- ouverture de discussion : on essaie vraiment start_conversation(), puis on annule
      begin
        perform public.start_conversation(ps[j]);
        raise exception 'zt_ok';
      exception when others then old_ok := (sqlerrm = 'zt_ok'); end;
      new_ok := (public.ow_permissions(ids[j])->>'start_conversation')::boolean;
      if old_ok is distinct from new_ok then mism_start := mism_start + 1; r := r || '   ecart discussion ' || nm[i] || '->' || nm[j] || E'\n'; end if;
      -- lecture du profil : ce que la règle RLS laisse réellement voir
      select count(*) into n from public.profiles where id = ids[j];
      new_ok := (public.ow_permissions(ids[j])->>'read_profile')::boolean;
      if (n = 1) is distinct from new_ok then mism_read := mism_read + 1; r := r || '   ecart lecture ' || nm[i] || '->' || nm[j] || E'\n'; end if;
      reset role;
    end loop;
  end loop;
  r := r || '12 equivalence sonnerie (ancienne regle = moteur), ' || pairs || ' couples: ' || case when mism_call = 0 then 'OK 0 ecart' else 'ECHEC ' || mism_call end || E'\n';
  r := r || '13 equivalence ouverture de discussion (start_conversation reel = moteur), ' || pairs || ' couples: ' || case when mism_start = 0 then 'OK 0 ecart' else 'ECHEC ' || mism_start end || E'\n';
  r := r || '14 equivalence lecture de profil (RLS reelle = moteur), ' || pairs || ' couples: ' || case when mism_read = 0 then 'OK 0 ecart' else 'ECHEC ' || mism_read end || E'\n';

  -- ===== la sonnerie réelle passe par le moteur =====
  perform set_config('realtime.topic', 'user:' || d, true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', sids[1])::text, true);
  set local role authenticated;
  begin
    insert into realtime.messages (topic, extension, event, payload, private) values ('user:' || d, 'broadcast', 'sig', '{}'::jsonb, true);
    r := r || '15 A sonne D (D a bloque A): ECHEC (autorise)' || E'\n';
  exception when insufficient_privilege then r := r || '15 A sonne D (D a bloque A): OK refuse (42501)' || E'\n'; end;
  reset role;
  perform set_config('realtime.topic', 'user:' || b, true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', sids[1])::text, true);
  set local role authenticated;
  begin
    insert into realtime.messages (topic, extension, event, payload, private) values ('user:' || b, 'broadcast', 'sig', '{}'::jsonb, true);
    r := r || '16 A sonne B (contact): OK' || E'\n';
  exception when others then r := r || '16 A sonne B (contact): ECHEC ' || sqlerrm || E'\n'; end;
  reset role;
  perform set_config('realtime.topic', '', true);

  raise exception 'RESULTATS (tout est annule)%', r;
end
$t$;
