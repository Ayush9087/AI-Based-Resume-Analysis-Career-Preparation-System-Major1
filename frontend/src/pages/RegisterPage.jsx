import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Loading from '../components/common/Loading';
import Toast from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, isConfigured } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    university: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isConfigured) {
      setNotice({ type: 'error', message: 'Supabase credentials are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the frontend .env file.' });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setNotice({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      const result = await signUp({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        university: form.university,
        phone: form.phone,
      });

      if (result.session) {
        navigate('/dashboard', { replace: true });
      } else {
        setNotice({ type: 'success', message: 'Your account was created. Check your inbox to confirm your email, then sign in.' });
      }
    } catch {
      setNotice({ type: 'error', message: 'Could not create your account. Check your details and try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-500 text-xl font-bold text-white shadow-lg shadow-primary-600/25">
            AI
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">Set up your profile to get AI resume insights and career guidance.</p>
        </div>

        <Card className="bg-white p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {notice && <Toast message={notice.message} type={notice.type} />}
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Full name" autoComplete="name" placeholder="Your name" value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} maxLength={120} required />
              <Input label="University" autoComplete="organization" placeholder="University or institution" value={form.university} onChange={(event) => setForm((prev) => ({ ...prev, university: event.target.value }))} maxLength={160} />
              <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required />
              <Input label="Phone" type="tel" autoComplete="tel" placeholder="Phone number (optional)" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
              <Input label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" className="md:col-span-2" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} minLength={8} required />
              <Input label="Confirm password" type="password" autoComplete="new-password" placeholder="Enter password again" className="md:col-span-2" value={form.confirmPassword} onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))} minLength={8} required />
            </div>

            <div className="mt-2">
              {loading ? <Loading text="Creating account..." /> : <Button type="submit" className="w-full">Create account</Button>}
            </div>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
