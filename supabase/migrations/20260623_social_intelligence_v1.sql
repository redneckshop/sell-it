create table if not exists public.social_media_assets (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null references public.workspaces(id) on delete cascade,

  title text not null,
  category text,
  tags text,
  description text,

  file_name text,
  file_type text,
  storage_path text,
  file_url text,

  uploaded_by_profile_id uuid references public.profiles(id) on delete set null,
  uploaded_by_team_member_id uuid references public.team_members(id) on delete set null,
  uploaded_by_name text,

  created_by uuid,
  updated_by uuid,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null references public.workspaces(id) on delete cascade,

  platform text,
  community_id uuid references public.communities(id) on delete set null,
  group_name text,

  post_title text not null,
  post_url text,
  post_text text,

  pain_point_id uuid references public.pain_points(id) on delete set null,
  pain_point_text text,

  goal text,

  media_asset_id uuid references public.social_media_assets(id) on delete set null,

  posted_by_profile_id uuid references public.profiles(id) on delete set null,
  posted_by_team_member_id uuid references public.team_members(id) on delete set null,
  posted_by_name text,

  posted_date date,
  status text not null default 'Draft',

  created_by uuid,
  updated_by uuid,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint social_posts_status_check
  check (status in ('Draft', 'Posted', 'Monitoring', 'Closed'))
);

create table if not exists public.social_post_companies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  social_post_id uuid not null references public.social_posts(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (social_post_id, company_id)
);

create table if not exists public.social_post_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  social_post_id uuid not null references public.social_posts(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (social_post_id, contact_id)
);

create table if not exists public.social_post_opportunities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  social_post_id uuid not null references public.social_posts(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (social_post_id, opportunity_id)
);

create table if not exists public.social_post_media_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  social_post_id uuid not null references public.social_posts(id) on delete cascade,
  media_asset_id uuid not null references public.social_media_assets(id) on delete cascade,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (social_post_id, media_asset_id)
);

create index if not exists social_media_assets_workspace_id_idx
on public.social_media_assets(workspace_id);

create index if not exists social_media_assets_category_idx
on public.social_media_assets(category);

create index if not exists social_posts_workspace_id_idx
on public.social_posts(workspace_id);

create index if not exists social_posts_status_idx
on public.social_posts(status);

create index if not exists social_posts_platform_idx
on public.social_posts(platform);

create index if not exists social_posts_community_id_idx
on public.social_posts(community_id);

create index if not exists social_posts_pain_point_id_idx
on public.social_posts(pain_point_id);

create index if not exists social_posts_media_asset_id_idx
on public.social_posts(media_asset_id);

create index if not exists social_post_companies_social_post_id_idx
on public.social_post_companies(social_post_id);

create index if not exists social_post_companies_company_id_idx
on public.social_post_companies(company_id);

create index if not exists social_post_contacts_social_post_id_idx
on public.social_post_contacts(social_post_id);

create index if not exists social_post_contacts_contact_id_idx
on public.social_post_contacts(contact_id);

create index if not exists social_post_opportunities_social_post_id_idx
on public.social_post_opportunities(social_post_id);

create index if not exists social_post_opportunities_opportunity_id_idx
on public.social_post_opportunities(opportunity_id);

create index if not exists social_post_media_assets_social_post_id_idx
on public.social_post_media_assets(social_post_id);

create index if not exists social_post_media_assets_media_asset_id_idx
on public.social_post_media_assets(media_asset_id);

create or replace function public.set_social_media_assets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_social_media_assets_updated_at on public.social_media_assets;

create trigger set_social_media_assets_updated_at
before update on public.social_media_assets
for each row
execute function public.set_social_media_assets_updated_at();

create or replace function public.set_social_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_social_posts_updated_at on public.social_posts;

create trigger set_social_posts_updated_at
before update on public.social_posts
for each row
execute function public.set_social_posts_updated_at();

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.social_media_assets to anon, authenticated;
grant select, insert, update, delete on public.social_posts to anon, authenticated;
grant select, insert, update, delete on public.social_post_companies to anon, authenticated;
grant select, insert, update, delete on public.social_post_contacts to anon, authenticated;
grant select, insert, update, delete on public.social_post_opportunities to anon, authenticated;
grant select, insert, update, delete on public.social_post_media_assets to anon, authenticated;

alter table public.social_media_assets enable row level security;
alter table public.social_posts enable row level security;
alter table public.social_post_companies enable row level security;
alter table public.social_post_contacts enable row level security;
alter table public.social_post_opportunities enable row level security;
alter table public.social_post_media_assets enable row level security;

drop policy if exists "Allow public read access for social media assets during build" on public.social_media_assets;
create policy "Allow public read access for social media assets during build"
on public.social_media_assets
for select
using (true);

drop policy if exists "Allow public insert access for social media assets during build" on public.social_media_assets;
create policy "Allow public insert access for social media assets during build"
on public.social_media_assets
for insert
with check (true);

drop policy if exists "Allow public update access for social media assets during build" on public.social_media_assets;
create policy "Allow public update access for social media assets during build"
on public.social_media_assets
for update
using (true)
with check (true);

drop policy if exists "Allow public delete access for social media assets during build" on public.social_media_assets;
create policy "Allow public delete access for social media assets during build"
on public.social_media_assets
for delete
using (true);

drop policy if exists "Allow public read access for social posts during build" on public.social_posts;
create policy "Allow public read access for social posts during build"
on public.social_posts
for select
using (true);

drop policy if exists "Allow public insert access for social posts during build" on public.social_posts;
create policy "Allow public insert access for social posts during build"
on public.social_posts
for insert
with check (true);

drop policy if exists "Allow public update access for social posts during build" on public.social_posts;
create policy "Allow public update access for social posts during build"
on public.social_posts
for update
using (true)
with check (true);

drop policy if exists "Allow public delete access for social posts during build" on public.social_posts;
create policy "Allow public delete access for social posts during build"
on public.social_posts
for delete
using (true);

drop policy if exists "Allow public read access for social post companies during build" on public.social_post_companies;
create policy "Allow public read access for social post companies during build"
on public.social_post_companies
for select
using (true);

drop policy if exists "Allow public insert access for social post companies during build" on public.social_post_companies;
create policy "Allow public insert access for social post companies during build"
on public.social_post_companies
for insert
with check (true);

drop policy if exists "Allow public delete access for social post companies during build" on public.social_post_companies;
create policy "Allow public delete access for social post companies during build"
on public.social_post_companies
for delete
using (true);

drop policy if exists "Allow public read access for social post contacts during build" on public.social_post_contacts;
create policy "Allow public read access for social post contacts during build"
on public.social_post_contacts
for select
using (true);

drop policy if exists "Allow public insert access for social post contacts during build" on public.social_post_contacts;
create policy "Allow public insert access for social post contacts during build"
on public.social_post_contacts
for insert
with check (true);

drop policy if exists "Allow public delete access for social post contacts during build" on public.social_post_contacts;
create policy "Allow public delete access for social post contacts during build"
on public.social_post_contacts
for delete
using (true);

drop policy if exists "Allow public read access for social post opportunities during build" on public.social_post_opportunities;
create policy "Allow public read access for social post opportunities during build"
on public.social_post_opportunities
for select
using (true);

drop policy if exists "Allow public insert access for social post opportunities during build" on public.social_post_opportunities;
create policy "Allow public insert access for social post opportunities during build"
on public.social_post_opportunities
for insert
with check (true);

drop policy if exists "Allow public delete access for social post opportunities during build" on public.social_post_opportunities;
create policy "Allow public delete access for social post opportunities during build"
on public.social_post_opportunities
for delete
using (true);

drop policy if exists "Allow public read access for social post media assets during build" on public.social_post_media_assets;
create policy "Allow public read access for social post media assets during build"
on public.social_post_media_assets
for select
using (true);

drop policy if exists "Allow public insert access for social post media assets during build" on public.social_post_media_assets;
create policy "Allow public insert access for social post media assets during build"
on public.social_post_media_assets
for insert
with check (true);

drop policy if exists "Allow public delete access for social post media assets during build" on public.social_post_media_assets;
create policy "Allow public delete access for social post media assets during build"
on public.social_post_media_assets
for delete
using (true);
