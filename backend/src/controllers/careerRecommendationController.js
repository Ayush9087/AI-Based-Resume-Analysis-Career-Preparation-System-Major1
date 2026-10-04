import { buildCareerRecommendations } from '../services/careerRecommendationService.js';
import { isUuid, isMissingRow } from '../utils/validation.js';

const roleSkillSelection = 'id, title, description, career_role_skills(required_strength, priority, learning_area, skills(name, category, description))';

function mapRoleRequirements(role) {
  const requirements = (role.career_role_skills ?? []).map((item) => {
    const skill = Array.isArray(item.skills) ? item.skills[0] : item.skills;
    if (!skill?.name) return null;
    return {
      name: skill.name,
      category: skill.category,
      description: skill.description,
      required_strength: item.required_strength,
      priority: item.priority,
      learning_area: item.learning_area,
    };
  }).filter(Boolean);

  return { ...role, requirements };
}

export async function getCareerRoleDetails(req, res, next) {
  try {
    const { data, error } = await req.supabase
      .from('career_roles')
      .select(roleSkillSelection)
      .eq('id', req.params.roleId)
      .single();

    if (error && !isMissingRow(error)) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Career role not found.' });
    const role = mapRoleRequirements(data);
    return res.json({
      success: true,
      data: {
        id: role.id,
        title: role.title,
        description: role.description,
        skillRequirements: role.requirements,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getRecommendationHistory(req, res, next) {
  if (req.query.resumeId && !isUuid(req.query.resumeId)) {
    return res.status(400).json({ success: false, message: 'The resume identifier is invalid.' });
  }

  try {
    let query = req.supabase
      .from('recommendations')
      .select('id, resume_id, role_id, title, description, priority, recommendation_data, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (typeof req.query.resumeId === 'string' && req.query.resumeId.trim()) {
      query = query.eq('resume_id', req.query.resumeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function generateCareerRecommendations(req, res, next) {
  const { resumeId } = req.body ?? {};
  if (!isUuid(resumeId)) {
    return res.status(400).json({ success: false, message: 'A resume ID is required.' });
  }

  try {
    const [resumeResult, rolesResult] = await Promise.all([
      req.supabase
        .from('resumes')
        .select('id, original_name, parsed_data, analysis_data')
        .eq('id', resumeId)
        .eq('user_id', req.user.id)
        .single(),
      req.supabase
        .from('career_roles')
        .select(roleSkillSelection)
        .order('title'),
    ]);

    if (resumeResult.error && !isMissingRow(resumeResult.error)) throw resumeResult.error;
    if (!resumeResult.data) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }
    if (rolesResult.error) throw rolesResult.error;

    const roles = (rolesResult.data ?? []).map(mapRoleRequirements).filter((role) => role.requirements.length > 0);
    if (roles.length === 0) {
      return res.status(422).json({ success: false, message: 'No career role requirements are configured yet.' });
    }

    const recommendations = buildCareerRecommendations(resumeResult.data, roles);
    const rows = recommendations.map((recommendation) => ({
      user_id: req.user.id,
      resume_id: resumeResult.data.id,
      role_id: recommendation.role.id,
      title: recommendation.role.title,
      description: recommendation.explanation,
      recommendation_data: recommendation,
    }));
    const { data: savedRows, error: insertError } = await req.supabase
      .from('recommendations')
      .insert(rows)
      .select('id, role_id, created_at');

    if (insertError) throw insertError;
    const savedByRoleId = new Map((savedRows ?? []).map((row) => [row.role_id, row]));

    return res.json({
      success: true,
      data: {
        resume: { id: resumeResult.data.id, originalName: resumeResult.data.original_name },
        recommendations: recommendations.map((recommendation) => {
          const saved = savedByRoleId.get(recommendation.role.id);
          return { ...recommendation, historyId: saved?.id ?? null, createdAt: saved?.created_at ?? null };
        }),
      },
    });
  } catch (error) {
    return next(error);
  }
}