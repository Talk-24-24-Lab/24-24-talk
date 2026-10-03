-- Durées de conservation annoncées dans la politique de confidentialité, appliquées partout.
-- Avant : les messages de plus de 90 jours n'étaient supprimés que lorsqu'un nouveau message
-- arrivait dans la même discussion. Une discussion devenue silencieuse gardait tout.
-- Après : la purge vise toute la base. Elle tourne à chaque nouveau message et, au hasard,
-- à environ 1 ouverture de l'appli sur 20 (fonction ping), donc même sans nouveaux messages.
-- Elle applique aussi les 12 mois annoncés pour les signalements.

create index if not exists messages_created_idx on public.messages(created_at);
create index if not exists reports_created_idx on public.reports(created_at);

create or replace function private.purge_expired()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.messages where created_at < now() - interval '90 days';
  delete from public.reports where created_at < now() - interval '12 months';
end;
$$;
revoke all on function private.purge_expired() from public, anon, authenticated;

create or replace function public.on_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_at = new.created_at where id = new.conversation_id;
  perform private.purge_expired();
  return new;
end;
$$;

create or replace function public.ping(sid uuid, net boolean default false)
returns void language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  s_id uuid := ping.sid;
  on_net boolean := coalesce(ping.net, false);
begin
  if s_id is null then return; end if;
  insert into public.stat_presence as p (sid, last_seen, net) values (s_id, now(), on_net)
    on conflict (sid) do update set last_seen = now(), net = excluded.net;
  if random() < 0.05 then
    delete from public.stat_presence where last_seen < now() - interval '1 day';
    delete from public.stat_devices where day < (now() at time zone 'Indian/Reunion')::date - 400;
    perform private.purge_expired();
  end if;
end;
$$;
