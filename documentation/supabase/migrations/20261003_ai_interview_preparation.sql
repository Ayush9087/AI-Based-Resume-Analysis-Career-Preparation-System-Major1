alter table public.interview_sessions
add column if not exists resume_id uuid references public.resumes(id) on delete set null,
add column if not exists difficulty text not null default 'medium',
add column if not exists experience_level text not null default 'intermediate',
add column if not exists question_count integer not null default 6;

alter table public.interview_questions
add column if not exists question_data jsonb not null default '{}'::jsonb;

alter table public.interview_evaluations
add column if not exists evaluation_data jsonb not null default '{}'::jsonb;

drop policy if exists "Interview sessions can be updated by owner" on public.interview_sessions;
create policy "Interview sessions can be updated by owner"
on public.interview_sessions
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Interview sessions can be deleted by owner" on public.interview_sessions;
create policy "Interview sessions can be deleted by owner"
on public.interview_sessions
for delete using (auth.uid() = user_id);

drop policy if exists "Interview questions can be inserted by session owner" on public.interview_questions;
create policy "Interview questions can be inserted by session owner"
on public.interview_questions
for insert with check (
  exists (
    select 1 from public.interview_sessions s
    where s.id = interview_questions.session_id and s.user_id = auth.uid()
  )
);

drop policy if exists "Interview answers can be inserted by session owner" on public.interview_answers;
create policy "Interview answers can be inserted by session owner"
on public.interview_answers
for insert with check (
  exists (
    select 1 from public.interview_questions q
    join public.interview_sessions s on s.id = q.session_id
    where q.id = interview_answers.question_id and s.user_id = auth.uid()
  )
);

drop policy if exists "Interview evaluations are viewable by session owner" on public.interview_evaluations;
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

drop policy if exists "Interview evaluations can be inserted by session owner" on public.interview_evaluations;
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