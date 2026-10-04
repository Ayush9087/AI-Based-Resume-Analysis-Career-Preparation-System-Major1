import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildInterviewPerformanceReport,
  retryGeminiRequest,
  validateAnswerEvaluation,
  validateQuestionSet,
} from './interviewAiService.js';

test('accepts exactly the requested structured question set', () => {
  assert.equal(validateQuestionSet({
    questions: [{
      category: 'project-based',
      question: 'Describe the project architecture.',
      rationale: 'Explores design choices.',
      evaluationCriteria: ['Explains a trade-off.'],
    }],
  }, 1), true);
});

test('rejects wrong counts, unknown categories, and missing criteria', () => {
  const validQuestion = {
    category: 'technical',
    question: 'How would you test this service?',
    rationale: 'Checks testing fundamentals.',
    evaluationCriteria: ['Identifies a test boundary.'],
  };
  assert.equal(validateQuestionSet({ questions: [validQuestion] }, 2), false);
  assert.equal(validateQuestionSet({ questions: [{ ...validQuestion, category: 'trivia' }] }, 1), false);
  assert.equal(validateQuestionSet({ questions: [{ ...validQuestion, evaluationCriteria: [] }] }, 1), false);
});

test('validates structured answer feedback and score bounds', () => {
  const evaluation = {
    score: 82,
    relevance: 90,
    technicalCorrectness: 75,
    completeness: 80,
    feedback: 'Clear and relevant.',
    strengths: ['Good example.'],
    missingPoints: ['Mention a trade-off.'],
    improvementSuggestions: ['State the trade-off.'],
  };
  assert.equal(validateAnswerEvaluation(evaluation), true);
  assert.equal(validateAnswerEvaluation({ ...evaluation, relevance: 120 }), false);
  assert.equal(validateAnswerEvaluation({ ...evaluation, missingPoints: [''] }), false);
});

test('aggregates answer rubric scores and feedback into a performance report', () => {
  const report = buildInterviewPerformanceReport([
    {
      interview_answers: [{
        interview_evaluations: [{
          score: 80,
          strengths: ['Clear example'],
          evaluation_data: { relevance: 90, technicalCorrectness: 70, completeness: 80, missingPoints: ['Edge cases'], improvementSuggestions: ['Discuss testing'] },
        }],
      }],
    },
    {
      interview_answers: [{
        interview_evaluations: [{
          score: 100,
          strengths: ['Clear example'],
          evaluation_data: { relevance: 80, technicalCorrectness: 90, completeness: 100, missingPoints: ['Trade-offs'], improvementSuggestions: ['Discuss testing'] },
        }],
      }],
    },
  ]);

  assert.equal(report.averageScore, 90);
  assert.equal(report.averageRelevance, 85);
  assert.equal(report.averageTechnicalCorrectness, 80);
  assert.equal(report.averageCompleteness, 90);
  assert.deepEqual(report.strengths, ['Clear example']);
  assert.deepEqual(report.missingPoints, ['Edge cases', 'Trade-offs']);
  assert.deepEqual(report.improvementSuggestions, ['Discuss testing']);
});

test('retries temporary Gemini capacity errors and succeeds on the next attempt', async () => {
  let attempts = 0;
  const delays = [];
  const result = await retryGeminiRequest(async () => {
    attempts += 1;
    if (attempts === 1) throw Object.assign(new Error('busy'), { status: 503 });
    return 'ok';
  }, async (milliseconds) => delays.push(milliseconds));

  assert.equal(result, 'ok');
  assert.equal(attempts, 2);
  assert.deepEqual(delays, [750]);
});

test('does not retry permanent Gemini errors and bounds repeated capacity retries', async () => {
  let attempts = 0;
  await assert.rejects(retryGeminiRequest(async () => {
    attempts += 1;
    throw Object.assign(new Error('invalid key'), { status: 403 });
  }, async () => {}), { status: 403 });
  assert.equal(attempts, 1);

  const delays = [];
  attempts = 0;
  await assert.rejects(retryGeminiRequest(async () => {
    attempts += 1;
    throw Object.assign(new Error('busy'), { status: 429 });
  }, async (milliseconds) => delays.push(milliseconds)), { status: 429 });
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [750, 1500]);
});