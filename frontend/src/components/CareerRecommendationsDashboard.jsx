import { useEffect, useState } from 'react';
import AppLayout from './layout/AppLayout';
import Button from './common/Button';
import Card from './common/Card';
import { useAuth } from '../context/AuthContext';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');

async function readApiResponse(response) {
  const payload = await response.json();
  if (!response.ok || !payload?.success) throw new Error(payload?.message || 'The request could not be completed.');
  return payload.data;
}

function toHistoryEntry(row) {
  const recommendation = row.recommendation_data ?? {};
  return {
    ...row,
    recommendation: {
      ...recommendation,
      role: recommendation.role ?? { id: row.role_id, title: row.title, description: '' },
      explanation: recommendation.explanation ?? row.description,
    },
  };
}

function SkillList({ title, skills, tone }) {
  const colors = {
    match: 'border-teal-200 bg-teal-50 text-teal-800',
    missing: 'border-rose-200 bg-rose-50 text-rose-800',
    improve: 'border-amber-200 bg-amber-50 text-amber-800',
  };
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {skills?.length ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li key={skill.name} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${colors[tone]}`}>
              {skill.name}
            </li>
          ))}
        </ul>
      ) : <p className="mt-2 text-sm text-slate-400">None identified</p>}
    </section>
  );
}

export default function CareerRecommendationsDashboard() {
  const { session } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [openRoleId, setOpenRoleId] = useState('');
  const [roleDetails, setRoleDetails] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState('');
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    if (!session?.access_token) return undefined;
    const abortController = new AbortController();
    const headers = { Authorization: `Bearer ${session.access_token}` };

    Promise.all([
      fetch(`${apiBaseUrl}/resumes`, { headers, signal: abortController.signal }).then(readApiResponse),
      fetch(`${apiBaseUrl}/career-recommendations/history`, { headers, signal: abortController.signal }).then(readApiResponse),
    ])
      .then(([resumeData, historyData]) => {
        const historyEntries = historyData.map(toHistoryEntry);
        setResumes(resumeData);
        setHistory(historyEntries);
        setSelectedResumeId((current) => (
          resumeData.some((resume) => resume.id === current) ? current : (resumeData[0]?.id ?? '')
        ));
        setError('');
      })
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') setError(loadError.message || 'Could not load resume and recommendation history.');
      })
      .finally(() => {
        if (!abortController.signal.aborted) setLoading(false);
      });

    return () => abortController.abort();
  }, [session?.access_token, refreshCount]);

  const selectedResume = resumes.find((resume) => resume.id === selectedResumeId);
  const visibleHistory = history.filter((entry) => entry.resume_id === selectedResumeId);

  const generate = async () => {
    if (!selectedResumeId || !session?.access_token) return;
    setGenerating(true);
    setGenerationError('');

    try {
      const response = await fetch(`${apiBaseUrl}/career-recommendations/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: selectedResumeId }),
      });
      const data = await readApiResponse(response);
      const newEntries = data.recommendations.map((recommendation) => toHistoryEntry({
        id: recommendation.historyId,
        resume_id: selectedResumeId,
        role_id: recommendation.role.id,
        title: recommendation.role.title,
        description: recommendation.explanation,
        recommendation_data: recommendation,
        created_at: recommendation.createdAt,
      }));
      setHistory((current) => [...newEntries, ...current]);
    } catch (requestError) {
      setGenerationError(requestError.message || 'Could not generate recommendations. Please retry.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleRoleDetails = async (roleId) => {
    if (openRoleId === roleId) {
      setOpenRoleId('');
      setDetailError('');
      return;
    }

    setOpenRoleId(roleId);
    setDetailError('');
    if (roleDetails[roleId]) return;
    setDetailLoadingId(roleId);

    try {
      const response = await fetch(`${apiBaseUrl}/career-recommendations/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await readApiResponse(response);
      setRoleDetails((current) => ({ ...current, [roleId]: data }));
    } catch (requestError) {
      setDetailError(requestError.message || 'Could not load role requirements.');
    } finally {
      setDetailLoadingId('');
    }
  };

  return (
    <AppLayout title="Career Recommendations" subtitle="Explore roles based on evidence in your saved resume.">
      <div className="mx-auto max-w-6xl space-y-5">
        <Card title="Recommendation profile" subtitle="Recommendations use resume skills, education, projects, experience, and interests when available.">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[15rem] flex-1">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Resume</span>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                value={selectedResumeId}
                onChange={(event) => {
                  setSelectedResumeId(event.target.value);
                  setGenerationError('');
                  setOpenRoleId('');
                }}
                disabled={loading || resumes.length === 0 || generating}
              >
                <option value="" disabled>Select a saved resume</option>
                {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.original_name}</option>)}
              </select>
            </label>
            <Button onClick={generate} disabled={loading || generating || !selectedResumeId}>
              {generating ? 'Reviewing resume...' : 'Generate recommendations'}
            </Button>
          </div>
          {loading && <p className="mt-4 text-sm text-slate-500" role="status">Loading resumes and saved recommendations...</p>}
          {error && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
              <p className="text-sm text-red-700">{error}</p>
              <Button variant="secondary" onClick={() => { setLoading(true); setRefreshCount((count) => count + 1); }}>Retry</Button>
            </div>
          )}
          {!loading && !error && resumes.length === 0 && (
            <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">Upload a resume in Resume Analysis before generating role recommendations.</p>
          )}
          {selectedResume && (
            <p className="mt-3 text-xs text-slate-500">Using saved information from {selectedResume.original_name}. Recommendations are guidance, not a promise of employment or career outcomes.</p>
          )}
        </Card>

        {generationError && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
            <p className="text-sm text-red-700">{generationError}</p>
            <Button variant="secondary" onClick={generate}>Retry</Button>
          </div>
        )}

        {detailError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{detailError}</p>}

        {!loading && !error && selectedResume && visibleHistory.length === 0 && (
          <div className="border-y border-slate-200 py-10 text-center">
            <h2 className="text-lg font-semibold text-slate-900">No recommendations saved for this resume</h2>
            <p className="mt-1 text-sm text-slate-500">Generate recommendations to compare this resume with career roles in the database.</p>
          </div>
        )}

        {visibleHistory.length > 0 && (
          <section aria-labelledby="recommendation-history-title">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="recommendation-history-title" className="text-lg font-semibold text-slate-900">Saved recommendations</h2>
              <p className="text-sm text-slate-500">{visibleHistory.length} history entries for {selectedResume?.original_name}</p>
            </div>
            <div className="space-y-4">
              {visibleHistory.map((entry) => {
                const recommendation = entry.recommendation;
                const isOpen = openRoleId === entry.role_id;
                const details = roleDetails[entry.role_id];

                return (
                  <Card key={entry.id}>
                    <article>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-slate-900">{recommendation.role.title}</h3>
                          <p className="mt-1 text-xs text-slate-500">Saved {entry.created_at ? new Date(entry.created_at).toLocaleString() : 'just now'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resume skill match</p>
                          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{Number.isFinite(recommendation.skillMatchPercent) ? `${recommendation.skillMatchPercent}%` : '—'}</p>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-600">{recommendation.explanation}</p>

                      <div className="mt-5 grid gap-5 md:grid-cols-3">
                        <SkillList title="Matching skills" skills={recommendation.matchingSkills} tone="match" />
                        <SkillList title="Missing skills" skills={recommendation.missingSkills} tone="missing" />
                        <SkillList title="Skills to improve" skills={recommendation.skillsNeedingImprovement} tone="improve" />
                      </div>

                      <section className="mt-5 border-t border-slate-100 pt-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested preparation areas</h4>
                        {recommendation.suggestedPreparationAreas?.length ? (
                          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                            {recommendation.suggestedPreparationAreas.map((area) => (
                              <li key={`${area.skill}-${area.area}`} className="text-sm text-slate-700">
                                <span className="font-medium">{area.area}</span><span className="ml-1 text-slate-500">({area.skill}, {area.priority} priority)</span>
                              </li>
                            ))}
                          </ul>
                        ) : <p className="mt-2 text-sm text-slate-500">No preparation gaps were identified in the stored requirements.</p>}
                      </section>

                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <Button variant="outline" onClick={() => toggleRoleDetails(entry.role_id)} disabled={detailLoadingId === entry.role_id}>
                          {detailLoadingId === entry.role_id ? 'Loading requirements...' : (isOpen ? 'Hide role requirements' : 'View role requirements')}
                        </Button>
                      </div>

                      {isOpen && details && (
                        <section className="mt-4 border-t border-slate-100 pt-4" aria-label={`${details.title} skill requirements`}>
                          <h4 className="text-sm font-semibold text-slate-900">{details.title} requirements</h4>
                          <p className="mt-1 text-sm text-slate-600">{details.description}</p>
                          <div className="mt-4 divide-y divide-slate-100">
                            {details.skillRequirements.map((skill) => (
                              <div key={skill.name} className="grid gap-1 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4">
                                <div>
                                  <p className="text-sm font-medium text-slate-800">{skill.name}</p>
                                  <p className="mt-0.5 text-xs text-slate-500">{skill.description}</p>
                                </div>
                                <span className="text-xs capitalize text-slate-600">Target: {skill.required_strength}</span>
                                <span className="text-xs capitalize text-slate-600">{skill.priority} priority</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                    </article>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}