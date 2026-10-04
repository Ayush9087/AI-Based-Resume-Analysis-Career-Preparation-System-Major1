import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white">
            AI
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Career Prep</p>
            <h1 className="text-lg font-bold text-slate-900">Resume Pro</h1>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link to="/" className="hover:text-slate-900">Home</Link>
          <Link to="/dashboard" className="hover:text-slate-900">Dashboard</Link>
        </nav>
      </div>
    </header>
  );
}
