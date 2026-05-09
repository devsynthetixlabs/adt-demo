create table project_contacts (
  id uuid default gen_random_uuid() primary key,
  project_id text not null,
  name text not null,
  email text default '',
  phone text default '',
  role text default 'Contractor',
  color text default '#E8601C',
  designation text default '',
  visibility jsonb default '["tasks", "comms"]',
  login_status text default 'pending',
  created_at timestamptz default now(),
  unique (project_id, name)
);

create or replace function get_project_contacts(p_project_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contacts jsonb;
begin
  select jsonb_agg(
    jsonb_build_object(
      'name', name,
      'email', email,
      'phone', phone,
      'role', role,
      'designation', designation,
      'color', color,
      'visibility', visibility,
      'loginStatus', login_status
    )
  )
  from project_contacts
  where project_id = p_project_id
  into v_contacts;

  return coalesce(v_contacts, '[]'::jsonb);
end;
$$;

create or replace function replace_project_contacts(p_project_id text, p_contacts jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from project_contacts where project_id = p_project_id;

  insert into project_contacts (project_id, name, email, phone, role, designation, color, visibility, login_status)
  select
    p_project_id,
    c->>'name',
    coalesce(c->>'email', ''),
    coalesce(c->>'phone', ''),
    coalesce(c->>'role', 'Contractor'),
    coalesce(c->>'designation', ''),
    coalesce(c->>'color', '#E8601C'),
    coalesce((c->>'visibility')::jsonb, '["tasks", "comms"]'),
    coalesce(c->>'loginStatus', 'pending')
  from jsonb_array_elements(p_contacts) as c;
end;
$$;

grant execute on function get_project_contacts(text) to authenticated;
grant execute on function replace_project_contacts(text, jsonb) to authenticated;
