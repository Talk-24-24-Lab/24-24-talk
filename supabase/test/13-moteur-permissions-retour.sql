-- Retour arrière du lot 2 « moteur de permissions » (base de TEST). © 2026 Sébastien Chevrier.
-- Remet can_signal exactement comme après le lot 1, puis retire le moteur.

create or replace function private.can_signal(topic text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
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
$$;

drop function if exists public.ow_permissions(uuid, text);
drop function if exists private.can(text, uuid, text);
