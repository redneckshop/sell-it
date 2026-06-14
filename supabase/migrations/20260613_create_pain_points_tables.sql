create table if not exists public.pain_points (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null references public.workspaces(id) on delete cascade,

  name text not null,
  description text,
  category text,

  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pain_point_companies (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null references public.workspaces(id) on delete cascade,

  pain_point_id uuid not null references public.pain_points(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  unique (pain_point_id, company_id)
);

create table if not exists public.pain_point_contacts (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null references public.workspaces(id) on delete cascade,

  pain_point_id uuid not null references public.pain_points(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  unique (pain_point_id, contact_id)
);

create table if not exists public.pain_point_activities (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null references public.workspaces(id) on delete cascade,

  pain_point_id uuid not null references public.pain_points(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  unique (pain_point_id, activity_id)
);

create table if not exists public.pain_point_posts (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null references public.workspaces(id) on delete cascade,

  pain_point_id uuid not null references public.pain_points(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  unique (pain_point_id, post_id)
);

create index if not exists pain_points_workspace_id_idx
on public.pain_points(workspace_id);

create index if not exists pain_point_companies_pain_point_id_idx
on public.pain_point_companies(pain_point_id);

create index if not exists pain_point_companies_company_id_idx
on public.pain_point_companies(company_id);

create index if not exists pain_point_contacts_pain_point_id_idx
on public.pain_point_contacts(pain_point_id);

create index if not exists pain_point_contacts_contact_id_idx
on public.pain_point_contacts(contact_id);

create index if not exists pain_point_activities_pain_point_id_idx
on public.pain_point_activities(pain_point_id);

create index if not exists pain_point_activities_activity_id_idx
on public.pain_point_activities(activity_id);

create index if not exists pain_point_posts_pain_point_id_idx
on public.pain_point_posts(pain_point_id);

create index if not exists pain_point_posts_post_id_idx
on public.pain_point_posts(post_id);

create or replace function public.set_pain_points_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_pain_points_updated_at on public.pain_points;

create trigger set_pain_points_updated_at
before update on public.pain_points
for each row
execute function public.set_pain_points_updated_at();

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.pain_points to anon, authenticated;
grant select, insert, update, delete on public.pain_point_companies to anon, authenticated;
grant select, insert, update, delete on public.pain_point_contacts to anon, authenticated;
grant select, insert, update, delete on public.pain_point_activities to anon, authenticated;
grant select, insert, update, delete on public.pain_point_posts to anon, authenticated;

alter table public.pain_points enable row level security;
alter table public.pain_point_companies enable row level security;
alter table public.pain_point_contacts enable row level security;
alter table public.pain_point_activities enable row level security;
alter table public.pain_point_posts enable row level security;

drop policy if exists "Allow public read access for pain points during build" on public.pain_points;
create policy "Allow public read access for pain points during build"
on public.pain_points
for select
using (true);

drop policy if exists "Allow public insert access for pain points during build" on public.pain_points;
create policy "Allow public insert access for pain points during build"
on public.pain_points
for insert
with check (true);

drop policy if exists "Allow public update access for pain points during build" on public.pain_points;
create policy "Allow public update access for pain points during build"
on public.pain_points
for update
using (true)
with check (true);

drop policy if exists "Allow public delete access for pain points during build" on public.pain_points;
create policy "Allow public delete access for pain points during build"
on public.pain_points
for delete
using (true);

drop policy if exists "Allow public read access for pain point companies during build" on public.pain_point_companies;
create policy "Allow public read access for pain point companies during build"
on public.pain_point_companies
for select
using (true);

drop policy if exists "Allow public insert access for pain point companies during build" on public.pain_point_companies;
create policy "Allow public insert access for pain point companies during build"
on public.pain_point_companies
for insert
with check (true);

drop policy if exists "Allow public delete access for pain point companies during build" on public.pain_point_companies;
create policy "Allow public delete access for pain point companies during build"
on public.pain_point_companies
for delete
using (true);

drop policy if exists "Allow public read access for pain point contacts during build" on public.pain_point_contacts;
create policy "Allow public read access for pain point contacts during build"
on public.pain_point_contacts
for select
using (true);

drop policy if exists "Allow public insert access for pain point contacts during build" on public.pain_point_contacts;
create policy "Allow public insert access for pain point contacts during build"
on public.pain_point_contacts
for insert
with check (true);

drop policy if exists "Allow public delete access for pain point contacts during build" on public.pain_point_contacts;
create policy "Allow public delete access for pain point contacts during build"
on public.pain_point_contacts
for delete
using (true);

drop policy if exists "Allow public read access for pain point activities during build" on public.pain_point_activities;
create policy "Allow public read access for pain point activities during build"
on public.pain_point_activities
for select
using (true);

drop policy if exists "Allow public insert access for pain point activities during build" on public.pain_point_activities;
create policy "Allow public insert access for pain point activities during build"
on public.pain_point_activities
for insert
with check (true);

drop policy if exists "Allow public delete access for pain point activities during build" on public.pain_point_activities;
create policy "Allow public delete access for pain point activities during build"
on public.pain_point_activities
for delete
using (true);

drop policy if exists "Allow public read access for pain point posts during build" on public.pain_point_posts;
create policy "Allow public read access for pain point posts during build"
on public.pain_point_posts
for select
using (true);

drop policy if exists "Allow public insert access for pain point posts during build" on public.pain_point_posts;
create policy "Allow public insert access for pain point posts during build"
on public.pain_point_posts
for insert
with check (true);

drop policy if exists "Allow public delete access for pain point posts during build" on public.pain_point_posts;
create policy "Allow public delete access for pain point posts during build"
on public.pain_point_posts
for delete
using (true);