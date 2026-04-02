-- Phase 7: Update team roles to match new role system
-- Run this in Supabase SQL Editor

-- Update existing team_members role constraint
alter table public.team_members drop constraint if exists team_members_role_check;
alter table public.team_members add constraint team_members_role_check
  check (role in ('owner','staff','exec_sponsor','client_viewer','editor','viewer'));

-- Update existing team_invites role constraint
alter table public.team_invites drop constraint if exists team_invites_role_check;
alter table public.team_invites add constraint team_invites_role_check
  check (role in ('staff','exec_sponsor','client_viewer','editor','viewer'));

-- Migrate existing roles to new names
update public.team_members set role = 'staff' where role = 'editor';
update public.team_members set role = 'staff' where role = 'viewer';
update public.team_invites set role = 'staff' where role = 'editor';
update public.team_invites set role = 'staff' where role = 'viewer';
