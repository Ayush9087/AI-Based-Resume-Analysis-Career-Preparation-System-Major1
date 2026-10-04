import { analyzeParsedResume } from '../services/aiService.js';
import { isUuid, isMissingRow } from '../utils/validation.js';

export async function analyzeResume(req, res, next) {
  const { resumeId } = req.body ?? {};
  if (!isUuid(resumeId)) {
    return res.status(400).json({ success: false, message: 'A resume ID is required.' });
  }

  try {
    const { data: resume, error: fetchError } = await req.supabase
      .from('resumes')
      .select('id, original_name, parsed_data')
      .eq('id', resumeId)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError && !isMissingRow(fetchError)) throw fetchError;
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    const analysis = await analyzeParsedResume(resume.parsed_data);
    const { data: savedResume, error: updateError } = await req.supabase
      .from('resumes')
      .update({ analysis_data: analysis, score: analysis.overallScore })
      .eq('id', resume.id)
      .eq('user_id', req.user.id)
      .select('updated_at')
      .single();

    if (updateError) throw updateError;

    const { error: historyError } = await req.supabase
      .from('resume_score_history')
      .insert({
        user_id: req.user.id,
        resume_id: resume.id,
        resume_name: resume.original_name,
        score: analysis.overallScore,
        analyzed_at: savedResume.updated_at,
      });
    if (historyError) throw historyError;

    return res.json({
      success: true,
      data: { resumeId: resume.id, analysis, analyzedAt: savedResume.updated_at },
    });
  } catch (error) {
    return next(error);
  }
}