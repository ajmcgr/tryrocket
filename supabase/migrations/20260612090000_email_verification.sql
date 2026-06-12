create table if not exists public.email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists email_verification_tokens_user_idx on public.email_verification_tokens(user_id);
grant all on public.email_verification_tokens to service_role;
alter table public.email_verification_tokens enable row level security;
