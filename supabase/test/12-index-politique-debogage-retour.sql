-- Retour arrière du mandat OW-TEST-002 (base de TEST). Remet exactement l'état constaté le 14 octobre 2026.
drop index if exists public.hidden_messages_message_idx;

alter policy "acces abonnement" on public.messages with check (private.has_access(auth.uid()));

create or replace function public.zz_tmp_headers() returns json
language sql security definer set search_path = '' as $$
 select json_build_object('pays', h->>'cf-ipcountry', 'ville', h->>'cf-ipcity', 'region', h->>'cf-region', 'ip_recue', (h->>'x-forwarded-for') is not null or (h->>'cf-connecting-ip') is not null, 'entetes', (select json_agg(key order by key) from json_each(h))) from (select current_setting('request.headers',true)::json as h) x
$$;
revoke all on function public.zz_tmp_headers() from public, anon, authenticated;
grant execute on function public.zz_tmp_headers() to service_role;
