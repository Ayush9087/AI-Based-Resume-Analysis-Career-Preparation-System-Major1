import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureResumeOwnerProfile } from './resumeOwnerProfile.js';

test('creates a missing owner profile without overwriting an existing one', async () => {
  let upsertCall;
  const supabase = {
    from(table) {
      assert.equal(table, 'profiles');
      return {
        async upsert(values, options) {
          upsertCall = { values, options };
          return { error: null };
        },
      };
    },
  };

  await ensureResumeOwnerProfile(supabase, {
    id: 'user-123',
    email: 'user@example.com',
    user_metadata: { full_name: 'Test User', university: 'Example University', phone: '12345678' },
  });

  assert.deepEqual(upsertCall, {
    values: {
      id: 'user-123',
      email: 'user@example.com',
      full_name: 'Test User',
      university: 'Example University',
      phone: '12345678',
    },
    options: { onConflict: 'id', ignoreDuplicates: true },
  });
});

test('rejects an authenticated user without an email', async () => {
  await assert.rejects(
    ensureResumeOwnerProfile({}, { id: 'user-123' }),
    { statusCode: 401, message: 'Your account is missing a profile email. Sign in again and retry.' },
  );
});