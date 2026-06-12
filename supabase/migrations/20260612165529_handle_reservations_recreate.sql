create table if not exists public.handle_reservations (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique,
  email text,
  created_at timestamptz not null default now()
);
create index if not exists handle_reservations_handle_lower_idx on public.handle_reservations (lower(handle));
grant select, insert on public.handle_reservations to anon, authenticated;
grant all on public.handle_reservations to service_role;
alter table public.handle_reservations enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='handle_reservations' and policyname='Anyone can read handle reservations') then
    create policy "Anyone can read handle reservations" on public.handle_reservations for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='handle_reservations' and policyname='Anyone can insert a handle reservation') then
    create policy "Anyone can insert a handle reservation" on public.handle_reservations for insert to anon, authenticated with check (char_length(handle) between 2 and 30 and handle ~ '^[a-zA-Z0-9_]+$');
  end if;
end $$;
notify pgrst, 'reload schema';
