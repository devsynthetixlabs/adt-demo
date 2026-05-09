-- ═══════════════════════════════
-- ANANTAM SITE MANAGER — ORG SCHEMA
-- Implements Organization concept from Step 1
-- ═══════════════════════════════

-- ─── PROFILES (update existing) ───
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  first_name text,
  last_name text,
  full_name text,
  phone text,
  dob timestamptz,
  role text check (role in ('owner', 'architect', 'contractor', 'site_supervisor', 'mep_consultant', 'vendor')),
  firm_name text,
  created_at timestamptz default now()
);

-- Ensure full_name exists and is not null
alter table profiles alter column full_name set not null;

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_full_name text;
  user_phone text;
  user_role text;
  user_firm_name text;
begin
  user_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'User'
  );

  user_phone := nullif(new.raw_user_meta_data->>'phone', '');
  user_role := nullif(new.raw_user_meta_data->>'role', '');
  user_firm_name := nullif(new.raw_user_meta_data->>'firm_name', '');

  insert into public.profiles (id, full_name, phone, role, firm_name)
  values (new.id, user_full_name, user_phone, user_role, user_firm_name)
  on conflict (id) do nothing;

  return new;
exception
  when others then
    raise warning 'Failed to create profile for user %: %', new.id, SQLERRM;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── ORGANIZATIONS ───
create table if not exists organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- ─── ORGANIZATION MEMBERS ───
create table if not exists organization_members (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('owner', 'architect', 'contractor', 'site_supervisor', 'mep_consultant', 'vendor')),
  status text not null default 'active' check (status in ('invited', 'active')),
  joined_at timestamptz default now(),
  invited_by uuid references auth.users(id) on delete set null,
  unique (organization_id, user_id)
);

-- ─── INVITATIONS ───
create table if not exists invitations (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  email text not null,
  role text not null check (role in ('architect', 'contractor', 'site_supervisor', 'mep_consultant', 'vendor')),
  token text unique not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- ─── PROJECTS ───
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  icon text default '🏛',
  client text not null,
  address text,
  start_date date,
  end_date date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- ─── PROJECT MEMBERS ───
create table if not exists project_members (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('site_supervisor', 'electrician', 'plumber', 'carpenter', 'painter', 'tiler', 'ac_contractor')),
  color text default '#E8601C',
  visibility text[] default '{"tasks", "comms"}',
  joined_at timestamptz default now(),
  unique (project_id, user_id)
);

-- ─── UNITS ───
create table if not exists units (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  sort_order int default 0,
  unique (project_id, name)
);

-- ─── ROOMS ───
create table if not exists rooms (
  id uuid default gen_random_uuid() primary key,
  unit_id uuid references units(id) on delete cascade not null,
  name text not null,
  sort_order int default 0,
  unique (unit_id, name)
);

-- ─── TASKS ───
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  unit_id uuid references units(id) on delete set null,
  room_id uuid references rooms(id) on delete set null,
  description text not null,
  assignee_id uuid references project_members(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done', 'delayed')),
  start_date date,
  end_date date,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- ═══════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ═══════════════════════════════

-- ═════════════════════════════
-- SECURITY DEFINER FUNCTIONS (to avoid RLS recursion)
-- ═════════════════════════════

-- Single function to get ALL organization IDs where user has access
-- Runs with SECURITY DEFINER (bypasses RLS completely)
create or replace function get_accessible_org_ids()
returns table(org_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  set local row_security = off;
  return query
    select id from organizations where owner_id = auth.uid()
    union
    select organization_id from organization_members where user_id = auth.uid();
end;
$$;

-- Function to create organization + add owner as member (bypasses RLS)
create or replace function create_organization_with_owner(org_name text, owner_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  set local row_security = off;

  insert into organizations (name, owner_id)
  values (org_name, owner_id)
  returning id into new_org_id;

  insert into organization_members (organization_id, user_id, role)
  values (new_org_id, owner_id, 'owner');

  return new_org_id;
end;
$$;

-- PROFILES
alter table profiles enable row level security;
drop policy if exists profiles_select on profiles;
drop policy if exists profiles_update on profiles;
create policy profiles_select on profiles for select using (auth.role() = 'authenticated');
create policy profiles_update on profiles for update using (auth.uid() = id);

-- ORGANIZATIONS
-- NOTE: orgs_select uses a direct exists check on organization_members.
-- This is safe because org_members_select (below) only checks user_id = auth.uid(),
-- so there is no circular dependency.
alter table organizations enable row level security;
drop policy if exists orgs_select on organizations;
drop policy if exists orgs_insert on organizations;
drop policy if exists orgs_update on organizations;
create policy orgs_select on organizations for select
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from organization_members
      where organization_members.organization_id = organizations.id
        and organization_members.user_id = auth.uid()
    )
  );
create policy orgs_insert on organizations for insert
  with check (owner_id = auth.uid());
create policy orgs_update on organizations for update
  using (owner_id = auth.uid());

-- ORGANIZATION MEMBERS
-- CRITICAL: org_members_select must be dead simple (user_id = auth.uid() only).
-- Any org lookup here would cause recursion via orgs_select → org_members_select.
alter table organization_members enable row level security;
drop policy if exists org_members_select on organization_members;
drop policy if exists org_members_insert on organization_members;
drop policy if exists org_members_update on organization_members;
drop policy if exists org_members_delete on organization_members;
create policy org_members_select on organization_members for select
  using (user_id = auth.uid());
create policy org_members_insert on organization_members for insert
  with check (
    user_id = auth.uid()
    or organization_id in (
      select id from organizations where owner_id = auth.uid()
    )
  );
create policy org_members_update on organization_members for update
  using (organization_id in (
    select id from organizations where owner_id = auth.uid()
  ));
create policy org_members_delete on organization_members for delete
  using (organization_id in (
    select id from organizations where owner_id = auth.uid()
  ));

-- PROJECTS
alter table projects enable row level security;
drop policy if exists projects_select on projects;
drop policy if exists projects_insert on projects;
drop policy if exists projects_update on projects;
drop policy if exists projects_delete on projects;
create policy projects_select on projects for select
  using (organization_id in (select get_accessible_org_ids()));
create policy projects_insert on projects for insert
  with check (created_by = auth.uid());
create policy projects_update on projects for update
  using (created_by = auth.uid());
create policy projects_delete on projects for delete
  using (created_by = auth.uid());

-- PROJECT MEMBERS
alter table project_members enable row level security;
drop policy if exists pj_members_select on project_members;
drop policy if exists pj_members_all on project_members;
create policy pj_members_select on project_members for select
  using (user_id = auth.uid() or project_id in (
    select id from projects where organization_id in (select get_accessible_org_ids())
  ));
create policy pj_members_all on project_members for all
  using (project_id in (
    select id from projects where organization_id in (select get_accessible_org_ids())
  ));

-- UNITS
alter table units enable row level security;
drop policy if exists units_select on units;
drop policy if exists units_all on units;
create policy units_select on units for select
  using (project_id in (
    select id from projects where organization_id in (select get_accessible_org_ids())
  ));
create policy units_all on units for all
  using (project_id in (
    select id from projects where organization_id in (select get_accessible_org_ids())
  ));

-- ROOMS
alter table rooms enable row level security;
drop policy if exists rooms_select on rooms;
drop policy if exists rooms_all on rooms;
create policy rooms_select on rooms for select
  using (unit_id in (
    select u.id from units u join projects p on p.id = u.project_id
    where p.organization_id in (select get_accessible_org_ids())
  ));
create policy rooms_all on rooms for all
  using (unit_id in (
    select u.id from units u join projects p on p.id = u.project_id
    where p.organization_id in (select get_accessible_org_ids())
  ));

-- TASKS
alter table tasks enable row level security;
drop policy if exists tasks_select on tasks;
drop policy if exists tasks_all on tasks;
create policy tasks_select on tasks for select
  using (project_id in (
    select id from projects where organization_id in (select get_accessible_org_ids())
  ));
create policy tasks_all on tasks for all
  using (project_id in (
    select id from projects where organization_id in (select get_accessible_org_ids())
  ));

-- ═══════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ═══════════════════════════════
create index if not exists idx_org_members_user on organization_members(user_id);
create index if not exists idx_org_members_org on organization_members(organization_id);
create index if not exists idx_pj_members_project on project_members(project_id);
create index if not exists idx_pj_members_user on project_members(user_id);
create index if not exists idx_tasks_project on tasks(project_id);
create index if not exists idx_tasks_assignee on tasks(assignee_id);
create index if not exists idx_units_project on units(project_id);
create index if not exists idx_rooms_unit on rooms(unit_id);
