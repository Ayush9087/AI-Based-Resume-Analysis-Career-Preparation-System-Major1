import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSkillGap } from './skillGapController.js';

test('loads only the caller resume and compares it with stored role requirements', async () => {
  const calls = [];
  let savedAnalysis;
  const resume = {
    id: '11111111-1111-4111-8111-111111111111',
    original_name: 'resume.pdf',
    parsed_data: { skills: ['Python (beginner)', 'SQL'] },
    analysis_data: null,
  };
  const role = {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Backend Developer',
    description: 'Build backend services.',
    career_role_skills: [
      { required_strength: 'intermediate', priority: 'high', learning_area: 'Python services', skills: { name: 'Python', category: 'technical' } },
      { required_strength: 'intermediate', priority: 'medium', learning_area: 'Relational queries', skills: { name: 'SQL', category: 'technical' } },
      { required_strength: 'intermediate', priority: 'high', learning_area: 'Container basics', skills: { name: 'Docker', category: 'technical' } },
    ],
  };
  const supabase = {
    from(table) {
      if (table === 'skill_gap_analyses') {
        return {
          insert(row) {
            savedAnalysis = row;
            return Promise.resolve({ error: null });
          },
        };
      }
      const query = {
        select(columns) {
          calls.push({ table, columns });
          return this;
        },
        eq(column, value) {
          calls.push({ table, column, value });
          return this;
        },
        single() {
          return Promise.resolve({ data: table === 'resumes' ? resume : role, error: null });
        },
      };
      return query;
    },
  };
  const response = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  await analyzeSkillGap({
    body: { resumeId: '11111111-1111-4111-8111-111111111111', roleId: '22222222-2222-4222-8222-222222222222' },
    supabase,
    user: { id: 'user-1' },
  }, response, (error) => { throw error; });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data.role.title, 'Backend Developer');
  assert.deepEqual(response.body.data.comparison.matchingSkills.map((skill) => skill.name), ['SQL']);
  assert.deepEqual(response.body.data.comparison.skillsNeedingImprovement.map((skill) => skill.name), ['Python']);
  assert.deepEqual(response.body.data.comparison.missingSkills.map((skill) => skill.name), ['Docker']);
  assert.equal(savedAnalysis.user_id, 'user-1');
  assert.equal(savedAnalysis.role_title, 'Backend Developer');
  assert.deepEqual(savedAnalysis.comparison_data, response.body.data.comparison);
  assert.ok(calls.some((call) => call.table === 'resumes' && call.column === 'user_id' && call.value === 'user-1'));
});