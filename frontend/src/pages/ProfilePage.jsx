import { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const emptyProfile = {
  full_name: '',
  university: '',
  graduation_year: '',
  target_career: '',
  skills: '',
  interests: '',
};

function listToText(items) {
  return Array.isArray(items) ? items.join(', ') : '';
}

function textToList(value) {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!supabase || !user?.id) return undefined;
    let active = true;

    supabase
      .from('profiles')
      .select('full_name, university, graduation_year, target_career, skills, interests')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) {
          setError('Could not load your profile. Please refresh and try again.');
          return;
        }
        setProfile({
          full_name: data?.full_name ?? user.user_metadata?.full_name ?? '',
          university: data?.university ?? user.user_metadata?.university ?? '',
          graduation_year: data?.graduation_year ? String(data.graduation_year) : '',
          target_career: data?.target_career ?? '',
          skills: listToText(data?.skills),
          interests: listToText(data?.interests),
        });
      })
      .catch(() => {
        if (active) setError('Could not load your profile. Please refresh and try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [user]);

  const updateField = (field) => (event) => {
    setProfile((current) => ({ ...current, [field]: event.target.value }));
    setNotice('');
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!supabase || !user?.id) {
      setError('Your session is unavailable. Sign in again and retry.');
      return;
    }

    const graduationYear = profile.graduation_year.trim() ? Number(profile.graduation_year) : null;
    if (graduationYear !== null && (!Number.isInteger(graduationYear) || graduationYear < 1900 || graduationYear > 2200)) {
      setError('Enter a valid graduation year.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');
    const values = {
      id: user.id,
      email: user.email,
      full_name: profile.full_name.trim(),
      university: profile.university.trim() || null,
      graduation_year: graduationYear,
      target_career: profile.target_career.trim() || null,
      skills: textToList(profile.skills),
      interests: textToList(profile.interests),
    };

    try {
      const { error: saveError } = await supabase.from('profiles').upsert(values, { onConflict: 'id' });
      if (saveError) throw saveError;
      setNotice('Profile saved.');
    } catch {
      setError('Could not save your profile. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Profile" subtitle="Keep your academic background and career goals up to date.">
      <div className="mx-auto max-w-4xl space-y-5">
        <Card title="Profile information" subtitle="This information is private to your account.">
          {loading ? (
            <p className="text-sm text-slate-500" role="status">Loading your profile...</p>
          ) : (
            <form onSubmit={saveProfile} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Input label="Full name" autoComplete="name" value={profile.full_name} onChange={updateField('full_name')} maxLength={120} />
                <Input label="Email" type="email" value={user?.email ?? ''} readOnly disabled className="disabled:bg-slate-100 disabled:text-slate-500" />
                <Input label="Education / university" placeholder="University or institution" value={profile.university} onChange={updateField('university')} maxLength={160} />
                <Input label="Graduation year" type="number" min="1900" max="2200" placeholder="e.g. 2026" value={profile.graduation_year} onChange={updateField('graduation_year')} />
                <Input label="Target career" placeholder="e.g. Backend Developer" value={profile.target_career} onChange={updateField('target_career')} maxLength={160} className="md:col-span-2" />
                <label className="block text-sm text-slate-700 md:col-span-2">
                  <span className="mb-2 block font-medium">Skills</span>
                  <textarea className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100" value={profile.skills} onChange={updateField('skills')} maxLength={2000} placeholder="Separate skills with commas, e.g. React, SQL, communication" />
                  <span className="mt-1 block text-xs text-slate-500">Enter skills you want associated with your profile, separated by commas.</span>
                </label>
                <label className="block text-sm text-slate-700 md:col-span-2">
                  <span className="mb-2 block font-medium">Interests</span>
                  <textarea className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100" value={profile.interests} onChange={updateField('interests')} maxLength={2000} placeholder="Separate interests with commas, e.g. AI, accessibility, cloud systems" />
                </label>
              </div>
              {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{error}</p>}
              {notice && <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 text-sm text-teal-800" role="status">{notice}</p>}
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</Button>
              </div>
            </form>
          )}
        </Card>
        <p className="text-xs text-slate-500">Your profile is loaded and saved using your signed-in Supabase identity and owner-only Row Level Security policies.</p>
      </div>
    </AppLayout>
  );
}
