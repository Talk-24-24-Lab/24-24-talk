-- 24/24 ONE WORLD — mandat OW-TEST-002, suite (base de TEST 24-24-talk-test uniquement). © 2026 Sébastien Chevrier.
-- Une connexion supprimée depuis « Mes appareils » doit perdre l'accès tout de suite, partout.
-- start_conversation() et mon_acces() ne le vérifiaient pas : un appareil déconnecté pouvait encore, pendant la
-- durée de son jeton (environ 1 heure), créer des discussions et lire l'état de son abonnement.
-- (ow_permissions() était déjà protégée : chaque réponse passe par private.can(), qui vérifie la session.)
-- Retour arrière : 13-session-fonctions-retour.sql
create or replace function public.start_conversation(other_pseudo text)
 returns uuid
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  me uuid := auth.uid();
  other uuid;
  conv uuid;
begin
  if me is null then raise exception 'NOT_SIGNED_IN'; end if;
  if not private.session_active() then raise exception 'AUTH'; end if;
  if not exists (select 1 from public.profiles where id = me) then raise exception 'NO_PROFILE'; end if;
  if private.is_suspended(me) then raise exception 'SUSPENDED'; end if;
  select id into other from public.profiles where pseudo = lower(trim(other_pseudo));
  if other is null or private.is_suspended(other) then raise exception 'NOT_FOUND'; end if;
  if other = me then raise exception 'SELF'; end if;
  if exists (select 1 from public.blocks where (blocker = me and blocked = other) or (blocker = other and blocked = me)) then
    raise exception 'BLOCKED';
  end if;
  select m1.conversation_id into conv
    from public.members m1
    join public.members m2 on m2.conversation_id = m1.conversation_id and m2.user_id = other
   where m1.user_id = me
     and (select count(*) from public.members m3 where m3.conversation_id = m1.conversation_id) = 2
   limit 1;
  if conv is null then
    if not exists (select 1 from public.admins where uid = me)
       and (select count(*) from private.rate_log
             where user_id = me and action = 'nouvelle_discussion'
               and at > now() - interval '24 hours') >= 20 then
      raise exception 'RATE_LIMIT' using hint = 'discussions';
    end if;
    insert into private.rate_log (user_id, action) values (me, 'nouvelle_discussion');
    if random() < 0.02 then delete from private.rate_log where at < now() - interval '2 days'; end if;
    insert into public.conversations default values returning id into conv;
    insert into public.members (conversation_id, user_id) values (conv, me), (conv, other);
  end if;
  return conv;
end;
$function$;

-- Sans session active : réponse vide (null) au lieu de l'état de l'abonnement.
create or replace function public.mon_acces()
 returns json
 language sql
 stable security definer
 set search_path to ''
as $function$
  select json_build_object(
    'acces', private.has_access(auth.uid()),
    'gratuit_jusqu_au', (select free_until from private.billing_settings),
    'abonne', exists (select 1 from private.subscriptions s where s.user_id = auth.uid()
                        and s.status in ('active', 'trialing', 'past_due')),
    'fin_periode', (select current_period_end from private.subscriptions s where s.user_id = auth.uid())
  )
  where (select private.session_active());
$function$;
