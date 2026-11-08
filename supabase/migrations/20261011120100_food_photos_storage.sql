-- Private bucket for the cut-out food photos. Each user writes only under "<user id>/...".
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('food-photos', 'food-photos', false, 5242880, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy "food-photos: read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'food-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "food-photos: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'food-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "food-photos: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'food-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'food-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "food-photos: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'food-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
