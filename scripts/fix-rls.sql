-- ==============================================================================
-- FIX RLS INFINITE RECURSION IN SUPABASE
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> Run)
-- ==============================================================================

-- 1. Helper functions (security definer prevents RLS recursion)
create or replace function public.is_workspace_member(ws_id uuid, u_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = u_id
  );
$$ language sql security definer set search_path = public;

create or replace function public.is_member_or_owner(ws_id uuid, u_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspaces where id = ws_id and owner_id = u_id
  ) or exists (
    select 1 from public.workspace_members where workspace_id = ws_id and user_id = u_id
  );
$$ language sql security definer set search_path = public;

-- 2. Workspace Members (fix the recursion)
drop policy if exists "Members can view workspace membership" on public.workspace_members;
drop policy if exists "Admins and owners can manage members" on public.workspace_members;

create policy "Members can view workspace membership" on public.workspace_members for select to authenticated
  using (user_id = auth.uid() or public.is_member_or_owner(workspace_id, auth.uid()));

create policy "Admins and owners can manage members" on public.workspace_members for all to authenticated
  using (public.is_member_or_owner(workspace_id, auth.uid()));

-- 3. Workspaces
drop policy if exists "Members can view their workspaces" on public.workspaces;
drop policy if exists "Users can create workspaces" on public.workspaces;
drop policy if exists "Owners and admins can update workspaces" on public.workspaces;
drop policy if exists "Owners can delete workspaces" on public.workspaces;

create policy "Members can view their workspaces" on public.workspaces for select to authenticated
  using (owner_id = auth.uid() or public.is_workspace_member(id, auth.uid()));

create policy "Users can create workspaces" on public.workspaces for insert to authenticated
  with check (owner_id = auth.uid());

create policy "Owners and admins can update workspaces" on public.workspaces for update to authenticated
  using (owner_id = auth.uid() or public.is_workspace_member(id, auth.uid()));

create policy "Owners can delete workspaces" on public.workspaces for delete to authenticated
  using (owner_id = auth.uid());

-- 4. Projects
drop policy if exists "Members can view workspace projects" on public.projects;
drop policy if exists "Members can insert projects" on public.projects;
drop policy if exists "Members can update projects" on public.projects;
drop policy if exists "Members can delete projects" on public.projects;

create policy "Members can view workspace projects" on public.projects for select to authenticated
  using (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Members can insert projects" on public.projects for insert to authenticated
  with check (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Members can update projects" on public.projects for update to authenticated
  using (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Members can delete projects" on public.projects for delete to authenticated
  using (public.is_member_or_owner(workspace_id, auth.uid()));

-- 5. Tasks
drop policy if exists "Members can view tasks" on public.tasks;
drop policy if exists "Members can insert tasks" on public.tasks;
drop policy if exists "Members can update tasks" on public.tasks;
drop policy if exists "Members can delete tasks" on public.tasks;

create policy "Members can view tasks" on public.tasks for select to authenticated
  using (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Members can insert tasks" on public.tasks for insert to authenticated
  with check (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Members can update tasks" on public.tasks for update to authenticated
  using (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Members can delete tasks" on public.tasks for delete to authenticated
  using (public.is_member_or_owner(workspace_id, auth.uid()));

-- 6. Messages & Threads
drop policy if exists "Members can view threads" on public.message_threads;
drop policy if exists "Members can create threads" on public.message_threads;

create policy "Members can view threads" on public.message_threads for select to authenticated
  using (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Members can create threads" on public.message_threads for insert to authenticated
  with check (public.is_member_or_owner(workspace_id, auth.uid()));

drop policy if exists "Members can view messages" on public.messages;
drop policy if exists "Members can insert messages" on public.messages;

create policy "Members can view messages" on public.messages for select to authenticated
  using (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Members can insert messages" on public.messages for insert to authenticated
  with check (public.is_member_or_owner(workspace_id, auth.uid()));
