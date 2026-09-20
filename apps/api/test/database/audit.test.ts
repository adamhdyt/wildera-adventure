import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { Client } from 'pg';
import { INestApplication } from '@nestjs/common';

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://wildera:wildera_dev_secret@127.0.0.1:55432/wildera_dev?schema=public';
const parsed = new URL(databaseUrl);
const name = `wildera_test_audit_${randomUUID().replace(/-/g, '')}`;
parsed.pathname = `/${name}`;
const connectionString = parsed.toString();
const adminParsed = new URL(databaseUrl);
adminParsed.pathname = '/postgres';

const adminDb = new Client({ connectionString: adminParsed.toString() });
const db = new Client({ connectionString });
const root = resolve(__dirname, '../../../..');

let created = false;
let app: INestApplication;
let appUrl = '';
const password = 'Password123!';

let superAdminCookie = '';
let operationsCookie = '';
let contentCookie = '';
let superAdminId = '';
let operationsAdminId = '';
let contentAdminId = '';

before(async () => {
  await adminDb.connect();
  await adminDb.query(`CREATE DATABASE "${name}"`);
  created = true;

  const migration = spawnSync(
    process.execPath,
    ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
    {
      cwd: root,
      env: { ...process.env, DATABASE_URL: connectionString },
      encoding: 'utf8',
      timeout: 60000,
    },
  );
  assert.equal(migration.status, 0, migration.stderr);
  await db.connect();

  const superRoleId = randomUUID();
  const opsRoleId = randomUUID();
  const contentRoleId = randomUUID();

  await db.query(
    `INSERT INTO roles (id, name, slug) VALUES 
      ($1, 'Super Admin', 'SUPER_ADMIN'),
      ($2, 'Operations', 'OPERATIONS'),
      ($3, 'Content', 'CONTENT')`,
    [superRoleId, opsRoleId, contentRoleId],
  );

  const hash = await argon2.hash(password, { type: argon2.argon2id });

  superAdminId = randomUUID();
  operationsAdminId = randomUUID();
  contentAdminId = randomUUID();

  await db.query(
    `INSERT INTO admin_users (id, name, email, password_hash, status) VALUES 
      ($1, 'Super Admin', 'superadmin@wildera.test', $4, 'ACTIVE'),
      ($2, 'Operations Admin', 'ops@wildera.test', $4, 'ACTIVE'),
      ($3, 'Content Admin', 'content@wildera.test', $4, 'ACTIVE')`,
    [superAdminId, operationsAdminId, contentAdminId, hash],
  );

  await db.query(
    `INSERT INTO admin_user_roles (admin_user_id, role_id) VALUES 
      ($1, $4),
      ($2, $5),
      ($3, $6)`,
    [
      superAdminId,
      operationsAdminId,
      contentAdminId,
      superRoleId,
      opsRoleId,
      contentRoleId,
    ],
  );

  process.env.DATABASE_URL = connectionString;
  process.env.NODE_ENV = 'test';
  process.env.SESSION_SECRET =
    'audit-test-session-secret-at-least-32-chars-long';

  const { createApp } = await import('../../src/app');
  app = await createApp();
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address();
  appUrl = `http://127.0.0.1:${address.port}`;

  // Log in as Super Admin
  const superLoginRes = await fetch(`${appUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@wildera.test',
      password,
    }),
  });
  assert.equal(superLoginRes.status, 200);
  superAdminCookie =
    superLoginRes.headers.get('set-cookie')?.split(';')[0] ?? '';

  // Log in as Operations
  const opsLoginRes = await fetch(`${appUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ops@wildera.test',
      password,
    }),
  });
  assert.equal(opsLoginRes.status, 200);
  operationsCookie = opsLoginRes.headers.get('set-cookie')?.split(';')[0] ?? '';

  // Log in as Content
  const contentLoginRes = await fetch(`${appUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'content@wildera.test',
      password,
    }),
  });
  assert.equal(contentLoginRes.status, 200);
  contentCookie =
    contentLoginRes.headers.get('set-cookie')?.split(';')[0] ?? '';
});

after(async () => {
  if (app) await app.close();
  await db.end();
  try {
    if (created) await adminDb.query(`DROP DATABASE "${name}" WITH (FORCE)`);
  } finally {
    await adminDb.end();
  }
});

test('Audit Log Lifecycle & Critical Events (STEP 33)', async (t) => {
  await t.test('1. RBAC permissions for audit logs', async () => {
    // Super admin can access
    const superRes = await fetch(`${appUrl}/api/v1/admin/audit-logs`, {
      headers: { Cookie: superAdminCookie },
    });
    assert.equal(superRes.status, 200);
    const superBody = await superRes.json();
    assert.equal(superBody.success, true);
    assert.ok(Array.isArray(superBody.data));
    assert.ok(superBody.meta);

    // Operations can access (AUDIT_VIEW_LIMITED)
    const opsRes = await fetch(`${appUrl}/api/v1/admin/audit-logs`, {
      headers: { Cookie: operationsCookie },
    });
    assert.equal(opsRes.status, 200);

    // Content is forbidden (403)
    const contentRes = await fetch(`${appUrl}/api/v1/admin/audit-logs`, {
      headers: { Cookie: contentCookie },
    });
    assert.equal(contentRes.status, 403);

    // Unauthenticated is rejected (401)
    const anonRes = await fetch(`${appUrl}/api/v1/admin/audit-logs`);
    assert.equal(anonRes.status, 401);
  });

  await t.test(
    '2. Critical Event: ADMIN_ROLE_CHANGED generated and verified',
    async () => {
      // Super admin changes roles of content admin
      const patchRes = await fetch(
        `${appUrl}/api/v1/admin/users/${contentAdminId}`,
        {
          method: 'PATCH',
          headers: {
            Cookie: superAdminCookie,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roles: ['OPERATIONS', 'CONTENT'],
          }),
        },
      );
      assert.equal(patchRes.status, 200);
      const patchBody = await patchRes.json();
      assert.equal(patchBody.success, true);
      assert.ok(patchBody.data.roles.includes('OPERATIONS'));
      assert.ok(patchBody.data.roles.includes('CONTENT'));

      // Check audit log contains ADMIN_ROLE_CHANGED
      const auditRes = await fetch(
        `${appUrl}/api/v1/admin/audit-logs?action=ADMIN_ROLE_CHANGED`,
        {
          headers: { Cookie: superAdminCookie },
        },
      );
      assert.equal(auditRes.status, 200);
      const auditBody = await auditRes.json();
      assert.equal(auditBody.success, true);
      assert.ok(auditBody.data.length >= 1);

      const logItem = auditBody.data.find(
        (item: { action: string; entityId: string }) =>
          item.action === 'ADMIN_ROLE_CHANGED' &&
          item.entityId === contentAdminId,
      );
      assert.ok(logItem, 'ADMIN_ROLE_CHANGED log item must exist');
      assert.deepEqual(logItem.oldValue, { roles: ['CONTENT'] });
      assert.deepEqual(logItem.newValue, { roles: ['OPERATIONS', 'CONTENT'] });
    },
  );

  await t.test(
    '3. Critical Event: SCHEDULE_CAPACITY_CHANGED and aliases',
    async () => {
      // Insert destination, mountain, trip, schedule manually to test schedule capacity update
      const destId = randomUUID();
      await db.query(
        `INSERT INTO destinations (id, name, slug) VALUES ($1, 'Destinasi Audit', 'destinasi-audit')`,
        [destId],
      );
      const mntId = randomUUID();
      await db.query(
        `INSERT INTO mountains (id, destination_id, name, slug, altitude_m, default_difficulty) 
       VALUES ($1, $2, 'Gunung Audit', 'gunung-audit', 3000, 'MODERATE')`,
        [mntId, destId],
      );
      const tripId = randomUUID();
      await db.query(
        `INSERT INTO trips (id, mountain_id, route_id, name, slug, trip_type, duration_days, duration_nights, difficulty, status, created_by)
       VALUES ($1, $2, NULL, 'Trip Audit', 'trip-audit', 'OPEN_TRIP', 3, 2, 'MODERATE', 'PUBLISHED', $3)`,
        [tripId, mntId, superAdminId],
      );
      const schedId = randomUUID();
      const startDate = new Date(Date.now() + 86400000 * 10);
      const endDate = new Date(Date.now() + 86400000 * 12);
      await db.query(
        `INSERT INTO trip_schedules (id, trip_id, start_date, end_date, capacity, minimum_participants, status, created_by)
       VALUES ($1, $2, $3, $4, 20, 5, 'OPEN', $5)`,
        [schedId, tripId, startDate, endDate, superAdminId],
      );

      // Update schedule capacity from 20 to 25
      const schedRes = await fetch(
        `${appUrl}/api/v1/admin/schedules/${schedId}`,
        {
          method: 'PATCH',
          headers: {
            Cookie: superAdminCookie,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            capacity: 25,
          }),
        },
      );
      assert.equal(schedRes.status, 200);

      // Query audit log with action=SCHEDULE_CAPACITY_CHANGED
      const auditRes = await fetch(
        `${appUrl}/api/v1/admin/audit-logs?action=SCHEDULE_CAPACITY_CHANGED`,
        {
          headers: { Cookie: superAdminCookie },
        },
      );
      assert.equal(auditRes.status, 200);
      const auditBody = await auditRes.json();
      assert.ok(auditBody.data.length >= 1);
      const capLog = auditBody.data.find(
        (item: { action: string; entityId: string }) =>
          item.action === 'SCHEDULE_CAPACITY_CHANGED' &&
          item.entityId === schedId,
      );
      assert.ok(capLog);
      assert.deepEqual(capLog.oldValue, { capacity: 20 });
      assert.deepEqual(capLog.newValue, { capacity: 25 });
    },
  );

  await t.test('4. Query Filters & Pagination', async () => {
    // Pagination check
    const pagedRes = await fetch(
      `${appUrl}/api/v1/admin/audit-logs?limit=2&page=1`,
      {
        headers: { Cookie: superAdminCookie },
      },
    );
    assert.equal(pagedRes.status, 200);
    const pagedBody = await pagedRes.json();
    assert.equal(pagedBody.data.length, 2);
    assert.ok(pagedBody.meta.total >= 2);
    assert.equal(pagedBody.meta.page, 1);
    assert.equal(pagedBody.meta.limit, 2);

    // Search filter check
    const searchRes = await fetch(
      `${appUrl}/api/v1/admin/audit-logs?search=ADMIN_ROLE`,
      {
        headers: { Cookie: superAdminCookie },
      },
    );
    assert.equal(searchRes.status, 200);
    const searchBody = await searchRes.json();
    assert.ok(searchBody.data.length >= 1);
    assert.equal(searchBody.data[0].action, 'ADMIN_ROLE_CHANGED');
  });

  await t.test(
    '5. Append-only enforcement: No delete or update endpoints for audit logs',
    async () => {
      const dummyId = randomUUID();

      // DELETE should return 404 (route does not exist)
      const delRes = await fetch(
        `${appUrl}/api/v1/admin/audit-logs/${dummyId}`,
        {
          method: 'DELETE',
          headers: { Cookie: superAdminCookie },
        },
      );
      assert.equal(delRes.status, 404);

      // PATCH should return 404
      const patchRes = await fetch(
        `${appUrl}/api/v1/admin/audit-logs/${dummyId}`,
        {
          method: 'PATCH',
          headers: {
            Cookie: superAdminCookie,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'MUTATED' }),
        },
      );
      assert.equal(patchRes.status, 404);

      // PUT should return 404
      const putRes = await fetch(
        `${appUrl}/api/v1/admin/audit-logs/${dummyId}`,
        {
          method: 'PUT',
          headers: {
            Cookie: superAdminCookie,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'MUTATED' }),
        },
      );
      assert.equal(putRes.status, 404);
    },
  );
});
