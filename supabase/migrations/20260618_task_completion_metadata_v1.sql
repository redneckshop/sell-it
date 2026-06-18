alter table public.tasks
add column if not exists completed_at timestamp with time zone null,
add column if not exists completed_by uuid null;

create index if not exists tasks_completed_at_idx
on public.tasks (completed_at);

create index if not exists tasks_completed_by_idx
on public.tasks (completed_by);

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'tasks'
      and constraint_name = 'tasks_completed_by_fkey'
  ) then
    alter table public.tasks
    add constraint tasks_completed_by_fkey
    foreign key (completed_by)
    references public.profiles(id)
    on delete set null;
  end if;
end $$;