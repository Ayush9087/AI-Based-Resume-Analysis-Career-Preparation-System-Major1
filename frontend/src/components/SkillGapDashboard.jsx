import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppLayout from './layout/AppLayout';
import Button from './common/Button';
import Card from './common/Card';
import { useAuth } from '../context/AuthContext';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');
const statusColors = ['#0f766e', '#d97706', '#e11d48'];

async function readApiResponse(response) {
  const payload = await response.json();
  if (!response.ok || !payload?.success) throw new Error(payload?.message || 'The request could not be completed.');
  return payload.data;
}

function SkillGroup({ title, skills, tone }) {
  const border = { positive: 'border-teal-600', caution: 'border-amber-500', negative: 'border-rose-600' };
  return (
    <section className={`border-t-2 ${border[tone]} pt-4`}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="text-xs tabular-nums text-slate-500">{skills.length}</span>
      </div>
      {skills.length ? (
        <ul className="mt-3 space-y-3">
          {skills.map((skill) => (
            <li key={skill.name} className="border-b border-slate-100 pb-3 last:border-0">
              <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                <span className="text-sm font-medium text-slate-800">{skill.name}</span>
                <span className="text-xs capitalize text-slate-500">{skill.priority} priority</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {skill.userStrength ? `${skill.userStrength} listed` : 'Not found in resume'} · Target: {skill.requiredStrength}
              </p>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-sm text-slate-400">No skills in this group.</p>}
    </section>
  );
}

export default function SkillGapDashboard() {
  const { session } = useAuth();
  const [roles, setRoles] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [roleId, setRoleId] = useState('');
  const [resumeId, setResumeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [optionsError, setOptionsError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!session?.access_token) return undefined;
    const abortController = new AbortController();
    const headers = { Authorization: `Bearer ${session.access_token}` };

    Promise.all([
      fetch(`${apiBaseUrl}/skill-gap/roles`, { headers, signal: abortController.signal }).then(readApiResponse),
      fetch(`${apiBaseUrl}/resumes`, { headers, signal: abortController.signal }).then(readApiResponse),
    ])
      .then(([roleData, resumeData]) => {
        setRoles(roleData);
        setResumes(resumeData);
        setRoleId((current) => (roleData.some((role) => role.id === current) ? current : (roleData[0]?.id ?? '')));
        setResumeId((current) => (resumeData.some((resume) => resume.id === current) ? current : (resumeData[0]?.id ?? '')));
        setOptionsError('');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setOptionsError(error.message || 'Could not load roles and resumes.');
      })
      .finally(() => {
        if (!abortController.signal.aborted) setLoading(false);
      });

    return () => abortController.abort();
  }, [session?.access_token, refreshCount]);

  const handleAnalyze = async () => {
    if (!roleId || !resumeId || !session?.access_token) return;
    setAnalyzing(true);
    setAnalysisError('');
    setResult(null);

    try {
      const response = await fetch(`${apiBaseUrl}/skill-gap/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, roleId }),
      });
      setResult(await readApiResponse(response));
    } catch (error) {
      setAnalysisError(error.message || 'Could not analyze this role. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const comparison = result?.comparison;
  const chartData = comparison ? [
    { status: 'Matched', count: comparison.summary.matched },
    { status: 'Improve', count: comparison.summary.needsImprovement },
    { status: 'Missing', count: comparison.summary.missing },
  ] : [];

  return (
    <AppLayout title="Skill Gap Analysis" subtitle="Compare resume skills with requirements for your target role.">
      <div className="mx-auto max-w-7xl space-y-5">
        <Card title="Choose your target" subtitle="Role requirements come from the career skills catalog.">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Target career role</span>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                value={roleId}
                onChange={(event) => { setRoleId(event.target.value); setResult(null); setAnalysisError(''); }}
                disabled={loading || roles.length === 0 || analyzing}
              >
                <option value="" disabled>Select a role</option>
                {roles.map((role) => <option key={role.id} value={role.id}>{role.title}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Resume</span>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                value={resumeId}
                onChange={(event) => { setResumeId(event.target.value); setResult(null); setAnalysisError(''); }}
                disabled={loading || resumes.length === 0 || analyzing}
              >
                <option value="" disabled>Select a saved resume</option>
                {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.original_name}</option>)}
              </select>
            </label>
            <Button onClick={handleAnalyze} disabled={loading || analyzing || !roleId || !resumeId}>
              {analyzing ? 'Comparing skills...' : 'Analyze skill gaps'}
            </Button>
          </div>

          {loading && <p className="mt-4 text-sm text-slate-500" role="status">Loading career roles and saved resumes...</p>}
          {optionsError && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
              <p className="text-sm text-red-700">{optionsError}</p>
              <Button variant="secondary" onClick={() => { setLoading(true); setRefreshCount((count) => count + 1); }}>Retry</Button>
            </div>
          )}
          {!loading && !optionsError && roles.length === 0 && (
            <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">No roles are available. Apply the skill-gap roles migration in Supabase, then reload.</p>
          )}
          {!loading && !optionsError && roles.length > 0 && resumes.length === 0 && (
            <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">Upload a resume before comparing skills to a role.</p>
          )}
        </Card>

        {analysisError && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
            <p className="text-sm text-red-700">{analysisError}</p>
            <Button variant="secondary" onClick={handleAnalyze}>Retry analysis</Button>
          </div>
        )}

        {comparison && result && (
          <>
            <Card title={result.role.title} subtitle={`${result.resume.originalName} · ${result.role.description}`}>
              <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)] md:items-center">
                <div>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exact skill match</p>
                      <p className="mt-1 text-4xl font-bold tabular-nums text-slate-900">{comparison.summary.matchPercent}<span className="text-lg font-medium text-slate-400">%</span></p>
                    </div>
                    <p className="text-sm text-slate-500">{comparison.summary.matched} of {comparison.summary.totalRequired} requirements matched</p>
                  </div>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Exact role skill match percentage" aria-valuemin={0} aria-valuemax={100} aria-valuenow={comparison.summary.matchPercent}>
                    <div className="h-full rounded-full bg-teal-700 transition-[width]" style={{ width: `${comparison.summary.matchPercent}%` }} />
                  </div>
                  <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                    {[
                      ['Matched', comparison.summary.matched],
                      ['Needs improvement', comparison.summary.needsImprovement],
                      ['Missing', comparison.summary.missing],
                    ].map(([label, value]) => (
                      <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{value}</dd></div>
                    ))}
                  </dl>
                </div>
                <div className="h-48 min-w-0" aria-label="Bar chart of skill match categories">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="status" width={74} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => [value, 'Skills']} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                        {chartData.map((entry, index) => <Cell key={entry.status} fill={statusColors[index]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>

            <div className="grid gap-5 xl:grid-cols-3">
              <Card title="Matching skills"><SkillGroup title="Meets listed target" skills={comparison.matchingSkills} tone="positive" /></Card>
              <Card title="Skills to improve"><SkillGroup title="Below listed target" skills={comparison.skillsNeedingImprovement} tone="caution" /></Card>
              <Card title="Missing skills"><SkillGroup title="Not found in resume" skills={comparison.missingSkills} tone="negative" /></Card>
            </div>

            <Card title="Recommended learning areas" subtitle="Prioritized from the selected role’s stored requirements.">
              {comparison.recommendedLearningAreas.length ? (
                <ol className="divide-y divide-slate-100">
                  {comparison.recommendedLearningAreas.map((item, index) => (
                    <li key={`${item.skill}-${item.area}`} className="flex flex-wrap items-start gap-3 py-4 first:pt-0 last:pb-0">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold tabular-nums text-slate-700">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1"><h3 className="text-sm font-semibold text-slate-900">{item.area}</h3><span className="text-xs text-slate-500">{item.skill}</span></div>
                        <p className="mt-1 text-xs capitalize text-slate-500">{item.priority} priority · {item.status === 'missing' ? 'not found' : 'below target'}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : <p className="text-sm text-slate-600">All listed role requirements are matched. Keep practicing and maintain these skills.</p>}
            </Card>
          </>
        )}

        {!comparison && !analysisError && !loading && roles.length > 0 && resumes.length > 0 && (
          <div className="border-y border-slate-200 py-8 text-center">
            <h2 className="text-lg font-semibold text-slate-900">Choose a role and resume to compare</h2>
            <p className="mt-1 text-sm text-slate-500">The comparison uses resume skills and role requirements stored in Supabase.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}