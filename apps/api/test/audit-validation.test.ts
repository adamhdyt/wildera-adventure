import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAuditLogQuery,
  validateCreateAdminUser,
  validateUpdateAdminUser,
} from '@wildera/validation';

describe('Audit Log & Admin Validation (STEP 33)', () => {
  describe('validateAuditLogQuery', () => {
    it('defaults pagination to page 1 and limit 20', () => {
      const q = validateAuditLogQuery({});
      assert.equal(q.page, 1);
      assert.equal(q.limit, 20);
    });

    it('clamps limit to maximum 100', () => {
      const q = validateAuditLogQuery({ limit: '250', page: '3' });
      assert.equal(q.page, 3);
      assert.equal(q.limit, 100);
    });

    it('uppercases action and entityType', () => {
      const q = validateAuditLogQuery({
        action: 'trip_publish',
        entityType: 'trip',
        adminUserId: ' user-123 ',
        search: ' summit ',
      });
      assert.equal(q.action, 'TRIP_PUBLISH');
      assert.equal(q.entityType, 'TRIP');
      assert.equal(q.adminUserId, 'user-123');
      assert.equal(q.search, 'summit');
    });

    it('parses valid dates and ignores invalid ones', () => {
      const q = validateAuditLogQuery({
        fromDate: '2026-09-01T00:00:00.000Z',
        toDate: 'not-a-date',
      });
      assert.ok(q.fromDate instanceof Date);
      assert.equal(q.toDate, undefined);
    });
  });

  describe('validateCreateAdminUser', () => {
    it('accepts valid admin user payload', () => {
      const res = validateCreateAdminUser({
        name: 'Jane Doe',
        email: 'jane@wildera.id',
        password: 'securePassword123',
        roles: ['OPERATIONS'],
      });
      assert.equal(res.valid, true);
      assert.deepEqual(res.data?.roles, ['OPERATIONS']);
      assert.equal(res.data?.email, 'jane@wildera.id');
    });

    it('rejects short name or invalid email', () => {
      const res = validateCreateAdminUser({
        name: 'J',
        email: 'invalid-email',
        password: 'password123',
        roles: ['OPERATIONS'],
      });
      assert.equal(res.valid, false);
      assert.ok(res.errors?.name);
      assert.ok(res.errors?.email);
    });

    it('rejects short password (< 8 chars)', () => {
      const res = validateCreateAdminUser({
        name: 'Jane Doe',
        email: 'jane@wildera.id',
        password: 'short',
        roles: ['OPERATIONS'],
      });
      assert.equal(res.valid, false);
      assert.ok(res.errors?.password);
    });

    it('rejects unknown roles', () => {
      const res = validateCreateAdminUser({
        name: 'Jane Doe',
        email: 'jane@wildera.id',
        password: 'securePassword123',
        roles: ['SUPER_USER', 'OPERATIONS'],
      });
      assert.equal(res.valid, false);
      assert.ok(res.errors?.roles);
    });
  });

  describe('validateUpdateAdminUser', () => {
    it('allows valid partial updates', () => {
      const res = validateUpdateAdminUser({
        name: 'Jane Smith',
        status: 'DISABLED',
        roles: ['CONTENT'],
      });
      assert.equal(res.valid, true);
      assert.equal(res.data?.name, 'Jane Smith');
      assert.equal(res.data?.status, 'DISABLED');
      assert.deepEqual(res.data?.roles, ['CONTENT']);
    });

    it('rejects invalid status', () => {
      const res = validateUpdateAdminUser({
        status: 'DELETED',
      });
      assert.equal(res.valid, false);
      assert.ok(res.errors?.status);
    });
  });
});
