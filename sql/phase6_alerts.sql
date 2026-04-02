-- Phase 6: Email Alert Preferences
-- Run this in Supabase SQL Editor

-- Enable pg_cron and pg_net extensions
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Alert preferences table
create table if not exists public.alert_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  email text not null,
  golive_enabled boolean default true,
  golive_days int default 30,
  golive_threshold int default 50,
  stale_enabled boolean default true,
  stale_days int default 7,
  digest_enabled boolean default true,
  digest_day int default 1, -- 0=Sun, 1=Mon, ...
  adkar_enabled boolean default true,
  share_expiry_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Alert log (prevents duplicate sends)
create table if not exists public.alert_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  alert_type text not null,
  alert_key text not null, -- unique key per alert instance (e.g. release_id + type)
  sent_at timestamptz default now(),
  unique(user_id, alert_key, alert_type)
);

-- RLS
alter table public.alert_preferences enable row level security;
alter table public.alert_log enable row level security;

-- Users can only manage their own preferences
create policy "ap_select" on public.alert_preferences for select using (user_id = auth.uid());
create policy "ap_insert" on public.alert_preferences for insert with check (user_id = auth.uid());
create policy "ap_update" on public.alert_preferences for update using (user_id = auth.uid());
create policy "ap_delete" on public.alert_preferences for delete using (user_id = auth.uid());

-- Users can see their own alert log
create policy "al_select" on public.alert_log for select using (user_id = auth.uid());
-- Alert log insert is done by Edge Function (service role), not user directly
