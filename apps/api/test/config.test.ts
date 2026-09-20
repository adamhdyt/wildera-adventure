import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateEnvironment } from '../src/common/config/environment';
import { sessionCookieOptions } from '../src/modules/auth/session.constants';

test('environment validation normalizes backend configuration', () => {
  assert.deepEqual(
    validateEnvironment({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/wildera',
      HOST: '0.0.0.0',
      NODE_ENV: 'staging',
      PORT: '4000',
      SESSION_SECRET: 'a-secure-session-secret-with-32-chars',
    }),
    {
      DATABASE_URL: 'postgresql://user:password@localhost:5432/wildera',
      HOST: '0.0.0.0',
      NODE_ENV: 'staging',
      PORT: 4000,
      SESSION_SECRET: 'a-secure-session-secret-with-32-chars',
    },
  );
});

test('environment validation rejects missing database URL and invalid ports', () => {
  assert.throws(() => validateEnvironment({}), /DATABASE_URL/);
  assert.throws(
    () =>
      validateEnvironment({
        DATABASE_URL: 'postgresql://localhost/wildera',
        PORT: '70000',
        SESSION_SECRET: 'a-secure-session-secret-with-32-chars',
      }),
    /PORT/,
  );
  assert.throws(
    () =>
      validateEnvironment({
        DATABASE_URL: 'mysql://localhost/wildera',
        SESSION_SECRET: 'a-secure-session-secret-with-32-chars',
      }),
    /PostgreSQL/,
  );
  assert.throws(
    () =>
      validateEnvironment({
        DATABASE_URL: 'postgresql://localhost/wildera',
        SESSION_SECRET: 'short',
      }),
    /SESSION_SECRET/,
  );
  assert.throws(
    () =>
      validateEnvironment({
        DATABASE_URL: 'postgresql://localhost/wildera',
        SESSION_SECRET: 'replace_with_at_least_32_random_characters',
      }),
    /SESSION_SECRET/,
  );
});

test('session cookie is HttpOnly and secure outside local/test environments', () => {
  assert.deepEqual(sessionCookieOptions('test'), {
    httpOnly: true,
    maxAge: 28_800_000,
    path: '/',
    sameSite: 'lax',
    secure: false,
  });
  assert.equal(sessionCookieOptions('staging').secure, true);
  assert.equal(sessionCookieOptions('production').secure, true);
});
