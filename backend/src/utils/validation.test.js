import test from 'node:test';
import assert from 'node:assert/strict';
import { isMissingRow, isUuid } from './validation.js';

test('validates UUIDs before database queries', () => {
  assert.equal(isUuid('11111111-1111-4111-8111-111111111111'), true);
  assert.equal(isUuid('not-a-uuid'), false);
  assert.equal(isUuid('11111111-1111-4111-8111-11111111111g'), false);
});

test('only treats PostgREST no-row results as not found', () => {
  assert.equal(isMissingRow({ code: 'PGRST116' }), true);
  assert.equal(isMissingRow({ code: '42501' }), false);
  assert.equal(isMissingRow(null), false);
});
