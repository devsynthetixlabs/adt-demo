-- Ensure materials table exists with all fields used by the frontend
create table if not exists materials (
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
  received_by text,
  received_date date,
  images jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS if not already enabled
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'materials'
  ) then
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
  end if;
end
$$;
