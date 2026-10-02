create table if not exists public.valorant_match_cache (
  match_id text primary key,
  shard text not null check (shard in ('br','latam','na','eu','kr','ap')),
  game_start timestamptz,
  queue_id text,
  match_data jsonb not null,
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.valorant_match_cache enable row level security;

create index if not exists valorant_match_cache_shard_start_idx
  on public.valorant_match_cache(shard, game_start desc);

grant select, insert, update, delete on table public.valorant_match_cache to service_role;
