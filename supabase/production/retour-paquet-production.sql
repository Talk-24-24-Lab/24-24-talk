-- 24/24 ONE WORLD — RETOUR ARRIÈRE du paquet-production.sql (base « 24/24 Talk »)
-- Remet la base dans l'état du 14 octobre 2026, avant le paquet.
-- ATTENTION : efface définitivement les photos de profil, profils linguistiques, messages masqués,
-- présences, pseudos réservés et abonnements créés depuis le paquet.
-- Garde les durées de conservation (90 jours / 12 mois), promises par la page confidentialité.
-- Une seule transaction : si une ligne échoue, rien n'est changé.
begin;

do $$ begin
  if to_regclass('public.language_profiles') is null then
    raise exception 'ARRÊT : le paquet n''est pas appliqué sur cette base';
  end if;
end $$;

-- 1. Règles ajoutées
do $$
declare t text;
begin
  foreach t in array array['public.blocks', 'public.conversations', 'public.members', 'public.messages',
                           'public.profiles', 'public.reports', 'realtime.messages'] loop
    execute format('drop policy if exists "session active" on %s', t);
  end loop;
end $$;
drop policy if exists "acces abonnement" on public.messages;

-- 2. Déclencheurs ajoutés
drop trigger if exists profiles_before_write on public.profiles;
drop trigger if exists profiles_after_delete on public.profiles;

-- 3. Tables et colonnes ajoutées (avec leurs données)
drop table public.language_profiles;
drop table public.hidden_messages;
drop table private.avatars;
drop table private.presence;
drop table private.pseudo_history;
drop table private.subscriptions;
drop table private.billing_settings;
alter table public.members drop column cleared_at;
alter table private.push_subs drop column session_id;
delete from private.moderation_log where action = 'retirer_photo';
alter table private.moderation_log drop constraint moderation_log_action_check;
alter table private.moderation_log add constraint moderation_log_action_check
  check (action = any (array['suspendre','retablir']));

-- 4. Versions d'avant des fonctions déjà présentes (relevées en lecture seule le 14 octobre 2026)
create or replace function private.before_message() returns trigger
language plpgsql security definer set search_path to 'public' as $function$
begin
  new.created_at := now();
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

create or replace function private.before_report() returns trigger
language plpgsql security definer set search_path to 'public' as $function$
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
language sql stable security definer set search_path to 'public' as $function$
  select exists (
    select 1 from public.members m join public.blocks b on b.blocker = m.user_id and b.blocked = auth.uid()
     where m.conversation_id = conv
  );
$function$;

create or replace function private.can_signal(topic text) returns boolean
language plpgsql stable security definer set search_path to 'public' as $function$
declare
  target uuid;
begin
  if topic is null or topic !~ '^user:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  target := substr(topic, 6)::uuid;
  if target = auth.uid() then return false; end if;
  if exists (select 1 from public.blocks where blocker = target and blocked = auth.uid()) then return false; end if;
  return exists (
    select 1 from public.members a
      join public.members b on b.conversation_id = a.conversation_id
     where a.user_id = auth.uid() and b.user_id = target
  );
end;
$function$;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path to 'public' as $function$
  select exists (select 1 from public.admins where uid = auth.uid());
$function$;

create or replace function private.is_member(conv uuid) returns boolean
language sql stable security definer set search_path to 'public' as $function$
  select exists (select 1 from public.members where conversation_id = conv and user_id = auth.uid());
$function$;

create or replace function private.is_suspended(who uuid default null::uuid) returns boolean
language sql stable security definer set search_path to 'public' as $function$
  select exists (select 1 from private.suspensions where user_id = coalesce(who, auth.uid()));
$function$;

create or replace function private.shares_conversation(other uuid) returns boolean
language sql stable security definer set search_path to 'public' as $function$
  select exists (
    select 1 from public.members a
      join public.members b on b.conversation_id = a.conversation_id
     where a.user_id = auth.uid() and b.user_id = other
  );
$function$;

create or replace function private.stats_origin_ok() returns boolean
language plpgsql stable security definer set search_path to 'public' as $function$
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
language plpgsql security definer set search_path to 'public' as $function$
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
language plpgsql security definer set search_path to 'public' as $function$
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
language plpgsql security definer set search_path to 'public' as $function$
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

create or replace function public.admin_stats() returns json
language plpgsql security definer set search_path to 'public' as $function$
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

create or replace function public.on_new_message() returns trigger
language plpgsql security definer set search_path to 'public' as $function$
begin
  update public.conversations set last_at = new.created_at where id = new.conversation_id;
  delete from public.messages where conversation_id = new.conversation_id and created_at < now() - interval '90 days';
  return new;
end;
$function$;

create or replace function public.ping(sid uuid, net boolean default false) returns void
language plpgsql security definer set search_path to 'public' as $function$
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

create or replace function public.start_conversation(other_pseudo text) returns uuid
language plpgsql security definer set search_path to 'public' as $function$
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

create or replace function public.track(sid uuid, kind text, amount integer default 1) returns void
language plpgsql security definer set search_path to 'public' as $function$
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

-- 5. Fonctions ajoutées
drop function private.after_profile_gone();
drop function private.before_profile();
drop function public.ow_permissions(uuid, text);
drop function private.can(text, uuid, text);
drop function public.mon_acces();
drop function private.has_access(uuid);
drop function public.photos(uuid[]);
drop function public.photos_de_mes_contacts();
drop function private.photo_visible(uuid);
drop function public.admin_photo(text);
drop function public.admin_retirer_photo(text);
drop function public.deconnecter_appareil(uuid);
drop function public.je_suis_la(boolean);
drop function public.langues_de_mes_contacts();
drop function public.mes_appareils();
drop function public.mettre_ma_photo(text);
drop function public.presence_de_mes_contacts();
drop function public.retirer_ma_photo();
drop function public.supprimer_mon_compte();
drop function private.session_active();
drop function private.lp_touch();
drop function private.lp_spoken_ok(jsonb);
drop function private.lp_codes_ok(text[]);
drop function private.lp_code_ok(text);

select 'retour fait' as etat,
       (select count(*) from pg_proc where pronamespace in ('public'::regnamespace, 'private'::regnamespace)) as fonctions;
commit;
