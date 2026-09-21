import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { securityHeaders } from '../src/common/security/security-headers.middleware';
import {
  rateLimiter,
  clearRateLimitRecords,
} from '../src/common/security/rate-limiter.middleware';
import { redactSensitiveData } from '../src/common/logger/app-logger.service';
import { sessionCookieOptions } from '../src/modules/auth/session.constants';

describe('Security Hardening (STEP 36)', () => {
  describe('securityHeaders', () => {
    test('sets strict OWASP security headers', () => {
      const middleware = securityHeaders();
      const headers: Record<string, string> = {};
      const res = {
        setHeader(name: string, value: string) {
          headers[name] = value;
          return this;
        },
      } as unknown as Response;
      let nextCalled = false;
      middleware({} as Request, res, () => {
        nextCalled = true;
      });

      assert.ok(nextCalled);
      assert.equal(headers['X-Content-Type-Options'], 'nosniff');
      assert.equal(headers['X-Frame-Options'], 'DENY');
      assert.equal(headers['X-XSS-Protection'], '0');
      assert.equal(
        headers['Referrer-Policy'],
        'strict-origin-when-cross-origin',
      );
      assert.equal(
        headers['Permissions-Policy'],
        'camera=(), microphone=(), geolocation=()',
      );
    });

    test('sets HSTS when in production environment', () => {
      const prev = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const middleware = securityHeaders();
        const headers: Record<string, string> = {};
        const res = {
          setHeader(name: string, value: string) {
            headers[name] = value;
            return this;
          },
        } as unknown as Response;
        middleware({} as Request, res, () => {});
        assert.ok(headers['Strict-Transport-Security']?.includes('max-age='));
      } finally {
        process.env.NODE_ENV = prev;
      }
    });
  });

  describe('rateLimiter', () => {
    test('tracks requests and enforces rate limit when exceeded', () => {
      clearRateLimitRecords();
      const limiter = rateLimiter({
        windowMs: 60000,
        maxPublic: 3,
        skipInTest: false,
      });

      const headers: Record<string, string | number> = {};
      let statusCode = 200;
      let jsonBody: unknown = null;

      const createMock = () => {
        const req = {
          ip: '192.168.1.100',
          path: '/api/v1/destinations',
          headers: {},
          socket: {},
        } as unknown as Request;

        const res = {
          setHeader(name: string, value: string | number) {
            headers[name] = value;
            return this;
          },
          status(code: number) {
            statusCode = code;
            return this;
          },
          json(data: unknown) {
            jsonBody = data;
            return this;
          },
        } as unknown as Response;

        return { req, res };
      };

      // 1st request
      let nextCount = 0;
      let mock = createMock();
      limiter(mock.req, mock.res, () => {
        nextCount++;
      });
      assert.equal(nextCount, 1);
      assert.equal(headers['X-RateLimit-Remaining'], 2);

      // 2nd request
      mock = createMock();
      limiter(mock.req, mock.res, () => {
        nextCount++;
      });
      assert.equal(nextCount, 2);
      assert.equal(headers['X-RateLimit-Remaining'], 1);

      // 3rd request
      mock = createMock();
      limiter(mock.req, mock.res, () => {
        nextCount++;
      });
      assert.equal(nextCount, 3);
      assert.equal(headers['X-RateLimit-Remaining'], 0);

      // 4th request (should be throttled with 429)
      mock = createMock();
      limiter(mock.req, mock.res, () => {
        nextCount++;
      });
      assert.equal(nextCount, 3, 'Should NOT call next() when throttled');
      assert.equal(statusCode, 429);
      const parsedBody = jsonBody as {
        error?: { code: string };
      };
      assert.equal(parsedBody?.error?.code, 'RATE_LIMIT_EXCEEDED');
      assert.ok(Number(headers['Retry-After']) > 0);
    });
  });

  describe('redactSensitiveData', () => {
    test('redacts database credentials from strings and stack traces', () => {
      const raw =
        'Error at postgresql://db_user:my_secret_pass_123@127.0.0.1:5432/wildera_prod';
      const cleaned = redactSensitiveData(raw);
      assert.ok(!String(cleaned).includes('my_secret_pass_123'));
      assert.ok(
        String(cleaned).includes(
          'postgresql://[REDACTED]:[REDACTED]@127.0.0.1:5432/wildera_prod',
        ),
      );
    });

    test('redacts sensitive fields in nested log objects', () => {
      const payload = {
        user: 'admin',
        password: 'PlainTextPassword123',
        token: 'eyJhbG...VCJ9.xyz',
        sessionSecret: 'very-secret-session-key',
        sessionVersion: 'v1.0',
        participant: {
          name: 'John Doe',
          nik: '3201234567890001',
          medicalHistory: 'Asma kronis',
        },
      };

      const redacted = redactSensitiveData(payload) as Record<
        string,
        unknown
      > & {
        participant: Record<string, unknown>;
      };
      assert.equal(redacted.user, 'admin');
      assert.equal(redacted.password, '[REDACTED]');
      assert.equal(redacted.token, '[REDACTED]');
      assert.equal(redacted.sessionSecret, '[REDACTED]');
      assert.equal(redacted.sessionVersion, '[REDACTED]');
      assert.equal(redacted.participant.nik, '[REDACTED]');
      assert.equal(redacted.participant.medicalHistory, '[REDACTED]');
      assert.equal(redacted.participant.name, 'John Doe');
    });
  });

  describe('sessionCookieOptions', () => {
    test('enforces httpOnly, sameSite lax, and environment-driven secure flag', () => {
      const prodOpts = sessionCookieOptions('production');
      assert.equal(prodOpts.httpOnly, true);
      assert.equal(prodOpts.sameSite, 'lax');
      assert.equal(prodOpts.path, '/');
      assert.equal(prodOpts.secure, true);

      const devOpts = sessionCookieOptions('development');
      assert.equal(devOpts.httpOnly, true);
      assert.equal(devOpts.secure, false);
    });
  });
});
