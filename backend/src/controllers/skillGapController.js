import { compareResumeSkills } from '../services/skillGapAnalyzer.js';
import { isUuid, isMissingRow } from '../utils/validation.js';

export async function listCareerRoles(req, res, next) {
  try {
    const { data, error } = await req.supabase
      .from('career_roles')
      .select('id, title, description')
      .order('title');

    if (error) throw error;
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function analyzeSkillGap(req, res, next) {
  const { resumeId, roleId } = req.body ?? {};
  if (!isUuid(resumeId) || !isUuid(roleId)) {
    return res.status(400).json({ success: false, message: 'A resume ID and target role are required.' });
  }

  try {
    const [resumeResult, roleResult] = await Promise.all([
      req.supabase
        .from('resumes')
        .select('id, original_name, parsed_data, analysis_data')
        .eq('id', resumeId)
        .eq('user_id', req.user.id)
        .single(),
      req.supabase
        .from('career_roles')
        .select('id, title, description, career_role_skills(required_strength, priority, learning_area, skills(name, category))')
        .eq('id', roleId)
        .single(),
    ]);

    if (resumeResult.error && !isMissingRow(resumeResult.error)) throw resumeResult.error;
    if (!resumeResult.data) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }
    if (roleResult.error && !isMissingRow(roleResult.error)) throw roleResult.error;
    if (!roleResult.data) {
      return res.status(404).json({ success: false, message: 'Target role not found.' });
    }

    const role = roleResult.data;
    const requirements = (role.career_role_skills ?? []).map((item) => ({
      name: Array.isArray(item.skills) ? item.skills[0]?.name : item.skills?.name,
      category: Array.isArray(item.skills) ? item.skills[0]?.category : item.skills?.category,
      required_strength: item.required_strength,
      priority: item.priority,
      learning_area: item.learning_area,
    }));

    if (requirements.length === 0) {
      return res.status(422).json({ success: false, message: 'This role has no skill requirements configured yet.' });
    }

    const comparison = compareResumeSkills(resumeResult.data, requirements);
    const { error: historyError } = await req.supabase
      .from('skill_gap_analyses')
      .insert({
        user_id: req.user.id,
        resume_id: resumeResult.data.id,
        resume_name: resumeResult.data.original_name,
        role_id: role.id,
        role_title: role.title,
        comparison_data: comparison,
      });
    if (historyError) throw historyError;

    return res.json({
      success: true,
      data: {
        resume: { id: resumeResult.data.id, originalName: resumeResult.data.original_name },
        role: { id: role.id, title: role.title, description: role.description },
        comparison,
      },
    });
  } catch (error) {
    return next(error);
  }
}