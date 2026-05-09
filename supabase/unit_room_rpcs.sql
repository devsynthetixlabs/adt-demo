-- SECURITY DEFINER RPCs for unit and room creation.
-- These bypass the units_all / rooms_all RLS policies which hang because
-- get_accessible_org_ids() (SECURITY DEFINER + set local row_security = off)
-- is called inside an INSERT WITH CHECK expression, corrupting the calling
-- transaction's row_security setting.
--
-- Run this in the Supabase SQL editor once.

create or replace function create_unit(p_project_id uuid, p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unit_id uuid;
begin
  -- Verify caller is a member of the org that owns this project
  if not exists (
    select 1
    from projects p
    where p.id = p_project_id
      and (
        exists (
          select 1 from organizations o
          where o.id = p.organization_id
            and o.owner_id = auth.uid()
        )
        or exists (
          select 1 from organization_members m
          where m.organization_id = p.organization_id
            and m.user_id = auth.uid()
        )
      )
  ) then
    raise exception 'Access denied';
  end if;

  insert into units (project_id, name)
  values (p_project_id, p_name)
  returning id into v_unit_id;

  return v_unit_id;
end;
$$;

create or replace function create_room(p_project_id uuid, p_unit_name text, p_room_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unit_id uuid;
  v_room_id uuid;
begin
  -- Look up the unit by project + name
  select id into v_unit_id
  from units
  where project_id = p_project_id and name = p_unit_name;

  if v_unit_id is null then
    raise exception 'Unit "%" not found in project', p_unit_name;
  end if;

  -- Verify caller is a member of the org that owns this unit's project
  if not exists (
    select 1
    from units u
    join projects p on p.id = u.project_id
    where u.id = v_unit_id
      and (
        exists (
          select 1 from organizations o
          where o.id = p.organization_id
            and o.owner_id = auth.uid()
        )
        or exists (
          select 1 from organization_members m
          where m.organization_id = p.organization_id
            and m.user_id = auth.uid()
        )
      )
  ) then
    raise exception 'Access denied';
  end if;

  insert into rooms (unit_id, name)
  values (v_unit_id, p_room_name)
  returning id into v_room_id;

  return v_room_id;
end;
$$;

-- Grant execute to authenticated users (anon key calls run as authenticated role)
grant execute on function create_unit(uuid, text) to authenticated;
grant execute on function create_room(uuid, text, text) to authenticated;
