import { useEffect, useState } from 'react';
import AppLayout from './layout/AppLayout';
import Button from './common/Button';
import Card from './common/Card';
import { useAuth } from '../context/AuthContext';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');
const difficulties = ['easy', 'medium', 'hard'];
const experienceLevels = ['beginner', 'intermediate', 'advanced'];
const questionCounts = [4, 6, 8, 10];

async function readApiResponse(response) {
  const payload = await response.json();
  if (!response.ok || !payload?.success) throw new Error(payload?.message || 'The request could not be completed.');
  return payload.data;
}

function getQuestions(session) {
  return session?.interview_questions ?? session?.questions ?? [];
}

function getLatestEvaluation(question) {
  const latestAnswer = question?.interview_answers?.at(-1);
  return latestAnswer?.interview_evaluations?.at(-1) ?? null;
}

export default function InterviewPreparationDashboard({
  mode = 'preparation',
  title = 'AI Interview Preparation',
  subtitle = 'Practice role-specific questions and get feedback on each answer.',
  startLabel = 'Start preparation',
}) {
  const mockMode = mode === 'mock';
  const { session: authSession } = useAuth();
  const [roles, setRoles] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [experienceLevel, setExperienceLevel] = useState('intermediate');
  const [questionCount, setQuestionCount] = useState(6);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [currentSession, setCurrentSession] = useState(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [draftAnswers, setDraftAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [answerError, setAnswerError] = useState('');
  const [loadingSessionId, setLoadingSessionId] = useState('');

  useEffect(() => {
    if (!authSession?.access_token) return undefined;
    const abortController = new AbortController();
    const headers = { Authorization: `Bearer ${authSession.access_token}` };

    Promise.all([
      fetch(`${apiBaseUrl}/interview-prep/roles`, { headers, signal: abortController.signal }).then(readApiResponse),
      fetch(`${apiBaseUrl}/resumes`, { headers, signal: abortController.signal }).then(readApiResponse),
      fetch(`${apiBaseUrl}/interview-prep/sessions`, { headers, signal: abortController.signal }).then(readApiResponse),
    ])
      .then(([roleData, resumeData, sessionData]) => {
        setRoles(roleData);
        setResumes(resumeData);
        setSessions(sessionData);
        setSelectedRoleId((current) => (roleData.some((role) => role.id === current) ? current : (roleData[0]?.id ?? '')));
        setSelectedResumeId((current) => (resumeData.some((resume) => resume.id === current) ? current : (resumeData[0]?.id ?? '')));
        setLoadError('');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setLoadError(error.message || 'Could not load interview setup.');
      })
      .finally(() => {
        if (!abortController.signal.aborted) setLoading(false);
      });

    return () => abortController.abort();
  }, [authSession?.access_token]);

  const questions = getQuestions(currentSession);
  const activeQuestion = questions[activeQuestionIndex] ?? null;
  const activeEvaluation = getLatestEvaluation(activeQuestion);
  const answeredCount = questions.filter((question) => question.interview_answers?.length > 0).length;
  const selectedRole = roles.find((role) => role.id === selectedRoleId);
  const modeSessions = sessions.filter((item) => (item.session_type ?? 'preparation') === (mockMode ? 'mock' : 'preparation'));

  const startSession = async () => {
    if (!selectedResumeId || !selectedRoleId || !authSession?.access_token) return;
    setStarting(true);
    setStartError('');
    setAnswerError('');

    try {
      const response = await fetch(`${apiBaseUrl}/interview-prep/sessions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authSession.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: selectedResumeId,
          roleId: selectedRoleId,
          difficulty,
          experienceLevel,
          questionCount: Number(questionCount),
          sessionType: mockMode ? 'mock' : 'preparation',
        }),
      });
      const data = await readApiResponse(response);
      const nextSession = { ...data.session, interview_questions: data.questions };
      setCurrentSession(nextSession);
      setSessionId(nextSession.id);
      setActiveQuestionIndex(0);
      setDraftAnswers({});
      setSessions((current) => [nextSession, ...current.filter((item) => item.id !== nextSession.id)]);
    } catch (error) {
      setStartError(error.message || 'Could not start interview preparation. Please retry.');
    } finally {
      setStarting(false);
    }
  };

  const loadSession = async (nextSessionId) => {
    setSessionId(nextSessionId);
    setStartError('');
    setAnswerError('');
    if (!nextSessionId) {
      setCurrentSession(null);
      setDraftAnswers({});
      return;
    }

    setLoadingSessionId(nextSessionId);
    try {
      const response = await fetch(`${apiBaseUrl}/interview-prep/sessions/${nextSessionId}`, {
        headers: { Authorization: `Bearer ${authSession.access_token}` },
      });
      const data = await readApiResponse(response);
      setCurrentSession(data);
      setSelectedResumeId(data.resume_id ?? '');
      setSelectedRoleId(data.role_id ?? '');
      setActiveQuestionIndex(0);
      setDraftAnswers({});
    } catch (error) {
      setStartError(error.message || 'Could not load this interview session.');
    } finally {
      setLoadingSessionId('');
    }
  };

  const submitAnswer = async () => {
    const answer = draftAnswers[activeQuestion?.id]?.trim();
    if (!answer || !activeQuestion || !sessionId || !authSession?.access_token) return;
    setSubmitting(true);
    setAnswerError('');

    try {
      const response = await fetch(`${apiBaseUrl}/interview-prep/sessions/${sessionId}/answers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authSession.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: activeQuestion.id, answer }),
      });
      const data = await readApiResponse(response);
      setCurrentSession((current) => ({
        ...current,
        status: data.completed ? 'completed' : current.status,
        score: data.sessionScore ?? current.score,
        performance_report: data.performanceReport ?? current.performance_report,
        completed_at: data.completed ? new Date().toISOString() : current.completed_at,
        interview_questions: current.interview_questions.map((question) => (
          question.id === activeQuestion.id
            ? {
                ...question,
                interview_answers: [...(question.interview_answers ?? []), {
                  ...data.answer,
                  interview_evaluations: [data.evaluation],
                }],
              }
            : question
        )),
      }));
      setSessions((current) => current.map((item) => (
        item.id === sessionId
          ? { ...item, status: data.completed ? 'completed' : item.status, score: data.sessionScore ?? item.score }
          : item
      )));
    } catch (error) {
      setAnswerError(error.message || 'Could not submit this answer. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title={title} subtitle={subtitle}>
      <div className="mx-auto max-w-5xl space-y-5">
        <Card title={mockMode ? 'Set up your mock interview' : 'Prepare a session'} subtitle={mockMode ? 'Choose a role and difficulty, then answer one question at a time.' : 'Questions use your saved resume, target role, experience level, and selected difficulty.'}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <label className="xl:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Resume</span>
              <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" value={selectedResumeId} onChange={(event) => setSelectedResumeId(event.target.value)} disabled={loading || starting || resumes.length === 0}>
                <option value="" disabled>Select resume</option>
                {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.original_name}</option>)}
              </select>
            </label>
            <label className="xl:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Target role</span>
              <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" value={selectedRoleId} onChange={(event) => setSelectedRoleId(event.target.value)} disabled={loading || starting || roles.length === 0}>
                <option value="" disabled>Select role</option>
                {roles.map((role) => <option key={role.id} value={role.id}>{role.title}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Experience</span>
              <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm capitalize" value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)} disabled={starting}>
                {experienceLevels.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Difficulty</span>
              <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm capitalize" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} disabled={starting}>
                {difficulties.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Questions</span>
              <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} disabled={starting}>
                {questionCounts.map((count) => <option key={count} value={count}>{count}</option>)}
              </select>
            </label>
          </div>

          {loading && <p className="mt-4 text-sm text-slate-500" role="status">Loading resumes, roles, and previous sessions...</p>}
          {loadError && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
              <p className="text-sm text-red-700">{loadError}</p>
              <Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
            </div>
          )}
          {!loading && !loadError && resumes.length === 0 && <p className="mt-4 text-sm text-slate-600">Upload a resume before starting an interview session.</p>}
          {!loading && !loadError && roles.length === 0 && <p className="mt-4 text-sm text-slate-600">No career roles are available. Apply the skill-gap role seed migration in Supabase.</p>}

          <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
            <div className="min-w-[16rem] flex-1">
              <label htmlFor="saved-interview-session" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{mockMode ? 'Resume a mock interview' : 'Previous sessions'}</label>
              <select id="saved-interview-session" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" value={sessionId} onChange={(event) => loadSession(event.target.value)} disabled={loading || loadingSessionId !== ''}>
                <option value="">{mockMode ? 'Start a new mock interview' : 'Start a new session'}</option>
                {modeSessions.map((item) => {
                  const roleTitle = roles.find((role) => role.id === item.role_id)?.title ?? 'Interview session';
                  return <option key={item.id} value={item.id}>{roleTitle} · {item.status} · {new Date(item.created_at).toLocaleDateString()}</option>;
                })}
              </select>
            </div>
            <Button onClick={startSession} disabled={loading || starting || !selectedResumeId || !selectedRoleId}>
              {starting ? 'Generating questions...' : startLabel}
            </Button>
          </div>
        </Card>

        {startError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{startError}</p>}
        {answerError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{answerError}</p>}

        {currentSession && questions.length > 0 && (
          <Card title={selectedRole?.title ?? 'Interview session'} subtitle={`${currentSession.experience_level} experience · ${currentSession.difficulty} difficulty · ${currentSession.status}`}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="min-w-48 flex-1">
                <div className="flex flex-wrap justify-between gap-2 text-sm text-slate-600">
                  <span>{mockMode ? `Question ${activeQuestionIndex + 1} of ${questions.length}` : `${answeredCount} of ${questions.length} answered`}</span>
                  {mockMode && <span>{answeredCount} answered</span>}
                </div>
                {mockMode && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary-600 transition-[width]" style={{ width: `${((activeQuestionIndex + 1) / questions.length) * 100}%` }} /></div>}
              </div>
              {currentSession.status === 'completed' && <p className="text-sm font-semibold text-teal-700">Session complete · Average score {Number.isFinite(currentSession.score) ? `${currentSession.score}/100` : 'not available'}</p>}
            </div>

            {!mockMode && <nav aria-label="Interview questions" className="mb-5 flex flex-wrap gap-2">
              {questions.map((question, index) => {
                const answered = question.interview_answers?.length > 0;
                return (
                  <button key={question.id} type="button" onClick={() => { setActiveQuestionIndex(index); setAnswerError(''); }} className={`grid h-9 w-9 place-items-center rounded-full border text-sm font-medium ${activeQuestionIndex === index ? 'border-primary-600 bg-primary-600 text-white' : answered ? 'border-teal-200 bg-teal-50 text-teal-800' : 'border-slate-200 bg-white text-slate-700'}`} aria-label={`Question ${index + 1}${answered ? ', answered' : ''}`} aria-current={activeQuestionIndex === index ? 'step' : undefined}>
                    {index + 1}
                  </button>
                );
              })}
            </nav>}

            {activeQuestion && (
              <section aria-live="polite">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium capitalize text-slate-700">{activeQuestion.category}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium capitalize text-slate-700">{activeQuestion.difficulty}</span>
                  <span className="text-slate-500">Question {activeQuestionIndex + 1} of {questions.length}</span>
                </div>
                <h2 className="mt-4 text-lg font-semibold leading-7 text-slate-900">{activeQuestion.question_text}</h2>
                {!mockMode && activeQuestion.question_data?.rationale && <p className="mt-2 text-sm text-slate-600">{activeQuestion.question_data.rationale}</p>}

                {activeQuestion.interview_answers?.length ? (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-lg bg-slate-50 p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your answer</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{activeQuestion.interview_answers.at(-1).answer_text}</p>
                    </div>
                    {activeEvaluation && (
                      <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="text-sm font-semibold text-teal-900">Feedback</h3>
                          <p className="text-lg font-bold tabular-nums text-teal-900">{activeEvaluation.score}/100</p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-teal-900">{activeEvaluation.feedback}</p>
                        {activeEvaluation.evaluation_data && (
                          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                            {[
                              ['Relevance', activeEvaluation.evaluation_data.relevance],
                              ['Technical correctness', activeEvaluation.evaluation_data.technicalCorrectness],
                              ['Completeness', activeEvaluation.evaluation_data.completeness],
                            ].map(([label, score]) => (
                              <div key={label} className="rounded-md bg-white/70 px-3 py-2">
                                <dt className="text-xs text-teal-800">{label}</dt>
                                <dd className="mt-1 text-lg font-semibold tabular-nums text-teal-950">{score}/100</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div><h4 className="text-xs font-semibold uppercase tracking-wide text-teal-800">Strengths</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-teal-900">{(activeEvaluation.strengths ?? []).map((item, index) => <li key={index}>{item}</li>)}</ul></div>
                          <div><h4 className="text-xs font-semibold uppercase tracking-wide text-teal-800">Missing points</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-teal-900">{(activeEvaluation.evaluation_data?.missingPoints ?? []).map((item, index) => <li key={index}>{item}</li>)}</ul></div>
                          <div className="sm:col-span-2"><h4 className="text-xs font-semibold uppercase tracking-wide text-teal-800">Improvement suggestions</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-teal-900">{(activeEvaluation.evaluation_data?.improvementSuggestions ?? activeEvaluation.improvements ?? []).map((item, index) => <li key={index}>{item}</li>)}</ul></div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-5">
                    <label htmlFor={`answer-${activeQuestion.id}`} className="mb-1.5 block text-sm font-medium text-slate-800">Your answer</label>
                    <textarea
                      id={`answer-${activeQuestion.id}`}
                      className="min-h-36 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      value={draftAnswers[activeQuestion.id] ?? ''}
                      onChange={(event) => setDraftAnswers((current) => ({ ...current, [activeQuestion.id]: event.target.value }))}
                      maxLength={12000}
                      placeholder="Write your answer..."
                      disabled={submitting || currentSession.status === 'completed'}
                    />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-slate-500">{(draftAnswers[activeQuestion.id] ?? '').length}/12,000 characters</span>
                      <Button onClick={submitAnswer} disabled={submitting || !(draftAnswers[activeQuestion.id] ?? '').trim()}>
                        {submitting ? 'Evaluating answer...' : (mockMode ? 'Submit & evaluate' : 'Submit answer')}
                      </Button>
                    </div>
                  </div>
                )}

                <div className={`mt-6 flex border-t border-slate-100 pt-4 ${mockMode ? 'justify-end' : 'justify-between'}`}>
                  {!mockMode && <Button variant="outline" onClick={() => setActiveQuestionIndex((index) => Math.max(0, index - 1))} disabled={activeQuestionIndex === 0}>Previous</Button>}
                  <Button variant={mockMode ? 'primary' : 'secondary'} onClick={() => setActiveQuestionIndex((index) => Math.min(questions.length - 1, index + 1))} disabled={activeQuestionIndex === questions.length - 1 || (mockMode && !activeQuestion.interview_answers?.length)}>
                    {mockMode ? 'Continue to next question' : 'Next question'}
                  </Button>
                </div>
              </section>
            )}
          </Card>
        )}

        {currentSession?.status === 'completed' && currentSession.performance_report && (
          <Card title="Interview performance report" subtitle="Scores assess each written answer against its criteria, not psychological traits.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Overall score', currentSession.performance_report.averageScore],
                ['Relevance', currentSession.performance_report.averageRelevance],
                ['Technical correctness', currentSession.performance_report.averageTechnicalCorrectness],
                ['Completeness', currentSession.performance_report.averageCompleteness],
              ].map(([label, score]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{score ?? '—'}<span className="ml-1 text-sm font-medium text-slate-500">{score === null ? '' : '/100'}</span></p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 md:grid-cols-3">
              {[
                ['Consistent strengths', currentSession.performance_report.strengths],
                ['Points to revisit', currentSession.performance_report.missingPoints],
                ['Suggested next steps', currentSession.performance_report.improvementSuggestions],
              ].map(([label, items]) => (
                <section key={label}>
                  <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
                  {items?.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No items recorded.</p>}
                </section>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}