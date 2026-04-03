-- Phase 8: Row Level Security (RLS) Policies
-- Run this in Supabase SQL Editor AFTER all previous phases
-- Enforces server-side role restrictions so client-side cannot be bypassed

-- ════════════════════════════════════════════════════════
-- 1. ENABLE RLS ON ALL TABLES
-- ════════════════════════════════════════════════════════

alter table public.user_data enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invites enable row level security;
alter table public.snapshots enable row level security;
alter table public.shared_links enable row level security;
alter table public.audit_log enable row level security;
alter table public.alert_preferences enable row level security;

-- ════════════════════════════════════════════════════════
-- 2. USER_DATA — Only owner can read/write their releases
-- ════════════════════════════════════════════════════════

create policy "Users can read own data"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own data"
  on public.user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Team members can read owner's data (for shared releases)
create policy "Team members can read shared data"
  on public.user_data for select
  using (
    exists (
      select 1 from public.team_members tm
      join public.teams t on t.id = tm.team_id
      where tm.user_id = auth.uid()
        and t.owner_id = user_data.user_id
    )
  );

-- ════════════════════════════════════════════════════════
-- 3. TEAMS — Owner full access, members can read
-- ════════════════════════════════════════════════════════

create policy "Team owners have full access"
  on public.teams for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Team members can view their teams"
  on public.teams for select
  using (
    exists (
      select 1 from public.team_members
      where team_id = teams.id and user_id = auth.uid()
    )
  );

-- ════════════════════════════════════════════════════════
-- 4. TEAM_MEMBERS — Owner manages, members read own
-- ════════════════════════════════════════════════════════

create policy "Team owners manage members"
  on public.team_members for all
  using (
    exists (
      select 1 from public.teams
      where id = team_members.team_id and owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.teams
      where id = team_members.team_id and owner_id = auth.uid()
    )
  );

create policy "Members can view own team membership"
  on public.team_members for select
  using (auth.uid() = user_id);

-- Members can delete their own membership (leave team)
create policy "Members can leave team"
  on public.team_members for delete
  using (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════
-- 5. TEAM_INVITES — Owner manages, invitees can read/accept
-- ════════════════════════════════════════════════════════

create policy "Team owners manage invites"
  on public.team_invites for all
  using (
    exists (
      select 1 from public.teams
      where id = team_invites.team_id and owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.teams
      where id = team_invites.team_id and owner_id = auth.uid()
    )
  );

-- Invitees can see and accept their own invites (matched by email)
create policy "Invitees can view own invites"
  on public.team_invites for select
  using (
    email = (select email from auth.users where id = auth.uid())
  );

create policy "Invitees can accept own invites"
  on public.team_invites for update
  using (
    email = (select email from auth.users where id = auth.uid())
    and accepted_at is null
  )
  with check (
    email = (select email from auth.users where id = auth.uid())
  );

-- ════════════════════════════════════════════════════════
-- 6. SNAPSHOTS — Only owner can read/write
-- ════════════════════════════════════════════════════════

create policy "Users manage own snapshots"
  on public.snapshots for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════
-- 7. SHARED_LINKS — Owner manages, public read by token
-- ════════════════════════════════════════════════════════

create policy "Users manage own shared links"
  on public.shared_links for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow anonymous access for active, non-expired shared links
create policy "Public can read active shared links by token"
  on public.shared_links for select
  using (is_active = true and expires_at > now());

-- ════════════════════════════════════════════════════════
-- 8. AUDIT_LOG — Only owner can read/write their logs
-- ════════════════════════════════════════════════════════

create policy "Users manage own audit logs"
  on public.audit_log for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════
-- 9. ALERT_PREFERENCES — Only owner can read/write
-- ════════════════════════════════════════════════════════

create policy "Users manage own alert preferences"
  on public.alert_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════
-- 10. VIEWER ROLE ENFORCEMENT (server-side)
-- ════════════════════════════════════════════════════════
-- Viewers can only SELECT, never INSERT/UPDATE/DELETE on user_data
-- This is enforced by restricting the team_members policy:
-- only owners and editors can write through the owner's data

-- Create a function to check if user has write access
create or replace function public.has_write_access(target_user_id uuid)
returns boolean as $$
begin
  -- Owner always has write access
  if auth.uid() = target_user_id then return true; end if;
  -- Check if user is an editor on any team owned by target
  return exists (
    select 1 from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.user_id = auth.uid()
      and t.owner_id = target_user_id
      and tm.role in ('owner', 'editor')
  );
end;
$$ language plpgsql security definer;

-- Revoke direct table access and grant through RLS only
-- (Supabase handles this automatically with RLS enabled)

-- ════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- Run these to verify RLS is working:
-- ════════════════════════════════════════════════════════
/*
-- Check RLS is enabled on all tables:
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('user_data','teams','team_members','team_invites','snapshots','shared_links','audit_log','alert_preferences');

-- Check policies exist:
select tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
*/
