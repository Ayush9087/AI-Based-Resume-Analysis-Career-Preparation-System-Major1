import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');
const defaultPreferences = {
  resume_review_notifications: true,
  interview_reminders: true,
  career_recommendation_notifications: true,
  dark_mode: false,
};
const preferenceItems = [
  ['resume_review_notifications', 'Email alerts for resume review updates'],
  ['interview_reminders', 'Weekly interview preparation reminders'],
  ['career_recommendation_notifications', 'Career recommendation notifications'],
  ['dark_mode', 'Dark mode interface preference'],
];

async function readApiResponse(response) {
  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'The request could not be completed.');
  }
  return payload.data;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!supabase || !user?.id) return undefined;
    let active = true;

    supabase
      .from('user_preferences')
      .select('resume_review_notifications, interview_reminders, career_recommendation_notifications, dark_mode')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) {
          setError('Could not load your preferences. Please refresh and try again.');
          return;
        }
        if (data) setPreferences({ ...defaultPreferences, ...data });
      })
      .catch(() => {
        if (active) setError('Could not load your preferences. Please refresh and try again.');
      })
      .finally(() => {
        if (active) setLoadingPreferences(false);
      });

    return () => { active = false; };
  }, [user]);

  const savePreferences = async () => {
    if (!supabase || !user?.id) {
      setError('Your session is unavailable. Sign in again and retry.');
      return;
    }
    setSavingPreferences(true);
    setError('');
    setNotice('');
    try {
      const { error: saveError } = await supabase
        .from('user_preferences')
        .upsert({ user_id: user.id, ...preferences }, { onConflict: 'user_id' });
      if (saveError) throw saveError;
      setNotice('Preferences saved.');
    } catch {
      setError('Could not save your preferences. Please check your connection and try again.');
    } finally {
      setSavingPreferences(false);
    }
  };

  const reauthenticate = async (password) => {
    if (!supabase || !user?.email) throw new Error('Your account email is unavailable. Sign in again.');
    const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email, password });
    if (authError) throw authError;
  };

  const changeEmail = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!newEmail.trim() || !emailPassword) {
      setError('Enter the new email address and your current password.');
      return;
    }
    try {
      await reauthenticate(emailPassword);
      const { error: updateError } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (updateError) throw updateError;
      setNewEmail('');
      setEmailPassword('');
      setNotice('Email change requested. Follow the confirmation link from Supabase to finish updating your address.');
    } catch (updateError) {
      setError(updateError.message || 'Could not update your email.');
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!currentPassword || !newPassword) {
      setError('Enter your current password and a new password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Choose a new password with at least 8 characters.');
      return;
    }
    if (newPassword !== passwordConfirmation) {
      setError('The new passwords do not match.');
      return;
    }
    try {
      await reauthenticate(currentPassword);
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setCurrentPassword('');
      setNewPassword('');
      setPasswordConfirmation('');
      setNotice('Password updated.');
    } catch (updateError) {
      setError(updateError.message || 'Could not update your password.');
    }
  };

  const logout = async () => {
    setError('');
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (logoutError) {
      setError(logoutError.message || 'Could not sign out. Please retry.');
    }
  };

  const deleteAccount = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (deleteConfirmation !== 'DELETE MY ACCOUNT') {
      setError('Type DELETE MY ACCOUNT exactly to confirm.');
      return;
    }
    if (!deletePassword) {
      setError('Enter your current password to verify your identity.');
      return;
    }
    setDeleting(true);
    try {
      await reauthenticate(deletePassword);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error('Your verified session is unavailable. Sign in again.');
      const response = await fetch(`${apiBaseUrl}/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      await readApiResponse(response);
      const { error: logoutError } = await supabase.auth.signOut({ scope: 'local' });
      if (logoutError) throw new Error(`Account deleted, but this device could not clear its local session: ${logoutError.message}`);
      navigate('/login', { replace: true });
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete your account.');
    } finally {
      setDeleting(false);
    }
  };

  const updatePreference = (key) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
    setNotice('');
  };

  return (
    <AppLayout title="Settings" subtitle="Manage your account security and application preferences.">
      <div className="mx-auto max-w-4xl space-y-5">
        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
        {notice && <p className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800" role="status">{notice}</p>}

        <Card title="Application preferences" subtitle="These choices are saved to your private Supabase account.">
          {loadingPreferences ? (
            <p className="text-sm text-slate-500" role="status">Loading your preferences...</p>
          ) : (
            <>
              <div className="space-y-3">
                {preferenceItems.map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-700">{label}</p>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(preferences[key])}
                      aria-label={label}
                      onClick={() => updatePreference(key)}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${preferences[key] ? 'bg-primary-600' : 'bg-slate-300'}`}
                    >
                      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${preferences[key] ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-end">
                <Button onClick={savePreferences} disabled={savingPreferences}>{savingPreferences ? 'Saving...' : 'Save preferences'}</Button>
              </div>
            </>
          )}
        </Card>

        <Card title="Account security" subtitle={`Signed in as ${user?.email ?? 'your Supabase account'}.`}>
          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={changeEmail} className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Change email</h3>
              <Input label="New email address" type="email" autoComplete="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} required />
              <Input label="Current password" type="password" autoComplete="current-password" value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)} required />
              <Button type="submit" variant="secondary">Request email change</Button>
            </form>
            <form onSubmit={changePassword} className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Change password</h3>
              <Input label="Current password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
              <Input label="New password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} required />
              <Input label="Confirm new password" type="password" autoComplete="new-password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} minLength={8} required />
              <Button type="submit" variant="secondary">Update password</Button>
            </form>
          </div>
        </Card>

        <Card title="Account actions" subtitle="Sign out on this device or permanently remove your account.">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-800">Sign out</p>
              <p className="mt-1 text-sm text-slate-500">End your current Supabase session.</p>
            </div>
            <Button variant="secondary" onClick={logout}>Logout</Button>
          </div>
          <form onSubmit={deleteAccount} className="mt-6 space-y-4 border-t border-red-100 pt-5">
            <div>
              <h3 className="text-sm font-semibold text-red-800">Delete account</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                This permanently deletes your Supabase account, profile, saved resume records, progress, and related data. This action cannot be undone.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Current password" type="password" autoComplete="current-password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} required />
              <Input label="Type DELETE MY ACCOUNT to confirm" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} required />
            </div>
            <Button type="submit" disabled={deleting} className="bg-red-700 text-white hover:bg-red-600 focus:ring-red-500/30">
              {deleting ? 'Deleting account...' : 'Permanently delete account'}
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
