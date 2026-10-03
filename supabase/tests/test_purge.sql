-- Test de la purge : un message de plus de 90 jours dans une discussion silencieuse
-- disparaît quand quelqu'un écrit dans une AUTRE discussion. Idem pour un signalement de plus de 12 mois.
\set ana '00000000-0000-0000-0000-0000000000a1'
\set carl '00000000-0000-0000-0000-0000000000c1'
-- Préparation en administrateur de base : un vieux message et un vieux signalement.
insert into public.messages (conversation_id, sender_id, body, lang, created_at)
  select m.conversation_id, m.user_id, 'vieux message', 'fr', now() - interval '91 days'
    from public.members m where m.user_id = :'carl' limit 1;
insert into public.reports (reporter, reported, body_copy, created_at)
  values (:'carl', :'ana', 'vieux signalement', now() - interval '13 months');
-- Un message récent ailleurs, écrit normalement par Ana.
set role authenticated;
set "request.jwt.claim.sub" = :'ana';
insert into public.messages (conversation_id, body, lang)
  select a.conversation_id, 'nouveau', 'fr' from public.members a
    join public.members b on b.conversation_id = a.conversation_id and b.user_id = '00000000-0000-0000-0000-00000000000a'
   where a.user_id = auth.uid();
reset role;
do $$ begin
  if exists (select 1 from public.messages where body = 'vieux message') then raise exception 'ECHEC : vieux message conservé'; end if;
  if exists (select 1 from public.reports where body_copy = 'vieux signalement') then raise exception 'ECHEC : vieux signalement conservé'; end if;
  if not exists (select 1 from public.messages where body = 'nouveau') then raise exception 'ECHEC : message récent supprimé'; end if;
end $$;
