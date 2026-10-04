import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Loading from '../components/common/Loading';
import Toast from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isConfigured } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [recoveryMode, setRecoveryMode] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isConfigured) {
      setNotice({ type: 'error', message: 'Supabase credentials are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the frontend .env file.' });
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      if (recoveryMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
        setNotice({ type: 'success', message: 'If an account matches that email, a password reset link is on its way.' });
        return;
      }
      await signIn(form);
      const requestedPath = location.state?.from?.pathname;
      navigate(requestedPath?.startsWith('/') ? requestedPath : '/dashboard', { replace: true });
    } catch {
      setNotice({ type: 'error', message: recoveryMode
        ? 'Could not request a password reset. Check the email address and try again.'
        : 'Could not sign in. Check your email and password, then try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-500 text-xl font-bold text-white shadow-lg shadow-primary-600/25">
            AI
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to continue your career preparation journey.</p>
        </div>

        <Card className="bg-white p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {notice && <Toast message={notice.message} type={notice.type} />}
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            {!recoveryMode && (
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            )}
            {!recoveryMode && (
              <div className="flex justify-end text-sm">
                <button type="button" className="font-medium text-primary-600 hover:text-primary-700" onClick={() => { setRecoveryMode(true); setNotice(null); }}>Forgot password?</button>
              </div>
            )}
            {loading ? <Loading text={recoveryMode ? 'Requesting reset link...' : 'Signing in...'} /> : <Button type="submit" className="w-full">{recoveryMode ? 'Send reset link' : 'Sign in'}</Button>}
            {recoveryMode && <button type="button" onClick={() => { setRecoveryMode(false); setNotice(null); }} className="w-full py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Back to sign in</button>}
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
