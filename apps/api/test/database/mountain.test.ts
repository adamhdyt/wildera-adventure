import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { Client } from 'pg';

const root = resolve(__dirname, '../../../..');
const name = `wildera_mtn_test_${randomUUID().replaceAll('-', '')}`;
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
  process.env.SESSION_SECRET = 'mountain-test-session-secret-at-least-32-chars';
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

test('Mountain CRUD end-to-end API lifecycle, relations, and validation', async () => {
  // Seed super admin user and roles
  const superAdminRoleId = randomUUID();
  const superAdminId = randomUUID();
  const password = 'SuperAdminPassword123!';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  await db.query(
    "INSERT INTO roles(id,name,slug,description) VALUES ($1,'Super Admin','SUPER_ADMIN','Full system access')",
    [superAdminRoleId],
  );
  await db.query(
    "INSERT INTO admin_users(id,name,email,password_hash,status) VALUES ($1,'Super Admin','superadmin@wildera.test',$2,'ACTIVE')",
    [superAdminId, passwordHash],
  );
  await db.query(
    'INSERT INTO admin_user_roles(admin_user_id,role_id) VALUES ($1,$2)',
    [superAdminId, superAdminRoleId],
  );

  // Seed destination
  const destId = randomUUID();
  await db.query(
    "INSERT INTO destinations(id,name,slug,province,region,status) VALUES ($1,'Lombok','lombok','Nusa Tenggara Barat','Lombok Timur','ACTIVE')",
    [destId],
  );

  const { createApp } = await import('../../src/app');
  const app = await createApp();
  await app.listen(0, '127.0.0.1');
  const server = app.getHttpServer();
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. Unauthenticated request to /admin/mountains should fail 401
    const unauth = await fetch(`${baseUrl}/api/v1/admin/mountains`);
    assert.equal(unauth.status, 401);

    // 2. Login as Super Admin
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@wildera.test', password }),
    });
    assert.equal(loginRes.status, 200);
    const sessionCookie = loginRes.headers.get('set-cookie');
    assert.ok(sessionCookie);

    // 3. List empty mountains
    const listEmpty = await fetch(`${baseUrl}/api/v1/admin/mountains`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(listEmpty.status, 200);
    const listEmptyJson = await listEmpty.json();
    assert.equal(listEmptyJson.success, true);
    assert.equal(listEmptyJson.data.total, 0);
    assert.deepEqual(listEmptyJson.data.items, []);

    // 4. Create mountain validation error: missing destinationId or name
    const invalidCreate = await fetch(`${baseUrl}/api/v1/admin/mountains`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({}),
    });
    assert.equal(invalidCreate.status, 422);

    // 5. Create mountain with non-existent destinationId should fail 400
    const invalidDest = await fetch(`${baseUrl}/api/v1/admin/mountains`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        destinationId: randomUUID(),
        name: 'Gunung Hantu',
      }),
    });
    assert.equal(invalidDest.status, 400);

    // 6. Create mountain: Gunung Rinjani
    const createRes = await fetch(`${baseUrl}/api/v1/admin/mountains`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        destinationId: destId,
        name: 'Gunung Rinjani',
        altitudeM: 3726,
        defaultDifficulty: 'HARD',
        bestSeason: 'Mei - Oktober',
        status: 'PUBLISHED',
      }),
    });
    assert.equal(createRes.status, 201);
    const createJson = await createRes.json();
    assert.equal(createJson.success, true);
    assert.equal(createJson.data.name, 'Gunung Rinjani');
    assert.equal(createJson.data.slug, 'gunung-rinjani');
    assert.equal(createJson.data.altitudeM, 3726);
    assert.equal(createJson.data.defaultDifficulty, 'HARD');
    assert.equal(createJson.data.status, 'PUBLISHED');
    assert.equal(createJson.data.destination.name, 'Lombok');
    const rinjaniId = createJson.data.id;

    // 7. Duplicate slug should return 409 Conflict
    const dupRes = await fetch(`${baseUrl}/api/v1/admin/mountains`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        destinationId: destId,
        name: 'Gunung Rinjani Second',
        slug: 'gunung-rinjani',
      }),
    });
    assert.equal(dupRes.status, 409);
    const dupJson = await dupRes.json();
    assert.equal(dupJson.error.code, 'SLUG_ALREADY_EXISTS');

    // 8. Get by ID
    const getRes = await fetch(
      `${baseUrl}/api/v1/admin/mountains/${rinjaniId}`,
      {
        headers: { Cookie: sessionCookie },
      },
    );
    assert.equal(getRes.status, 200);
    const getJson = await getRes.json();
    assert.equal(getJson.data.id, rinjaniId);
    assert.equal(getJson.data.destination.name, 'Lombok');

    // 9. Update mountain
    const updateRes = await fetch(
      `${baseUrl}/api/v1/admin/mountains/${rinjaniId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          altitudeM: 3727,
          bestSeason: 'April - November',
        }),
      },
    );
    assert.equal(updateRes.status, 200);
    const updateJson = await updateRes.json();
    assert.equal(updateJson.data.altitudeM, 3727);
    assert.equal(updateJson.data.bestSeason, 'April - November');

    // 10. Filter by destinationId
    const filterDest = await fetch(
      `${baseUrl}/api/v1/admin/mountains?destinationId=${destId}`,
      {
        headers: { Cookie: sessionCookie },
      },
    );
    assert.equal(filterDest.status, 200);
    const filterDestJson = await filterDest.json();
    assert.equal(filterDestJson.data.total, 1);
    assert.ok(filterDestJson.data.items[0]);
    assert.equal(filterDestJson.data.items[0].id, rinjaniId);

    // 11. Filter by search
    const filterSearch = await fetch(
      `${baseUrl}/api/v1/admin/mountains?search=Rinjani`,
      {
        headers: { Cookie: sessionCookie },
      },
    );
    assert.equal(filterSearch.status, 200);
    const filterSearchJson = await filterSearch.json();
    assert.equal(filterSearchJson.data.total, 1);

    // 12. Soft delete / archive
    const deleteRes = await fetch(
      `${baseUrl}/api/v1/admin/mountains/${rinjaniId}`,
      {
        method: 'DELETE',
        headers: { Cookie: sessionCookie },
      },
    );
    assert.equal(deleteRes.status, 200);

    // 13. Mountain no longer listed
    const listAfterDelete = await fetch(`${baseUrl}/api/v1/admin/mountains`, {
      headers: { Cookie: sessionCookie },
    });
    const listAfterDeleteJson = await listAfterDelete.json();
    assert.equal(listAfterDeleteJson.data.total, 0);

    // 14. Get by ID returns 404
    const getAfterDelete = await fetch(
      `${baseUrl}/api/v1/admin/mountains/${rinjaniId}`,
      {
        headers: { Cookie: sessionCookie },
      },
    );
    assert.equal(getAfterDelete.status, 404);

    // 15. Verify audit log entries in DB
    const audits = await db.query(
      "SELECT action, entity_type FROM audit_logs WHERE entity_type = 'MOUNTAIN' ORDER BY created_at ASC",
    );
    assert.equal(audits.rows.length, 3);
    assert.equal(audits.rows[0].action, 'MOUNTAIN_CREATE');
    assert.equal(audits.rows[1].action, 'MOUNTAIN_UPDATE');
    assert.equal(audits.rows[2].action, 'MOUNTAIN_DELETE');
  } finally {
    await app.close();
  }
});
