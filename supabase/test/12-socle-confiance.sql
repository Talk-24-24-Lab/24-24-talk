-- 24/24 ONE WORLD — Lot 1 « socle de confiance ». © 2026 Sébastien Chevrier. Tous droits réservés.
-- Base de TEST uniquement (projet 24-24-talk-test). Retour arrière : 12-socle-confiance-retour.sql.
-- Ne change aucun comportement attendu de TALK : ferme seulement des écarts relevés à l'audit du 5 oct. 2026.
--
--   E1  profiles.created_at fixé par le serveur à la création (le téléphone ne peut plus antidater son profil)
--   E2  temps réel : un jeton d'une session déconnectée ne peut plus écouter ni émettre (règle « session active »)
--   R1  blocks et reports : règle « session active », comme les autres tables du compte
--   R2  anciennes fonctions : search_path vide (tous les objets y sont déjà nommés avec leur schéma)
--   C2  pseudo : au plus un changement par 30 jours ; un pseudo libéré (changé ou compte supprimé) reste réservé
--       30 jours à son ancien titulaire, contre l'usurpation. Erreur 23505 = « pseudo déjà pris » dans TALK.

-- ---------- C2 : historique minimal des pseudos libérés (30 jours, puis effacé) ----------
create table if not exists private.pseudo_history (
  pseudo      text        not null,
  user_id     uuid        not null,
  released_at timestamptz not null default now()
);
create index if not exists pseudo_history_pseudo on private.pseudo_history (pseudo, released_at);
create index if not exists pseudo_history_user on private.pseudo_history (user_id, released_at);
alter table private.pseudo_history enable row level security;  -- aucune règle : fermé au site
revoke all on private.pseudo_history from anon, authenticated;

-- ---------- E1 + C2 : contrôle des profils côté serveur ----------
create or replace function private.before_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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

  -- un pseudo libéré par quelqu'un d'autre il y a moins de 30 jours reste réservé
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
$$;

create or replace function private.after_profile_gone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.pseudo_history (pseudo, user_id) values (old.pseudo, old.id);
  return old;
end;
$$;

revoke all on function private.before_profile() from public, anon, authenticated;
revoke all on function private.after_profile_gone() from public, anon, authenticated;

create trigger profiles_before_write before insert or update on public.profiles
  for each row execute function private.before_profile();
create trigger profiles_after_delete after delete on public.profiles
  for each row execute function private.after_profile_gone();

-- ---------- R1 : « session active » sur blocks et reports ----------
create policy "session active" on public.blocks as restrictive for all to authenticated
  using ((select private.session_active())) with check ((select private.session_active()));
create policy "session active" on public.reports as restrictive for all to authenticated
  using ((select private.session_active())) with check ((select private.session_active()));

-- ---------- E2 : « session active » sur le temps réel (boîtes privées user:<id>) ----------
create policy "session active" on realtime.messages as restrictive for all to authenticated
  using ((select private.session_active())) with check ((select private.session_active()));

-- ---------- R2 : search_path vide sur les anciennes fonctions ----------
alter function private.before_message()              set search_path = '';
alter function private.before_report()               set search_path = '';
alter function private.blocked_in(uuid)              set search_path = '';
alter function private.can_signal(text)              set search_path = '';
alter function private.has_access(uuid)              set search_path = '';
alter function private.is_admin()                    set search_path = '';
alter function private.is_member(uuid)               set search_path = '';
alter function private.is_suspended(uuid)            set search_path = '';
alter function private.shares_conversation(uuid)     set search_path = '';
alter function private.stats_origin_ok()             set search_path = '';
alter function private.welcome_new_profile()         set search_path = '';
alter function public.admin_ban(text, boolean)       set search_path = '';
alter function public.admin_moderation()             set search_path = '';
alter function public.admin_stats()                  set search_path = '';
alter function public.mon_acces()                    set search_path = '';
alter function public.on_new_message()               set search_path = '';
alter function public.ping(uuid, boolean)            set search_path = '';
alter function public.start_conversation(text)       set search_path = '';
alter function public.track(uuid, text, integer)     set search_path = '';
