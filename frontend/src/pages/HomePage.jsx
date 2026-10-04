import { Link } from 'react-router-dom';
import Card from '../components/common/Card';

const steps = [
  'Upload your resume',
  'Analyze your profile',
  'Identify skill gaps',
  'Prepare for your target career',
];

const featureSections = [
  {
    title: 'Resume analysis',
    text: 'Get an AI-driven review of resume structure, content clarity, and ways to strengthen your evidence.',
    icon: '01',
  },
  {
    title: 'Skill-gap analysis',
    text: 'Compare your current strengths against role requirements to focus on the most valuable learning areas.',
    icon: '02',
  },
  {
    title: 'Career recommendations',
    text: 'Receive role suggestions that match your resume, academic profile, and growth potential.',
    icon: '03',
  },
  {
    title: 'Interview preparation',
    text: 'Practice role-based questions and get structured guidance for technical and behavioral rounds.',
    icon: '04',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-indigo-500 text-sm font-bold text-white shadow-lg shadow-primary-600/25">
              AI
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Career</p>
              <h1 className="text-lg font-bold text-slate-900">Resume Pro</h1>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <Link to="/" className="hover:text-slate-900">Home</Link>
            <Link to="/dashboard" className="hover:text-slate-900">Dashboard</Link>
            <Link to="/resume-analysis" className="hover:text-slate-900">Analysis</Link>
            <Link to="/mock-interview" className="hover:text-slate-900">Interviews</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 sm:px-4">Login</Link>
            <Link to="/register" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-primary-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 sm:px-4">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-8 rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-primary-700 p-8 text-white shadow-soft lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
          <div>
            <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
              AI-based resume analysis & career preparation
            </p>
            <h2 className="mt-6 max-w-xl text-4xl font-bold leading-tight lg:text-6xl">
              Turn your resume into a stronger career story.
            </h2>
            <p className="mt-5 max-w-xl text-base text-slate-200 lg:text-lg">
              Upload your resume, analyze your profile, identify skills gaps, and prepare for your target job with confidence.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/resume-analysis" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">Analyze My Resume</Link>
              <Link to="/register" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/20 bg-transparent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">Get Started</Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-200">
              {steps.map((item, index) => (
                <div key={item} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white">{index + 1}</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Career growth flow</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/20 p-4">
                <p className="text-sm font-medium text-slate-200">1. Upload your resume</p>
                <p className="mt-1 text-sm text-slate-400">Add a PDF or DOCX resume to get started.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/20 p-4">
                <p className="text-sm font-medium text-slate-200">2. Analyze profile</p>
                <p className="mt-1 text-sm text-slate-400">Review strengths, weak points, and missing keywords.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/20 p-4">
                <p className="text-sm font-medium text-slate-200">3. Prepare for opportunities</p>
                <p className="mt-1 text-sm text-slate-400">Build interview confidence and target relevant roles.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">How it works</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">An intelligent system built for career readiness</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featureSections.map((feature) => (
              <Card key={feature.title} className="bg-white">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-sm font-bold text-primary-700">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-semibold text-slate-900">{feature.title}</h4>
                <p className="mt-3 text-sm text-slate-600">{feature.text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-8 rounded-[30px] border border-slate-200 bg-white p-8 shadow-soft lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Resume analysis</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">Actionable improvements that make resumes stronger</h3>
            <ul className="mt-6 space-y-4 text-sm text-slate-600">
              <li>• Review saved feedback for sections such as skills, projects, and experience.</li>
              <li>• See strengths, weaknesses, and missing information reported by the analysis.</li>
              <li>• Use specific suggestions to guide your next resume revision.</li>
            </ul>
          </div>
          <div className="rounded-[24px] bg-slate-50 p-6">
            <div className="flex h-full flex-col justify-center rounded-[24px] bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Your analysis</p>
              <h4 className="mt-3 text-xl font-semibold text-slate-900">Feedback tied to your saved resume</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">Scores and suggestions are generated from the resume you upload. Re-analyze after revisions to compare saved results over time.</p>
              <Link to="/resume-analysis" className="mt-5 inline-flex min-h-10 w-fit items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40">Learn about resume analysis</Link>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-8 rounded-[30px] border border-slate-200 bg-slate-50 p-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Skill-gap analysis</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">Focus your effort where it matters most</h3>
            <p className="mt-4 text-slate-600">Compare skills in your saved resume with requirements for a selected role. Review matched skills, areas to improve, and skills not found in the resume.</p>
            <Link to="/skill-gap" className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40">Explore skill gaps</Link>
          </div>
          <Card title="Evidence-based comparison" subtitle="Results use the resume and target role you choose.">
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-2"><span className="font-semibold text-teal-700" aria-hidden="true">✓</span><span>See requirements already represented in your resume.</span></li>
              <li className="flex gap-2"><span className="font-semibold text-amber-700" aria-hidden="true">↗</span><span>Spot listed skills that may need more evidence.</span></li>
              <li className="flex gap-2"><span className="font-semibold text-rose-700" aria-hidden="true">＋</span><span>Identify requirements that are not found in the saved resume.</span></li>
            </ul>
          </Card>
        </section>

        <section className="mt-16">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Career recommendations</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">Role suggestions based on your potential</h3>
          </div>
          <Card className="mx-auto max-w-3xl text-center">
            <p className="text-sm leading-6 text-slate-600">Generate recommendations from your saved resume to review matching skills, skill gaps, and preparation areas for the roles configured in the career catalog.</p>
            <Link to="/career-recommendations" className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40">View career recommendations</Link>
          </Card>
        </section>

        <section className="mt-16 grid gap-8 rounded-[30px] border border-slate-200 bg-white p-8 shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">AI interview preparation</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-900">Practice realistic interview questions before the real round</h3>
            <ul className="mt-6 space-y-4 text-sm text-slate-600">
              <li>• Generate technical and behavioral interview questions.</li>
              <li>• Simulate mock interview sessions and improve communication clarity.</li>
              <li>• Improve confidence before campus placements and job interviews.</li>
            </ul>
          </div>
          <div className="rounded-[24px] bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-900">Practice flow</p>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-primary-700">1</span><span>Choose a saved resume and target role.</span></li>
              <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-primary-700">2</span><span>Answer role-specific questions at your pace.</span></li>
              <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-primary-700">3</span><span>Review feedback and your saved performance report.</span></li>
            </ol>
            <Link to="/mock-interview" className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40">Explore mock interviews</Link>
          </div>
        </section>

        <section className="mt-16 rounded-[30px] bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-soft">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Progress tracking</p>
              <h3 className="mt-3 text-3xl font-bold">Stay consistent and monitor your improvement</h3>
              <p className="mt-3 text-slate-300">Track resume progress, skill readiness, and interview preparation in one place.</p>
            </div>
            <Link to="/progress" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">View Progress</Link>
          </div>
        </section>

        <section className="mt-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Ready to begin?</p>
          <h3 className="mt-3 text-3xl font-bold text-slate-900">Build a stronger resume and a better career future.</h3>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link to="/register" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40">Get Started</Link>
            <Link to="/login" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40">Login</Link>
          </div>
        </section>
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="font-semibold text-slate-900">Resume Pro</p>
            <p>AI-Based Resume Analysis & Career Preparation</p>
          </div>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-slate-900">Home</Link>
            <Link to="/dashboard" className="hover:text-slate-900">Dashboard</Link>
            <Link to="/login" className="hover:text-slate-900">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
