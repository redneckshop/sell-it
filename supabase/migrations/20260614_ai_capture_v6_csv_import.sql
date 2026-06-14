create table if not exists public.import_history (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id),
  attachment_id uuid references public.attachments(id),
  file_name text not null,
  import_type text not null,
  duplicate_handling text not null,
  row_count integer not null default 0,
  rows_imported integer not null default 0,
  rows_skipped integer not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

alter table public.import_history enable row level security;

drop policy if exists "Allow public read access to import history" on public.import_history;
drop policy if exists "Allow public insert access to import history" on public.import_history;
drop policy if exists "Allow public update access to import history" on public.import_history;
drop policy if exists "Allow public delete access to import history" on public.import_history;

create policy "Allow public read access to import history"
on public.import_history
for select
using (true);

create policy "Allow public insert access to import history"
on public.import_history
for insert
with check (true);

create policy "Allow public update access to import history"
on public.import_history
for update
using (true)
with check (true);

create policy "Allow public delete access to import history"
on public.import_history
for delete
using (true);

alter table public.companies
add column if not exists notes text;

alter table public.attachments
drop constraint if exists attachments_file_type_check;

alter table public.attachments
add constraint attachments_file_type_check
check (
  file_type is null
  or file_type in (
    'image',
    'pdf',
    'document',
    'screenshot',
    'csv',
    'other',
    'Image',
    'PDF',
    'Document',
    'Screenshot',
    'CSV',
    'Other'
  )
);

alter table public.companies
drop constraint if exists companies_lead_temperature_check;

alter table public.companies
add constraint companies_lead_temperature_check
check (
  lead_temperature is null
  or lead_temperature in (
    'Cold',
    'Warm',
    'Hot',
    'Active',
    'Dead'
  )
);

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do update
set public = true;

drop policy if exists "Allow public upload to attachments bucket" on storage.objects;
drop policy if exists "Allow public read from attachments bucket" on storage.objects;

create policy "Allow public upload to attachments bucket"
on storage.objects
for insert
with check (bucket_id = 'attachments');

create policy "Allow public read from attachments bucket"
on storage.objects
for select
using (bucket_id = 'attachments');

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
on table public.import_history
to anon, authenticated;

grant select, insert, update, delete
on table public.attachments
to anon, authenticated;

grant usage on schema storage to anon, authenticated;

grant select, insert
on table storage.objects
to anon, authenticated;
