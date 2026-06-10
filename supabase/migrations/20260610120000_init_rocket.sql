-- Rocket V1 initial schema

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Users view own profile" on public.profiles for select to authenticated using (auth.uid() = user_id);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = user_id);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = user_id);

-- ============ ROCKETS ============
create table public.rockets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_url text not null,
  product_name text,
  status text not null default 'generating',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.rockets to authenticated;
grant all on public.rockets to service_role;
alter table public.rockets enable row level security;
create policy "Users view own rockets" on public.rockets for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own rockets" on public.rockets for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own rockets" on public.rockets for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own rockets" on public.rockets for delete to authenticated using (auth.uid() = user_id);
create index rockets_user_id_idx on public.rockets(user_id, created_at desc);

-- ============ ROCKET ASSETS ============
create table public.rocket_assets (
  id uuid primary key default gen_random_uuid(),
  rocket_id uuid not null references public.rockets(id) on delete cascade,
  asset_type text not null,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.rocket_assets to authenticated;
grant all on public.rocket_assets to service_role;
alter table public.rocket_assets enable row level security;
create policy "Users view assets of own rockets" on public.rocket_assets for select to authenticated
  using (exists (select 1 from public.rockets r where r.id = rocket_id and r.user_id = auth.uid()));
create policy "Users insert assets for own rockets" on public.rocket_assets for insert to authenticated
  with check (exists (select 1 from public.rockets r where r.id = rocket_id and r.user_id = auth.uid()));
create policy "Users update assets of own rockets" on public.rocket_assets for update to authenticated
  using (exists (select 1 from public.rockets r where r.id = rocket_id and r.user_id = auth.uid()));
create policy "Users delete assets of own rockets" on public.rocket_assets for delete to authenticated
  using (exists (select 1 from public.rockets r where r.id = rocket_id and r.user_id = auth.uid()));
create index rocket_assets_rocket_id_idx on public.rocket_assets(rocket_id);

-- ============ SUBSCRIPTIONS ============
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  plan text not null default 'free',
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
create policy "Users view own subscription" on public.subscriptions for select to authenticated using (auth.uid() = user_id);

-- ============ USER USAGE ============
create table public.user_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan text not null default 'free',
  monthly_limit integer not null default 500,
  credits_used integer not null default 0,
  credits_extra integer not null default 0,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '30 days'),
  updated_at timestamptz not null default now()
);
grant select on public.user_usage to authenticated;
grant all on public.user_usage to service_role;
alter table public.user_usage enable row level security;
create policy "Users view own usage" on public.user_usage for select to authenticated using (auth.uid() = user_id);

-- ============ PAYMENTS ============
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  currency text not null default 'usd',
  payment_type text not null,
  credits_added integer default 0,
  stripe_session_id text,
  stripe_payment_intent_id text,
  status text not null default 'succeeded',
  created_at timestamptz not null default now()
);
grant select on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "Users view own payments" on public.payments for select to authenticated using (auth.uid() = user_id);

-- ============ TRIGGER: new user setup ============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  ) on conflict (user_id) do nothing;

  insert into public.user_usage (user_id, plan, monthly_limit)
  values (new.id, 'free', 500)
  on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ updated_at trigger ============
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger rockets_updated_at before update on public.rockets for each row execute function public.set_updated_at();
create trigger rocket_assets_updated_at before update on public.rocket_assets for each row execute function public.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger user_usage_updated_at before update on public.user_usage for each row execute function public.set_updated_at();
