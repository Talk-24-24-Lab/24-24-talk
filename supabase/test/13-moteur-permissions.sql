-- 24/24 ONE WORLD — Lot 2 « moteur de permissions ». © 2026 Sébastien Chevrier. Tous droits réservés.
-- Base de TEST uniquement. Retour arrière : 13-moteur-permissions-retour.sql.
--
-- Une seule décision d'autorisation côté serveur : private.can(action, cible, contexte).
-- Elle réutilise les garde-fous existants (session_active, is_suspended, shares_conversation, blocks) et ne change
-- AUCUN comportement de TALK : la sonnerie des appels (can_signal) passe désormais par elle, à l'identique.
--
-- Actions connues : read_profile, message, call, start_conversation, block, report.
-- Contexte : seul « personal » existe aujourd'hui ; tout autre contexte est refusé (confidentialité par défaut)
-- jusqu'à ce que le lot 3 (relations et contextes) le définisse.
-- Une action inconnue, une cible inconnue ou un appareil déconnecté donnent toujours « non », sans dire pourquoi
-- (pas de fuite sur l'existence d'un compte).

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
      -- même règle qu'avant : contact réel (discussion partagée) et pas bloqué par la cible
      if p_target = me then return false; end if;
      if exists (select 1 from public.blocks b where b.blocker = p_target and b.blocked = me) then return false; end if;
      return private.shares_conversation(p_target);

    when 'start_conversation' then
      -- même règle que start_conversation() : personne suspendue ou blocage dans un sens ou l'autre = non
      if p_target = me or private.is_suspended(me) or private.is_suspended(p_target) then return false; end if;
      return not exists (select 1 from public.blocks b
                          where (b.blocker = me and b.blocked = p_target) or (b.blocker = p_target and b.blocked = me));

    when 'block', 'report' then
      return p_target <> me;

    else
      return false;
  end case;
end;
$$;
revoke all on function private.can(text, uuid, text) from public, anon, authenticated;

-- La sonnerie des appels passe par le moteur (comportement identique, vérifié par les essais).
create or replace function private.can_signal(topic text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if topic is null or topic !~ '^user:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return private.can('call', substr(topic, 6)::uuid, 'personal');
end;
$$;

-- Ce que le téléphone peut demander : « que puis-je faire avec cette personne, dans ce contexte ? »
-- Réponse uniquement en oui / non ; tout « non » si la personne n'existe pas (aucune énumération de comptes).
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
    'block',              private.can('block', p_other, p_context),
    'report',             private.can('report', p_other, p_context)
  );
$$;
revoke all on function public.ow_permissions(uuid, text) from public, anon;
grant execute on function public.ow_permissions(uuid, text) to authenticated;
