-- Retour arrière du lot 3 « demandes de contact » (base de TEST). © 2026 Sébastien Chevrier.
-- Remet start_conversation, blocked_in, can() et ow_permissions exactement comme après le lot 2, puis retire le reste.
-- Les discussions ouvertes pendant le lot 3 restent (ce sont des discussions TALK ordinaires).

drop function if exists public.start_conversation(text, text);
create or replace function public.start_conversation(other_pseudo text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
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
$$;
revoke all on function public.start_conversation(text) from public, anon;
grant execute on function public.start_conversation(text) to authenticated;

create or replace function private.blocked_in(conv uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.members m join public.blocks b on b.blocker = m.user_id and b.blocked = auth.uid()
     where m.conversation_id = conv
  );
$$;

create or replace function private.can(p_action text, p_target uuid, p_context text default 'personal')
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null or not private.session_active() then return false; end if;
  if p_context is distinct from 'personal' then return false; end if;
  if p_target is null or not exists (select 1 from public.profiles p where p.id = p_target) then return false; end if;
  case p_action
    when 'read_profile' then
      return p_target = me or private.shares_conversation(p_target);
    when 'message', 'call' then
      if p_target = me then return false; end if;
      if exists (select 1 from public.blocks b where b.blocker = p_target and b.blocked = me) then return false; end if;
      return private.shares_conversation(p_target);
    when 'start_conversation' then
      if p_target = me or private.is_suspended(me) or private.is_suspended(p_target) then return false; end if;
      return not exists (select 1 from public.blocks b
                          where (b.blocker = me and b.blocked = p_target) or (b.blocker = p_target and b.blocked = me));
    when 'block', 'report' then
      return p_target <> me;
    else
      return false;
  end case;
end;
$$;
revoke all on function private.can(text, uuid, text) from public, anon, authenticated;

create or replace function public.ow_permissions(p_other uuid, p_context text default 'personal')
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'context',            coalesce(p_context, 'personal'),
    'read_profile',       private.can('read_profile', p_other, p_context),
    'message',            private.can('message', p_other, p_context),
    'call',               private.can('call', p_other, p_context),
    'start_conversation', private.can('start_conversation', p_other, p_context),
    'block',              private.can('block', p_other, p_context),
    'report',             private.can('report', p_other, p_context)
  );
$$;

drop function if exists public.create_invite();
drop function if exists public.cancel_contact_request(uuid);
drop function if exists public.answer_contact_request(uuid, boolean);
drop function if exists public.contact_requests_list();
drop function if exists private.invite_ok(uuid, text);
drop function if exists private.dm_between(uuid, uuid);
drop function if exists private.blocked_between(uuid, uuid);
drop table if exists private.invites;
drop table if exists private.contact_requests;
