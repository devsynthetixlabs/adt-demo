-- ═══════════════════════════════════════════
-- ANANTAM SITE MANAGER — SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- ─── PROFILES (extends auth.users) ───
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('owner', 'architect', 'contractor')),
  firm_name text,
  phone text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, role, firm_name, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'role',
    new.raw_user_meta_data->>'firm_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Enable RLS
alter table profiles enable row level security;

-- Users can read all profiles
create policy "Profiles are viewable by all authenticated users"
  on profiles for select
  using (auth.role() = 'authenticated');

-- Users can only update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- ─── PROJECTS ───
create table projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  icon text default '🏛',
  client text not null,
  address text,
  owner_id uuid references profiles(id) on delete cascade not null,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

alter table projects enable row level security;

create policy "Owners can manage their projects"
  on projects for all
  using (auth.uid() = owner_id);

create policy "Projects are viewable by authenticated users"
  on projects for select
  using (auth.role() = 'authenticated');

-- ─── UNITS ───
create table units (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  name text not null
);

alter table units enable row level security;

create policy "CRUD units via project ownership"
  on units for all
  using (
    exists (
      select 1 from projects
      where projects.id = units.project_id
      and projects.owner_id = auth.uid()
    )
  );

-- ─── ROOMS ───
create table rooms (
  id uuid default gen_random_uuid() primary key,
  unit_id uuid references units(id) on delete cascade not null,
  name text not null
);

alter table rooms enable row level security;

create policy "CRUD rooms via project ownership"
  on rooms for all
  using (
    exists (
      select 1 from units
      join projects on projects.id = units.project_id
      where units.id = rooms.unit_id
      and projects.owner_id = auth.uid()
    )
  );

-- ─── TASKS ───
create table tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  unit_id uuid references units(id) on delete set null,
  room_id uuid references rooms(id) on delete set null,
  description text not null,
  assignee_name text,
  start_date date,
  end_date date,
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Done', 'Delayed')),
  notes text,
  created_at timestamptz default now()
);

alter table tasks enable row level security;

create policy "CRUD tasks via project ownership"
  on tasks for all
  using (
    exists (
      select 1 from projects
      where projects.id = tasks.project_id
      and projects.owner_id = auth.uid()
    )
  );

-- ─── MATERIALS ───
create table materials (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  category text,
  unit text,
  room text,
  vendor text,
  qty text,
  order_date date,
  eta date,
  status text not null default 'Pending Order' check (status in ('Ordered', 'Delivered', 'Pending Order', 'On Hold')),
  notes text,
  created_at timestamptz default now()
);

alter table materials enable row level security;

create policy "CRUD materials via project ownership"
  on materials for all
  using (
    exists (
      select 1 from projects
      where projects.id = materials.project_id
      and projects.owner_id = auth.uid()
    )
  );

-- ─── APPROVALS ───
create table approvals (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  description text not null,
  type text,
  unit text,
  submitted_by text,
  submitted_at date,
  responded_at date,
  status text not null default 'Pending' check (status in ('Approved', 'Pending', 'Rejected', 'Revision Required')),
  remarks text,
  created_at timestamptz default now()
);

alter table approvals enable row level security;

create policy "CRUD approvals via project ownership"
  on approvals for all
  using (
    exists (
      select 1 from projects
      where projects.id = approvals.project_id
      and projects.owner_id = auth.uid()
    )
  );

-- ─── SNAGS ───
create table snags (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  description text not null,
  severity text not null check (severity in ('Critical', 'Major', 'Minor')),
  unit text,
  room text,
  assignee text,
  target_date date,
  raised_by text,
  status text not null default 'Open' check (status in ('Open', 'In Rectification', 'Rectified', 'Signed Off')),
  created_at timestamptz default now()
);

alter table snags enable row level security;

create policy "CRUD snags via project ownership"
  on snags for all
  using (
    exists (
      select 1 from projects
      where projects.id = snags.project_id
      and projects.owner_id = auth.uid()
    )
  );

-- ─── DRAWINGS ───
create table drawings (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  type text,
  unit text,
  file_size text,
  storage_path text,
  created_at timestamptz default now()
);

alter table drawings enable row level security;

create policy "CRUD drawings via project ownership"
  on drawings for all
  using (
    exists (
      select 1 from projects
      where projects.id = drawings.project_id
      and projects.owner_id = auth.uid()
    )
  );

-- ─── NOTES ───
create table notes (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  text text not null,
  priority text not null default 'medium' check (priority in ('high', 'medium', 'info')),
  created_at timestamptz default now()
);

alter table notes enable row level security;

create policy "CRUD notes via project ownership"
  on notes for all
  using (
    exists (
      select 1 from projects
      where projects.id = notes.project_id
      and projects.owner_id = auth.uid()
    )
  );

-- ─── COMMS CHANNELS ───
create table comms_channels (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  sub text,
  icon text default '💬',
  unit text,
  created_at timestamptz default now()
);

alter table comms_channels enable row level security;

create policy "CRUD comms channels via project ownership"
  on comms_channels for all
  using (
    exists (
      select 1 from projects
      where projects.id = comms_channels.project_id
      and projects.owner_id = auth.uid()
    )
  );

-- ─── COMMS MESSAGES ───
create table comms_messages (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid references comms_channels(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete set null,
  sender_name text not null,
  text text not null,
  tag text,
  photo_url text,
  created_at timestamptz default now()
);

alter table comms_messages enable row level security;

create policy "CRUD comms messages via project ownership"
  on comms_messages for all
  using (
    exists (
      select 1 from comms_channels
      join projects on projects.id = comms_channels.project_id
      where comms_channels.id = comms_messages.channel_id
      and projects.owner_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════
-- SEED DATA (Optional — for demo project)
-- ═══════════════════════════════════════════
