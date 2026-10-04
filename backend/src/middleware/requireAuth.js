import { createUserSupabaseClient, isSupabaseServerConfigured } from '../config/supabase.js';

export async function requireAuth(req, res, next) {
  const authorization = req.get('authorization');
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!accessToken) {
    return res.status(401).json({ success: false, message: 'Sign in to access this resource.' });
  }

  if (!isSupabaseServerConfigured) {
    return res.status(503).json({ success: false, message: 'The service is temporarily unavailable. Please try again later.' });
  }

  try {
    const supabase = createUserSupabaseClient(accessToken);
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error && [401, 403].includes(Number(error.status))) {
      return res.status(401).json({ success: false, message: 'Your session is invalid or expired. Sign in again.' });
    }
    if (error) return next(error);
    if (!data.user) return res.status(401).json({ success: false, message: 'Your session is invalid or expired. Sign in again.' });

    req.supabase = supabase;
    req.user = data.user;
    return next();
  } catch (error) {
    return next(error);
  }
}