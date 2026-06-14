alter table public.attachments
add column if not exists related_post_id uuid references public.posts(id) on delete cascade;

create index if not exists attachments_related_post_id_idx
on public.attachments(related_post_id);