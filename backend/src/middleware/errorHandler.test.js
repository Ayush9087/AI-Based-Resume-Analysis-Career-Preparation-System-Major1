import test from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler } from './errorHandler.js';

function callErrorHandler(error) {
  const response = {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(statusCode) { this.statusCode = statusCode; return this; },
    json(body) { this.body = body; return this; },
  };
  errorHandler(error, { method: 'POST', path: '/api/test' }, response, (nextError) => {
    throw nextError;
  });
  return response;
}

test('hides unexpected implementation and database error details', () => {
  const response = callErrorHandler(Object.assign(new Error('secret SQL and credentials'), { code: 'SUPABASE_ERROR' }));

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.message, 'Something went wrong. Please try again.');
  assert.equal(response.body.message.includes('credentials'), false);
  assert.ok(response.headers['X-Request-Id']);
});

test('returns a safe, intentionally exposed validation message', () => {
  const response = callErrorHandler(Object.assign(new Error('Choose a valid role.'), {
    statusCode: 400,
    expose: true,
  }));

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.message, 'Choose a valid role.');
});

test('preserves intentionally exposed AI service statuses and messages', () => {
  const response = callErrorHandler(Object.assign(new Error('The AI service is busy. Please retry shortly.'), {
    statusCode: 503,
    expose: true,
  }));

  assert.equal(response.statusCode, 503);
  assert.equal(response.body.message, 'The AI service is busy. Please retry shortly.');
});

test('maps malformed JSON and upload size failures to safe responses', () => {
  const jsonResponse = callErrorHandler(Object.assign(new SyntaxError('parser internals'), { type: 'entity.parse.failed' }));
  assert.equal(jsonResponse.statusCode, 400);
  assert.equal(jsonResponse.body.message, 'Request body must contain valid JSON.');

  const uploadResponse = callErrorHandler(Object.assign(new Error('too large'), { code: 'LIMIT_FILE_SIZE' }));
  assert.equal(uploadResponse.statusCode, 413);
  assert.equal(uploadResponse.body.message, 'The resume must be 10 MB or smaller.');
});
