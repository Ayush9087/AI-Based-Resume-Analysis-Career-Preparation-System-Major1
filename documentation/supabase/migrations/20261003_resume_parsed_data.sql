alter table public.resumes
add column if not exists parsed_data jsonb not null default '{}'::jsonb;

drop policy if exists "User resumes can be deleted by owner" on public.resumes;
create policy "User resumes can be deleted by owner"
on public.resumes
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can upload own resumes" on storage.objects;
create policy "Users can upload own resumes"
on storage.objects for insert
with check (bucket_id = 'resume-files' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "Users can view own resumes" on storage.objects;
create policy "Users can view own resumes"
on storage.objects for select
using (bucket_id = 'resume-files' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "Users can delete own resumes" on storage.objects;
create policy "Users can delete own resumes"
on storage.objects for delete
using (bucket_id = 'resume-files' and split_part(name, '/', 1) = auth.uid()::text);