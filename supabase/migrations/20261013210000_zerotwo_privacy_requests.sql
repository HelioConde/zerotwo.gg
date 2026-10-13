-- Authenticated private LGPD mailbox; service role only.
-- Requests remain available after account deletion for follow-up.
create extension if not exists pgcrypto;
create table if not exists public.zerotwo_privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  reply_email text not null check (char_length(reply_email) <= 320),
  request_type text not null check(request_type in ('access','correction','deletion','other')),
  message text not null check(char_length(message) between 15 and 1200),
  status text not null default 'received'
    check(status in ('received','processing','resolved','rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.zerotwo_privacy_requests enable row level security;
revoke all on table public.zerotwo_privacy_requests from public, anon, authenticated;
grant select, insert, update, delete on table public.zerotwo_privacy_requests to service_role;
create index if not exists zerotwo_privacy_requests_user_created
  on public.zerotwo_privacy_requests (user_id, created_at desc);
create index if not exists zerotwo_privacy_requests_status_created
  on public.zerotwo_privacy_requests (status, created_at desc);
