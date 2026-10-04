import test from 'node:test';
import assert from 'node:assert/strict';
import { getProgress } from './progressController.js';

test('returns saved progress records scoped to the signed-in user', async () => {
  const calls = [];
  const records = {
    resume_score_history: [{ id: 'score-1', score: 76 }],
    skill_gap_analyses: [{ id: 'gap-1', role_title: 'Backend Developer' }],
    interview_sessions: [{ id: 'mock-1', status: 'completed' }],
    recommendations: [{ id: 'recommendation-1' }],
  };
  const supabase = {
    from(table) {
      const query = {
        select(columns) {
          calls.push({ table, columns });
          return this;
        },
        eq(column, value) {
          calls.push({ table, column, value });
          return this;
        },
        order(column, options) {
          calls.push({ table, column, options });
          return this;
        },
        range(start, end) {
          calls.push({ table, start, end });
          return Promise.resolve({ data: records[table], error: null });
        },
      };
      return query;
    },
  };
  const response = {
    json(body) {
      this.body = body;
      return this;
    },
  };

  await getProgress({ supabase, user: { id: 'user-1' } }, response, (error) => { throw error; });

  assert.equal(response.body.success, true);
  assert.deepEqual(response.body.data.resumeScoreHistory, records.resume_score_history);
  assert.deepEqual(response.body.data.skillGapHistory, records.skill_gap_analyses);
  assert.deepEqual(response.body.data.mockInterviews, records.interview_sessions);
  assert.deepEqual(response.body.data.recommendations, records.recommendations);
  assert.equal(calls.filter((call) => call.column === 'user_id').length, 4);
  assert.ok(calls.some((call) => call.table === 'interview_sessions' && call.column === 'session_type' && call.value === 'mock'));
});
