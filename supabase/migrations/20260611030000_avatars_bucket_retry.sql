-- Create avatars bucket via storage admin
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'avatars') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('avatars', 'avatars', true, 5242880, array['image/png','image/jpeg','image/jpg','image/webp','image/gif']);
  else
    update storage.buckets set public = true where id = 'avatars';
  end if;
end $$;
