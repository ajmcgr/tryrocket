alter table public.rockets add column if not exists pinned boolean not null default false;
create index if not exists rockets_user_pinned_idx on public.rockets(user_id, pinned desc, created_at desc);
