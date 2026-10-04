import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updatePassword = async (event) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Choose a password with at least 8 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }
    if (!supabase || !user) {
      setError('Your password reset session is no longer available. Request a new reset link.');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Could not update your password. Request a new reset link and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Update password" subtitle="Choose a new password for your account.">
      <div className="mx-auto max-w-xl">
        <Card title="Set a new password" subtitle="Use at least 8 characters.">
          <form className="space-y-4" onSubmit={updatePassword}>
            <Input label="New password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
            <Input label="Confirm new password" type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
            {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{error}</p>}
            <Button type="submit" disabled={saving}>{saving ? 'Updating password...' : 'Update password'}</Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
