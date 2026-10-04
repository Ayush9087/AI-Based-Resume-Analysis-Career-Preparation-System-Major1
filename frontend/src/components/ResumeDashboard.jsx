import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Button from './common/Button';
import Card from './common/Card';

const resumeSections = [
  ['contact', 'Contact'],
  ['summary', 'Summary'],
  ['education', 'Education'],
  ['skills', 'Skills'],
  ['projects', 'Projects'],
  ['experience', 'Experience'],
  ['internships', 'Internships'],
  ['certifications', 'Certifications'],
  ['achievements', 'Achievements'],
];
const parsedSections = [
  ['education', 'Education'],
  ['skills', 'Skills'],
  ['projects', 'Projects'],
  ['experience', 'Experience'],
  ['internships', 'Internships'],
  ['certifications', 'Certifications'],
  ['achievements', 'Achievements'],
];

function ScoreRing({ score }) {
  return (
    <div
      className="grid h-40 w-40 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(#2563eb ${score * 3.6}deg, #e2e8f0 0deg)` }}
      role="img"
      aria-label={`Overall resume score: ${score} out of 100`}
    >
      <div className="grid h-32 w-32 place-items-center rounded-full bg-white text-center">
        <div>
          <p className="text-4xl font-bold tabular-nums text-slate-900">{score}</p>
          <p className="text-xs font-medium text-slate-500">out of 100</p>
        </div>
      </div>
    </div>
  );
}

function FeedbackList({ title, items, tone = 'neutral' }) {
  const markerClass = tone === 'positive' ? 'bg-emerald-500' : tone === 'negative' ? 'bg-rose-500' : 'bg-blue-500';
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {items?.length ? (
        <ul className="mt-3 space-y-2.5">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-2.5 text-sm leading-6 text-slate-700">
              <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${markerClass}`} aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      ) : <p className="mt-2 text-sm text-slate-400">No items reported.</p>}
    </section>
  );
}

function SkillBadges({ title, skills }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {skills?.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <li key={`${skill}-${index}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              {skill}
            </li>
          ))}
        </ul>
      ) : <p className="mt-2 text-sm text-slate-400">No skills detected.</p>}
    </section>
  );
}

export default function ResumeDashboard({
  resumes,
  resume,
  loading,
  loadError,
  onRefresh,
  onSelect,
  onAnalyze,
  analyzing,
  analysisError,
  onView,
  previewLoading,
}) {
  const analysis = resume?.analysis_data;
  const parsed = resume?.parsed_data ?? {};
  const sectionScores = analysis?.sectionScores ?? {};
  const chartData = resumeSections
    .filter(([key]) => typeof sectionScores[key] === 'number')
    .map(([key, label]) => ({ section: label, score: sectionScores[key] }));
  const extractedSkills = parsed.skills ?? analysis?.skills ?? [];

  return (
    <div className="space-y-5">
      <Card title="Resume dashboard" subtitle="Scores and feedback are saved with your uploaded resume.">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[15rem] flex-1">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Saved resumes</span>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              value={resume?.id ?? ''}
              onChange={(event) => onSelect(event.target.value)}
              disabled={loading || resumes.length === 0 || analyzing}
            >
              <option value="" disabled>Select a resume</option>
              {resumes.map((item) => (
                <option key={item.id} value={item.id}>{item.original_name}</option>
              ))}
            </select>
          </label>
          {resume && (
            <>
              <Button variant="outline" onClick={() => onView(resume.id)} disabled={previewLoading}>
                {previewLoading ? 'Preparing file...' : 'View uploaded resume'}
              </Button>
              <Button onClick={() => onAnalyze(resume.id)} disabled={analyzing}>
                {analyzing ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Analyze resume'}
              </Button>
            </>
          )}
        </div>

        {loading && <p className="mt-4 text-sm text-slate-500" role="status">Loading saved resumes...</p>}
        {loadError && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
            <p className="text-sm text-red-700">{loadError}</p>
            <Button variant="secondary" onClick={onRefresh}>Retry</Button>
          </div>
        )}
        {!loading && !loadError && resumes.length === 0 && (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <h3 className="font-semibold text-slate-900">No resumes yet</h3>
            <p className="mt-1 text-sm text-slate-500">Upload a PDF or DOCX above to create your first resume dashboard.</p>
          </div>
        )}
      </Card>

      {analysisError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
          <p className="text-sm text-red-700">{analysisError}</p>
          {resume && <Button variant="secondary" onClick={() => onAnalyze(resume.id)}>Retry analysis</Button>}
        </div>
      )}

      {resume && (
        <>
          <Card title={resume.original_name} subtitle={analysis ? 'Latest saved analysis' : 'Resume information extracted from your file'}>
            {analysis ? (
              <div className="grid items-center gap-7 md:grid-cols-[auto_1fr]">
                <ScoreRing score={analysis.overallScore} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Overall resume score</p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    A section-by-section view of the information present in this resume. Use the feedback below to guide your next revision.
                  </p>
                  <p className="mt-4 text-xs text-slate-500">
                    Analyzed {resume.updated_at ? new Date(resume.updated_at).toLocaleString() : 'time unavailable'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
                <div>
                  <p className="font-medium text-slate-800">No analysis saved for this resume</p>
                  <p className="mt-1 text-sm text-slate-500">Analyze it to see scores, skills, and improvement guidance.</p>
                </div>
                {analyzing && <p className="text-sm text-primary-700" role="status">Analyzing resume...</p>}
              </div>
            )}
          </Card>

          {analysis && (
            <div className="grid gap-5 xl:grid-cols-2">
              <Card title="Section scores" subtitle="Score by resume section, from 0 to 100.">
                <dl className="space-y-4">
                  {chartData.map(({ section, score }) => (
                    <div key={section}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <dt className="text-slate-600">{section}</dt>
                        <dd className="font-semibold tabular-nums text-slate-900">{score}</dd>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${section} score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
                        <div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  ))}
                </dl>
              </Card>

              <Card title="Score comparison" subtitle="Compare section scores at a glance.">
                <div className="h-72 w-full" aria-label="Bar chart of resume section scores">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 34, left: -18 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="section" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => [`${value} / 100`, 'Score']} />
                      <Bar dataKey="score" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Section profile" subtitle="Radar view highlights relative balance across sections.">
                <div className="h-80 w-full" aria-label="Radar chart of resume section scores">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={chartData} outerRadius="72%">
                      <PolarGrid />
                      <PolarAngleAxis dataKey="section" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value) => [`${value} / 100`, 'Score']} />
                      <Radar dataKey="score" stroke="#0f766e" fill="#14b8a6" fillOpacity={0.22} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Feedback" subtitle="Prioritize specific, actionable changes.">
                <div className="grid gap-6 sm:grid-cols-2">
                  <FeedbackList title="Strengths" items={analysis.strengths} tone="positive" />
                  <FeedbackList title="Weaknesses" items={analysis.weaknesses} tone="negative" />
                  <FeedbackList title="Improvement suggestions" items={analysis.suggestions} />
                  <FeedbackList title="Missing information" items={analysis.missingInformation} />
                </div>
              </Card>

              <Card title="Skills" subtitle="Skills detected in the saved resume analysis.">
                <div className="space-y-6">
                  <SkillBadges title="Extracted skills" skills={extractedSkills} />
                  <SkillBadges title="Technical skills" skills={analysis.technicalSkills} />
                  <SkillBadges title="Soft skills" skills={analysis.softSkills} />
                </div>
              </Card>
            </div>
          )}

          <Card title="Resume information" subtitle="Parsed fields stored with this uploaded resume.">
            <div className="grid gap-6 md:grid-cols-2">
              <section>
                <h3 className="text-sm font-semibold text-slate-900">Contact</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  {[
                    ['Name', parsed.name],
                    ['Email', parsed.email],
                    ['Phone', parsed.phone],
                    ['Location', parsed.location],
                  ].map(([label, value]) => value && (
                    <div key={label} className="grid grid-cols-[5rem_1fr] gap-3">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="break-words text-slate-800">{value}</dd>
                    </div>
                  ))}
                  {!parsed.name && !parsed.email && !parsed.phone && !parsed.location && <p className="text-slate-400">No contact details detected.</p>}
                </dl>
              </section>
              {parsedSections.map(([key, label]) => (
                <section key={key}>
                  <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
                  {parsed[key]?.length ? (
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                      {parsed[key].map((item, index) => <li key={`${key}-${index}`}>{item}</li>)}
                    </ul>
                  ) : <p className="mt-2 text-sm text-slate-400">No details detected.</p>}
                </section>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}