-- ZeroTwo.gg — Riot Life persistent memory
-- Stores user-owned snapshots so Time Machine can survive device changes.
-- Frontend access is authenticated-only and protected by RLS.

create extension if not exists pgcrypto;

create table if not exists public.riot_life_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_key text not null,
  platform text not null,
  game_name text not null,
  tag_line text not null,
  captured_day date not null default current_date,
  captured_at timestamptz not null default now(),
  snapshot jsonb not null,
  constraint riot_life_snapshots_snapshot_object
    check (jsonb_typeof(snapshot) = 'object'),
  unique (user_id, player_key, captured_day)
);

alter table public.riot_life_snapshots enable row level security;

revoke all on table public.riot_life_snapshots from anon, authenticated;
grant select, insert, update on table public.riot_life_snapshots to authenticated;

drop policy if exists "riot_life_snapshots_select_own" on public.riot_life_snapshots;
create policy "riot_life_snapshots_select_own"
on public.riot_life_snapshots
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "riot_life_snapshots_insert_own" on public.riot_life_snapshots;
create policy "riot_life_snapshots_insert_own"
on public.riot_life_snapshots
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "riot_life_snapshots_update_own" on public.riot_life_snapshots;
create policy "riot_life_snapshots_update_own"
on public.riot_life_snapshots
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists riot_life_snapshots_user_id_idx
  on public.riot_life_snapshots(user_id);

create index if not exists riot_life_snapshots_player_history_idx
  on public.riot_life_snapshots(user_id, player_key, captured_at desc);
