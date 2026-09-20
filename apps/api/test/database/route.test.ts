import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { Client } from 'pg';

const root = resolve(__dirname, '../../../..');
const name = `wildera_route_test_${randomUUID().replaceAll('-', '')}`;
const source = process.env.DATABASE_URL;
if (!source) {
  throw new Error(
    'DATABASE_URL is required; run npm run db:local:start first.',
  );
}
const url = new URL(source);
url.pathname = `/${name}`;
url.search = '';
const connectionString = url.toString();
url.pathname = '/postgres';
const admin = new Client({ connectionString: url.toString() });
const db = new Client({ connectionString });

const previousEnvironment = {
  databaseUrl: process.env.DATABASE_URL,
  nodeEnvironment: process.env.NODE_ENV,
  sessionSecret: process.env.SESSION_SECRET,
};
let created = false;

before(async () => {
  await admin.connect();
  await admin.query(`CREATE DATABASE "${name}"`);
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
  process.env.DATABASE_URL = connectionString;
  process.env.NODE_ENV = 'test';
  process.env.SESSION_SECRET = 'route-test-session-secret-at-least-32-chars';
});

after(async () => {
  await db.end();
  try {
    if (created) await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
  } finally {
    await admin.end();
    if (previousEnvironment.databaseUrl === undefined)
      delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousEnvironment.databaseUrl;
    if (previousEnvironment.nodeEnvironment === undefined)
      delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment.nodeEnvironment;
    if (previousEnvironment.sessionSecret === undefined)
      delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = previousEnvironment.sessionSecret;
  }
});

test('Route CRUD end-to-end API lifecycle, one mountain multiple routes, and audit trail', async () => {
  const superAdminRoleId = randomUUID();
  const adminId = randomUUID();
  const password = 'SuperAdminPassword123!';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  await db.query(
    "INSERT INTO roles(id,name,slug,description) VALUES ($1,'Super Admin','SUPER_ADMIN','Full system access')",
    [superAdminRoleId],
  );
  await db.query(
    "INSERT INTO admin_users(id,name,email,password_hash,status) VALUES ($1,'Route Admin','route-admin@wildera.test',$2,'ACTIVE')",
    [adminId, passwordHash],
  );
  await db.query(
    'INSERT INTO admin_user_roles(admin_user_id,role_id) VALUES ($1,$2)',
    [adminId, superAdminRoleId],
  );

  // Seed destination
  const destId = randomUUID();
  await db.query(
    "INSERT INTO destinations(id,name,slug,province,region,status) VALUES ($1,'Lombok Island','lombok-island','NTB','Lombok','ACTIVE')",
    [destId],
  );

  // Seed mountain
  const mountainId = randomUUID();
  await db.query(
    "INSERT INTO mountains(id,destination_id,name,slug,altitude_m,status) VALUES ($1,$2,'Gunung Rinjani','gunung-rinjani',3726,'PUBLISHED')",
    [mountainId, destId],
  );

  const { createApp } = await import('../../src/app');
  const app = await createApp();
  await app.listen(0, '127.0.0.1');
  const server = app.getHttpServer();
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. Authenticate
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'route-admin@wildera.test',
        password: 'SuperAdminPassword123!',
      }),
    });
    assert.equal(loginRes.status, 200);
    const cookie = loginRes.headers.get('set-cookie');
    assert.ok(cookie);

    // 2. Initially empty routes
    const listRes = await fetch(`${baseUrl}/api/v1/admin/routes`, {
      headers: { Cookie: cookie },
    });
    assert.equal(listRes.status, 200);
    const listJson = await listRes.json();
    assert.equal(listJson.total, 0);
    assert.equal(listJson.items.length, 0);

    // 3. Validation failure: missing mountainId or name
    const invalidCreate = await fetch(`${baseUrl}/api/v1/admin/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: '' }),
    });
    assert.equal(invalidCreate.status, 422);

    // 4. Validation failure: mountain does not exist
    const nonExistentMountain = await fetch(`${baseUrl}/api/v1/admin/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        mountainId: randomUUID(),
        name: 'Jalur Fiktif',
      }),
    });
    assert.equal(nonExistentMountain.status, 400);

    // 5. Create Route 1: Jalur Sembalun
    const sembalunRes = await fetch(`${baseUrl}/api/v1/admin/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        mountainId,
        name: 'Jalur Sembalun',
        distanceKm: 8.5,
        elevationGainM: 1900,
        estimatedDurationHours: 7.5,
        difficulty: 'HARD',
        startingPoint: 'Pintu Masuk Sembalun',
      }),
    });
    assert.equal(sembalunRes.status, 201);
    const sembalun = await sembalunRes.json();
    assert.equal(sembalun.name, 'Jalur Sembalun');
    assert.equal(sembalun.slug, 'jalur-sembalun');
    assert.equal(sembalun.difficulty, 'HARD');
    assert.equal(sembalun.mountain.name, 'Gunung Rinjani');

    // 6. Duplicate slug for same mountain should fail with 409
    const duplicateRes = await fetch(`${baseUrl}/api/v1/admin/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        mountainId,
        name: 'Jalur Sembalun Duplikat',
        slug: 'jalur-sembalun',
      }),
    });
    assert.equal(duplicateRes.status, 409);

    // 7. Create Route 2: Jalur Senaru (One Mountain Multiple Routes acceptance criteria!)
    const senaruRes = await fetch(`${baseUrl}/api/v1/admin/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        mountainId,
        name: 'Jalur Senaru',
        distanceKm: 9.2,
        difficulty: 'MODERATE',
        startingPoint: 'Desa Senaru',
        status: 'PUBLISHED',
      }),
    });
    assert.equal(senaruRes.status, 201);

    // 8. Create Route 3: Jalur Torean
    const toreanRes = await fetch(`${baseUrl}/api/v1/admin/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        mountainId,
        name: 'Jalur Torean',
        difficulty: 'HARD',
        startingPoint: 'Desa Torean',
        status: 'PUBLISHED',
      }),
    });
    assert.equal(toreanRes.status, 201);

    // 9. Query routes for mountain - should have 3 routes
    const mtnRoutes = await fetch(
      `${baseUrl}/api/v1/admin/routes?mountainId=${mountainId}`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(mtnRoutes.status, 200);
    const mtnJson = await mtnRoutes.json();
    assert.equal(mtnJson.total, 3);
    assert.equal(mtnJson.items.length, 3);

    // 10. Search filter
    const searchRes = await fetch(
      `${baseUrl}/api/v1/admin/routes?search=Sembalun`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(searchRes.status, 200);
    const searchJson = await searchRes.json();
    assert.equal(searchJson.total, 1);
    assert.equal(searchJson.items[0].slug, 'jalur-sembalun');

    // 11. Detail by ID
    const detailRes = await fetch(
      `${baseUrl}/api/v1/admin/routes/${sembalun.id}`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(detailRes.status, 200);
    const detail = await detailRes.json();
    assert.equal(detail.id, sembalun.id);
    assert.equal(detail.mountain.name, 'Gunung Rinjani');

    // 12. Update route
    const updateRes = await fetch(
      `${baseUrl}/api/v1/admin/routes/${sembalun.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          status: 'PUBLISHED',
          distanceKm: 8.8,
        }),
      },
    );
    assert.equal(updateRes.status, 200);
    const updated = await updateRes.json();
    assert.equal(updated.status, 'PUBLISHED');
    assert.equal(Number(updated.distanceKm), 8.8);

    // 13. Soft delete route
    const deleteRes = await fetch(
      `${baseUrl}/api/v1/admin/routes/${sembalun.id}`,
      {
        method: 'DELETE',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(deleteRes.status, 200);

    // 14. Detail after delete returns 404
    const detailDeleted = await fetch(
      `${baseUrl}/api/v1/admin/routes/${sembalun.id}`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(detailDeleted.status, 404);

    // 15. Audit logs recorded
    const auditLogs = await db.query(
      `SELECT action, entity_type, entity_id FROM audit_logs WHERE entity_type = 'ROUTE';`,
    );
    assert.ok(auditLogs.rows.length >= 3);
    const actions = auditLogs.rows.map((r) => r.action);
    assert.ok(actions.includes('ROUTE_CREATE'));
    assert.ok(actions.includes('ROUTE_UPDATE'));
    assert.ok(actions.includes('ROUTE_DELETE'));
  } finally {
    await app.close();
  }
});
