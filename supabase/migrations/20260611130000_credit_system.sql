-- Credit system v2: configurable per-asset credit costs + transaction log + plan limit changes

-- ============ CREDIT COSTS ============
create table if not exists public.credit_costs (
  asset_type text primary key,
  label text not null,
  credits integer not null check (credits >= 0),
  category text not null default 'text',
  updated_at timestamptz not null default now()
);
grant select on public.credit_costs to anon, authenticated;
grant all on public.credit_costs to service_role;
alter table public.credit_costs enable row level security;
drop policy if exists "Anyone can read credit costs" on public.credit_costs;
create policy "Anyone can read credit costs" on public.credit_costs for select to anon, authenticated using (true);

insert into public.credit_costs (asset_type, label, credits, category) values
  ('positioning_tagline',        'Tagline',                 1, 'text'),
  ('positioning_category',       'Product Category',        1, 'text'),
  ('positioning_elevator',       'Elevator Pitch',          2, 'text'),
  ('positioning_value_prop',     'Value Proposition',       3, 'text'),
  ('positioning_audience',       'Target Audience',         3, 'text'),
  ('positioning_differentiator', 'Key Differentiator',      3, 'text'),
  ('audience_ideal_customer',    'Ideal Customer',          3, 'text'),
  ('audience_pain_points',       'Pain Points',             3, 'text'),
  ('audience_use_cases',         'Use Cases',               3, 'text'),
  ('audience_messaging',         'Messaging Angles',        3, 'text'),
  ('founder_bio',                'Founder Bio',             5, 'text'),
  ('founder_tagline',            'Founder Tagline',         1, 'text'),
  ('founder_x_bio',              'X Bio',                   1, 'text'),
  ('founder_linkedin',           'LinkedIn Headline',       1, 'text'),
  ('launch_submission',          'Launch Submission',       5, 'text'),
  ('launch_product_hunt',        'Product Hunt Copy',      20, 'text'),
  ('launch_directory',           'Directory Submission',    3, 'text'),
  ('founder_story',              'Founder Story',          10, 'text'),
  ('strategy_readiness',         'Launch Readiness',        2, 'text'),
  ('strategy_channels',          'Recommended Channels',    3, 'text'),
  ('strategy_communities',       'Recommended Communities', 3, 'text'),
  ('strategy_content',           'Content Ideas',           3, 'text'),
  ('checklist_pre',              'Pre-Launch Checklist',    3, 'text'),
  ('checklist_day',              'Launch Day Checklist',    3, 'text'),
  ('checklist_post',             'Post-Launch Checklist',   3, 'text'),
  ('social_x_post',              'X Post',                  1, 'text'),
  ('social_x_thread',            'X Thread',                5, 'text'),
  ('social_linkedin',            'LinkedIn Post',           3, 'text'),
  ('social_reddit',              'Reddit Post',             3, 'text'),
  ('social_newsletter',          'Newsletter Announce',     3, 'text'),
  ('promote_influencer_outreach','Influencer Outreach DM',  5, 'text'),
  ('promote_pr_pitch',           'PR Pitch Email',          5, 'text'),
  ('promote_creator_campaign',   'Creator Campaign',       10, 'text'),
  ('design_style_direction',     'Style Direction',         3, 'text'),
  ('design_color_palette',       'Color Palette',           3, 'text'),
  ('design_typography',          'Typography Notes',        3, 'text'),
  ('design_image_1',             'Logo Concept',           25, 'image'),
  ('design_image_2',             'Logo Concept',           25, 'image'),
  ('design_image_3',             'Logo Concept',           25, 'image'),
  ('logo_generation',            'Logo Generation',        25, 'image'),
  ('logo_variation',             'Logo Variation',         10, 'image'),
  ('app_icon',                   'App Icon',               25, 'image'),
  ('hero_artwork',               'Hero Artwork',           50, 'image'),
  ('social_graphic',             'Social Graphic',         50, 'image'),
  ('youtube_thumbnail',          'YouTube Thumbnail',      50, 'image'),
  ('ad_creative',                'Ad Creative',            75, 'image'),
  ('landing_page_visual',        'Landing Page Visual',    75, 'image'),
  ('brand_template_pack',        'Brand Template Pack',   100, 'image'),
  ('image_regeneration',         'Image Regeneration',     10, 'image')
on conflict (asset_type) do update set
  label = excluded.label,
  credits = excluded.credits,
  category = excluded.category,
  updated_at = now();

-- ============ CREDIT TRANSACTIONS ============
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rocket_id uuid references public.rockets(id) on delete set null,
  asset_type text,
  workflow text,
  kind text not null check (kind in ('spent','purchased','granted','refunded')),
  credits integer not null,
  meta jsonb,
  created_at timestamptz not null default now()
);
grant select on public.credit_transactions to authenticated;
grant all on public.credit_transactions to service_role;
alter table public.credit_transactions enable row level security;
drop policy if exists "Users view own credit transactions" on public.credit_transactions;
create policy "Users view own credit transactions" on public.credit_transactions
  for select to authenticated using (auth.uid() = user_id);
create index if not exists credit_transactions_user_idx
  on public.credit_transactions(user_id, created_at desc);
create index if not exists credit_transactions_asset_idx
  on public.credit_transactions(asset_type);

-- ============ PLAN LIMITS: Free 500 -> 100 ============
update public.user_usage set monthly_limit = 100 where plan = 'free';
update public.user_usage set monthly_limit = 3000 where plan = 'growth';
alter table public.user_usage alter column monthly_limit set default 100;

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
  values (new.id, 'free', 100)
  on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;
