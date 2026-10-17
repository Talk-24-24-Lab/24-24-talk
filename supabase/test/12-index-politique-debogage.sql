-- 24/24 ONE WORLD — mandat OW-TEST-002 (base de TEST 24-24-talk-test uniquement). © 2026 Sébastien Chevrier.
-- 1. Index sur hidden_messages(message_id) : la suppression d'un message (purge des messages de plus de 90 jours,
--    effacement d'un compte) vérifie la table des messages masqués ; sans index, chaque message supprimé la parcourt
--    en entier. Mesuré sur copie locale : purge de 20 000 messages avec 55 000 messages masqués = 54 s, l'envoi
--    qui la déclenche dépasse la limite de 8 s de Supabase et échoue (voir ow-test-002 dans les fichiers du projet).
-- 2. Règle « acces abonnement » : même condition, mais auth.uid() calculé une fois par requête au lieu d'une fois par ligne
--    (alerte « auth_rls_initplan » de Supabase). Aucun droit ajouté ni retiré.
-- 3. Suppression de public.zz_tmp_headers() : fonction temporaire de débogage (pays/ville d'après les en-têtes),
--    exécutable seulement par postgres et service_role, utilisée par aucune fonction, règle, vue ni fichier du site.
-- Retour arrière : 12-index-politique-debogage-retour.sql
do $$
begin
  if not exists (select 1 from pg_policy where polname = 'acces abonnement' and polrelid = 'public.messages'::regclass
                 and pg_get_expr(polwithcheck, polrelid) in ('private.has_access(auth.uid())', 'private.has_access(( SELECT auth.uid() AS uid))')) then
    raise exception 'ARRET : la règle « acces abonnement » n''est pas celle attendue, rien n''est modifié';
  end if;
end $$;

create index if not exists hidden_messages_message_idx on public.hidden_messages (message_id);

alter policy "acces abonnement" on public.messages with check (private.has_access((select auth.uid())));

drop function if exists public.zz_tmp_headers();
