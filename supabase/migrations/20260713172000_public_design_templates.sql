create or replace function public.get_public_designs(_limit integer default 200)
returns table (
  id uuid,
  user_id uuid,
  title text,
  asset_type public.asset_type,
  content text,
  image_url text,
  thumbnail_url text,
  prompt text,
  editor_state jsonb,
  meta jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  share_token uuid,
  creator_username text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id,
    a.user_id,
    a.title,
    a.asset_type,
    a.content,
    a.image_url,
    a.thumbnail_url,
    a.prompt,
    a.editor_state,
    a.meta,
    a.created_at,
    a.updated_at,
    a.share_token,
    coalesce(nullif(p.username, ''), '@' || left(a.user_id::text, 8)) as creator_username
  from public.assets a
  left join public.profiles p on p.user_id = a.user_id
  where a.share_token is not null
  order by a.created_at desc
  limit greatest(1, least(coalesce(_limit, 200), 500));
$$;

grant execute on function public.get_public_designs(integer) to anon, authenticated;

notify pgrst, 'reload schema';
