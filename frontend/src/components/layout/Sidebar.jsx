import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Overview', to: '/dashboard' },
  { label: 'Resume Analysis', to: '/resume-analysis' },
  { label: 'Skill Gap', to: '/skill-gap' },
  { label: 'Career Matches', to: '/career-recommendations' },
  { label: 'Interview Prep', to: '/interview-preparation' },
  { label: 'Mock Interview', to: '/mock-interview' },
  { label: 'Progress', to: '/progress' },
  { label: 'Profile', to: '/profile' },
  { label: 'Settings', to: '/settings' },
];

const linkClasses = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
    isActive
      ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-500 text-lg font-bold text-white shadow-lg shadow-primary-600/25">
          AI
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Career</p>
          <h1 className="text-lg font-bold text-slate-900">Resume Pro</h1>
        </div>
      </div>

      <nav aria-label="Main navigation" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:space-y-2 lg:overflow-visible lg:pb-0">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={`${linkClasses} shrink-0 whitespace-nowrap lg:shrink`}>
            <span className="h-2 w-2 rounded-full bg-current opacity-75" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 hidden rounded-2xl border border-primary-100 bg-primary-50 p-4 lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Strategy</p>
        <p className="mt-2 text-sm text-slate-700">Focus on keyword optimization, quantified achievements, and role-aligned projects.</p>
      </div>
    </aside>
  );
}
