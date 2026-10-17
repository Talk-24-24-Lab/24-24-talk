-- 24/24 ONE WORLD — profil linguistique (base de TEST 24-24-talk-test uniquement). © 2026 Sébastien Chevrier.
-- Principe : privé par défaut, minimisation des données. Le profil reste sur l'appareil ; il n'est enregistré ici
-- QUE si la personne coche « Sauvegarder sur mon compte ». Seule la personne lit et modifie sa ligne.
-- Ses contacts TALK (personnes déjà en discussion avec elle) ne voient ses langues QUE si elle choisit « contacts »,
-- et seulement par la fonction langues_de_mes_contacts() (langue maternelle, langues parlées, nom affiché ; rien d'autre).
-- Suppression du compte (supprimer_mon_compte) : la ligne disparaît avec le profil (ON DELETE CASCADE).
-- Retour arrière : 10-profil-linguistique-retour.sql
-- APPLIQUÉ sur la base de test le 4 octobre 2026 (migrations profil_linguistique_1 à 5). Jamais sur la production.

-- Validation des codes de langue (ex. fr, en, pt-BR, zh-TW) et des niveaux.
create or replace function private.lp_code_ok(c text) returns boolean
language sql immutable set search_path = '' as $$
  select c is not null and c ~ '^[a-z]{2,3}(-[A-Za-z]{2,4})?$'
$$;

create or replace function private.lp_spoken_ok(j jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(j) = 'array' and jsonb_array_length(j) <= 12 and not exists (
    select 1 from jsonb_array_elements(j) e
    where jsonb_typeof(e) <> 'object'
       or not private.lp_code_ok(e->>'code')
       or coalesce(e->>'level', '') not in ('A1','A2','B1','B2','C1','C2')
       or coalesce(e->>'source', 'declare') not in ('declare','estime')
       or (select count(*) from jsonb_object_keys(e)) > 3
  )
$$;

create or replace function private.lp_codes_ok(a text[]) returns boolean
language sql immutable set search_path = '' as $$
  select a is not null and coalesce(cardinality(a), 0) <= 8 and not exists (select 1 from unnest(a) x where not private.lp_code_ok(x))
$$;

create table public.language_profiles (
  user_id      uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 40 and display_name !~ '[[:cntrl:]<>]'),
  native_lang  text not null check (private.lp_code_ok(native_lang)),
  spoken       jsonb not null default '[]'::jsonb check (private.lp_spoken_ok(spoken)),
  ui_lang      text not null default 'auto' check (ui_lang = 'auto' or private.lp_code_ok(ui_lang)),
  favorites    text[] not null default '{}' check (private.lp_codes_ok(favorites)),
  -- Préférences (voix, lecture, accessibilité, communication) : objet de taille limitée, sans donnée sensible.
  prefs        jsonb not null default '{}'::jsonb check (jsonb_typeof(prefs) = 'object' and pg_column_size(prefs) <= 2048),
  visibility   text not null default 'private' check (visibility in ('private','contacts')),
  updated_at   timestamptz not null default now()
);

alter table public.language_profiles enable row level security;
-- Supabase donne par défaut tous les droits aux rôles anon et authenticated : on les retire.
revoke all on public.language_profiles from anon;
revoke truncate, references, trigger on public.language_profiles from authenticated;

create policy "mon profil linguistique" on public.language_profiles for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "session active" on public.language_profiles as restrictive for all to authenticated
  using ((select private.session_active())) with check ((select private.session_active()));

create function private.lp_touch() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger lp_touch before insert or update on public.language_profiles for each row execute function private.lp_touch();

-- Langues de mes contacts qui ont choisi « visible par mes contacts ». Rien pour les autres.
create function public.langues_de_mes_contacts()
returns table (user_id uuid, display_name text, native_lang text, spoken jsonb)
language sql stable security definer set search_path = '' as $$
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
$$;
revoke execute on function public.langues_de_mes_contacts() from public, anon;
grant execute on function public.langues_de_mes_contacts() to authenticated;
revoke execute on function private.lp_touch() from public, anon, authenticated;
