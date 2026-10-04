import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCareerRecommendations } from './careerRecommendationController.js';

test('generates and persists role recommendations for the signed-in user', async () => {
  const calls = [];
  let insertedRows = [];
  const resume = {
    id: '11111111-1111-4111-8111-111111111111',
    original_name: 'profile.pdf',
    parsed_data: { skills: ['Python'], projects: ['Python automation project'] },
    analysis_data: null,
  };
  const roles = [{
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Python Developer',
    description: 'Build Python applications.',
    career_role_skills: [{
      required_strength: 'intermediate',
      priority: 'high',
      learning_area: 'Python application design',
      skills: { name: 'Python', category: 'technical', description: 'Python development.' },
    }],
  }];
  const supabase = {
    from(table) {
      if (table === 'resumes') {
        return {
          select() { return this; },
          eq(column, value) { calls.push({ table, column, value }); return this; },
          single() { return Promise.resolve({ data: resume, error: null }); },
        };
      }
      if (table === 'career_roles') {
        return { select() { return this; }, order() { return Promise.resolve({ data: roles, error: null }); } };
      }
      return {
        insert(rows) { insertedRows = rows; return this; },
        select() {
          return Promise.resolve({
            data: insertedRows.map((row) => ({ id: 'history-1', role_id: row.role_id, created_at: '2026-10-03T00:00:00.000Z' })),
            error: null,
          });
        },
      };
    },
  };
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  await generateCareerRecommendations({
    body: { resumeId: '11111111-1111-4111-8111-111111111111' },
    supabase,
    user: { id: 'user-1' },
  }, response, (error) => { throw error; });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data.recommendations[0].role.title, 'Python Developer');
  assert.equal(response.body.data.recommendations[0].historyId, 'history-1');
  assert.equal(insertedRows[0].user_id, 'user-1');
  assert.equal(insertedRows[0].resume_id, '11111111-1111-4111-8111-111111111111');
  assert.ok(insertedRows[0].recommendation_data.matchingSkills.some((skill) => skill.name === 'Python'));
  assert.ok(calls.some((call) => call.column === 'user_id' && call.value === 'user-1'));
});