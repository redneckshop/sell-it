create extension if not exists pgcrypto;

create table if not exists public.work_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid null,
  actor_type text not null default 'user',
  actor_profile_id uuid null,
  actor_team_member_id uuid null,
  actor_display_name text null,
  action_type text not null,
  entity_type text not null,
  entity_id uuid null,
  entity_label text null,
  related_entity_type text null,
  related_entity_id uuid null,
  summary text not null,
  details text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint work_log_actor_type_check check (
    actor_type in ('user', 'team_member', 'system')
  )
);

create index if not exists work_log_workspace_created_at_idx
  on public.work_log (workspace_id, created_at desc);

create index if not exists work_log_entity_idx
  on public.work_log (entity_type, entity_id);

create index if not exists work_log_action_type_idx
  on public.work_log (action_type);

create index if not exists work_log_actor_display_name_idx
  on public.work_log (actor_display_name);

alter table public.work_log enable row level security;

drop policy if exists "work_log_select_all_v1" on public.work_log;
create policy "work_log_select_all_v1"
  on public.work_log
  for select
  to anon, authenticated
  using (true);

drop policy if exists "work_log_insert_all_v1" on public.work_log;
create policy "work_log_insert_all_v1"
  on public.work_log
  for insert
  to anon, authenticated
  with check (true);

grant select, insert on public.work_log to anon, authenticated;

revoke update on public.work_log from anon, authenticated;
revoke delete on public.work_log from anon, authenticated;

comment on table public.work_log is
  'Permanent append-only Sell It history log. Notification Center is attention feed; Work Log is permanent history.';
