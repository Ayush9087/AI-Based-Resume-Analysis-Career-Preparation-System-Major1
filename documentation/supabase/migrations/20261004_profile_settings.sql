alter table public.profiles
add column if not exists graduation_year integer,
add column if not exists target_career text,
add column if not exists skills text[] not null default '{}',
add column if not exists interests text[] not null default '{}';

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  resume_review_notifications boolean not null default true,
  interview_reminders boolean not null default true,
  career_recommendation_notifications boolean not null default true,
  dark_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "Users can view own preferences" on public.user_preferences;
create policy "Users can view own preferences"
on public.user_preferences
for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own preferences" on public.user_preferences;
create policy "Users can insert own preferences"
on public.user_preferences
for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own preferences" on public.user_preferences;
create policy "Users can update own preferences"
on public.user_preferences
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.user_preferences to authenticated;

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute procedure public.sync_profile_email();
