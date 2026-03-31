-- Phase 4: Team Collaboration + RBAC
-- Run this in Supabase SQL Editor

-- Teams table (one per release)
create table if not exists public.teams (
  id uuid default gen_random_uuid() primary key,
  release_id bigint not null,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- Team members
create table if not exists public.team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('owner','editor','viewer')),
  created_at timestamptz default now(),
  unique(team_id, user_id)
);

-- Team invites
create table if not exists public.team_invites (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  email text not null,
  role text not null check (role in ('editor','viewer')),
  invited_by uuid references auth.users(id) on delete cascade not null,
  accepted_at timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invites enable row level security;

-- Teams policies: owner or member can read
create policy "teams_select" on public.teams for select using (
  owner_id = auth.uid() or
  id in (select team_id from public.team_members where user_id = auth.uid())
);
create policy "teams_insert" on public.teams for insert with check (owner_id = auth.uid());
create policy "teams_delete" on public.teams for delete using (owner_id = auth.uid());

-- Team members policies
create policy "tm_select" on public.team_members for select using (
  team_id in (select id from public.teams where owner_id = auth.uid()) or
  user_id = auth.uid()
);
create policy "tm_insert" on public.team_members for insert with check (
  team_id in (select id from public.teams where owner_id = auth.uid())
);
create policy "tm_delete" on public.team_members for delete using (
  team_id in (select id from public.teams where owner_id = auth.uid())
);

-- Team invites policies
create policy "ti_select" on public.team_invites for select using (
  invited_by = auth.uid() or
  email = (select email from auth.users where id = auth.uid())
);
create policy "ti_insert" on public.team_invites for insert with check (
  invited_by = auth.uid()
);
create policy "ti_update" on public.team_invites for update using (
  email = (select email from auth.users where id = auth.uid())
);

-- RPC: get releases accessible to the current user (own + shared)
create or replace function public.get_accessible_releases()
returns table(user_id uuid, releases jsonb, role text) as $$
begin
  -- Own releases
  return query
    select ud.user_id, ud.releases, 'owner'::text as role
    from public.user_data ud
    where ud.user_id = auth.uid();

  -- Shared releases (via team membership)
  return query
    select ud.user_id, ud.releases, tm.role
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    join public.user_data ud on ud.user_id = t.owner_id
    where tm.user_id = auth.uid();
end;
$$ language plpgsql security definer;
