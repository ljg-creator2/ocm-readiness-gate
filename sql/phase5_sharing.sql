-- Phase 5: Public Sharing + Snapshots
-- Run this in Supabase SQL Editor

-- Snapshots table (replaces user_metadata storage)
create table if not exists public.snapshots (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  snapshot_date date not null,
  data jsonb not null,
  created_at timestamptz default now(),
  unique(user_id, snapshot_date)
);

-- Shared links table (frozen public snapshots)
create table if not exists public.shared_links (
  id uuid default gen_random_uuid() primary key,
  token uuid default gen_random_uuid() not null unique,
  user_id uuid references auth.users(id) on delete cascade not null,
  label text default '',
  snapshot jsonb not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  is_active boolean default true
);

-- RLS
alter table public.snapshots enable row level security;
alter table public.shared_links enable row level security;

-- Snapshots: only owner can read/write their own
create policy "snap_select" on public.snapshots for select using (user_id = auth.uid());
create policy "snap_insert" on public.snapshots for insert with check (user_id = auth.uid());
create policy "snap_upsert" on public.snapshots for update using (user_id = auth.uid());
create policy "snap_delete" on public.snapshots for delete using (user_id = auth.uid());

-- Shared links: owner can manage their own
create policy "sl_select" on public.shared_links for select using (user_id = auth.uid());
create policy "sl_insert" on public.shared_links for insert with check (user_id = auth.uid());
create policy "sl_update" on public.shared_links for update using (user_id = auth.uid());
create policy "sl_delete" on public.shared_links for delete using (user_id = auth.uid());

-- Public read for shared links by token (anonymous access)
-- This allows anyone with the token to read the snapshot
create policy "sl_public_read" on public.shared_links for select using (
  is_active = true and expires_at > now()
);

-- RPC: fetch a shared link by token (bypasses auth for anonymous users)
create or replace function public.get_shared_snapshot(share_token uuid)
returns jsonb as $$
declare
  result jsonb;
begin
  select json_build_object(
    'snapshot', sl.snapshot,
    'label', sl.label,
    'created_at', sl.created_at,
    'expires_at', sl.expires_at
  )::jsonb into result
  from public.shared_links sl
  where sl.token = share_token
    and sl.is_active = true
    and sl.expires_at > now();

  return result;
end;
$$ language plpgsql security definer;
