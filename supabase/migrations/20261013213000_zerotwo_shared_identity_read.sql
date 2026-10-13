-- The Supabase Auth identity is shared with Chibi and TFT.
-- ZeroTwo deletion needs only READ on these tables to determine whether to keep
-- the global Auth identity; never grant delete/update/insert from ZeroTwo here.
do $audit$
declare tbl text;
begin
  foreach tbl in array array[
    'chibi_recorded_matches','chibi_riot_account_links',
    'tft_museum_collections','tft_museum_match_archive',
    'tft_museum_public_shares','tft_museum_state','tft_museum_watch_profiles'
  ] loop
    if to_regclass(format('public.%I',tbl)) is not null then
      execute format('grant select on table public.%I to service_role',tbl);
    end if;
  end loop;
end
$audit$;
