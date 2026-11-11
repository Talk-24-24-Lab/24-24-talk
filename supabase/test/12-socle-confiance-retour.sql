-- Retour arrière du lot 1 « socle de confiance » (base de TEST). © 2026 Sébastien Chevrier.
-- Remet exactement l'état d'avant 12-socle-confiance.sql.

drop policy if exists "session active" on realtime.messages;
drop policy if exists "session active" on public.blocks;
drop policy if exists "session active" on public.reports;

drop trigger if exists profiles_before_write on public.profiles;
drop trigger if exists profiles_after_delete on public.profiles;
drop function if exists private.before_profile();
drop function if exists private.after_profile_gone();
drop table if exists private.pseudo_history;

alter function private.before_message()              set search_path = 'public';
alter function private.before_report()               set search_path = 'public';
alter function private.blocked_in(uuid)              set search_path = 'public';
alter function private.can_signal(text)              set search_path = 'public';
alter function private.has_access(uuid)              set search_path = 'public';
alter function private.is_admin()                    set search_path = 'public';
alter function private.is_member(uuid)               set search_path = 'public';
alter function private.is_suspended(uuid)            set search_path = 'public';
alter function private.shares_conversation(uuid)     set search_path = 'public';
alter function private.stats_origin_ok()             set search_path = 'public';
alter function private.welcome_new_profile()         set search_path = 'public';
alter function public.admin_ban(text, boolean)       set search_path = 'public';
alter function public.admin_moderation()             set search_path = 'public';
alter function public.admin_stats()                  set search_path = 'public';
alter function public.mon_acces()                    set search_path = 'public';
alter function public.on_new_message()               set search_path = 'public';
alter function public.ping(uuid, boolean)            set search_path = 'public';
alter function public.start_conversation(text)       set search_path = 'public';
alter function public.track(uuid, text, integer)     set search_path = 'public';
