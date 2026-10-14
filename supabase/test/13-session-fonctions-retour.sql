-- Retour arrière de 13-session-fonctions.sql (base de TEST) : remet les deux fonctions telles que constatées le 14 octobre 2026
-- (même logique, seule la mise en page du code diffère). Les droits d'exécution ne changent pas.
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
  );
$function$;
