-- ==============================================================================
-- FLOWGRID DATABASE SCHEMA
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> Run)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  username text unique,
  avatar_url text,
  role_title text,
  job_title text,
  timezone text default 'utc',
  two_factor_enabled boolean default false,
  email_verified boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create or replace trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4))
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. WORKSPACES
create table if not exists public.workspaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text,
  description text,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. WORKSPACE MEMBERS
create table if not exists public.workspace_members (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (workspace_id, user_id)
);

create or replace function public.handle_new_workspace()
returns trigger as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function public.handle_new_workspace();

-- 4. WORKSPACE INVITATIONS
create table if not exists public.workspace_invitations (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  email text not null,
  invited_by uuid references auth.users(id) on delete cascade not null,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. PROJECTS
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  description text,
  is_archived boolean default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 6. TASKS
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  title text not null,
  description text,
  priority text default 'P3',
  due_date timestamptz,
  status text default 'todo' check (status in ('todo', 'in_progress', 'done')),
  creator_id uuid references auth.users(id) on delete set null,
  assignee_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 7. MESSAGE THREADS
create table if not exists public.message_threads (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  title text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 8. THREAD PARTICIPANTS
create table if not exists public.thread_participants (
  thread_id uuid references public.message_threads(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  is_admin boolean default false,
  last_read_at timestamptz default timezone('utc'::text, now()),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  primary key (thread_id, user_id)
);

-- 9. MESSAGES
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references public.message_threads(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 10. NOTIFICATIONS
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  ref_id text,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  title text,
  body text,
  is_read boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 11. USER PREFERENCES
create table if not exists public.user_preferences (
  user_id uuid references auth.users(id) on delete cascade primary key,
  email_notifications boolean default true,
  email_frequency text default 'instant',
  push_notifications boolean default true,
  task_updates boolean default true,
  default_task_view text default 'board',
  start_time text default '09:00',
  end_time text default '17:00',
  theme text default 'system',
  availability text default 'available',
  show_profile boolean default true,
  allow_mentions boolean default true,
  show_typing boolean default true,
  mask_email boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 12. OAUTH CONNECTIONS
create table if not exists public.oauth_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (user_id, provider)
);

-- 13. USER SESSIONS
create table if not exists public.user_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  device_info text,
  ip_address text,
  is_current boolean default false,
  last_activity_at timestamptz default timezone('utc'::text, now()) not null,
  expires_at timestamptz not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 14. AUDIT LOGS
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 15. DATA EXPORT REQUESTS
create table if not exists public.data_export_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text default 'pending',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 16. ACCOUNT DELETION REQUESTS
create table if not exists public.account_deletion_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  reason text,
  scheduled_deletion_at timestamptz not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- SECURITY DEFINER RECURSION-FREE HELPER FUNCTIONS
-- ==============================================================================
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

create or replace function public.add_thread_participants(thread_id_param uuid, participants_param uuid[])
returns void as $$
declare uid uuid;
begin
  foreach uid in array participants_param loop
    insert into public.thread_participants (thread_id, user_id)
    values (thread_id_param, uid)
    on conflict (thread_id, user_id) do nothing;
  end loop;
end;
$$ language plpgsql security definer;

create or replace function public.get_thread_participants(thread_id_param uuid)
returns table (thread_id uuid, user_id uuid, is_admin boolean, last_read_at timestamptz) as $$
begin
  return query select tp.thread_id, tp.user_id, tp.is_admin, tp.last_read_at
  from public.thread_participants tp where tp.thread_id = thread_id_param;
end;
$$ language plpgsql security definer;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.message_threads enable row level security;
alter table public.thread_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.user_preferences enable row level security;
alter table public.oauth_connections enable row level security;
alter table public.user_sessions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.data_export_requests enable row level security;
alter table public.account_deletion_requests enable row level security;

-- Profiles
drop policy if exists "Public profiles viewable by authenticated users" on public.profiles;
drop policy if exists "Public profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;

create policy "Public profiles viewable by authenticated users" on public.profiles for select to authenticated using (true);
create policy "Users can update their own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Workspaces
drop policy if exists "Members can view their workspaces" on public.workspaces;
drop policy if exists "Users can create workspaces" on public.workspaces;
drop policy if exists "Owners and admins can update workspaces" on public.workspaces;
drop policy if exists "Owners can delete workspaces" on public.workspaces;

create policy "Members can view their workspaces" on public.workspaces for select to authenticated
  using (owner_id = auth.uid() or public.is_workspace_member(id, auth.uid()));
create policy "Users can create workspaces" on public.workspaces for insert to authenticated with check (owner_id = auth.uid());
create policy "Owners and admins can update workspaces" on public.workspaces for update to authenticated
  using (owner_id = auth.uid() or public.is_workspace_member(id, auth.uid()));
create policy "Owners can delete workspaces" on public.workspaces for delete to authenticated using (owner_id = auth.uid());

-- Workspace Members
drop policy if exists "Members can view workspace membership" on public.workspace_members;
drop policy if exists "Admins and owners can manage members" on public.workspace_members;

create policy "Members can view workspace membership" on public.workspace_members for select to authenticated
  using (user_id = auth.uid() or public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Admins and owners can manage members" on public.workspace_members for all to authenticated
  using (public.is_member_or_owner(workspace_id, auth.uid()));

-- Workspace Invitations
drop policy if exists "Members can view invitations" on public.workspace_invitations;
drop policy if exists "Admins can create invitations" on public.workspace_invitations;
drop policy if exists "Admins can update invitations" on public.workspace_invitations;

create policy "Members can view invitations" on public.workspace_invitations for select to authenticated using (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Admins can create invitations" on public.workspace_invitations for insert to authenticated with check (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Admins can update invitations" on public.workspace_invitations for update to authenticated using (public.is_member_or_owner(workspace_id, auth.uid()));

-- Projects
drop policy if exists "Members can view workspace projects" on public.projects;
drop policy if exists "Members can insert projects" on public.projects;
drop policy if exists "Members can update projects" on public.projects;
drop policy if exists "Members can delete projects" on public.projects;

create policy "Members can view workspace projects" on public.projects for select to authenticated using (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Members can insert projects" on public.projects for insert to authenticated with check (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Members can update projects" on public.projects for update to authenticated using (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Members can delete projects" on public.projects for delete to authenticated using (public.is_member_or_owner(workspace_id, auth.uid()));

-- Tasks
drop policy if exists "Members can view tasks" on public.tasks;
drop policy if exists "Members can insert tasks" on public.tasks;
drop policy if exists "Members can update tasks" on public.tasks;
drop policy if exists "Members can delete tasks" on public.tasks;

create policy "Members can view tasks" on public.tasks for select to authenticated using (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Members can insert tasks" on public.tasks for insert to authenticated with check (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Members can update tasks" on public.tasks for update to authenticated using (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Members can delete tasks" on public.tasks for delete to authenticated using (public.is_member_or_owner(workspace_id, auth.uid()));

-- Message Threads
drop policy if exists "Members can view threads" on public.message_threads;
drop policy if exists "Members can create threads" on public.message_threads;

create policy "Members can view threads" on public.message_threads for select to authenticated using (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Members can create threads" on public.message_threads for insert to authenticated with check (public.is_member_or_owner(workspace_id, auth.uid()));

-- Thread Participants
drop policy if exists "Participants can view thread participants" on public.thread_participants;
drop policy if exists "Users can update own participant record" on public.thread_participants;
drop policy if exists "Users can insert participants" on public.thread_participants;
drop policy if exists "Users can delete participant records" on public.thread_participants;

create policy "Participants can view thread participants" on public.thread_participants for select to authenticated using (true);
create policy "Users can update own participant record" on public.thread_participants for update to authenticated using (user_id = auth.uid());
create policy "Users can insert participants" on public.thread_participants for insert to authenticated with check (true);
create policy "Users can delete participant records" on public.thread_participants for delete to authenticated using (user_id = auth.uid());

-- Messages
drop policy if exists "Members can view messages" on public.messages;
drop policy if exists "Members can insert messages" on public.messages;
drop policy if exists "Authors can update their messages" on public.messages;
drop policy if exists "Authors can delete their messages" on public.messages;

create policy "Members can view messages" on public.messages for select to authenticated using (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Members can insert messages" on public.messages for insert to authenticated with check (public.is_member_or_owner(workspace_id, auth.uid()));
create policy "Authors can update their messages" on public.messages for update to authenticated using (author_id = auth.uid());
create policy "Authors can delete their messages" on public.messages for delete to authenticated using (author_id = auth.uid());

-- Notifications
drop policy if exists "Users can view their notifications" on public.notifications;
drop policy if exists "Users can update their notifications" on public.notifications;
drop policy if exists "Users can insert notifications" on public.notifications;
drop policy if exists "Users can delete their notifications" on public.notifications;

create policy "Users can view their notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "Users can update their notifications" on public.notifications for update to authenticated using (user_id = auth.uid());
create policy "Users can insert notifications" on public.notifications for insert to authenticated with check (true);
create policy "Users can delete their notifications" on public.notifications for delete to authenticated using (user_id = auth.uid());

-- User Preferences
drop policy if exists "Users can view their preferences" on public.user_preferences;
drop policy if exists "Users can update their preferences" on public.user_preferences;
drop policy if exists "Users can insert their preferences" on public.user_preferences;

create policy "Users can view their preferences" on public.user_preferences for select to authenticated using (user_id = auth.uid());
create policy "Users can update their preferences" on public.user_preferences for update to authenticated using (user_id = auth.uid());
create policy "Users can insert their preferences" on public.user_preferences for insert to authenticated with check (user_id = auth.uid());

-- OAuth & Sessions & Audits & Requests
drop policy if exists "Users can manage their OAuth connections" on public.oauth_connections;
drop policy if exists "Users can manage their sessions" on public.user_sessions;
drop policy if exists "Users can view their audit logs" on public.audit_logs;
drop policy if exists "Users can manage data export requests" on public.data_export_requests;
drop policy if exists "Users can manage account deletion requests" on public.account_deletion_requests;

create policy "Users can manage their OAuth connections" on public.oauth_connections for all to authenticated using (user_id = auth.uid());
create policy "Users can manage their sessions" on public.user_sessions for all to authenticated using (user_id = auth.uid());
create policy "Users can view their audit logs" on public.audit_logs for select to authenticated using (user_id = auth.uid());
create policy "Users can manage data export requests" on public.data_export_requests for all to authenticated using (user_id = auth.uid());
create policy "Users can manage account deletion requests" on public.account_deletion_requests for all to authenticated using (user_id = auth.uid());

-- Storage policies
insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public Access to profile-images" on storage.objects;
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
drop policy if exists "Users can update their avatars" on storage.objects;
drop policy if exists "Users can delete their avatars" on storage.objects;

create policy "Public Access to profile-images" on storage.objects for select using (bucket_id = 'profile-images');
create policy "Authenticated users can upload avatars" on storage.objects for insert to authenticated with check (bucket_id = 'profile-images');
create policy "Users can update their avatars" on storage.objects for update to authenticated using (bucket_id = 'profile-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete their avatars" on storage.objects for delete to authenticated using (bucket_id = 'profile-images' and auth.uid()::text = (storage.foldername(name))[1]);
