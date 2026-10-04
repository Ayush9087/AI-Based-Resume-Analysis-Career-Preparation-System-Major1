# AI-Based Resume Analysis & Career Preparation System

## 📌 Project Overview

The AI-Based Resume Analysis & Career Preparation System is a web application
for students, fresh graduates, and job seekers. It helps users review resumes,
identify skill gaps, explore career recommendations, and prepare for interviews
in one place.

The application combines a React frontend, an authenticated Express API,
Supabase, and Google Gemini. Analysis and progress data is associated with the
signed-in user's account.

## 🎯 Problem Statement

- Manual resume evaluation can be time-consuming.
- Students and job seekers may not know what is weak or missing in a resume.
- It can be difficult to identify the skills required for a target role.
- Users may not know which career roles best fit the experience they have
  recorded.
- Generic interview practice is not always tailored to a resume or career goal.

## 💡 Solution

The system brings resume review and career preparation workflows together:

- Parse uploaded resumes and request a structured AI analysis.
- Review a resume score, section scores, strengths, weaknesses, and suggestions.
- Compare extracted resume skills with requirements for a selected career role.
- Generate and save career recommendations from the user's resume evidence and
  the career-role data stored in Supabase.
- Generate interview questions and evaluate submitted answers with Gemini.
- Review saved resume, skill-gap, recommendation, and mock-interview activity
  in progress views.

AI-generated results are guidance and should be reviewed by the user; they are
not guarantees of employment or interview outcomes.

## ✨ Features

- 🔐 Supabase Auth registration, sign-in, session persistence, password reset,
  password update, and protected application routes
- 📄 PDF and DOCX resume upload to private Supabase Storage
- 🔍 Resume text/section parsing and saved resume management
- 🤖 Gemini-powered structured resume analysis
- 📊 Overall and section-level resume scoring
- 💡 Resume strengths, weaknesses, and improvement suggestions
- 🧩 Resume skill extraction and role-based skill-gap comparisons
- 💼 Saved career recommendations based on the user's resume and stored role
  requirements
- 📝 AI-generated interview questions with configurable interview settings
- 🎤 Interview sessions with saved answers
- 📈 Structured AI evaluation and feedback for interview answers
- 📊 Supabase-backed progress and history views with empty states when no
  activity is available
- 👤 Editable user profile and per-user application preferences
- ⚙️ Account settings, email/password updates, logout, and a
  recently-authenticated account-deletion flow

## 🏗️ System Architecture

```text
User
  ↓
React + Vite Frontend
  ↓ authenticated REST requests
Node.js + Express Backend
  ├── Supabase PostgreSQL
  ├── Supabase Authentication
  ├── Supabase Storage
  └── Google Gemini API
```

- **Frontend:** Renders the public and authenticated pages, handles user input,
  communicates with Supabase Auth, and calls the backend with the user's access
  token.
- **Backend:** Validates requests, verifies Supabase access tokens, parses
  resumes, calls Gemini from the server, and reads or writes user-scoped data.
- **Supabase:** Provides Auth, PostgreSQL persistence, private resume-file
  Storage, and Row Level Security (RLS).
- **Google Gemini:** Produces structured resume analysis, interview questions,
  and interview-answer evaluations. Its API key is used only by the backend.

## 🛠️ Technology Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, JavaScript, Tailwind CSS, React Router, Recharts |
| Backend | Node.js, Express.js, REST API |
| Database and cloud | Supabase, PostgreSQL, Supabase Auth, Supabase Storage |
| AI | Google Gemini API |
| Resume parsing | `pdf-parse`, `mammoth` |

## 🔄 Application Workflow

```text
Register / Sign in
        ↓
Upload a PDF or DOCX resume
        ↓
Parse and save resume data
        ↓
Request AI resume analysis
        ↓
Review score, strengths, and suggestions
        ↓
Compare resume skills with a career role
        ↓
Review saved career recommendations
        ↓
Generate tailored interview questions
        ↓
Submit interview answers
        ↓
Review AI evaluation and saved progress
```

Each stage depends on the relevant user data being available. For example,
resume analysis requires a successfully uploaded and parsed resume.

## 📂 Project Structure

The structure below reflects the source and documentation present in this
repository; dependency folders and generated build output are omitted.

```text
project-root/
├── backend/
│   ├── scripts/
│   │   └── build.js
│   ├── src/
│   │   ├── config/          # Environment and Supabase clients
│   │   ├── controllers/     # API handlers and controller tests
│   │   ├── middleware/      # Authentication, validation, safe errors
│   │   ├── routes/          # Express API route definitions
│   │   ├── services/        # Gemini, parsing, career, and skill-gap logic
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── package-lock.json
│   └── package.json
├── documentation/
│   ├── supabase/
│   │   ├── migrations/      # Dated Supabase SQL migrations
│   │   ├── README.md
│   │   └── schema.sql
│   └── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── routes/
│   ├── .env.example
│   ├── package-lock.json
│   └── package.json
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## ⚙️ Installation & Setup

### Prerequisites

- Node.js compatible with the Vite version in `frontend/package.json`
- npm
- A Supabase project
- A Google Gemini API key for AI-powered analysis and interview workflows

### Clone Repository

Replace the URL with the GitHub repository URL supplied by the project owner:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd YOUR_REPOSITORY_FOLDER
```

### Install Dependencies

Run these commands from the project root:

```bash
npm install
npm --prefix frontend install
npm --prefix backend install
```

### Environment Variables

Example files are provided at `frontend/.env.example` and
`backend/.env.example`. In PowerShell, create local environment files without
overwriting existing ones:

```powershell
if (!(Test-Path "frontend/.env")) { Copy-Item "frontend/.env.example" "frontend/.env" }
if (!(Test-Path "backend/.env")) { Copy-Item "backend/.env.example" "backend/.env" }
```

Fill in the values locally. Do not commit `.env` files or share their contents.

**Frontend — `frontend/.env`:**

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL; local default is `http://localhost:3001/api` |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anon key used by the browser |

**Backend — `backend/.env`:**

| Variable | Purpose |
| --- | --- |
| `PORT` | API port; defaults to `3001` |
| `NODE_ENV` | Runtime environment |
| `CLIENT_URL` | Comma-separated allowed frontend origins; local example is `http://localhost:4173` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key used with the caller's access token |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key required for account deletion |
| `GEMINI_API_KEY` | Server-only key required for Gemini-powered workflows |

Never put `GEMINI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_*` variable
or in frontend code. The service-role key bypasses RLS and must remain private.

### Supabase Database and Storage

For a new Supabase project:

1. Create the private Storage bucket named `resume-files`.
2. Run `documentation/supabase/schema.sql` in the Supabase SQL Editor.
3. Apply every SQL migration in `documentation/supabase/migrations/` in
   filename/date order.

The migrations add resume parsing and analysis fields, career-role skill data,
recommendations, interview preparation fields, profile preferences, and
progress history. The base schema and migration SQL define the RLS policies
used by the application. See
[`documentation/supabase/README.md`](documentation/supabase/README.md) for the
database-specific setup details.

### Run the Application

From the project root, start both development servers:

```bash
npm run dev
```

- Frontend: `http://localhost:4173`
- Backend: `http://localhost:3001`
- Health check: `http://localhost:3001/api/health`

Keep the terminal running while using the application. To run the servers in
separate terminals, use `npm run dev:frontend` and `npm run dev:backend` from
the project root.

### Build, Lint, and Test

```bash
npm run lint
npm run build
npm --prefix backend run build
npm --prefix backend test
```

The backend build script performs a JavaScript syntax check; it does not bundle
the Node.js application.

## 🗄️ Database

The Supabase schema and migrations define the following application tables:

| Table | Purpose |
| --- | --- |
| `profiles` | User profile fields linked to Supabase Auth |
| `resumes` | Uploaded resume metadata, parsed content, and latest analysis |
| `resume_analysis` | Resume-analysis record structure in the base schema |
| `skills` | Skill catalogue for role requirements |
| `career_roles` | Career roles available for recommendations and comparisons |
| `career_role_skills` | Skills, priorities, and learning areas associated with roles |
| `recommendations` | User-owned saved career recommendation snapshots |
| `interview_sessions` | User-owned interview sessions and completion/score data |
| `interview_questions` | Questions generated for interview sessions |
| `interview_answers` | User answers to interview questions |
| `interview_evaluations` | Structured evaluation data for submitted answers |
| `progress_history` | General progress metric records in the base schema |
| `user_preferences` | Per-user application preferences |
| `resume_score_history` | Historical resume scores used by progress views |
| `skill_gap_analyses` | Saved role comparison results used by progress views |

Career-role and skill catalogue data is seeded by the
`20261003_skill_gap_roles.sql` migration. Resume files are stored in the private
`resume-files` Storage bucket; file paths are scoped to the owning user.

## 🤖 AI Integration

The backend uses the Google Gemini API for:

- Structured resume scoring and improvement feedback
- Interview-question generation
- Interview-answer evaluation

Skill-gap comparisons and career recommendations use parsed/analyzed resume
evidence together with role and skill requirements stored in Supabase. The
Gemini API key is read by the backend only and must never be exposed to the
browser.

Gemini availability, quota, and rate limits are controlled by Google and the
API-key project's tier. Application retries cannot bypass exhausted quotas.

## 🔌 API Documentation

All routes are served from `http://localhost:3001`. Unless marked **Public**,
the endpoint requires `Authorization: Bearer <Supabase access token>`.

| Method | Endpoint | Purpose | Authentication |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Check API health | Public |
| `GET` | `/api/resumes` | List the signed-in user's resumes | Required |
| `POST` | `/api/resumes/upload` | Upload and parse a PDF or DOCX resume (`multipart/form-data`, field `resume`) | Required |
| `GET` | `/api/resumes/:resumeId/view` | Create a short-lived signed URL for the owner's resume | Required |
| `POST` | `/api/resume/analyze` | Analyze a saved resume (`{ "resumeId": "..." }`) | Required |
| `GET` | `/api/skill-gap/roles` | List available career roles for skill comparisons | Required |
| `POST` | `/api/skill-gap/analyze` | Compare a resume with a role (`resumeId`, `roleId`) | Required |
| `POST` | `/api/career-recommendations/generate` | Generate and save career recommendations for a resume | Required |
| `GET` | `/api/career-recommendations/history` | List the signed-in user's saved recommendations | Required |
| `GET` | `/api/career-recommendations/roles/:roleId` | Get stored requirements for a career role | Required |
| `GET` | `/api/interview-prep/roles` | List interview-preparation career roles | Required |
| `GET` | `/api/interview-prep/sessions` | List the signed-in user's interview sessions | Required |
| `POST` | `/api/interview-prep/sessions` | Create an interview session and generate its questions | Required |
| `GET` | `/api/interview-prep/sessions/:sessionId` | Retrieve an owned interview session | Required |
| `POST` | `/api/interview-prep/sessions/:sessionId/answers` | Save and evaluate an interview answer | Required |
| `GET` | `/api/progress` | Retrieve the signed-in user's saved progress histories | Required |
| `DELETE` | `/api/account` | Delete the recently authenticated user's account and stored resume files | Required |

Profile and preference reads/updates, password/email changes, and Supabase Auth
flows use the Supabase client directly from the frontend under the configured
RLS policies; they are not Express endpoints.

## 🔒 Security

- Supabase Auth is used for registration, sign-in, and session management.
- Protected frontend routes require an authenticated session.
- Backend routes verify the bearer token with Supabase Auth before accessing
  user data.
- User-owned database operations are scoped to the authenticated user; the
  Supabase schema and migrations enable RLS and define owner policies.
- Resume Storage is private and its policies restrict files to the owning
  user's storage path.
- Resume uploads are limited to 10 MB and validated by file extension, MIME
  type, and file signature for PDF/DOCX.
- Gemini and Supabase service-role keys are backend-only environment variables.
- Backend errors are returned through centralized handling without exposing
  internal implementation details.
- CORS origins can be restricted with the backend `CLIENT_URL` setting.

## 📸 Screenshots

No screenshots are included yet. After capturing real application screenshots,
add them under `/screenshots/` and replace these example paths with the images:

```text
/screenshots/
├── landing.png
├── dashboard.png
├── resume-analysis.png
├── skill-gap.png
├── interview.png
└── progress.png
```

## 🚀 Future Scope

The following are possible future improvements and are **not presented as
current features**:

- Expand the career-role and skill catalogue.
- Add advanced resume benchmarking against role-specific criteria.
- Introduce additional interview modes and practice formats.
- Explore voice-based interview practice.
- Add more advanced analytics and reporting.
- Evaluate support for additional AI providers or models.

## 👨‍💻 Contributors

- Chandan Kharoliya
- Ayush Panchal
- Atul Karahe

## 📚 Project Context

**Domain:** Education and Career Development

**Intended users:** Students, fresh graduates, and job seekers.
