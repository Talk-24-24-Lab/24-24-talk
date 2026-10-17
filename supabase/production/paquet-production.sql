-- 24/24 ONE WORLD — PAQUET SQL DE PRODUCTION (base « 24/24 Talk »)
-- Met la base de production au niveau de la base de TEST du 14 octobre 2026 :
--   sessions par appareil, profil linguistique, photos de profil, présence en ligne,
--   messages masqués, pseudos réservés 30 jours, suppression du compte, durées de conservation,
--   abonnement : gratuit tant que le paiement (Stripe) et une structure juridique n'existent pas ; la date du
--   1er novembre 2026 peut rester affichée sur le site (choix de Sébastien, 15 octobre 2026, « Gratuit en attendant »,
--   qui remplace son choix du 14 octobre « Laisse payant au 1er novembre »). Le jour où le paiement existe,
--   changer seulement la date de private.billing_settings.
-- Tout se fait en une seule transaction : si une ligne échoue, rien n'est changé.
-- Retour arrière : retour-paquet-production.sql
-- À coller seulement AVEC la mise en ligne du nouveau site (sinon l'ancien site fonctionne toujours, mais
-- sans utiliser ces nouveautés).
begin;

-- 0. Garde-fou : bonne base, paquet pas encore appliqué
do $$ begin
  if to_regclass('public.messages') is null or to_regclass('public.profiles') is null then
    raise exception 'ARRÊT : ce n''est pas la base 24/24 Talk';
  end if;
  if to_regclass('public.language_profiles') is not null then
    raise exception 'ARRÊT : le paquet est déjà appliqué';
  end if;
end $$;

-- 1. Fonctions de contrôle du profil linguistique (utilisées par les contraintes de la table)
create or replace function private.lp_code_ok(c text) returns boolean
language sql immutable set search_path to '' as $function$
  select c is not null and c ~ '^[a-z]{2,3}(-[A-Za-z]{2,4})?$'
$function$;

create or replace function private.lp_codes_ok(a text[]) returns boolean
language sql immutable set search_path to '' as $function$
  select a is not null and coalesce(cardinality(a), 0) <= 8 and not exists (select 1 from unnest(a) x where not private.lp_code_ok(x))
$function$;

create or replace function private.lp_spoken_ok(j jsonb) returns boolean
language sql immutable set search_path to '' as $function$
  select jsonb_typeof(j) = 'array' and jsonb_array_length(j) <= 12 and not exists (
    select 1 from jsonb_array_elements(j) e
    where jsonb_typeof(e) <> 'object'
       or not private.lp_code_ok(e->>'code')
       or coalesce(e->>'level', '') not in ('A1','A2','B1','B2','C1','C2')
       or coalesce(e->>'source', 'declare') not in ('declare','estime')
       or (select count(*) from jsonb_object_keys(e)) > 3
  )
$function$;

create or replace function private.lp_touch() returns trigger
language plpgsql set search_path to '' as $function$
begin new.updated_at := now(); return new; end $function$;

-- 2. Nouvelles tables et colonnes
create table private.billing_settings (
  id boolean not null default true,
  free_until timestamp with time zone not null,
  constraint billing_settings_pkey primary key (id),
  constraint billing_settings_id_check check (id)
);
-- 2100-01-01 = gratuit sans date de fin réelle (choix du 15 octobre 2026). Ancienne valeur : '2026-11-01 00:00:00+04'.
insert into private.billing_settings (id, free_until) values (true, '2100-01-01 00:00:00+00');

create table private.subscriptions (
  user_id uuid not null,
  status text not null,
  current_period_end timestamp with time zone,
  stripe_customer_id text,
  stripe_subscription_id text,
  updated_at timestamp with time zone not null default now(),
  constraint subscriptions_pkey primary key (user_id),
  constraint subscriptions_status_check check (status = any (array['active','trialing','past_due','canceled','unpaid','incomplete'])),
  constraint subscriptions_stripe_subscription_id_key unique (stripe_subscription_id),
  constraint subscriptions_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade
);

create table private.presence (
  user_id uuid not null,
  last_seen timestamp with time zone not null default now(),
  hidden boolean not null default false,
  constraint presence_pkey primary key (user_id),
  constraint presence_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade
);
alter table private.presence enable row level security;

create table private.pseudo_history (
  pseudo text not null,
  user_id uuid not null,
  released_at timestamp with time zone not null default now()
);
create index pseudo_history_user on private.pseudo_history using btree (user_id, released_at);
create index pseudo_history_pseudo on private.pseudo_history using btree (pseudo, released_at);
alter table private.pseudo_history enable row level security;

create table private.avatars (
  user_id uuid not null,
  img text not null,
  updated_at timestamp with time zone not null default now(),
  constraint avatars_pkey primary key (user_id),
  constraint avatars_img_check check ((length(img) <= 60000) and (img ~ '^data:image/(jpeg|webp);base64,[A-Za-z0-9+/]+=*$')),
  constraint avatars_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade
);
alter table private.avatars enable row level security;

revoke all on private.billing_settings, private.subscriptions, private.presence, private.pseudo_history, private.avatars from public, anon, authenticated;

create table public.language_profiles (
  user_id uuid not null,
  display_name text not null default '',
  native_lang text not null,
  spoken jsonb not null default '[]'::jsonb,
  ui_lang text not null default 'auto',
  favorites text[] not null default '{}'::text[],
  prefs jsonb not null default '{}'::jsonb,
  visibility text not null default 'private',
  updated_at timestamp with time zone not null default now(),
  constraint language_profiles_pkey primary key (user_id),
  constraint language_profiles_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint language_profiles_display_name_check check ((char_length(display_name) <= 40) and (display_name !~ '[[:cntrl:]<>]')),
  constraint language_profiles_favorites_check check (private.lp_codes_ok(favorites)),
  constraint language_profiles_native_lang_check check (private.lp_code_ok(native_lang)),
  constraint language_profiles_prefs_check check ((jsonb_typeof(prefs) = 'object') and (pg_column_size(prefs) <= 2048)),
  constraint language_profiles_spoken_check check (private.lp_spoken_ok(spoken)),
  constraint language_profiles_ui_lang_check check ((ui_lang = 'auto') or private.lp_code_ok(ui_lang)),
  constraint language_profiles_visibility_check check (visibility = any (array['private','contacts']))
);
alter table public.language_profiles enable row level security;
revoke all on public.language_profiles from public, anon, authenticated;
grant select, insert, update, delete on public.language_profiles to authenticated;

create table public.hidden_messages (
  user_id uuid not null default auth.uid(),
  message_id bigint not null,
  created_at timestamp with time zone not null default now(),
  constraint hidden_messages_pkey primary key (user_id, message_id),
  constraint hidden_messages_message_id_fkey foreign key (message_id) references public.messages(id) on delete cascade,
  constraint hidden_messages_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade
);
alter table public.hidden_messages enable row level security;
revoke all on public.hidden_messages from public, anon, authenticated;
grant select, insert, update, delete, truncate, references, trigger on public.hidden_messages to authenticated;
-- index sur message_id : sans lui, effacer un message (purge des 90 jours) parcourt toute la table (mandat OW-TEST-002)
create index hidden_messages_message_idx on public.hidden_messages (message_id);

alter table public.members add column cleared_at timestamp with time zone;
grant update (cleared_at) on public.members to authenticated;

alter table private.push_subs add column session_id uuid;

alter table private.moderation_log drop constraint moderation_log_action_check;
alter table private.moderation_log add constraint moderation_log_action_check
  check (action = any (array['suspendre','retablir','retirer_photo']));

-- 3. Fonctions (versions de TEST ; chemin de recherche vide = plus sûr)
create or replace function private.after_profile_gone() returns trigger
language plpgsql security definer set search_path to '' as $function$
begin
  insert into private.pseudo_history (pseudo, user_id) values (old.pseudo, old.id);
  return old;
end;
$function$;

create or replace function private.before_message() returns trigger
language plpgsql security definer set search_path to '' as $function$
begin
  new.created_at := now();
  -- compte suspendu : erreur explicite pour que l'appli affiche « compte suspendu »
  -- (la règle « compte non suspendu » reste en place comme seconde barrière)
  if new.sender_id is not null and private.is_suspended(new.sender_id) then
    raise exception 'SUSPENDED' using errcode = 'P0001';
  end if;
  if new.sender_id is null or exists (select 1 from public.admins where uid = new.sender_id) then
    return new;
  end if;
  if (select count(*) from public.messages
       where sender_id = new.sender_id and created_at > now() - interval '1 minute') >= 30
  or (select count(*) from public.messages
       where sender_id = new.sender_id and created_at > now() - interval '24 hours') >= 1000 then
    raise exception 'RATE_LIMIT' using errcode = 'P0001', hint = 'messages';
  end if;
  return new;
end;
$function$;

create or replace function private.before_profile() returns trigger
language plpgsql security definer set search_path to '' as $function$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
  else
    new.created_at := old.created_at;
    new.id := old.id;
  end if;

  if tg_op = 'UPDATE' and new.pseudo is not distinct from old.pseudo then
    return new;
  end if;

  if exists (select 1 from private.pseudo_history h
              where h.pseudo = new.pseudo and h.user_id <> new.id
                and h.released_at > now() - interval '30 days') then
    raise exception 'duplicate key value violates unique constraint "profiles_pseudo_key"'
      using errcode = '23505', hint = 'pseudo_reserve';
  end if;

  if tg_op = 'UPDATE' then
    if not exists (select 1 from public.admins a where a.uid = new.id)
       and exists (select 1 from private.pseudo_history h
                    where h.user_id = new.id and h.released_at > now() - interval '30 days') then
      raise exception 'RATE_LIMIT' using errcode = 'P0001', hint = 'pseudo';
    end if;
    insert into private.pseudo_history (pseudo, user_id) values (old.pseudo, old.id);
  end if;

  if random() < 0.05 then
    delete from private.pseudo_history where released_at < now() - interval '30 days';
  end if;
  return new;
end;
$function$;

create or replace function private.before_report() returns trigger
language plpgsql security definer set search_path to '' as $function$
begin
  if new.reporter is not null
     and not exists (select 1 from public.admins where uid = new.reporter)
     and (select count(*) from public.reports
           where reporter = new.reporter and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'RATE_LIMIT' using errcode = 'P0001', hint = 'reports';
  end if;
  new.created_at := now();
  return new;
end;
$function$;

create or replace function private.blocked_in(conv uuid) returns boolean
language sql stable security definer set search_path to '' as $function$
  select exists (
    select 1 from public.members m join public.blocks b on b.blocker = m.user_id and b.blocked = auth.uid()
     where m.conversation_id = conv
  );
$function$;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path to '' as $function$
  select exists (select 1 from public.admins where uid = auth.uid());
$function$;

create or replace function private.is_member(conv uuid) returns boolean
language sql stable security definer set search_path to '' as $function$
  select exists (select 1 from public.members where conversation_id = conv and user_id = auth.uid());
$function$;

create or replace function private.is_suspended(who uuid default null::uuid) returns boolean
language sql stable security definer set search_path to '' as $function$
  select exists (select 1 from private.suspensions where user_id = coalesce(who, auth.uid()));
$function$;

create or replace function private.session_active() returns boolean
language sql stable security definer set search_path to '' as $function$
  select exists (
    select 1 from auth.sessions s
    where s.id = nullif(auth.jwt()->>'session_id', '')::uuid and s.user_id = auth.uid()
  )
$function$;

create or replace function private.shares_conversation(other uuid) returns boolean
language sql stable security definer set search_path to '' as $function$
  select exists (
    select 1 from public.members a
      join public.members b on b.conversation_id = a.conversation_id
     where a.user_id = auth.uid() and b.user_id = other
  );
$function$;

create or replace function private.can(p_action text, p_target uuid, p_context text default 'personal'::text) returns boolean
language plpgsql stable security definer set search_path to '' as $function$
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
$function$;

create or replace function private.can_signal(topic text) returns boolean
language plpgsql stable security definer set search_path to '' as $function$
begin
  if topic is null or topic !~ '^user:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return private.can('call', substr(topic, 6)::uuid, 'personal');
end;
$function$;

create or replace function private.has_access(uid uuid) returns boolean
language sql stable security definer set search_path to '' as $function$
  select uid is not null and (
       now() < (select free_until from private.billing_settings)
    or exists (select 1 from public.admins where admins.uid = has_access.uid)
    or exists (select 1 from private.subscriptions s
                where s.user_id = has_access.uid
                  and s.status in ('active', 'trialing', 'past_due')
                  and (s.current_period_end is null or s.current_period_end > now() - interval '3 days'))
  );
$function$;

create or replace function private.photo_visible(target uuid) returns boolean
language sql stable security definer set search_path to '' as $function$
  select (select auth.uid()) is not null
     and (
       target = (select auth.uid())
       or (
         exists (select 1 from public.members a join public.members b on a.conversation_id = b.conversation_id
                  where a.user_id = (select auth.uid()) and b.user_id = target)
         and not exists (select 1 from public.blocks bl
                          where (bl.blocker = target and bl.blocked = (select auth.uid()))
                             or (bl.blocker = (select auth.uid()) and bl.blocked = target))
         and not private.is_suspended(target)
       )
     )
$function$;

create or replace function private.stats_origin_ok() returns boolean
language plpgsql stable security definer set search_path to '' as $function$
declare
  h text := current_setting('request.headers', true);
  o text;
begin
  if h is null or h = '' then return true; end if;
  begin o := h::json ->> 'origin'; exception when others then return false; end;
  return o is not null and exists (select 1 from private.stats_origins where origin = o);
end;
$function$;

create or replace function private.welcome_new_profile() returns trigger
language plpgsql security definer set search_path to '' as $function$
declare
  admin_id uuid;
  conv uuid;
begin
  select uid into admin_id from public.admins limit 1;
  if admin_id is null or new.id = admin_id then return new; end if;
  begin
    insert into public.conversations default values returning id into conv;
    insert into public.members (conversation_id, user_id, last_read)
      values (conv, admin_id, now()), (conv, new.id, now() - interval '1 second');
    insert into public.messages (conversation_id, sender_id, body, lang, kind)
      values (conv, admin_id, 'Bienvenue @' || new.pseudo || ' dans l''aventure 24/24', 'fr', 'text');
  exception when others then
    raise warning 'welcome_new_profile: %', sqlerrm;
  end;
  return new;
end;
$function$;

create or replace function public.admin_ban(target_pseudo text, suspendre boolean) returns json
language plpgsql security definer set search_path to '' as $function$
declare
  me uuid := auth.uid();
  target uuid;
  clean text := lower(trim(coalesce(target_pseudo, '')));
begin
  if me is null or not private.is_admin() then raise exception 'NOT_ADMIN'; end if;
  select id into target from public.profiles where pseudo = clean;
  if target is null then raise exception 'NOT_FOUND'; end if;
  if target = me or exists (select 1 from public.admins where uid = target) then
    raise exception 'ADMIN_PROTEGE';
  end if;
  if coalesce(suspendre, false) then
    insert into private.suspensions (user_id, suspended_by) values (target, me)
      on conflict (user_id) do nothing;
    insert into private.moderation_log (admin_id, target_id, target_pseudo, action) values (me, target, clean, 'suspendre');
  else
    delete from private.suspensions where user_id = target;
    insert into private.moderation_log (admin_id, target_id, target_pseudo, action) values (me, target, clean, 'retablir');
  end if;
  return json_build_object('ok', true, 'pseudo', clean, 'suspendu', coalesce(suspendre, false));
end;
$function$;

create or replace function public.admin_moderation() returns json
language plpgsql security definer set search_path to '' as $function$
declare
  res json;
begin
  if auth.uid() is null or not private.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;
  select json_build_object(
    'reports', coalesce((
      select json_agg(r order by r.cree desc) from (
        select pc.pseudo as cible,
               pr.pseudo as par,
               rep.created_at as cree,
               (rep.reported is not null and private.is_suspended(rep.reported)) as suspendu,
               rep.reason as motif,
               rep.body_copy as message
          from public.reports rep
          left join public.profiles pc on pc.id = rep.reported
          left join public.profiles pr on pr.id = rep.reporter
         order by rep.created_at desc
         limit 200
      ) r), '[]'::json),
    'bannis', coalesce((
      select json_agg(p.pseudo order by p.pseudo)
        from private.suspensions s join public.profiles p on p.id = s.user_id), '[]'::json)
  ) into res;
  return res;
end;
$function$;

create or replace function public.admin_photo(target_pseudo text) returns text
language plpgsql stable security definer set search_path to '' as $function$
begin
  if auth.uid() is null or not private.is_admin() then raise exception 'NOT_ADMIN'; end if;
  return (select a.img from private.avatars a join public.profiles p on p.id = a.user_id
           where p.pseudo = lower(trim(coalesce(target_pseudo, ''))));
end $function$;

create or replace function public.admin_retirer_photo(target_pseudo text) returns json
language plpgsql security definer set search_path to '' as $function$
declare me uuid := auth.uid(); target uuid; clean text := lower(trim(coalesce(target_pseudo, '')));
begin
  if me is null or not private.is_admin() then raise exception 'NOT_ADMIN'; end if;
  select id into target from public.profiles where pseudo = clean;
  if target is null then raise exception 'NOT_FOUND'; end if;
  delete from private.avatars where user_id = target;
  insert into private.moderation_log (admin_id, target_id, target_pseudo, action) values (me, target, clean, 'retirer_photo');
  return json_build_object('ok', true, 'pseudo', clean);
end $function$;

create or replace function public.admin_stats() returns json
language plpgsql security definer set search_path to '' as $function$
declare
  today date := (now() at time zone 'Indian/Reunion')::date;
  res json;
begin
  if auth.uid() is null or not exists (select 1 from public.admins where uid = auth.uid()) then
    raise exception 'NOT_ADMIN';
  end if;
  select json_build_object(
    'now', now(),
    'online', (select count(*) from public.stat_presence where last_seen > now() - interval '2 minutes'),
    'online_net', (select count(*) from public.stat_presence where last_seen > now() - interval '2 minutes' and net),
    'today', json_build_object(
      'personnes', (select count(*) from public.stat_devices where day = today),
      'ouvertures', coalesce((select n from public.stat_days where day = today and kind = 'ouverture'), 0),
      'traductions', coalesce((select n from public.stat_days where day = today and kind = 'traduction'), 0),
      'messages', (select count(*) from public.messages where (created_at at time zone 'Indian/Reunion')::date = today),
      'appels', coalesce((select n from public.stat_days where day = today and kind = 'appel'), 0),
      'minutes', round(coalesce((select n from public.stat_days where day = today and kind = 'appel_sec'), 0) / 60.0, 1),
      'inscrits', (select count(*) from public.profiles where (created_at at time zone 'Indian/Reunion')::date = today)
    ),
    'days', (
      select json_agg(json_build_object(
        'day', g.d,
        'personnes', (select count(*) from public.stat_devices v where v.day = g.d),
        'ouvertures', coalesce((select n from public.stat_days s where s.day = g.d and s.kind = 'ouverture'), 0),
        'traductions', coalesce((select n from public.stat_days s where s.day = g.d and s.kind = 'traduction'), 0),
        'messages', (select count(*) from public.messages m where (m.created_at at time zone 'Indian/Reunion')::date = g.d),
        'appels', coalesce((select n from public.stat_days s where s.day = g.d and s.kind = 'appel'), 0),
        'minutes', round(coalesce((select n from public.stat_days s where s.day = g.d and s.kind = 'appel_sec'), 0) / 60.0, 1),
        'inscrits', (select count(*) from public.profiles p where (p.created_at at time zone 'Indian/Reunion')::date = g.d)
      ) order by g.d)
      from (select gs::date as d from generate_series(today - 29, today, interval '1 day') as gs) g
    ),
    'totals', json_build_object(
      'inscrits', (select count(*) from public.profiles),
      'discussions', (select count(*) from public.conversations),
      'messages', (select count(*) from public.messages),
      'traductions', coalesce((select sum(n) from public.stat_days where kind = 'traduction'), 0),
      'appels', coalesce((select sum(n) from public.stat_days where kind = 'appel'), 0),
      'minutes', round(coalesce((select sum(n) from public.stat_days where kind = 'appel_sec'), 0) / 60.0, 1),
      'personnes_30j', (select count(distinct sid) from public.stat_devices where day > today - 30)
    ),
    'users', (
      select coalesce(json_agg(u order by u.cree desc), '[]'::json) from (
        select p.pseudo, p.lang, p.created_at as cree,
          (select max(m.created_at) from public.messages m where m.sender_id = p.id) as dernier_message,
          (select count(*) from public.messages m where m.sender_id = p.id) as messages
        from public.profiles p order by p.created_at desc limit 300
      ) u
    ),
    'quota', json_build_object(
      'db_mo', round(pg_database_size(current_database()) / 1048576.0, 1),
      'actifs_mois', (select count(*) from auth.users where last_sign_in_at >= date_trunc('month', now())),
      'temps_reel', (select count(distinct (claims ->> 'sub')) from realtime.subscription)
    )
  ) into res;
  return res;
end;
$function$;

create or replace function public.deconnecter_appareil(sid uuid) returns boolean
language plpgsql security definer set search_path to '' as $function$
declare me uuid := auth.uid(); cur uuid := nullif(auth.jwt()->>'session_id', '')::uuid;
begin
  if me is null or not private.session_active() then raise exception 'AUTH'; end if;
  if sid is null or sid = cur then raise exception 'CURRENT'; end if;
  delete from private.push_subs where session_id = sid and user_id = me;
  delete from auth.sessions where id = sid and user_id = me;
  return found;
end $function$;

create or replace function public.je_suis_la(cacher boolean default null::boolean) returns boolean
language plpgsql security definer set search_path to '' as $function$
declare
  me uuid := auth.uid();
  h boolean;
begin
  if me is null or not private.session_active() then return null; end if;
  if not exists (select 1 from public.profiles where id = me) then return null; end if;
  insert into private.presence as p (user_id, last_seen, hidden)
    values (me, now(), coalesce(cacher, false))
  on conflict (user_id) do update
    set last_seen = now(), hidden = coalesce(cacher, p.hidden)
  returning p.hidden into h;
  return h;
end;
$function$;

create or replace function public.langues_de_mes_contacts()
returns table(user_id uuid, display_name text, native_lang text, spoken jsonb)
language sql stable security definer set search_path to '' as $function$
  select lp.user_id, lp.display_name, lp.native_lang, lp.spoken
  from public.language_profiles lp
  where (select auth.uid()) is not null
    and (select private.session_active())
    and lp.visibility = 'contacts'
    and lp.user_id <> (select auth.uid())
    and exists (
      select 1 from public.members a join public.members b on a.conversation_id = b.conversation_id
      where a.user_id = (select auth.uid()) and b.user_id = lp.user_id)
    and not exists (select 1 from public.blocks bl where bl.blocker = lp.user_id and bl.blocked = (select auth.uid()))
$function$;

create or replace function public.mes_appareils()
returns table(id uuid, appareil text, depuis timestamp with time zone, vu timestamp with time zone, actuel boolean)
language sql stable security definer set search_path to '' as $function$
  select s.id, coalesce(s.user_agent, ''), s.created_at,
         greatest(s.created_at, s.updated_at, (s.refreshed_at at time zone 'UTC')),
         s.id = nullif(auth.jwt()->>'session_id', '')::uuid
  from auth.sessions s
  where s.user_id = auth.uid() and (select private.session_active())
  order by 4 desc
$function$;

create or replace function public.mettre_ma_photo(img text) returns timestamp with time zone
language plpgsql security definer set search_path to '' as $function$
declare me uuid := auth.uid(); t timestamptz := now();
begin
  if me is null or not private.session_active() then raise exception 'AUTH'; end if;
  if not exists (select 1 from public.profiles where id = me) then raise exception 'NO_PROFILE'; end if;
  if private.is_suspended(me) then raise exception 'SUSPENDED'; end if;
  if img is null or length(img) > 60000 or img !~ '^data:image/(jpeg|webp);base64,[A-Za-z0-9+/]+=*$' then
    raise exception 'BAD_IMAGE';
  end if;
  if (select count(*) from private.rate_log where user_id = me and action = 'photo' and at > now() - interval '24 hours') >= 20 then
    raise exception 'RATE_LIMIT' using hint = 'photo';
  end if;
  insert into private.rate_log (user_id, action, at) values (me, 'photo', t);
  insert into private.avatars as a (user_id, img, updated_at) values (me, mettre_ma_photo.img, t)
    on conflict (user_id) do update set img = excluded.img, updated_at = excluded.updated_at;
  return t;
end $function$;

create or replace function public.mon_acces() returns json
language sql stable security definer set search_path to '' as $function$
  select json_build_object(
    'acces', private.has_access(auth.uid()),
    'gratuit_jusqu_au', (select free_until from private.billing_settings),
    'abonne', exists (select 1 from private.subscriptions s where s.user_id = auth.uid()
                        and s.status in ('active', 'trialing', 'past_due')),
    'fin_periode', (select current_period_end from private.subscriptions s where s.user_id = auth.uid())
  )
  where (select private.session_active());
$function$;

create or replace function public.on_new_message() returns trigger
language plpgsql security definer set search_path to '' as $function$
begin
  update public.conversations set last_at = new.created_at where id = new.conversation_id;
  delete from public.messages where conversation_id = new.conversation_id and created_at < now() - interval '90 days';
  return new;
end;
$function$;

create or replace function public.ow_permissions(p_other uuid, p_context text default 'personal'::text) returns jsonb
language sql stable security definer set search_path to '' as $function$
  select jsonb_build_object(
    'context',            coalesce(p_context, 'personal'),
    'read_profile',       private.can('read_profile', p_other, p_context),
    'message',            private.can('message', p_other, p_context),
    'call',               private.can('call', p_other, p_context),
    'start_conversation', private.can('start_conversation', p_other, p_context),
    'block',              private.can('block', p_other, p_context),
    'report',             private.can('report', p_other, p_context)
  );
$function$;

create or replace function public.photos(ids uuid[])
returns table(user_id uuid, img text, updated_at timestamp with time zone)
language sql stable security definer set search_path to '' as $function$
  select a.user_id, a.img, a.updated_at from private.avatars a
   where (select private.session_active())
     and a.user_id = any((ids)[1:50])
     and private.photo_visible(a.user_id)
$function$;

create or replace function public.photos_de_mes_contacts()
returns table(user_id uuid, updated_at timestamp with time zone)
language sql stable security definer set search_path to '' as $function$
  select a.user_id, a.updated_at from private.avatars a
   where (select private.session_active()) and private.photo_visible(a.user_id)
$function$;

create or replace function public.ping(sid uuid, net boolean default false) returns void
language plpgsql security definer set search_path to '' as $function$
#variable_conflict use_column
declare
  s_id uuid := ping.sid;
  on_net boolean := coalesce(ping.net, false);
begin
  if s_id is null then return; end if;
  if not private.stats_origin_ok() then return; end if;
  if exists (select 1 from public.stat_presence where sid = s_id) then
    update public.stat_presence set last_seen = now(), net = on_net where sid = s_id;
  elsif (select count(*) from public.stat_presence) < 5000 then
    insert into public.stat_presence (sid, last_seen, net) values (s_id, now(), on_net)
      on conflict (sid) do update set last_seen = now(), net = excluded.net;
  end if;
  if random() < 0.05 then
    delete from public.stat_presence where last_seen < now() - interval '1 day';
    delete from public.stat_devices where day < (now() at time zone 'Indian/Reunion')::date - 400;
  end if;
end;
$function$;

create or replace function public.presence_de_mes_contacts()
returns table(user_id uuid, last_seen timestamp with time zone)
language sql stable security definer set search_path to '' as $function$
  select p.user_id, p.last_seen
  from private.presence p
  where (select auth.uid()) is not null
    and (select private.session_active())
    and p.user_id <> (select auth.uid())
    and not p.hidden
    -- réciprocité : qui cache sa présence ne voit pas celle des autres
    and not exists (select 1 from private.presence m where m.user_id = (select auth.uid()) and m.hidden)
    and exists (
      select 1 from public.members a join public.members b on a.conversation_id = b.conversation_id
      where a.user_id = (select auth.uid()) and b.user_id = p.user_id)
    and not exists (
      select 1 from public.blocks bl
      where (bl.blocker = p.user_id and bl.blocked = (select auth.uid()))
         or (bl.blocker = (select auth.uid()) and bl.blocked = p.user_id))
$function$;

create or replace function public.retirer_ma_photo() returns void
language plpgsql security definer set search_path to '' as $function$
begin
  if auth.uid() is null or not private.session_active() then raise exception 'AUTH'; end if;
  delete from private.avatars where user_id = auth.uid();
end $function$;

create or replace function public.start_conversation(other_pseudo text) returns uuid
language plpgsql security definer set search_path to '' as $function$
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

create or replace function public.supprimer_mon_compte() returns void
language plpgsql security definer set search_path to '' as $function$
declare me uuid := auth.uid();
begin
  if me is null or not private.session_active() then raise exception 'AUTH'; end if;
  delete from auth.users where id = me;
end $function$;

create or replace function public.track(sid uuid, kind text, amount integer default 1) returns void
language plpgsql security definer set search_path to '' as $function$
#variable_conflict use_column
declare
  d date := (now() at time zone 'Indian/Reunion')::date;
  k text := track.kind;
  a integer;
  s_id uuid := track.sid;
begin
  if k is null or k not in ('ouverture', 'traduction', 'appel', 'appel_sec', 'voix_ok', 'voix_echec', 'voix_relais') then
    return;
  end if;
  if not private.stats_origin_ok() then return; end if;
  a := case when k = 'appel_sec' then greatest(1, least(coalesce(track.amount, 1), 7200)) else 1 end;
  if exists (select 1 from public.stat_days where day = d and kind = k and n >= 1000000) then return; end if;
  insert into public.stat_days as s (day, kind, n) values (d, k, a)
    on conflict (day, kind) do update set n = s.n + excluded.n;
  if k = 'ouverture' and s_id is not null
     and (select count(*) from public.stat_devices where day = d) < 20000 then
    insert into public.stat_devices (day, sid) values (d, s_id) on conflict do nothing;
  end if;
end;
$function$;

-- Durées de conservation : 90 jours pour les messages, 12 mois pour les signalements, partout
create index if not exists messages_created_idx on public.messages (created_at);
create index if not exists reports_created_idx on public.reports (created_at);
create or replace function private.purger_anciennes_donnees() returns trigger
language plpgsql security definer set search_path to '' as $function$
begin
  -- après chaque nouveau message : toujours ; ailleurs : 1 fois sur 20 pour rester léger
  if tg_table_name = 'messages' or random() < 0.05 then
    delete from public.messages where created_at < now() - interval '90 days';
    delete from public.reports where created_at < now() - interval '12 months';
  end if;
  return null;
end $function$;

-- Droits d'exécution des fonctions (identiques à TEST)
do $$
declare f text;
begin
  foreach f in array array[
    'private.lp_code_ok(text)', 'private.lp_codes_ok(text[])', 'private.lp_spoken_ok(jsonb)', 'private.lp_touch()',
    'private.after_profile_gone()', 'private.before_message()', 'private.before_profile()', 'private.before_report()',
    'private.blocked_in(uuid)', 'private.can(text,uuid,text)', 'private.can_signal(text)', 'private.has_access(uuid)',
    'private.is_admin()', 'private.is_member(uuid)', 'private.is_suspended(uuid)', 'private.photo_visible(uuid)',
    'private.session_active()', 'private.shares_conversation(uuid)', 'private.stats_origin_ok()', 'private.welcome_new_profile()',
    'private.purger_anciennes_donnees()',
    'public.admin_ban(text,boolean)', 'public.admin_moderation()', 'public.admin_photo(text)', 'public.admin_retirer_photo(text)',
    'public.admin_stats()', 'public.deconnecter_appareil(uuid)', 'public.je_suis_la(boolean)', 'public.langues_de_mes_contacts()',
    'public.mes_appareils()', 'public.mettre_ma_photo(text)', 'public.mon_acces()', 'public.on_new_message()',
    'public.ow_permissions(uuid,text)', 'public.photos(uuid[])', 'public.photos_de_mes_contacts()', 'public.ping(uuid,boolean)',
    'public.presence_de_mes_contacts()', 'public.retirer_ma_photo()', 'public.start_conversation(text)',
    'public.supprimer_mon_compte()', 'public.track(uuid,text,integer)']
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;
  foreach f in array array['private.lp_code_ok(text)', 'private.lp_codes_ok(text[])', 'private.lp_spoken_ok(jsonb)'] loop
    execute format('grant execute on function %s to public', f);
  end loop;
  foreach f in array array[
    'private.blocked_in(uuid)', 'private.can_signal(text)', 'private.has_access(uuid)', 'private.is_admin()',
    'private.is_member(uuid)', 'private.is_suspended(uuid)', 'private.photo_visible(uuid)', 'private.session_active()',
    'private.shares_conversation(uuid)',
    'public.admin_ban(text,boolean)', 'public.admin_moderation()', 'public.admin_photo(text)', 'public.admin_retirer_photo(text)',
    'public.admin_stats()', 'public.deconnecter_appareil(uuid)', 'public.je_suis_la(boolean)', 'public.langues_de_mes_contacts()',
    'public.mes_appareils()', 'public.mettre_ma_photo(text)', 'public.mon_acces()', 'public.ow_permissions(uuid,text)',
    'public.photos(uuid[])', 'public.photos_de_mes_contacts()', 'public.ping(uuid,boolean)', 'public.presence_de_mes_contacts()',
    'public.retirer_ma_photo()', 'public.start_conversation(text)', 'public.supprimer_mon_compte()', 'public.track(uuid,text,integer)']
  loop
    execute format('grant execute on function %s to authenticated', f);
  end loop;
  execute 'grant execute on function public.ping(uuid,boolean) to anon';
  execute 'grant execute on function public.track(uuid,text,integer) to anon';
end $$;

-- 4. Déclencheurs
create trigger lp_touch before insert or update on public.language_profiles
  for each row execute function private.lp_touch();
create trigger profiles_before_write before insert or update on public.profiles
  for each row execute function private.before_profile();
create trigger profiles_after_delete after delete on public.profiles
  for each row execute function private.after_profile_gone();
drop trigger if exists purge_conservation on public.messages;
create trigger purge_conservation after insert on public.messages
  for each statement execute function private.purger_anciennes_donnees();
drop trigger if exists purge_conservation on public.stat_presence;
create trigger purge_conservation after insert or update on public.stat_presence
  for each statement execute function private.purger_anciennes_donnees();
create trigger purge_conservation after insert or update on private.presence
  for each statement execute function private.purger_anciennes_donnees();

-- 5. Règles d'accès
create policy "masquer un message" on public.hidden_messages as permissive for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "mes messages masqués" on public.hidden_messages as permissive for select to authenticated
  using (user_id = (select auth.uid()));
create policy "mon profil linguistique" on public.language_profiles as permissive for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "acces abonnement" on public.messages as restrictive for insert to authenticated
  with check (private.has_access((select auth.uid())));
-- une connexion supprimée depuis « Mes appareils » perd l'accès tout de suite
do $$
declare t text;
begin
  foreach t in array array['public.blocks', 'public.conversations', 'public.hidden_messages', 'public.language_profiles',
                           'public.members', 'public.messages', 'public.profiles', 'public.reports', 'realtime.messages'] loop
    execute format('create policy "session active" on %s as restrictive for all to authenticated '
                   'using ((select private.session_active())) with check ((select private.session_active()))', t);
  end loop;
end $$;

-- 6. Purge immédiate du retard, puis vérification
delete from public.messages where created_at < now() - interval '90 days';
delete from public.reports where created_at < now() - interval '12 months';

select (select count(*) from pg_proc where pronamespace in ('public'::regnamespace, 'private'::regnamespace)) as fonctions,
       (select count(*) from pg_policy where polname = 'session active') as regles_session,
       (select count(*) from pg_trigger where tgname = 'purge_conservation') as declencheurs_conservation,
       (select free_until from private.billing_settings) as gratuit_jusqu_au;
commit;
