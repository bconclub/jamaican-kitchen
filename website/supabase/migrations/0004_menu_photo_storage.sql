-- 0004_menu_photo_storage.sql
-- Storage bucket for real menu-item photos, uploaded from the admin Menu page
-- (replaces guessed stock photos with actual product shots the owner takes).
-- Public read (storefront + admin both display them), staff-only write.
begin;

insert into storage.buckets (id, name, public)
values ('menu-photos', 'menu-photos', true)
on conflict (id) do nothing;

drop policy if exists "public read menu photos" on storage.objects;
create policy "public read menu photos" on storage.objects
  for select using (bucket_id = 'menu-photos');

drop policy if exists "staff upload menu photos" on storage.objects;
create policy "staff upload menu photos" on storage.objects
  for insert with check (
    bucket_id = 'menu-photos'
    and (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'manager') or public.has_role(auth.uid(),'staff'))
  );

drop policy if exists "staff update menu photos" on storage.objects;
create policy "staff update menu photos" on storage.objects
  for update using (
    bucket_id = 'menu-photos'
    and (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'manager') or public.has_role(auth.uid(),'staff'))
  );

drop policy if exists "staff delete menu photos" on storage.objects;
create policy "staff delete menu photos" on storage.objects
  for delete using (
    bucket_id = 'menu-photos'
    and (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'manager') or public.has_role(auth.uid(),'staff'))
  );

commit;
