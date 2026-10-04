export async function ensureResumeOwnerProfile(supabase, user) {
  if (!user?.id || !user.email) {
    const error = new Error('Your account is missing a profile email. Sign in again and retry.');
    error.statusCode = 401;
    throw error;
  }

  const metadata = user.user_metadata ?? {};
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email,
      full_name: metadata.full_name ?? '',
      university: metadata.university ?? null,
      phone: metadata.phone ?? null,
    }, { onConflict: 'id', ignoreDuplicates: true });

  if (error) throw error;
}