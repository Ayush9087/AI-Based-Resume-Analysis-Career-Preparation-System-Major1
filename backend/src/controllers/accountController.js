import { supabaseAdmin } from '../config/supabase.js';

const resumeBucket = 'resume-files';

export async function deleteAccount(req, res, next) {
  if (!supabaseAdmin) {
    return res.status(503).json({
      success: false,
      message: 'Account deletion is temporarily unavailable. Please try again later.',
    });
  }

  const lastSignIn = Date.parse(req.user.last_sign_in_at ?? '');
  if (!Number.isFinite(lastSignIn) || Date.now() - lastSignIn > 5 * 60 * 1000) {
    return res.status(403).json({
      success: false,
      message: 'Sign in again before deleting your account.',
    });
  }

  try {
    const storagePaths = [];
    const pageSize = 100;
    for (let offset = 0; ; offset += pageSize) {
      const { data: objects, error: listError } = await supabaseAdmin.storage
        .from(resumeBucket)
        .list(req.user.id, { limit: pageSize, offset, sortBy: { column: 'name', order: 'asc' } });
      if (listError) throw listError;
      storagePaths.push(...(objects ?? []).map((object) => `${req.user.id}/${object.name}`));
      if ((objects?.length ?? 0) < pageSize) break;
    }

    for (let offset = 0; offset < storagePaths.length; offset += pageSize) {
      const { error: storageError } = await supabaseAdmin.storage
        .from(resumeBucket)
        .remove(storagePaths.slice(offset, offset + pageSize));
      if (storageError) throw storageError;
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(req.user.id);
    if (deleteError) throw deleteError;

    return res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return next(error);
  }
}
