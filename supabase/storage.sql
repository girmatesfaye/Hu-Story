-- Storage buckets: public read, user-owned write

-- Set buckets to public
update storage.buckets
set public = true
where id in ('avatars', 'event-covers', 'spot-images', 'project-covers');

-- Public read for all objects in these buckets
create policy "storage_public_read"
  on storage.objects
  for select
  using (bucket_id in ('avatars', 'event-covers', 'spot-images', 'project-covers'));

-- Users can upload only to their own folder: <user_id>/...
create policy "storage_user_insert"
  on storage.objects
  for insert
  with check (
    bucket_id in ('avatars', 'event-covers', 'spot-images', 'project-covers')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update only their own files
create policy "storage_user_update"
  on storage.objects
  for update
  using (
    bucket_id in ('avatars', 'event-covers', 'spot-images', 'project-covers')
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id in ('avatars', 'event-covers', 'spot-images', 'project-covers')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete only their own files
create policy "storage_user_delete"
  on storage.objects
  for delete
  using (
    bucket_id in ('avatars', 'event-covers', 'spot-images', 'project-covers')
    and auth.uid()::text = (storage.foldername(name))[1]
  );
