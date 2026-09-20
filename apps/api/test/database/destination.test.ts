import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { Client } from 'pg';

const root = resolve(__dirname, '../../../..');
const name = `wildera_dest_test_${randomUUID().replaceAll('-', '')}`;
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
  process.env.SESSION_SECRET =
    'destination-test-session-secret-at-least-32-chars';
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

test('Destination CRUD end-to-end API lifecycle and validation', async () => {
  const superAdminRoleId = randomUUID();
  const superAdminId = randomUUID();
  const password = 'SuperAdminPassword123!';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  await db.query(
    "INSERT INTO roles(id,name,slug) VALUES ($1,'Super Admin','SUPER_ADMIN')",
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

  const { createApp } = await import('../../src/app');
  const app = await createApp();
  await app.listen(0, '127.0.0.1');
  const baseUrl = await app.getUrl();

  try {
    // 1. Unauthenticated request rejected
    const unauth = await fetch(`${baseUrl}/api/v1/admin/destinations`);
    assert.equal(unauth.status, 401);

    // 2. Login to get session cookie
    const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@wildera.test',
        password,
      }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie);

    // 3. Initial list is empty
    const listInitial = await fetch(`${baseUrl}/api/v1/admin/destinations`, {
      headers: { Cookie: cookie },
    });
    assert.equal(listInitial.status, 200);
    const initialJson = (await listInitial.json()) as {
      success: boolean;
      data: { items: unknown[]; total: number };
    };
    assert.equal(initialJson.success, true);
    assert.equal(initialJson.data.total, 0);
    assert.equal(initialJson.data.items.length, 0);

    // 4. Create destination - validation failure (missing name)
    const invalidCreate = await fetch(`${baseUrl}/api/v1/admin/destinations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({ name: '' }),
    });
    assert.equal(invalidCreate.status, 422);
    const invalidCreateJson = (await invalidCreate.json()) as {
      error: { code: string; fields: Record<string, string> };
    };
    assert.equal(invalidCreateJson.error.code, 'VALIDATION_ERROR');
    assert.ok(invalidCreateJson.error.fields.name);

    // 5. Create destination - success (Lombok)
    const createLombok = await fetch(`${baseUrl}/api/v1/admin/destinations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        name: 'Lombok',
        slug: 'lombok',
        province: 'Nusa Tenggara Barat',
        region: 'Kepulauan Nusa Tenggara',
        description: 'Destinasi pendakian Gunung Rinjani.',
        status: 'ACTIVE',
        seoTitle: 'Paket Pendakian Lombok',
        seoDescription: 'Informasi dan paket trip resmi Lombok Wildera.',
      }),
    });
    assert.equal(createLombok.status, 201);
    const lombokJson = (await createLombok.json()) as {
      success: boolean;
      data: {
        id: string;
        name: string;
        slug: string;
        province: string;
        status: string;
      };
    };
    assert.equal(lombokJson.success, true);
    assert.equal(lombokJson.data.name, 'Lombok');
    assert.equal(lombokJson.data.slug, 'lombok');
    assert.equal(lombokJson.data.status, 'ACTIVE');
    const lombokId = lombokJson.data.id;

    // 6. Create destination with duplicate slug - 409 Conflict
    const duplicateSlug = await fetch(`${baseUrl}/api/v1/admin/destinations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        name: 'Lombok Baru',
        slug: 'lombok',
      }),
    });
    assert.equal(duplicateSlug.status, 409);
    const duplicateJson = (await duplicateSlug.json()) as {
      error: { code: string; message: string };
    };
    assert.equal(duplicateJson.error.code, 'SLUG_ALREADY_EXISTS');

    // 7. Create second destination (Jawa Tengah)
    const createJateng = await fetch(`${baseUrl}/api/v1/admin/destinations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        name: 'Jawa Tengah',
        province: 'Jawa Tengah',
      }),
    });
    assert.equal(createJateng.status, 201);
    const jatengJson = (await createJateng.json()) as {
      data: { slug: string; id: string };
    };
    assert.equal(jatengJson.data.slug, 'jawa-tengah');
    const jatengId = jatengJson.data.id;

    // 8. Get destination by ID
    const getLombok = await fetch(
      `${baseUrl}/api/v1/admin/destinations/${lombokId}`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(getLombok.status, 200);
    const getLombokJson = (await getLombok.json()) as {
      data: { id: string; name: string; _count: { mountains: number } };
    };
    assert.equal(getLombokJson.data.id, lombokId);
    assert.equal(getLombokJson.data.name, 'Lombok');
    assert.equal(getLombokJson.data._count.mountains, 0);

    // 9. Update destination (Lombok)
    const updateLombok = await fetch(
      `${baseUrl}/api/v1/admin/destinations/${lombokId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify({
          description: 'Deskripsi Lombok yang diperbarui.',
          status: 'INACTIVE',
        }),
      },
    );
    assert.equal(updateLombok.status, 200);
    const updatedJson = (await updateLombok.json()) as {
      data: { description: string; status: string };
    };
    assert.equal(
      updatedJson.data.description,
      'Deskripsi Lombok yang diperbarui.',
    );
    assert.equal(updatedJson.data.status, 'INACTIVE');

    // 10. List with status filter
    const listActive = await fetch(
      `${baseUrl}/api/v1/admin/destinations?status=ACTIVE`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(listActive.status, 200);
    const listActiveJson = (await listActive.json()) as {
      data: { total: number; items: Array<{ id: string }> };
    };
    assert.equal(listActiveJson.data.total, 1);
    assert.ok(listActiveJson.data.items[0]);
    assert.equal(listActiveJson.data.items[0].id, jatengId);

    // 11. List with search
    const listSearch = await fetch(
      `${baseUrl}/api/v1/admin/destinations?search=Lombok`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(listSearch.status, 200);
    const listSearchJson = (await listSearch.json()) as {
      data: { total: number; items: Array<{ id: string }> };
    };
    assert.equal(listSearchJson.data.total, 1);
    assert.ok(listSearchJson.data.items[0]);
    assert.equal(listSearchJson.data.items[0].id, lombokId);

    // 12. Soft delete destination
    const deleteJateng = await fetch(
      `${baseUrl}/api/v1/admin/destinations/${jatengId}`,
      {
        method: 'DELETE',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(deleteJateng.status, 200);

    // 13. Deleted destination not returned in list or get
    const getDeleted = await fetch(
      `${baseUrl}/api/v1/admin/destinations/${jatengId}`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(getDeleted.status, 404);

    // 14. Verify audit log was recorded
    const auditLogs = await db.query(
      "SELECT action, entity_type, entity_id FROM audit_logs WHERE entity_type = 'DESTINATION' ORDER BY created_at ASC",
    );
    assert.ok(auditLogs.rows.length >= 3);
    assert.equal(auditLogs.rows[0].action, 'DESTINATION_CREATE');
    assert.equal(auditLogs.rows[1].action, 'DESTINATION_CREATE');
    assert.equal(auditLogs.rows[2].action, 'DESTINATION_UPDATE');
  } finally {
    await app.close();
  }
});
