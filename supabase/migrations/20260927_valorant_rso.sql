-- ZeroTwo.gg — VALORANT RSO foundation
-- Player-specific VALORANT data must only be exposed after Riot Sign On opt-in.

create extension if not exists pgcrypto;

create table if not exists public.riot_rso_states (
  state uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game text not null check (game in ('valorant')),
  shard text not null check (shard in ('br','latam','na','eu','kr','ap')),
  return_to text not null,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now()
);

alter table public.riot_rso_states enable row level security;

create table if not exists public.valorant_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  puuid text not null unique,
  game_name text not null,
  tag_line text not null,
  shard text not null check (shard in ('br','latam','na','eu','kr','ap')),
  sharing_enabled boolean not null default true,
  linked_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.valorant_accounts enable row level security;

-- Intentionally no browser RLS policies.
-- These tables contain server-side identity/consent data and are accessed by Edge Functions
-- with service-role credentials only.
create index if not exists riot_rso_states_user_id_idx on public.riot_rso_states(user_id);
create index if not exists riot_rso_states_expires_at_idx on public.riot_rso_states(expires_at);
