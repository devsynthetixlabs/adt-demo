-- Ensure approvals table exists with all fields used by the frontend
create table if not exists approvals (
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

