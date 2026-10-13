-- ZeroTwo server-side privacy operations require access to every ZeroTwo-owned user table.
-- Only the Supabase service_role receives these explicit privileges; browser roles are unchanged.
do $permissions$
declare tbl text;
begin
  foreach tbl in array array[
    'riot_life_snapshots','valorant_user_matches','valorant_accounts','riot_rso_states',
    'duo_experience_feedback','player_discovery_settings','player_dna_snapshots',
    'player_match_feedback','test_player_interactions','client_event_logs',
    'riot_legacy_public_profiles','riot_legacy_rso_states','riot_accounts','profiles'
  ] loop
    if to_regclass(format('public.%I',tbl)) is not null then
      execute format('grant select, insert, update, delete on table public.%I to service_role',tbl);
    end if;
  end loop;
end
$permissions$;
