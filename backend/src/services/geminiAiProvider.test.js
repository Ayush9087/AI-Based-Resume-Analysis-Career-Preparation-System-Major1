import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGeminiAnalysis, retryGeminiRequest, toSafeGeminiError, validateAnalysis } from './geminiAiProvider.js';

const sectionNames = ['contact', 'summary', 'education', 'skills', 'projects', 'experience', 'internships', 'certifications', 'achievements'];
const listFields = ['strengths', 'weaknesses', 'missingInformation', 'suggestions', 'skills', 'technicalSkills', 'softSkills', 'qualityObservations'];

function validAnalysis() {
  return {
    overallScore: 78,
    sectionScores: Object.fromEntries(sectionNames.map((name) => [name, 70])),
    ...Object.fromEntries(listFields.map((field) => [field, ['Example item']])),
  };
}

test('accepts a complete structured analysis', () => {
  assert.equal(validateAnalysis(validAnalysis()), true);
});

test('rejects missing fields, invalid scores, and malformed lists', () => {
  const missingSection = validAnalysis();
  delete missingSection.sectionScores.projects;
  assert.equal(validateAnalysis(missingSection), false);

  const invalidScore = validAnalysis();
  invalidScore.overallScore = 101;
  assert.equal(validateAnalysis(invalidScore), false);

  const invalidList = validAnalysis();
  invalidList.suggestions = [''];
  assert.equal(validateAnalysis(invalidList), false);
});
test('converts malformed Gemini JSON into a safe service error', () => {
  assert.throws(
    () => parseGeminiAnalysis('{not json'),
    { message: 'Gemini returned an invalid structured response. Please retry analysis.', statusCode: 502 },
  );
});

test('maps Gemini capacity and rate-limit errors to retryable responses', () => {
  const unavailableError = toSafeGeminiError({ status: 503 });
  assert.equal(unavailableError.message, 'Gemini is temporarily busy or rate-limited. Wait a moment, then retry analysis.');
  assert.equal(unavailableError.statusCode, 503);

  const rateLimitError = toSafeGeminiError({ status: 429 });
  assert.equal(rateLimitError.message, 'Gemini API quota or rate limit reached. Check the API key project quota in Google AI Studio, then try again later.');
  assert.equal(rateLimitError.statusCode, 429);
});

test('retries temporary Gemini capacity errors and succeeds without delaying tests', async () => {
  let attempts = 0;
  const result = await retryGeminiRequest(
    async () => {
      attempts += 1;
      if (attempts === 1) throw Object.assign(new Error('busy'), { status: 503 });
      return 'success';
    },
    async () => {},
  );

  assert.equal(result, 'success');
  assert.equal(attempts, 2);
});

test('does not retry permanent or rate-limit Gemini errors and bounds capacity retries', async () => {
  let attempts = 0;
  await assert.rejects(
    retryGeminiRequest(async () => {
      attempts += 1;
      throw Object.assign(new Error('invalid key'), { status: 403 });
    }, async () => {}),
    { message: 'invalid key' },
  );
  assert.equal(attempts, 1);

  attempts = 0;
  await assert.rejects(
    retryGeminiRequest(async () => {
      attempts += 1;
      throw Object.assign(new Error('busy'), { status: 429 });
    }, async () => {}),
    { message: 'busy' },
  );
  assert.equal(attempts, 1);

  attempts = 0;
  await assert.rejects(
    retryGeminiRequest(async () => {
      attempts += 1;
      throw Object.assign(new Error('capacity unavailable'), { status: 503 });
    }, async () => {}),
    { message: 'capacity unavailable' },
  );
  assert.equal(attempts, 3);
});