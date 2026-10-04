alter table public.interview_sessions
add column if not exists session_type text not null default 'preparation';

-- Existing sessions cannot be classified retroactively because their original mode was not stored.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'interview_sessions_session_type_check'
      and conrelid = 'public.interview_sessions'::regclass
  ) then
    alter table public.interview_sessions
    add constraint interview_sessions_session_type_check
    check (session_type in ('preparation', 'mock'));
  end if;
end $$;

create table if not exists public.resume_score_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  resume_name text not null,
  score integer not null check (score between 0 and 100),
  analyzed_at timestamptz not null default now()
);

alter table public.resume_score_history enable row level security;

drop policy if exists "Users can view own resume score history" on public.resume_score_history;
create policy "Users can view own resume score history"
on public.resume_score_history
for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own resume score history" on public.resume_score_history;
create policy "Users can insert own resume score history"
on public.resume_score_history
for insert with check (auth.uid() = user_id);

grant select, insert on public.resume_score_history to authenticated;

insert into public.resume_score_history (user_id, resume_id, resume_name, score, analyzed_at)
select
  user_id,
  id,
  original_name,
  (analysis_data->>'overallScore')::integer,
  coalesce(updated_at, created_at)
from public.resumes
where case
  when analysis_data->>'overallScore' ~ '^[0-9]+$'
    then (analysis_data->>'overallScore')::integer between 0 and 100
  else false
end
  and not exists (
    select 1 from public.resume_score_history history where history.resume_id = resumes.id
  );

create index if not exists resume_score_history_user_analyzed_at_idx
on public.resume_score_history (user_id, analyzed_at desc);

create table if not exists public.skill_gap_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  resume_name text not null,
  role_id uuid references public.career_roles(id) on delete set null,
  role_title text not null,
  comparison_data jsonb not null,
  analyzed_at timestamptz not null default now()
);

alter table public.skill_gap_analyses enable row level security;

drop policy if exists "Users can view own skill gap analyses" on public.skill_gap_analyses;
create policy "Users can view own skill gap analyses"
on public.skill_gap_analyses
for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own skill gap analyses" on public.skill_gap_analyses;
create policy "Users can insert own skill gap analyses"
on public.skill_gap_analyses
for insert with check (auth.uid() = user_id);

grant select, insert on public.skill_gap_analyses to authenticated;

create index if not exists skill_gap_analyses_user_analyzed_at_idx
on public.skill_gap_analyses (user_id, analyzed_at desc);
