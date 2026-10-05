-- Essais du lot 3 « demandes de contact » (base de TEST). © 2026 Sébastien Chevrier.
-- Comptes fictifs : A, B (contact de A), C, D, E, F inconnus. Chaque essai attaque directement les fonctions et la base,
-- puis vérifie l'état réel en base (pas seulement l'absence d'erreur). Tout est annulé par l'exception finale.
do $t$
declare
  ids uuid[] := array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
  sids uuid[] := array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
  ps text[];
  a uuid; b uuid; c uuid; d uuid; e uuid; f uuid;
  i int; j int; n int; conv uuid; conv2 uuid; ab uuid; tok text; st text; j1 jsonb;
  r text := E'\n';
begin
  a := ids[1]; b := ids[2]; c := ids[3]; d := ids[4]; e := ids[5]; f := ids[6];
  ps := array[]::text[];
  for i in 1..6 loop
    ps := ps || ('zt3' || chr(96 + i) || substr(md5(random()::text), 1, 8));
    insert into auth.users (id, instance_id, aud, role, is_anonymous, created_at, updated_at)
      values (ids[i], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', true, now(), now());
    insert into auth.sessions (id, user_id, created_at, updated_at) values (sids[i], ids[i], now(), now());
    insert into public.profiles (id, pseudo, lang) values (ids[i], ps[i], 'fr');
  end loop;
  -- A et B sont déjà contacts (discussion créée « à l'ancienne », comme les contacts existants)
  insert into public.conversations default values returning id into ab;
  insert into public.members (conversation_id, user_id) values (ab, a), (ab, b);

  -- ===== A (session active) =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', sids[1])::text, true);
  set local role authenticated;
  conv := public.start_conversation(ps[2]);
  r := r || '01 A ouvre B (contact existant): ' || case when conv = ab then 'OK meme discussion' else 'ECHEC ' || coalesce(conv::text, 'null') end || E'\n';
  conv := public.start_conversation(ps[3]);
  reset role;
  select count(*) into n from public.members m1 join public.members m2 on m2.conversation_id = m1.conversation_id where m1.user_id = a and m2.user_id = c;
  r := r || '02 A -> C inconnu, sans lien: ' || case when conv is null and n = 0
    and exists (select 1 from private.contact_requests where from_id = a and to_id = c and status = 'pending')
    then 'OK demande en attente, aucune discussion' else 'ECHEC conv=' || coalesce(conv::text, 'null') || ' n=' || n end || E'\n';
  set local role authenticated;
  conv := public.start_conversation(ps[3]);
  reset role;
  select count(*) into n from private.contact_requests where from_id = a and to_id = c;
  r := r || '03 A redemande C (double clic, reconnexion): ' || case when conv is null and n = 1 then 'OK une seule demande' else 'ECHEC n=' || n end || E'\n';

  -- A ne peut pas écrire à C : aucune discussion commune, même en connaissant les identifiants
  set local role authenticated;
  begin
    insert into public.messages (conversation_id, sender_id, body, lang, kind) values (ab, c, 'usurpation', 'fr', 'text');
    r := r || '04 A ecrit au nom de C: ECHEC (autorise)' || E'\n';
  exception when insufficient_privilege then r := r || '04 A ecrit au nom de C (sender_id falsifie): OK refuse (42501)' || E'\n'; end;
  begin
    perform 1 from private.contact_requests limit 1;
    r := r || '05 A lit la table des demandes: ECHEC (autorise)' || E'\n';
  exception when insufficient_privilege then r := r || '05 A lit directement la table des demandes: OK refuse (42501)' || E'\n'; end;
  begin
    insert into private.contact_requests (from_id, to_id, status) values (d, a, 'accepted');
    r := r || '06 A fabrique une demande acceptee de D: ECHEC (autorise)' || E'\n';
  exception when insufficient_privilege then r := r || '06 A fabrique une demande « acceptee » de D: OK refuse (42501)' || E'\n'; end;
  begin
    perform public.answer_contact_request(c, true);
    r := r || '07 A accepte sa propre demande a la place de C: ECHEC (autorise)' || E'\n';
  exception when others then r := r || '07 A accepte sa propre demande a la place de C: ' || case when sqlerrm = 'NOT_FOUND' then 'OK refuse (NOT_FOUND)' else 'ECHEC ' || sqlerrm end || E'\n'; end;
  reset role;

  -- ===== C voit la demande ; B (tiers) ne peut pas y répondre =====
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated', 'session_id', sids[3])::text, true);
  set local role authenticated;
  select count(*) into n from public.contact_requests_list() l where l.direction = 'in' and l.other_id = a and l.pseudo = ps[1];
  r := r || '08 C voit la demande de A: ' || case when n = 1 then 'OK' else 'ECHEC n=' || n end || E'\n';
  j1 := public.ow_permissions(a);
  r := r || '09 C -> A avant reponse: ' || case when (j1->>'start_conversation')::boolean and not (j1->>'message')::boolean then 'OK peut ouvrir (demande recue), pas encore ecrire' else 'ECHEC ' || j1::text end || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated', 'session_id', sids[2])::text, true);
  set local role authenticated;
  begin
    perform public.answer_contact_request(a, true);
    r := r || '10 B accepte la demande de A destinee a C: ECHEC (autorise)' || E'\n';
  exception when others then r := r || '10 B accepte une demande destinee a C: ' || case when sqlerrm = 'NOT_FOUND' then 'OK refuse (NOT_FOUND)' else 'ECHEC ' || sqlerrm end || E'\n'; end;
  reset role;

  -- ===== C refuse : A n'en sait rien et ne peut pas relancer =====
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated', 'session_id', sids[3])::text, true);
  set local role authenticated;
  conv := public.answer_contact_request(a, false);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', sids[1])::text, true);
  set local role authenticated;
  select count(*) into n from public.contact_requests_list() l where l.direction = 'out' and l.other_id = c;
  conv := public.start_conversation(ps[3]);
  perform public.cancel_contact_request(c);
  conv2 := public.start_conversation(ps[3]);
  reset role;
  r := r || '11 C refuse ; A voit toujours « en attente », relance et annule sans effet: ' || case when n = 1 and conv is null and conv2 is null
    and (select status from private.contact_requests where from_id = a and to_id = c) = 'declined' then 'OK refus non revele, pas de relance' else 'ECHEC' end || E'\n';

  -- ===== D demande à C, C accepte =====
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated', 'session_id', sids[4])::text, true);
  set local role authenticated;
  perform public.start_conversation(ps[3]);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated', 'session_id', sids[3])::text, true);
  set local role authenticated;
  conv := public.answer_contact_request(d, true);
  reset role;
  select count(*) into n from public.members where conversation_id = conv and user_id in (c, d);
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated', 'session_id', sids[4])::text, true);
  set local role authenticated;
  begin
    insert into public.messages (conversation_id, sender_id, body, lang, kind) values (conv, d, 'bonjour', 'fr', 'text');
    st := 'ecrit';
  exception when others then st := sqlerrm; end;
  conv2 := public.start_conversation(ps[3]);
  reset role;
  r := r || '12 D demande, C accepte: ' || case when conv is not null and n = 2 and st = 'ecrit' and conv2 = conv
    and (select status from private.contact_requests where from_id = d and to_id = c) = 'accepted' then 'OK discussion ouverte, D peut ecrire' else 'ECHEC n=' || n || ' ' || st end || E'\n';

  -- ===== demande croisée : E demande à F, F ouvre E → acceptation implicite =====
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated', 'session_id', sids[5])::text, true);
  set local role authenticated;
  perform public.start_conversation(ps[6]);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', f, 'role', 'authenticated', 'session_id', sids[6])::text, true);
  set local role authenticated;
  conv := public.start_conversation(ps[5]);
  reset role;
  r := r || '13 F ouvre E qui lui avait demande: ' || case when conv is not null
    and (select status from private.contact_requests where from_id = e and to_id = f) = 'accepted' then 'OK acceptation implicite' else 'ECHEC' end || E'\n';

  -- ===== lien d'invitation signé =====
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated', 'session_id', sids[2])::text, true);
  set local role authenticated;
  tok := public.create_invite();
  reset role;
  r := r || '14 jeton cree, seule son empreinte est gardee: ' || case when tok ~ '^[0-9a-f]{64}$'
    and exists (select 1 from private.invites where owner_id = b and token_hash = sha256(convert_to(tok, 'UTF8')))
    and not exists (select 1 from private.invites where encode(token_hash, 'escape') like '%' || tok || '%') then 'OK' else 'ECHEC' end || E'\n';
  perform set_config('request.jwt.claims', json_build_object('sub', f, 'role', 'authenticated', 'session_id', sids[6])::text, true);
  set local role authenticated;
  conv := public.start_conversation(ps[4], tok);       -- jeton de B présenté pour D : refusé
  conv2 := public.start_conversation(ps[4], 'zz');     -- jeton mal formé
  reset role;
  r := r || '15 jeton de B presente pour D, ou jeton invente: ' || case when conv is null and conv2 is null
    and exists (select 1 from private.contact_requests where from_id = f and to_id = d and status = 'pending') then 'OK simple demande' else 'ECHEC' end || E'\n';
  perform set_config('request.jwt.claims', json_build_object('sub', f, 'role', 'authenticated', 'session_id', sids[6])::text, true);
  set local role authenticated;
  conv := public.start_conversation(ps[2], tok);
  reset role;
  r := r || '16 F suit le lien signe de B: ' || case when conv is not null
    and (select count(*) from public.members where conversation_id = conv and user_id in (b, f)) = 2 then 'OK discussion ouverte directement' else 'ECHEC' end || E'\n';
  update private.invites set expires_at = now() - interval '1 second' where owner_id = b;
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated', 'session_id', sids[5])::text, true);
  set local role authenticated;
  conv := public.start_conversation(ps[2], tok);
  reset role;
  r := r || '17 lien de B expire: ' || case when conv is null then 'OK simple demande' else 'ECHEC discussion ouverte' end || E'\n';

  -- ===== blocage dans les deux sens (celui qui bloque ne peut plus écrire ni sonner) =====
  insert into public.blocks (blocker, blocked) values (a, b);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', sids[1])::text, true);
  set local role authenticated;
  begin
    insert into public.messages (conversation_id, sender_id, body, lang, kind) values (ab, a, 'x', 'fr', 'text');
    st := 'ecrit';
  exception when insufficient_privilege then st := 'refuse'; end;
  j1 := public.ow_permissions(b);
  reset role;
  r := r || '18 A a bloque B, A ecrit a B: ' || case when st = 'refuse' and not (j1->>'message')::boolean and not (j1->>'call')::boolean then 'OK refuse, ni message ni appel' else 'ECHEC ' || st || ' ' || j1::text end || E'\n';
  perform set_config('realtime.topic', 'user:' || b, true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'session_id', sids[1])::text, true);
  set local role authenticated;
  begin
    insert into realtime.messages (topic, extension, event, payload, private) values ('user:' || b, 'broadcast', 'sig', '{}'::jsonb, true);
    r := r || '19 A fait sonner B qu il a bloque: ECHEC (autorise)' || E'\n';
  exception when insufficient_privilege then r := r || '19 A fait sonner B qu il a bloque: OK refuse (42501)' || E'\n'; end;
  reset role;
  perform set_config('realtime.topic', '', true);
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated', 'session_id', sids[2])::text, true);
  set local role authenticated;
  begin
    insert into public.messages (conversation_id, sender_id, body, lang, kind) values (ab, b, 'x', 'fr', 'text');
    st := 'ecrit';
  exception when insufficient_privilege then st := 'refuse'; end;
  reset role;
  r := r || '20 B (bloque par A) ecrit a A: ' || case when st = 'refuse' then 'OK refuse comme avant' else 'ECHEC' end || E'\n';
  -- demande d'un compte bloqué : refusée, et une ancienne demande devient invisible
  insert into public.blocks (blocker, blocked) values (d, f);
  perform set_config('request.jwt.claims', json_build_object('sub', f, 'role', 'authenticated', 'session_id', sids[6])::text, true);
  set local role authenticated;
  begin
    perform public.start_conversation(ps[4]);
    st := 'passe';
  exception when others then st := sqlerrm; end;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated', 'session_id', sids[4])::text, true);
  set local role authenticated;
  select count(*) into n from public.contact_requests_list() l where l.other_id = f;
  reset role;
  r := r || '21 D a bloque F : demande de F refusee et cachee: ' || case when st = 'BLOCKED' and n = 0 then 'OK' else 'ECHEC ' || st || ' n=' || n end || E'\n';

  -- ===== appareil déconnecté, sans connexion =====
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated', 'session_id', gen_random_uuid())::text, true);
  set local role authenticated;
  select count(*) into n from public.contact_requests_list();
  begin
    perform public.create_invite();
    st := 'passe';
  exception when others then st := sqlerrm; end;
  reset role;
  r := r || '22 appareil deconnecte: ' || case when n = 0 and st = 'NOT_SIGNED_IN' then 'OK rien a lire, pas de jeton' else 'ECHEC n=' || n || ' ' || st end || E'\n';
  set local role anon;
  begin
    perform public.contact_requests_list();
    r := r || '23 sans connexion: ECHEC (autorise)' || E'\n';
  exception when insufficient_privilege then r := r || '23 sans connexion, liste des demandes: OK refuse (42501)' || E'\n'; end;
  reset role;

  -- ===== limite : 20 demandes par jour =====
  insert into private.rate_log (user_id, action) select e, 'demande_contact' from generate_series(1, 20);
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated', 'session_id', sids[5])::text, true);
  set local role authenticated;
  begin
    perform public.start_conversation(ps[3]);
    st := 'passe';
  exception when others then st := sqlerrm; end;
  reset role;
  r := r || '24 21e demande dans la journee: ' || case when st = 'RATE_LIMIT' then 'OK refusee (RATE_LIMIT)' else 'ECHEC ' || st end || E'\n';

  -- ===== moteur : start_conversation annoncé = start_conversation réel =====
  n := 0;
  for i in 1..6 loop
    for j in 1..6 loop
      continue when i = j;
      perform set_config('request.jwt.claims', json_build_object('sub', ids[i], 'role', 'authenticated', 'session_id', sids[i])::text, true);
      set local role authenticated;
      j1 := public.ow_permissions(ids[j]);
      begin
        conv := public.start_conversation(ps[j]);
        st := case when conv is null then 'demande' else 'ouvre' end;
        raise exception 'zt_rollback';
      exception when others then if sqlerrm <> 'zt_rollback' then st := 'erreur'; end if; end;
      reset role;
      if ((j1->>'start_conversation')::boolean) is distinct from (st = 'ouvre') then n := n + 1; r := r || '   ecart ' || i || '->' || j || ' ' || st || E'\n'; end if;
    end loop;
  end loop;
  r := r || '25 moteur = fonction reelle sur 30 couples: ' || case when n = 0 then 'OK 0 ecart' else 'ECHEC ' || n end || E'\n';

  -- ===== suppression d'un compte : ses demandes et jetons disparaissent =====
  delete from public.profiles where id = f;
  r := r || '26 compte F supprime: ' || case when not exists (select 1 from private.contact_requests where from_id = f or to_id = f)
    and not exists (select 1 from private.invites where owner_id = f) then 'OK demandes effacees' else 'ECHEC' end || E'\n';

  raise exception 'RESULTATS (tout est annule)%', r;
end
$t$;
