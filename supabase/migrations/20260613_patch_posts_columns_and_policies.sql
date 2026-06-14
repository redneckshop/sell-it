alter table public.posts
add column if not exists title text not null default 'Untitled Post',
add column if not exists platform text,
add column if not exists post_type text,
add column if not exists post_url text,
add column if not exists post_date date,
add column if not exists original_post_text text,
add column if not exists screenshot_url text,
add column if not exists comment_count integer default 0,
add column if not exists reaction_count integer default 0,
add column if not exists share_count integer default 0,
add column if not exists last_checked_date date,
add column if not exists ai_summary text,
add column if not exists pain_points_found text,
add column if not exists leads_found text,
add column if not exists follow_up_needed boolean default false,
add column if not exists tags text,
add column if not exists created_by uuid references auth.users(id) on delete set null,
add column if not exists updated_by uuid references auth.users(id) on delete set null,
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

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

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.posts to anon, authenticated;

alter table public.posts enable row level security;

drop policy if exists "Allow public read access for posts during build" on public.posts;
create policy "Allow public read access for posts during build"
on public.posts
for select
using (true);

drop policy if exists "Allow public insert access for posts during build" on public.posts;
create policy "Allow public insert access for posts during build"
on public.posts
for insert
with check (true);

drop policy if exists "Allow public update access for posts during build" on public.posts;
create policy "Allow public update access for posts during build"
on public.posts
for update
using (true)
with check (true);

drop policy if exists "Allow public delete access for posts during build" on public.posts;
create policy "Allow public delete access for posts during build"
on public.posts
for delete
using (true);