import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useAuth } from '../context/AuthContext';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');
const statusColors = { match: '#0f766e', 'needs-improvement': '#d97706', missing: '#e11d48' };
const interviewColors = ['#2563eb', '#cbd5e1'];
const emptyArray = [];

async function readApiResponse(response) {
  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Could not load your progress from Supabase.');
  }
  return payload.data;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getSkills(analysis) {
  return Array.isArray(analysis?.comparison_data?.skills) ? analysis.comparison_data.skills : [];
}

function ChartEmptyState({ children }) {
  return <p className="grid h-full min-h-48 place-items-center px-6 text-center text-sm text-slate-500">{children}</p>;
}

function MetricCard({ label, value, detail }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </Card>
  );
}

export default function ProgressPage() {
  const { session } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (!session?.access_token) return undefined;
    const abortController = new AbortController();

    fetch(`${apiBaseUrl}/progress`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      signal: abortController.signal,
    })
      .then(readApiResponse)
      .then((data) => {
        setProgress(data);
        setError('');
      })
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'Could not load your progress. Please retry.');
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) setLoading(false);
      });

    return () => abortController.abort();
  }, [session?.access_token, refreshCount]);

  const resumeScores = progress?.resumeScoreHistory ?? emptyArray;
  const skillGapHistory = progress?.skillGapHistory ?? emptyArray;
  const mockInterviews = progress?.mockInterviews ?? emptyArray;
  const recommendations = progress?.recommendations ?? emptyArray;
  const completedInterviews = mockInterviews.filter((interview) => interview.status === 'completed');
  const scoredInterviews = completedInterviews.filter((interview) => Number.isFinite(interview.score));
  const averageInterviewScore = scoredInterviews.length
    ? Math.round(scoredInterviews.reduce((sum, interview) => sum + interview.score, 0) / scoredInterviews.length)
    : null;
  const latestGap = skillGapHistory.at(-1) ?? null;
  const latestSkills = getSkills(latestGap);
  const skillCounts = [
    { status: 'Matched', count: latestSkills.filter((skill) => skill.status === 'match').length, fill: statusColors.match },
    { status: 'Needs improvement', count: latestSkills.filter((skill) => skill.status === 'needs-improvement').length, fill: statusColors['needs-improvement'] },
    { status: 'Missing', count: latestSkills.filter((skill) => skill.status === 'missing').length, fill: statusColors.missing },
  ].filter((item) => item.count > 0);

  const skillsProgress = useMemo(() => {
    if (!latestGap) return [];
    const sameRoleAnalyses = skillGapHistory
      .filter((analysis) => (latestGap.role_id ? analysis.role_id === latestGap.role_id : analysis.role_title === latestGap.role_title))
      .slice(-8);
    return sameRoleAnalyses.map((analysis) => {
      const summary = analysis.comparison_data?.summary ?? {};
      const skills = getSkills(analysis);
      return {
        date: formatDate(analysis.analyzed_at),
        matched: Number.isFinite(summary.matched) ? summary.matched : skills.filter((skill) => skill.status === 'match').length,
        needsImprovement: Number.isFinite(summary.needsImprovement)
          ? summary.needsImprovement
          : skills.filter((skill) => skill.status === 'needs-improvement').length,
        missing: Number.isFinite(summary.missing) ? summary.missing : skills.filter((skill) => skill.status === 'missing').length,
      };
    });
  }, [latestGap, skillGapHistory]);

  const improvedSkills = useMemo(() => {
    if (!latestGap) return [];
    const roleAnalyses = skillGapHistory.filter((analysis) => (
      latestGap.role_id ? analysis.role_id === latestGap.role_id : analysis.role_title === latestGap.role_title
    ));
    if (roleAnalyses.length < 2) return [];
    const previous = new Map(getSkills(roleAnalyses.at(-2)).map((skill) => [skill.name.toLowerCase(), skill.status]));
    return getSkills(latestGap).filter((skill) => (
      skill.status === 'match' && previous.get(skill.name.toLowerCase()) !== 'match'
    ));
  }, [latestGap, skillGapHistory]);

  const interviewCompletion = [
    { name: 'Completed', value: completedInterviews.length },
    { name: 'Not completed', value: mockInterviews.length - completedInterviews.length },
  ].filter((item) => item.value > 0);
  const prepStages = [
    { label: 'Resume analyzed', complete: resumeScores.length > 0, to: '/resume-analysis', action: 'Analyze a resume' },
    { label: 'Skill gaps reviewed', complete: skillGapHistory.length > 0, to: '/skill-gap', action: 'Review skill gaps' },
    { label: 'Career recommendations generated', complete: recommendations.length > 0, to: '/career-recommendations', action: 'Explore career matches' },
    { label: 'Mock interview completed', complete: completedInterviews.length > 0, to: '/mock-interview', action: 'Start a mock interview' },
  ];
  const completedStages = prepStages.filter((stage) => stage.complete).length;
  const hasAnyHistory = resumeScores.length + skillGapHistory.length + mockInterviews.length + recommendations.length > 0;

  return (
    <AppLayout title="Progress" subtitle="See how your resume, skills, and interview practice change over time.">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Your preparation dashboard</h2>
            <p className="mt-1 text-sm text-slate-500">Every metric and chart below comes from your saved Supabase records.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              setRefreshCount((count) => count + 1);
            }}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh progress'}
          </Button>
        </div>

        {loading && <p className="rounded-xl bg-white p-5 text-sm text-slate-500" role="status">Loading saved progress...</p>}

        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3" role="alert">
            <p className="text-sm text-red-700">{error} If this is the first setup, apply the progress dashboard migration in Supabase.</p>
            <Button variant="secondary" onClick={() => { setLoading(true); setRefreshCount((count) => count + 1); }}>Retry</Button>
          </div>
        )}

        {!loading && !error && progress && !hasAnyHistory && (
          <Card title="Your progress starts with your first saved activity" subtitle="There is no resume, skill-gap, career recommendation, or mock-interview history yet.">
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Upload and analyze a resume to save your first score. Then compare it with a target role, generate career recommendations, and complete a mock interview. Your charts will fill in as those activities are saved.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700" to="/resume-analysis">Analyze a resume</Link>
              <Link className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" to="/mock-interview">Start a mock interview</Link>
            </div>
          </Card>
        )}

        {!loading && !error && progress && hasAnyHistory && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Saved resume scores" value={resumeScores.length} detail="Each saved analysis is one history point" />
              <MetricCard label="Mock interviews completed" value={completedInterviews.length} detail={`${mockInterviews.length} mock sessions started`} />
              <MetricCard label="Average mock score" value={averageInterviewScore === null ? '—' : `${averageInterviewScore}/100`} detail={scoredInterviews.length ? `From ${scoredInterviews.length} completed scored sessions` : 'Available after a scored mock interview'} />
              <MetricCard label="Preparation stages" value={`${completedStages} of ${prepStages.length}`} detail="Stages with saved activity" />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <Card title="Resume score trend" subtitle="Saved analysis scores over time">
                <div className="h-72">
                  {resumeScores.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={resumeScores}>
                        <defs>
                          <linearGradient id="resumeScoreFill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="analyzed_at" tickFormatter={formatDate} stroke="#64748b" />
                        <YAxis domain={[0, 100]} stroke="#64748b" />
                        <Tooltip labelFormatter={formatDate} formatter={(value, _name, item) => [`${value}/100`, item.payload.resume_name]} />
                        <Area type="monotone" dataKey="score" name="Resume score" stroke="#2563eb" fill="url(#resumeScoreFill)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <ChartEmptyState>Analyze a saved resume to create your first score-history point.</ChartEmptyState>}
                </div>
              </Card>

              <Card title="Interview score trend" subtitle="Scores from completed mock interviews">
                <div className="h-72">
                  {scoredInterviews.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={scoredInterviews}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="completed_at" tickFormatter={formatDate} stroke="#64748b" />
                        <YAxis domain={[0, 100]} stroke="#64748b" />
                        <Tooltip labelFormatter={formatDate} formatter={(value) => [`${value}/100`, 'Interview score']} />
                        <Area type="monotone" dataKey="score" stroke="#0f766e" fill="#14b8a6" fillOpacity={0.16} strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <ChartEmptyState>Complete a mock interview to see your interview performance trend.</ChartEmptyState>}
                </div>
              </Card>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <Card title="Latest skill gaps" subtitle={latestGap ? `${latestGap.role_title} · checked ${formatDate(latestGap.analyzed_at)}` : 'Saved role comparisons'}>
                <div className="h-64">
                  {skillCounts.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={skillCounts} layout="vertical" margin={{ left: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" allowDecimals={false} stroke="#64748b" />
                        <YAxis type="category" dataKey="status" width={130} stroke="#64748b" />
                        <Tooltip />
                        <Bar dataKey="count" name="Skills" radius={[0, 6, 6, 0]}>
                          {skillCounts.map((entry) => <Cell key={entry.status} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <ChartEmptyState>Compare a saved resume with a target role to see matched, developing, and missing skills.</ChartEmptyState>}
                </div>
              </Card>

              <Card title="Mock interview completion" subtitle={`${completedInterviews.length} of ${mockInterviews.length} saved mock sessions completed`}>
                <div className="h-64">
                  {interviewCompletion.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={interviewCompletion} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>
                          {interviewCompletion.map((entry) => (
                            <Cell key={entry.name} fill={entry.name === 'Completed' ? interviewColors[0] : interviewColors[1]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <ChartEmptyState>Start a mock interview to track how many sessions you complete.</ChartEmptyState>}
                </div>
              </Card>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <Card title="Skills progress" subtitle={latestGap ? `Matched skills across saved checks for ${latestGap.role_title}` : 'Compare the same role more than once to see progress'}>
                <div className="h-64">
                  {skillsProgress.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={skillsProgress}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#64748b" />
                        <YAxis allowDecimals={false} stroke="#64748b" />
                        <Tooltip />
                        <Bar dataKey="matched" name="Matched" stackId="skills" fill={statusColors.match} />
                        <Bar dataKey="needsImprovement" name="Needs improvement" stackId="skills" fill={statusColors['needs-improvement']} />
                        <Bar dataKey="missing" name="Missing" stackId="skills" fill={statusColors.missing} radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <ChartEmptyState>Run another skill-gap check for the same role to compare saved results over time.</ChartEmptyState>}
                </div>
                <div className="mt-3 border-t border-slate-100 pt-4">
                  <h3 className="text-sm font-semibold text-slate-900">Skills improved since the previous check</h3>
                  {improvedSkills.length ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {improvedSkills.map((skill) => (
                        <li key={skill.name} className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">{skill.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">
                      {skillGapHistory.length < 2
                        ? 'Repeat a skill-gap check for this role to identify skills that move into the matched group.'
                        : 'No skills moved into the matched group since the previous check for this role.'}
                    </p>
                  )}
                </div>
              </Card>

              <Card title="Career preparation progress" subtitle={`${completedStages} of ${prepStages.length} stages have saved activity`}>
                <ol className="space-y-3">
                  {prepStages.map((stage, index) => (
                    <li key={stage.label} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${stage.complete ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'}`}>
                        {stage.complete ? '✓' : index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${stage.complete ? 'text-slate-900' : 'text-slate-600'}`}>{stage.label}</p>
                        {!stage.complete && <Link className="mt-0.5 inline-block text-xs font-medium text-primary-700 hover:underline" to={stage.to}>{stage.action}</Link>}
                      </div>
                      <span className={`text-xs font-semibold ${stage.complete ? 'text-teal-700' : 'text-slate-400'}`}>{stage.complete ? 'Recorded' : 'Not started'}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
