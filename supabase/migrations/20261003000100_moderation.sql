-- Modération : l'administrateur lit les signalements et peut suspendre un compte.
-- Répond à l'onglet « Signalements » du tableau de bord (gestion/), qui appelle
-- admin_moderation() et admin_ban() mais ne trouvait pas ces fonctions sur le serveur.
--
-- Un compte suspendu ne peut plus : écrire un message, ouvrir une discussion, appeler.
-- Il garde la lecture de ses discussions et peut supprimer son compte.

create table if not exists private.bans (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  by uuid
);
alter table private.bans enable row level security;
revoke all on private.bans from public, anon, authenticated;

create or replace function private.is_banned(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from private.bans where user_id = uid);
$$;
revoke all on function private.is_banned(uuid) from public, anon;
grant execute on function private.is_banned(uuid) to authenticated;

-- Liste des signalements (les plus récents d'abord) et des comptes suspendus.
create or replace function public.admin_moderation()
returns json language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not exists (select 1 from public.admins where uid = auth.uid()) then
    raise exception 'NOT_ADMIN';
  end if;
  return json_build_object(
    'reports', (
      select coalesce(json_agg(r order by r.cree desc), '[]'::json) from (
        select pr.pseudo as cible, pp.pseudo as par, rp.created_at as cree,
          nullif(rp.reason, 'user_report') as motif, rp.body_copy as message,
          exists (select 1 from private.bans b where b.user_id = rp.reported) as suspendu
        from public.reports rp
        left join public.profiles pr on pr.id = rp.reported
        left join public.profiles pp on pp.id = rp.reporter
        order by rp.created_at desc limit 200
      ) r
    ),
    'bannis', (
      select coalesce(json_agg(p.pseudo order by p.pseudo), '[]'::json)
      from private.bans b join public.profiles p on p.id = b.user_id
    )
  );
end;
$$;
revoke all on function public.admin_moderation() from public, anon;
grant execute on function public.admin_moderation() to authenticated;

-- Suspendre (suspendre = true) ou rétablir (false) un compte, par son pseudo.
create or replace function public.admin_ban(target_pseudo text, suspendre boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  target uuid;
begin
  if auth.uid() is null or not exists (select 1 from public.admins where uid = auth.uid()) then
    raise exception 'NOT_ADMIN';
  end if;
  select id into target from public.profiles where pseudo = lower(trim(target_pseudo));
  if target is null then raise exception 'NOT_FOUND'; end if;
  if exists (select 1 from public.admins where uid = target) then raise exception 'ADMIN'; end if;
  if suspendre then
    insert into private.bans (user_id, by) values (target, auth.uid()) on conflict (user_id) do nothing;
  else
    delete from private.bans where user_id = target;
  end if;
end;
$$;
revoke all on function public.admin_ban(text, boolean) from public, anon;
grant execute on function public.admin_ban(text, boolean) to authenticated;

-- Effets de la suspension.
-- 1. Écrire : même règle qu'avant, plus « ne pas être suspendu ».
drop policy if exists "envoyer un message" on public.messages;
create policy "envoyer un message" on public.messages for insert to authenticated with check (
  sender_id = (select auth.uid())
  and private.is_member(conversation_id)
  and not private.blocked_in(conversation_id)
  and not private.is_banned((select auth.uid()))
);

-- 2. Ouvrir une discussion : même fonction qu'avant, plus le refus « SUSPENDED ».
create or replace function public.start_conversation(other_pseudo text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  other uuid;
  conv uuid;
begin
  if me is null then raise exception 'NOT_SIGNED_IN'; end if;
  if not exists (select 1 from public.profiles where id = me) then raise exception 'NO_PROFILE'; end if;
  if private.is_banned(me) then raise exception 'SUSPENDED'; end if;
  select id into other from public.profiles where pseudo = lower(trim(other_pseudo));
  if other is null then raise exception 'NOT_FOUND'; end if;
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
    insert into public.conversations default values returning id into conv;
    insert into public.members (conversation_id, user_id) values (conv, me), (conv, other);
  end if;
  return conv;
end;
$$;

-- 3. Appeler (signaux d'appel en temps réel) : même fonction qu'avant, plus le refus si suspendu.
create or replace function private.can_signal(topic text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  target uuid;
begin
  if topic is null or topic !~ '^user:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  target := substr(topic, 6)::uuid;
  if target = auth.uid() then return false; end if;
  if private.is_banned(auth.uid()) then return false; end if;
  if exists (select 1 from public.blocks where blocker = target and blocked = auth.uid()) then return false; end if;
  return exists (
    select 1 from public.members a
      join public.members b on b.conversation_id = a.conversation_id
     where a.user_id = auth.uid() and b.user_id = target
  );
end;
$$;
