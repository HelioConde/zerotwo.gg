create table if not exists public.valorant_user_matches (
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null references public.valorant_match_cache(match_id) on delete cascade,
  started_at timestamptz,
  queue_id text,
  observed_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

alter table public.valorant_user_matches enable row level security;

create index if not exists valorant_user_matches_user_started_idx
  on public.valorant_user_matches(user_id, started_at desc);

grant select, insert, update, delete on table public.valorant_user_matches to service_role;
