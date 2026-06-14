create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  community_id uuid references public.communities(id) on delete set null,

  title text not null,
  platform text,
  post_type text,
  post_url text,
  post_date date,
  original_post_text text,
  screenshot_url text,

  comment_count integer default 0,
  reaction_count integer default 0,
  share_count integer default 0,

  last_checked_date date,

  ai_summary text,
  pain_points_found text,
  leads_found text,

  follow_up_needed boolean default false,

  tags text,

  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

drop policy if exists "Users can view posts in their workspace" on public.posts;
create policy "Users can view posts in their workspace"
on public.posts
for select
using (
  workspace_id in (
    select workspace_id
    from public.profiles
    where id = auth.uid()
  )
);

drop policy if exists "Users can insert posts in their workspace" on public.posts;
create policy "Users can insert posts in their workspace"
on public.posts
for insert
with check (
  workspace_id in (
    select workspace_id
    from public.profiles
    where id = auth.uid()
  )
);

drop policy if exists "Users can update posts in their workspace" on public.posts;
create policy "Users can update posts in their workspace"
on public.posts
for update
using (
  workspace_id in (
    select workspace_id
    from public.profiles
    where id = auth.uid()
  )
)
with check (
  workspace_id in (
    select workspace_id
    from public.profiles
    where id = auth.uid()
  )
);

drop policy if exists "Users can delete posts in their workspace" on public.posts;
create policy "Users can delete posts in their workspace"
on public.posts
for delete
using (
  workspace_id in (
    select workspace_id
    from public.profiles
    where id = auth.uid()
  )
);

create or replace function public.set_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_posts_updated_at on public.posts;

create trigger set_posts_updated_at
before update on public.posts
for each row
execute function public.set_posts_updated_at();