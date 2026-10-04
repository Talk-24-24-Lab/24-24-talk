-- Retour arrière du profil linguistique (base de TEST). Efface la table et ses données (profils linguistiques sauvegardés).
drop function if exists public.langues_de_mes_contacts();
drop table if exists public.language_profiles;
drop function if exists private.lp_touch();
drop function if exists private.lp_codes_ok(text[]);
drop function if exists private.lp_spoken_ok(jsonb);
drop function if exists private.lp_code_ok(text);
