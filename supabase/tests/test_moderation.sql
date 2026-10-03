-- Tests de la modération (signalements, suspension). S'exécute après test_base.sql,
-- dont il réutilise les comptes : admin_test (administrateur), ana, ben, carl.
\set adm '00000000-0000-0000-0000-00000000000a'
\set ana '00000000-0000-0000-0000-0000000000a1'
\set carl '00000000-0000-0000-0000-0000000000c1'

-- Carl signale Ana.
set role authenticated;
set "request.jwt.claim.sub" = :'carl';
insert into public.reports (reported, body_copy, reason) values (:'ana', 'message gênant', 'user_report');

-- Un non-administrateur ne lit pas les signalements et ne suspend personne.
do $$ begin
  begin perform public.admin_moderation(); raise exception 'ECHEC : signalements lisibles par tous';
  exception when raise_exception then if sqlerrm <> 'NOT_ADMIN' then raise; end if; end;
  begin perform public.admin_ban('ana', true); raise exception 'ECHEC : suspension par un non-administrateur';
  exception when raise_exception then if sqlerrm <> 'NOT_ADMIN' then raise; end if; end;
end $$;

-- L'administrateur lit le signalement, avec la forme attendue par gestion/index.html.
set "request.jwt.claim.sub" = :'adm';
do $$ declare j json := public.admin_moderation(); begin
  if json_array_length(j->'reports') <> 1 then raise exception 'ECHEC : 1 signalement attendu'; end if;
  if j->'reports'->0->>'cible' <> 'ana' or j->'reports'->0->>'par' <> 'carl'
     or j->'reports'->0->>'message' <> 'message gênant' or (j->'reports'->0->>'motif') is not null
     or (j->'reports'->0->>'suspendu')::boolean then
    raise exception 'ECHEC : contenu du signalement %', j->'reports'->0;
  end if;
end $$;

-- Il suspend Ana ; il ne peut pas se suspendre lui-même.
select public.admin_ban('ana', true);
do $$ begin
  begin perform public.admin_ban('admin_test', true); raise exception 'ECHEC : administrateur suspendu';
  exception when raise_exception then if sqlerrm <> 'ADMIN' then raise; end if; end;
  if (public.admin_moderation()->'bannis')::text <> '["ana"]' then raise exception 'ECHEC : liste des suspendus'; end if;
end $$;

-- Ana suspendue : plus d'envoi, plus de nouvelle discussion, plus d'appel ; la lecture reste.
set "request.jwt.claim.sub" = :'ana';
do $$ begin
  begin
    insert into public.messages (conversation_id, body, lang)
      select conversation_id, 'test', 'fr' from public.members where user_id = auth.uid() limit 1;
    raise exception 'ECHEC : un compte suspendu écrit encore';
  exception when insufficient_privilege then null; end;
  begin perform public.start_conversation('carl'); raise exception 'ECHEC : un compte suspendu ouvre une discussion';
  exception when raise_exception then if sqlerrm <> 'SUSPENDED' then raise; end if; end;
  if private.can_signal('user:00000000-0000-0000-0000-00000000000a') then raise exception 'ECHEC : un compte suspendu appelle'; end if;
  if not exists (select 1 from public.messages) then raise exception 'ECHEC : un compte suspendu ne lit plus ses discussions'; end if;
end $$;

-- Rétablie, Ana peut de nouveau écrire à l'administrateur.
set "request.jwt.claim.sub" = :'adm';
select public.admin_ban('ana', false);
set "request.jwt.claim.sub" = :'ana';
insert into public.messages (conversation_id, body, lang)
  select a.conversation_id, 'Merci', 'fr' from public.members a
    join public.members b on b.conversation_id = a.conversation_id and b.user_id = '00000000-0000-0000-0000-00000000000a'
   where a.user_id = auth.uid();
do $$ begin
  if private.can_signal('user:00000000-0000-0000-0000-00000000000a') is not true then raise exception 'ECHEC : appel refusé après rétablissement'; end if;
end $$;
reset role;
