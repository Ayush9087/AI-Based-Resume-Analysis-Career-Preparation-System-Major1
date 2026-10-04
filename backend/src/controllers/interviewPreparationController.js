import {
  buildInterviewPerformanceReport,
  evaluateInterviewAnswer,
  generateInterviewQuestions,
} from '../services/interviewAiService.js';
import { isUuid, isMissingRow } from '../utils/validation.js';

const sessionQuestionSelection = 'id, question_text, difficulty, category, question_data, created_at, interview_answers(id, answer_text, created_at, interview_evaluations(id, score, feedback, strengths, improvements, evaluation_data, created_at))';

function mapRole(role) {
  const skillRequirements = (role.career_role_skills ?? []).map((item) => {
    const skill = Array.isArray(item.skills) ? item.skills[0] : item.skills;
    if (!skill?.name) return null;
    return {
      name: skill.name,
      requiredStrength: item.required_strength,
      category: skill.category,
    };
  }).filter(Boolean);
  return { ...role, skillRequirements };
}

export async function listInterviewRoles(req, res, next) {
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

export async function listInterviewSessions(req, res, next) {
  try {
    const { data, error } = await req.supabase
      .from('interview_sessions')
      .select('id, resume_id, role_id, difficulty, experience_level, question_count, session_type, status, score, started_at, completed_at, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(25);
    if (error) throw error;
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function startInterviewSession(req, res, next) {
  const { resumeId, roleId, difficulty, experienceLevel, questionCount, sessionType = 'preparation' } = req.body ?? {};
  if (!isUuid(resumeId) || !isUuid(roleId)) {
    return res.status(400).json({ success: false, message: 'Choose a resume and target role.' });
  }
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    return res.status(400).json({ success: false, message: 'Choose a valid question difficulty.' });
  }
  if (!['beginner', 'intermediate', 'advanced'].includes(experienceLevel)) {
    return res.status(400).json({ success: false, message: 'Choose a valid experience level.' });
  }
  if (!Number.isInteger(questionCount) || questionCount < 3 || questionCount > 12) {
    return res.status(400).json({ success: false, message: 'Choose between 3 and 12 questions.' });
  }
  if (!['preparation', 'mock'].includes(sessionType)) {
    return res.status(400).json({ success: false, message: 'Choose a valid interview session type.' });
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
        .select('id, title, description, career_role_skills(required_strength, skills(name, category))')
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

    const role = mapRole(roleResult.data);
    const generatedQuestions = await generateInterviewQuestions({
      resume: resumeResult.data,
      role,
      difficulty,
      experienceLevel,
      questionCount,
    });

    const { data: session, error: sessionError } = await req.supabase
      .from('interview_sessions')
      .insert({
        user_id: req.user.id,
        resume_id: resumeResult.data.id,
        role_id: role.id,
        difficulty,
        experience_level: experienceLevel,
        question_count: questionCount,
        session_type: sessionType,
        status: 'in_progress',
      })
      .select('id, resume_id, role_id, difficulty, experience_level, question_count, session_type, status, started_at')
      .single();

    if (sessionError) throw sessionError;

    const questionRows = generatedQuestions.map((question) => ({
      session_id: session.id,
      question_text: question.question,
      difficulty,
      category: question.category,
      question_data: {
        rationale: question.rationale,
        evaluationCriteria: question.evaluationCriteria,
      },
    }));
    const { data: questions, error: questionsError } = await req.supabase
      .from('interview_questions')
      .insert(questionRows)
      .select('id, question_text, difficulty, category, question_data, created_at');

    if (questionsError) {
      await req.supabase.from('interview_sessions').delete().eq('id', session.id).eq('user_id', req.user.id);
      throw questionsError;
    }

    return res.status(201).json({
      success: true,
      data: {
        session: { ...session, role: { id: role.id, title: role.title }, resume: { id: resumeResult.data.id, originalName: resumeResult.data.original_name } },
        questions,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getInterviewSession(req, res, next) {
  try {
    const { data, error } = await req.supabase
      .from('interview_sessions')
      .select(`id, resume_id, role_id, difficulty, experience_level, question_count, session_type, status, score, started_at, completed_at, created_at, career_roles(id, title, description), interview_questions(${sessionQuestionSelection})`)
      .eq('id', req.params.sessionId)
      .eq('user_id', req.user.id)
      .single();

    if (error && !isMissingRow(error)) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Interview session not found.' });
    return res.json({
      success: true,
      data: { ...data, performance_report: buildInterviewPerformanceReport(data.interview_questions ?? []) },
    });
  } catch (error) {
    return next(error);
  }
}

export async function submitInterviewAnswer(req, res, next) {
  const { questionId, answer } = req.body ?? {};
  if (!isUuid(questionId) || typeof answer !== 'string' || !answer.trim()) {
    return res.status(400).json({ success: false, message: 'A question and answer are required.' });
  }
  if (answer.trim().length > 12000) {
    return res.status(413).json({ success: false, message: 'Answers must be 12,000 characters or fewer.' });
  }

  try {
    const { data: session, error: sessionError } = await req.supabase
      .from('interview_sessions')
      .select('id, role_id, question_count, status')
      .eq('id', req.params.sessionId)
      .eq('user_id', req.user.id)
      .single();
    if (sessionError && !isMissingRow(sessionError)) throw sessionError;
    if (!session) return res.status(404).json({ success: false, message: 'Interview session not found.' });
    if (session.status === 'completed') return res.status(409).json({ success: false, message: 'This interview session is already complete.' });

    const [questionResult, roleResult] = await Promise.all([
      req.supabase
        .from('interview_questions')
        .select('id, question_text, category, question_data')
        .eq('id', questionId)
        .eq('session_id', session.id)
        .single(),
      req.supabase
        .from('career_roles')
        .select('id, title')
        .eq('id', session.role_id)
        .single(),
    ]);
    if (questionResult.error && !isMissingRow(questionResult.error)) throw questionResult.error;
    if (!questionResult.data) return res.status(404).json({ success: false, message: 'Question not found in this session.' });
    if (roleResult.error && !isMissingRow(roleResult.error)) throw roleResult.error;
    if (!roleResult.data) return res.status(404).json({ success: false, message: 'Target role not found.' });

    const { data: existingAnswer, error: existingAnswerError } = await req.supabase
      .from('interview_answers')
      .select('id')
      .eq('question_id', questionId)
      .maybeSingle();
    if (existingAnswerError) throw existingAnswerError;
    if (existingAnswer) return res.status(409).json({ success: false, message: 'An answer has already been submitted for this question.' });

    const evaluation = await evaluateInterviewAnswer({ question: questionResult.data, answer: answer.trim(), role: roleResult.data });
    const { data: savedAnswer, error: answerError } = await req.supabase
      .from('interview_answers')
      .insert({ question_id: questionId, answer_text: answer.trim() })
      .select('id, question_id, answer_text, created_at')
      .single();
    if (answerError) throw answerError;

    const { data: savedEvaluation, error: evaluationError } = await req.supabase
      .from('interview_evaluations')
      .insert({
        answer_id: savedAnswer.id,
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        evaluation_data: evaluation.evaluationData,
      })
      .select('id, score, feedback, strengths, improvements, evaluation_data, created_at')
      .single();
    if (evaluationError) throw evaluationError;

    const { data: questions, error: questionsError } = await req.supabase
      .from('interview_questions')
      .select('id, interview_answers(id, interview_evaluations(score, strengths, evaluation_data))')
      .eq('session_id', session.id);
    if (questionsError) throw questionsError;

    const completed = questions.length > 0 && questions.every((question) => question.interview_answers?.length > 0);
    const performanceReport = buildInterviewPerformanceReport(questions);
    let sessionScore = null;
    if (completed) {
      sessionScore = performanceReport.averageScore;
      const { error: updateError } = await req.supabase
        .from('interview_sessions')
        .update({ status: 'completed', score: sessionScore, completed_at: new Date().toISOString() })
        .eq('id', session.id)
        .eq('user_id', req.user.id);
      if (updateError) throw updateError;
    }

    return res.status(201).json({
      success: true,
      data: { answer: savedAnswer, evaluation: savedEvaluation, completed, sessionScore, performanceReport },
    });
  } catch (error) {
    return next(error);
  }
}