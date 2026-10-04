import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useAuth } from '../context/AuthContext';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');

async function readApiResponse(response) {
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The service returned an unreadable response. Please retry.');
  }
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Could not load your dashboard. Please retry.');
  }
  return payload.data;
}

function OverviewCard({ label, value, detail, to, action }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
      <Link className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary-700 hover:text-primary-800 hover:underline" to={to}>
        {action}<span aria-hidden="true" className="ml-1">→</span>
      </Link>
    </Card>
  );
}

export default function DashboardPage() {
  const { session } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (!session?.access_token) return undefined;
    const abortController = new AbortController();
    const options = { headers: { Authorization: `Bearer ${session.access_token}` }, signal: abortController.signal };

    Promise.all([
      fetch(`${apiBaseUrl}/progress`, options).then(readApiResponse),
      fetch(`${apiBaseUrl}/resumes`, options).then(readApiResponse),
    ])
      .then(([progress, resumes]) => {
        setDashboard({ progress, resumes });
        setError('');
      })
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'Could not load your dashboard. Please retry.');
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) setLoading(false);
      });

    return () => abortController.abort();
  }, [session?.access_token, refreshCount]);

  const resumeHistory = dashboard?.progress.resumeScoreHistory ?? [];
  const savedScores = resumeHistory.filter((item) => Number.isFinite(item.score));
  const latestScore = savedScores.at(-1)?.score;
  const recommendations = dashboard?.progress.recommendations ?? [];
  const completedMocks = (dashboard?.progress.mockInterviews ?? [])
    .filter((interview) => interview.status === 'completed');
  const scoredMocks = completedMocks.filter((interview) => Number.isFinite(interview.score));
  const interviewAverage = scoredMocks.length
    ? Math.round(scoredMocks.reduce((sum, interview) => sum + interview.score, 0) / scoredMocks.length)
    : null;
  const resumeCount = dashboard?.resumes.length ?? 0;
  const hasActivity = resumeCount + recommendations.length + completedMocks.length > 0;

  return (
    <AppLayout title="Dashboard" subtitle="A clear overview of the career preparation activity you have saved.">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Overview</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Your preparation snapshot</h2>
          </div>
          <Button variant="outline" onClick={() => { setLoading(true); setRefreshCount((count) => count + 1); }} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh dashboard'}
          </Button>
        </div>

        {loading && <p className="rounded-xl bg-white p-5 text-sm text-slate-500" role="status">Loading your saved activity...</p>}
        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3" role="alert">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="secondary" onClick={() => { setLoading(true); setRefreshCount((count) => count + 1); }}>Retry</Button>
          </div>
        )}

        {!loading && !error && dashboard && !hasActivity && (
          <Card title="Your dashboard is ready when you are" subtitle="No resume or preparation activity has been saved yet.">
            <p className="max-w-2xl text-sm leading-6 text-slate-600">Start by uploading and analyzing your resume. You can then review role-specific skill gaps, explore career recommendations, and practice a mock interview. This dashboard will reflect your saved activity.</p>
            <Link to="/resume-analysis" className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40">Analyze a resume</Link>
          </Card>
        )}

        {!loading && !error && dashboard && hasActivity && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <OverviewCard label="Saved resumes" value={resumeCount} detail="Files in your account" to="/resume-analysis" action="Review resumes" />
              <OverviewCard label="Latest resume score" value={latestScore === undefined ? '—' : `${latestScore}/100`} detail={savedScores.length ? `${savedScores.length} saved analyses` : 'Analyze a resume to get a score'} to="/resume-analysis" action="Open resume analysis" />
              <OverviewCard label="Career recommendations" value={recommendations.length} detail="Saved role recommendations" to="/career-recommendations" action="View career matches" />
              <OverviewCard label="Mock interviews" value={completedMocks.length} detail={interviewAverage === null ? 'Completed sessions' : `Average score ${interviewAverage}/100`} to="/mock-interview" action="Practice an interview" />
            </div>

            <Card title="Continue your preparation" subtitle="Pick up with a saved activity or start the next step.">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Resume analysis', detail: `${resumeCount} resume${resumeCount === 1 ? '' : 's'} saved`, to: '/resume-analysis' },
                  { label: 'Skill gap analysis', detail: 'Compare a resume with a target role', to: '/skill-gap' },
                  { label: 'Career recommendations', detail: 'Review role matches from your resume', to: '/career-recommendations' },
                  { label: 'Interview practice', detail: 'Continue preparation or start a mock', to: '/interview-preparation' },
                ].map((item) => (
                  <Link key={item.to} to={item.to} className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-primary-200 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50">
                    <p className="font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                  </Link>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
