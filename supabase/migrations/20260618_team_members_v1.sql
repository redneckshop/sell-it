create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  profile_id uuid null references public.profiles(id) on delete set null,
  display_name text not null,
  email text null,
  role_title text null,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks
add column if not exists assigned_team_member_id uuid null
references public.team_members(id) on delete set null;

create index if not exists team_members_workspace_id_idx
on public.team_members(workspace_id);

create index if not exists tasks_assigned_team_member_id_idx
on public.tasks(assigned_team_member_id);

insert into public.team_members (
  workspace_id,
  profile_id,
  display_name,
  email,
  role_title,
  status
)
select
  p.workspace_id,
  p.id,
  coalesce(nullif(p.full_name, ''), p.email, 'Charles Charlebois'),
  p.email,
  'Owner',
  'Active'
from public.profiles p
where not exists (
  select 1
  from public.team_members tm
  where tm.profile_id = p.id
);

insert into public.team_members (
  workspace_id,
  display_name,
  role_title,
  status
)
select
  'ba491d9b-3b36-426d-b98a-f05b0bf271ed',
  'Trent',
  'Partner',
  'Active'
where not exists (
  select 1
  from public.team_members
  where workspace_id = 'ba491d9b-3b36-426d-b98a-f05b0bf271ed'
    and lower(display_name) = 'trent'
);

insert into public.team_members (
  workspace_id,
  display_name,
  role_title,
  status
)
select
  'ba491d9b-3b36-426d-b98a-f05b0bf271ed',
  'Angel',
  'Sales / Support',
  'Active'
where not exists (
  select 1
  from public.team_members
  where workspace_id = 'ba491d9b-3b36-426d-b98a-f05b0bf271ed'
    and lower(display_name) = 'angel'
);

update public.tasks t
set assigned_team_member_id = tm.id
from public.team_members tm
where t.assigned_to = tm.profile_id
  and t.assigned_team_member_id is null;
grant select, insert, update on table public.team_members to anon, authenticated, service_role;