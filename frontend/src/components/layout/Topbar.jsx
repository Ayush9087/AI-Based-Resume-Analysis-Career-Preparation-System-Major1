import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ title, subtitle, actions }) {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [logoutError, setLogoutError] = useState('');

  const handleLogout = async () => {
    try {
      setLogoutError('');
      await signOut();
      navigate('/login', { replace: true });
    } catch {
      setLogoutError('Could not sign out. Please try again.');
    }
  };

  const initials = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-600">AI career platform</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {actions}
        <button
          type="button"
          onClick={handleLogout}
          className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        >
          Logout
        </button>
        <Link to="/profile" className="flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 transition hover:border-slate-300 hover:bg-white sm:gap-3 sm:px-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
            {initials}
          </div>
          <div className="text-left">
            <p className="max-w-40 truncate text-sm font-semibold text-slate-900 sm:max-w-64">{user?.email || 'User'}</p>
            <p className="text-xs text-slate-500">Student</p>
          </div>
        </Link>
      </div>
      {logoutError && <p className="text-sm text-red-700" role="alert">{logoutError}</p>}
    </header>
  );
}
