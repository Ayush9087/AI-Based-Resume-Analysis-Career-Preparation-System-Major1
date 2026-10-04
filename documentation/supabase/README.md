# Supabase setup for AI Resume Analysis & Career Preparation System

## 1. Create Supabase project

1. Create a new Supabase project from the Supabase dashboard.
2. Copy the project URL and anon key from Project Settings > API.
3. Store them in the frontend environment variables.
4. Store the service role key only in backend environment variables if server-side admin features are required.

## 2. Environment variables

Frontend:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Backend:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

## 3. Run schema

For a new Supabase project:

1. Run [schema.sql](schema.sql) in the SQL editor.
2. Create a private Storage bucket named `resume-files`.
3. Apply every SQL file in [migrations/](migrations/) in filename/date order.

For a project that already has the base schema, apply any migrations that have
not yet been run, in filename/date order. The upload API stores extracted fields
in `resumes.parsed_data`; validated AI reports are stored in
`resumes.analysis_data`; career roles and their skill requirements are seeded by
the skill-gap migration; recommendation history stores structured snapshots in
`recommendations.recommendation_data`.

This creates the required tables for:
- profiles
- resumes
- resume_analysis
- skills
- career_roles
- career_role_skills
- recommendations
- interview_sessions
- interview_questions
- interview_answers
- interview_evaluations
- progress_history
- user_preferences
- resume_score_history
- skill_gap_analyses

## 4. Storage bucket

Keep the `resume-files` bucket private and organize files using:

```text
{user_id}/filename.pdf
```

The schema and migration apply Storage policies so each user can only upload, view, and delete files in their own `{user_id}/` folder.

## Resume upload API

The authenticated endpoint is `POST /api/resumes/upload`. Send a multipart form field named `resume` and an `Authorization: Bearer <Supabase access token>` header. Only PDF and DOCX files up to 10 MB are accepted. The API uploads to private Storage, creates a `resumes` record, extracts available contact and resume-section details, and returns those details as JSON.

The authenticated endpoint `POST /api/resume/analyze` accepts `{ "resumeId": "..." }` with the same bearer token. It analyzes the owner's parsed resume data through the backend-only Gemini provider and returns a validated structured report. `GEMINI_API_KEY` must only be set in the backend environment.

## Career recommendations API

`POST /api/career-recommendations/generate` accepts `{ "resumeId": "..." }`, ranks stored career roles against the user's resume, and saves each result to recommendation history. `GET /api/career-recommendations/history` lists the signed-in user's saved recommendations. `GET /api/career-recommendations/roles/:roleId` returns the stored skill requirements for a role. Recommendations are evidence-based guidance, not guaranteed outcomes.

## Interview preparation API

The authenticated `POST /api/interview-prep/sessions` endpoint accepts a resume ID, role ID, difficulty, experience level, and question count. Gemini generates validated structured questions on the backend; sessions and question details are saved in Supabase. `GET /api/interview-prep/sessions` lists the user's sessions, `GET /api/interview-prep/sessions/:sessionId` resumes a session, and `POST /api/interview-prep/sessions/:sessionId/answers` saves an answer and its structured Gemini evaluation. Keep `GEMINI_API_KEY` in the backend environment only.

## Skill-gap API

The authenticated endpoint `GET /api/skill-gap/roles` lists roles stored in `career_roles`. The authenticated endpoint `POST /api/skill-gap/analyze` accepts `{ "resumeId": "...", "roleId": "..." }` and compares the owner's parsed and analyzed resume skills with the selected role's `career_role_skills`. Exact matching is deterministic; role strength, priority, and learning areas come from Supabase.

## 5. RLS and security

- Never expose the service role key in frontend code.
- Keep all secrets in environment variables.
- Restrict access so users only see their own profiles, resumes, recommendations, interview history, and progress.
- Use Supabase auth for session management.

## 6. Authentication behavior

The frontend uses Supabase Auth for:
- register
- login
- session persistence
- logout
- protected route checks

## 7. Recreate database

To recreate the project database from scratch:

1. Create a new Supabase project.
2. Open the SQL editor.
3. Run the SQL from [schema.sql](schema.sql).
4. Run [20261003_skill_gap_roles.sql](migrations/20261003_skill_gap_roles.sql).
5. Run [20261003_career_recommendations.sql](migrations/20261003_career_recommendations.sql).
6. Create the `resume-files` storage bucket.
7. Apply the storage RLS policies described in the SQL file comments.
