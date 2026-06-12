-- Resend-based email verification: profile flags, verifications table, trigger update.

alter table public.profiles
  add column if not exists email_verified boolean not null default false,
  add column if not exists email_verified_at timestamptz;

create table if not exists public.email_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
grant all on public.email_verifications to service_role;
alter table public.email_verifications enable row level security;
create index if not exists email_verifications_token_hash_idx on public.email_verifications(token_hash);
create index if not exists email_verifications_user_idx on public.email_verifications(user_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider text := coalesce(new.raw_app_meta_data->>'provider', 'email');
  v_is_oauth boolean := v_provider <> 'email';
begin
  insert into public.profiles (user_id, email, full_name, avatar_url, email_verified, email_verified_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    v_is_oauth,
    case when v_is_oauth then now() else null end
  ) on conflict (user_id) do update
    set email_verified = excluded.email_verified or public.profiles.email_verified,
        email_verified_at = coalesce(public.profiles.email_verified_at, excluded.email_verified_at);

  insert into public.user_usage (user_id, plan, monthly_limit)
  values (new.id, 'free', 500)
  on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

update public.profiles p
set email_verified = true,
    email_verified_at = coalesce(p.email_verified_at, now())
from auth.users u
where u.id = p.user_id
  and coalesce(u.raw_app_meta_data->>'provider', 'email') <> 'email'
  and p.email_verified = false;
