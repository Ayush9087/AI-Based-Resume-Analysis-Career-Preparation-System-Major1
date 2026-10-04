-- AI-Based Resume Analysis & Career Preparation System
-- Supabase PostgreSQL schema

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  university text,
  phone text,
  graduation_year integer,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  original_name text not null,
  storage_path text not null,
  file_type text not null,
  status text not null default 'uploaded',
  score numeric(5,2),
  summary text,
  parsed_data jsonb not null default '{}'::jsonb,
  analysis_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resume_analysis (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  overall_score numeric(5,2) not null,
  strengths jsonb default '[]'::jsonb,
  weaknesses jsonb default '[]'::jsonb,
  recommendations jsonb default '[]'::jsonb,
  skill_summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.career_roles (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.career_role_skills (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.career_roles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  required_strength text,
  priority text not null default 'medium',
  learning_area text,
  created_at timestamptz not null default now(),
  unique(role_id, skill_id)
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  role_id uuid references public.career_roles(id) on delete set null,
  title text not null,
  description text not null,
  priority text not null default 'medium',
  recommendation_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  role_id uuid references public.career_roles(id) on delete set null,
  difficulty text not null default 'medium',
  experience_level text not null default 'intermediate',
  question_count integer not null default 6,
  status text not null default 'draft',
  score numeric(5,2),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  question_text text not null,
  difficulty text,
  category text,
  question_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.interview_questions(id) on delete cascade,
  answer_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_evaluations (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.interview_answers(id) on delete cascade,
  score numeric(5,2) not null,
  feedback text,
  strengths jsonb default '[]'::jsonb,
  improvements jsonb default '[]'::jsonb,
  evaluation_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.progress_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  metric text not null,
  value numeric(5,2) not null,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, university, phone, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'university',
    new.raw_user_meta_data->>'phone',
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute procedure public.update_updated_at_column();

create trigger resumes_updated_at
before update on public.resumes
for each row execute procedure public.update_updated_at_column();

alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_analysis enable row level security;
alter table public.skills enable row level security;
alter table public.career_roles enable row level security;
alter table public.career_role_skills enable row level security;
alter table public.recommendations enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.interview_questions enable row level security;
alter table public.interview_answers enable row level security;
alter table public.interview_evaluations enable row level security;
alter table public.progress_history enable row level security;

create policy "Profiles are viewable by owner"
on public.profiles
for select
using (auth.uid() = id);

create policy "Profiles can be updated by owner"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Profiles can be inserted by owner"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "User resumes are viewable by owner"
on public.resumes
for select
using (auth.uid() = user_id);

create policy "User resumes can be inserted by owner"
on public.resumes
for insert
with check (auth.uid() = user_id);

create policy "User resumes can be updated by owner"
on public.resumes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "User resumes can be deleted by owner"
on public.resumes
for delete
using (auth.uid() = user_id);

create policy "User resume analysis is viewable by owner"
on public.resume_analysis
for select using (
  exists (
    select 1 from public.resumes r
    where r.id = resume_analysis.resume_id and r.user_id = auth.uid()
  )
);

create policy "Recommendations are viewable by owner"
on public.recommendations
for select using (auth.uid() = user_id);

create policy "Recommendations can be inserted by owner"
on public.recommendations
for insert with check (auth.uid() = user_id);

create policy "Interview sessions are viewable by owner"
on public.interview_sessions
for select using (auth.uid() = user_id);

create policy "Interview sessions can be inserted by owner"
on public.interview_sessions
for insert with check (auth.uid() = user_id);

create policy "Interview sessions can be updated by owner"
on public.interview_sessions
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Interview sessions can be deleted by owner"
on public.interview_sessions
for delete using (auth.uid() = user_id);

create policy "Interview questions are viewable by owner"
on public.interview_questions
for select using (
  exists (
    select 1 from public.interview_sessions s
    where s.id = interview_questions.session_id and s.user_id = auth.uid()
  )
);

create policy "Interview questions can be inserted by session owner"
on public.interview_questions
for insert with check (
  exists (
    select 1 from public.interview_sessions s
    where s.id = interview_questions.session_id and s.user_id = auth.uid()
  )
);

create policy "Interview answers are viewable by owner"
on public.interview_answers
for select using (
  exists (
    select 1 from public.interview_questions q
    join public.interview_sessions s on s.id = q.session_id
    where q.id = interview_answers.question_id and s.user_id = auth.uid()
  )
);

create policy "Interview answers can be inserted by session owner"
on public.interview_answers
for insert with check (
  exists (
    select 1 from public.interview_questions q
    join public.interview_sessions s on s.id = q.session_id
    where q.id = interview_answers.question_id and s.user_id = auth.uid()
  )
);

create policy "Interview evaluations are viewable by session owner"
on public.interview_evaluations
for select using (
  exists (
    select 1 from public.interview_answers a
    join public.interview_questions q on q.id = a.question_id
    join public.interview_sessions s on s.id = q.session_id
    where a.id = interview_evaluations.answer_id and s.user_id = auth.uid()
  )
);

create policy "Interview evaluations can be inserted by session owner"
on public.interview_evaluations
for insert with check (
  exists (
    select 1 from public.interview_answers a
    join public.interview_questions q on q.id = a.question_id
    join public.interview_sessions s on s.id = q.session_id
    where a.id = interview_evaluations.answer_id and s.user_id = auth.uid()
  )
);

create policy "Progress history is viewable by owner"
on public.progress_history
for select using (auth.uid() = user_id);

create policy "Progress history can be inserted by owner"
on public.progress_history
for insert with check (auth.uid() = user_id);

create policy "Skills are readable by authenticated users"
on public.skills
for select
using (auth.role() = 'authenticated');

create policy "Career roles are readable by authenticated users"
on public.career_roles
for select
using (auth.role() = 'authenticated');

create policy "Career role skills are readable by authenticated users"
on public.career_role_skills
for select
using (auth.role() = 'authenticated');

-- Storage bucket setup instructions for Supabase Dashboard:
-- 1. Create a new storage bucket named 'resume-files'.
-- 2. Keep it private (public=false).
-- 3. Use folder structure: {user_id}/filename.ext
-- 4. Add policies for authenticated users to manage only their own files.

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
