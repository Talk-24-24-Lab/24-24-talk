-- 24/24 ONE WORLD — Lot 3 « demandes de contact » (décision D6 : « Oui, avec lien », 5 octobre 2026).
-- © 2026 Sébastien Chevrier. Tous droits réservés. Base de TEST uniquement. Retour arrière : 14-demandes-contact-retour.sql.
--
-- Règle : on ne peut plus ouvrir une discussion avec quelqu'un juste parce qu'on connaît son pseudo.
--   1. Discussion déjà existante                     → elle s'ouvre (les contacts actuels restent contacts).
--   2. La personne m'a envoyé une demande            → l'ouvrir vaut acceptation.
--   3. J'ai un lien d'invitation signé de la personne → elle a choisi de le partager : la discussion s'ouvre.
--   4. Sinon                                          → une DEMANDE est enregistrée ; elle doit l'accepter.
-- Le blocage compte désormais dans les deux sens : celui qui bloque ne peut plus écrire ni faire sonner celui qu'il a bloqué.
-- Les demandes et les jetons ne sont lisibles par personne directement : uniquement par les fonctions ci-dessous.
--
-- Contrat de public.start_conversation(other_pseudo, invite) :
--   renvoie l'identifiant de la discussion, ou NULL = « demande envoyée, en attente d'acceptation ».
--   erreurs inchangées : NOT_SIGNED_IN, NO_PROFILE, SUSPENDED, NOT_FOUND, SELF, BLOCKED, RATE_LIMIT.
--   Un refus n'est jamais révélé à celui qui a demandé (il voit toujours « demande envoyée »).

-- ===== tables (schéma privé, aucun accès direct) =====
create table if not exists private.contact_requests (
  from_id    uuid not null references public.profiles(id) on delete cascade,
  to_id      uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  primary key (from_id, to_id),
  check (from_id <> to_id)
);
create index if not exists contact_requests_to_pending on private.contact_requests (to_id) where status = 'pending';
alter table private.contact_requests enable row level security;
revoke all on private.contact_requests from public, anon, authenticated;

-- Jetons d'invitation : seule l'empreinte SHA-256 est gardée ; le jeton lui-même n'existe que dans le lien partagé.
create table if not exists private.invites (
  token_hash bytea primary key,
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);
create index if not exists invites_owner on private.invites (owner_id, created_at);
alter table private.invites enable row level security;
revoke all on private.invites from public, anon, authenticated;

-- ===== outils internes =====
create or replace function private.blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.blocks
                  where (blocker = a and blocked = b) or (blocker = b and blocked = a));
$$;
revoke all on function private.blocked_between(uuid, uuid) from public, anon, authenticated;

create or replace function private.dm_between(a uuid, b uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select m1.conversation_id
    from public.members m1
    join public.members m2 on m2.conversation_id = m1.conversation_id and m2.user_id = b
   where m1.user_id = a
     and (select count(*) from public.members m3 where m3.conversation_id = m1.conversation_id) = 2
   limit 1;
$$;
revoke all on function private.dm_between(uuid, uuid) from public, anon, authenticated;

create or replace function private.invite_ok(p_owner uuid, p_token text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_token is not null and p_token ~ '^[0-9a-f]{64}$'
     and exists (select 1 from private.invites i
                  where i.token_hash = sha256(convert_to(p_token, 'UTF8'))
                    and i.owner_id = p_owner and i.expires_at > now());
$$;
revoke all on function private.invite_ok(uuid, text) from public, anon, authenticated;

-- Le blocage compte dans les deux sens pour envoyer un message (règle « envoyer un message »).
create or replace function private.blocked_in(conv uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.members m
      join public.blocks b on (b.blocker = m.user_id and b.blocked = auth.uid())
                           or (b.blocker = auth.uid() and b.blocked = m.user_id)
     where m.conversation_id = conv and m.user_id <> auth.uid()
  );
$$;

-- ===== ouvrir une discussion, ou demander =====
drop function if exists public.start_conversation(text);
create or replace function public.start_conversation(other_pseudo text, invite text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  other uuid;
  conv uuid;
  is_admin boolean;
  req record;
begin
  if me is null then raise exception 'NOT_SIGNED_IN'; end if;
  if not exists (select 1 from public.profiles where id = me) then raise exception 'NO_PROFILE'; end if;
  if private.is_suspended(me) then raise exception 'SUSPENDED'; end if;
  select id into other from public.profiles where pseudo = lower(trim(other_pseudo));
  if other is null or private.is_suspended(other) then raise exception 'NOT_FOUND'; end if;
  if other = me then raise exception 'SELF'; end if;
  if private.blocked_between(me, other) then raise exception 'BLOCKED'; end if;

  -- 1. discussion existante : rien ne change pour les contacts actuels
  conv := private.dm_between(me, other);
  if conv is not null then return conv; end if;

  is_admin := exists (select 1 from public.admins where uid = me);

  -- 2 et 3 : demande reçue de cette personne, lien signé par elle, ou administrateur (modération)
  if is_admin
     or private.invite_ok(other, invite)
     or exists (select 1 from private.contact_requests where from_id = other and to_id = me and status = 'pending') then
    if not is_admin
       and (select count(*) from private.rate_log
             where user_id = me and action = 'nouvelle_discussion' and at > now() - interval '24 hours') >= 20 then
      raise exception 'RATE_LIMIT' using hint = 'discussions';
    end if;
    insert into private.rate_log (user_id, action) values (me, 'nouvelle_discussion');
    if random() < 0.02 then delete from private.rate_log where at < now() - interval '2 days'; end if;
    insert into public.conversations default values returning id into conv;
    insert into public.members (conversation_id, user_id) values (conv, me), (conv, other);
    update private.contact_requests set status = 'accepted', decided_at = now()
     where ((from_id = other and to_id = me) or (from_id = me and to_id = other)) and status = 'pending';
    return conv;
  end if;

  -- 4. demande (idempotente ; un refus récent n'est jamais révélé et n'est pas renvoyé)
  select * into req from private.contact_requests where from_id = me and to_id = other;
  if found and (req.status = 'pending'
                or (req.status = 'declined' and req.decided_at > now() - interval '30 days')) then
    return null;
  end if;
  if (select count(*) from private.rate_log
       where user_id = me and action = 'demande_contact' and at > now() - interval '24 hours') >= 20 then
    raise exception 'RATE_LIMIT' using hint = 'demandes';
  end if;
  insert into private.rate_log (user_id, action) values (me, 'demande_contact');
  insert into private.contact_requests (from_id, to_id) values (me, other)
    on conflict (from_id, to_id) do update set status = 'pending', created_at = now(), decided_at = null;
  return null;
end;
$$;
revoke all on function public.start_conversation(text, text) from public, anon;
grant execute on function public.start_conversation(text, text) to authenticated;

-- ===== mes demandes (reçues et envoyées, en attente, 30 jours au plus) =====
create or replace function public.contact_requests_list()
returns table (direction text, other_id uuid, pseudo text, lang text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select 'in', r.from_id, p.pseudo, p.lang, r.created_at
    from private.contact_requests r join public.profiles p on p.id = r.from_id
   where r.to_id = auth.uid() and r.status = 'pending' and r.created_at > now() - interval '30 days'
     and private.session_active()
     and not private.blocked_between(r.from_id, r.to_id) and not private.is_suspended(r.from_id)
  union all
  select 'out', r.to_id, p.pseudo, p.lang, r.created_at
    from private.contact_requests r join public.profiles p on p.id = r.to_id
   where r.from_id = auth.uid() and r.status = 'pending' and r.created_at > now() - interval '30 days'
     and private.session_active()
  order by 5 desc;
$$;
revoke all on function public.contact_requests_list() from public, anon;
grant execute on function public.contact_requests_list() to authenticated;

-- ===== accepter ou refuser une demande reçue =====
create or replace function public.answer_contact_request(p_from uuid, p_accept boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  conv uuid;
begin
  if me is null or not private.session_active() then raise exception 'NOT_SIGNED_IN'; end if;
  if private.is_suspended(me) then raise exception 'SUSPENDED'; end if;
  if not exists (select 1 from private.contact_requests
                  where from_id = p_from and to_id = me and status = 'pending'
                    and created_at > now() - interval '30 days') then
    raise exception 'NOT_FOUND';
  end if;
  if not coalesce(p_accept, false) then
    update private.contact_requests set status = 'declined', decided_at = now() where from_id = p_from and to_id = me;
    return null;
  end if;
  if private.blocked_between(me, p_from) or private.is_suspended(p_from) then raise exception 'BLOCKED'; end if;
  conv := private.dm_between(me, p_from);
  if conv is null then
    insert into public.conversations default values returning id into conv;
    insert into public.members (conversation_id, user_id) values (conv, me), (conv, p_from);
  end if;
  update private.contact_requests set status = 'accepted', decided_at = now()
   where ((from_id = p_from and to_id = me) or (from_id = me and to_id = p_from)) and status = 'pending';
  return conv;
end;
$$;
revoke all on function public.answer_contact_request(uuid, boolean) from public, anon;
grant execute on function public.answer_contact_request(uuid, boolean) to authenticated;

-- ===== annuler une demande que j'ai envoyée =====
create or replace function public.cancel_contact_request(p_to uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not private.session_active() then raise exception 'NOT_SIGNED_IN'; end if;
  update private.contact_requests set status = 'cancelled', decided_at = now()
   where from_id = auth.uid() and to_id = p_to and status = 'pending';
  return found;
end;
$$;
revoke all on function public.cancel_contact_request(uuid) from public, anon;
grant execute on function public.cancel_contact_request(uuid) to authenticated;

-- ===== créer un jeton pour mon lien d'invitation (30 jours, 10 actifs au plus, 30 par jour) =====
create or replace function public.create_invite()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  tok text;
begin
  if me is null or not private.session_active() then raise exception 'NOT_SIGNED_IN'; end if;
  if not exists (select 1 from public.profiles where id = me) then raise exception 'NO_PROFILE'; end if;
  if private.is_suspended(me) then raise exception 'SUSPENDED'; end if;
  if (select count(*) from private.rate_log
       where user_id = me and action = 'invitation' and at > now() - interval '24 hours') >= 30 then
    raise exception 'RATE_LIMIT' using hint = 'invitations';
  end if;
  insert into private.rate_log (user_id, action) values (me, 'invitation');
  tok := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into private.invites (token_hash, owner_id) values (sha256(convert_to(tok, 'UTF8')), me);
  delete from private.invites where owner_id = me and (expires_at < now() or token_hash in (
    select token_hash from private.invites where owner_id = me order by created_at desc offset 10));
  return tok;
end;
$$;
revoke all on function public.create_invite() from public, anon;
grant execute on function public.create_invite() to authenticated;

-- ===== le moteur de permissions (lot 2) suit les nouvelles règles =====
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
      -- contact réel et aucun blocage, dans un sens ou dans l'autre (lot 3)
      if p_target = me or private.blocked_between(me, p_target) then return false; end if;
      return private.shares_conversation(p_target);

    when 'start_conversation' then
      -- ouvrir directement : discussion existante, demande reçue de la cible, ou administrateur
      if p_target = me or private.is_suspended(me) or private.is_suspended(p_target)
         or private.blocked_between(me, p_target) then return false; end if;
      return private.dm_between(me, p_target) is not null
          or exists (select 1 from private.contact_requests where from_id = p_target and to_id = me and status = 'pending')
          or exists (select 1 from public.admins where uid = me);

    when 'request_contact' then
      if p_target = me or private.is_suspended(me) or private.is_suspended(p_target)
         or private.blocked_between(me, p_target) then return false; end if;
      return private.dm_between(me, p_target) is null;

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
    'request_contact',    private.can('request_contact', p_other, p_context),
    'block',              private.can('block', p_other, p_context),
    'report',             private.can('report', p_other, p_context)
  );
$$;
revoke all on function public.ow_permissions(uuid, text) from public, anon;
grant execute on function public.ow_permissions(uuid, text) to authenticated;
