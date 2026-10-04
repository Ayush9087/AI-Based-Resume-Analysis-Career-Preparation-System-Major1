async function fetchAllRows(buildQuery) {
  const pageSize = 1000;
  const rows = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await buildQuery().range(offset, offset + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < pageSize) return rows;
  }
}

export async function getProgress(req, res, next) {
  try {
    const userId = req.user.id;
    const [resumeScoreHistory, skillGapHistory, mockInterviews, recommendations] = await Promise.all([
      fetchAllRows(() => req.supabase
        .from('resume_score_history')
        .select('id, resume_name, score, analyzed_at')
        .eq('user_id', userId)
        .order('analyzed_at', { ascending: true })),
      fetchAllRows(() => req.supabase
        .from('skill_gap_analyses')
        .select('id, role_id, role_title, comparison_data, analyzed_at')
        .eq('user_id', userId)
        .order('analyzed_at', { ascending: true })),
      fetchAllRows(() => req.supabase
        .from('interview_sessions')
        .select('id, status, score, started_at, completed_at, created_at')
        .eq('user_id', userId)
        .eq('session_type', 'mock')
        .order('created_at', { ascending: true })),
      fetchAllRows(() => req.supabase
        .from('recommendations')
        .select('id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })),
    ]);

    return res.json({
      success: true,
      data: { resumeScoreHistory, skillGapHistory, mockInterviews, recommendations },
    });
  } catch (error) {
    return next(error);
  }
}
