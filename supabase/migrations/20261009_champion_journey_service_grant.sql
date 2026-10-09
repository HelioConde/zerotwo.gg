-- Applied to ZeroTwo gamer Supabase only (bieihhaobdztjyoweewa), 2026-10-09.
-- Snapshot source is trusted Riot server; direct browser access remains revoked.
grant select, insert on table public.lol_champion_journey_snapshots to service_role;
revoke all on table public.lol_champion_journey_snapshots from anon, authenticated;
