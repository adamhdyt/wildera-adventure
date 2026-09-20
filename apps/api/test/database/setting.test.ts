import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { Client } from 'pg';
import { INestApplication } from '@nestjs/common';

const root = resolve(__dirname, '../../../..');
const name = `wildera_setting_test_${randomUUID().replaceAll('-', '')}`;
const source = process.env.DATABASE_URL;
if (!source) {
  throw new Error(
    'DATABASE_URL is required; run npm run db:local:start first.',
  );
}

const url = new URL(source);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
  throw new Error('Database tests require a local PostgreSQL server.');
}

url.pathname = `/${name}`;
url.search = '';
const connectionString = url.toString();
url.pathname = '/postgres';
const adminDb = new Client({ connectionString: url.toString() });
const db = new Client({ connectionString });

let app: INestApplication;
let appUrl: string;
let superAdminCookie: string;
let opsCookie: string;
let contentCookie: string;
let superAdminId: string;
let created = false;

const previousEnv = {
  databaseUrl: process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV,
  sessionSecret: process.env.SESSION_SECRET,
};

const password = 'SettingTestPassword123!';

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

  process.env.DATABASE_URL = connectionString;
  process.env.NODE_ENV = 'test';
  process.env.SESSION_SECRET =
    'setting-test-session-secret-at-least-32-chars-long';

  // Seed roles
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

  // Setup SUPER_ADMIN user
  superAdminId = randomUUID();
  await db.query(
    `INSERT INTO admin_users (id, name, email, password_hash, status)
     VALUES ($1, 'Super Admin Setting', 'superadmin@wildera.test', $2, 'ACTIVE')`,
    [superAdminId, hash],
  );
  await db.query(
    `INSERT INTO admin_user_roles (admin_user_id, role_id)
     VALUES ($1, $2)`,
    [superAdminId, superRoleId],
  );

  // Setup OPERATIONS user
  const opsId = randomUUID();
  await db.query(
    `INSERT INTO admin_users (id, name, email, password_hash, status)
     VALUES ($1, 'Ops User Setting', 'ops@wildera.test', $2, 'ACTIVE')`,
    [opsId, hash],
  );
  await db.query(
    `INSERT INTO admin_user_roles (admin_user_id, role_id)
     VALUES ($1, $2)`,
    [opsId, opsRoleId],
  );

  // Setup CONTENT user
  const contentId = randomUUID();
  await db.query(
    `INSERT INTO admin_users (id, name, email, password_hash, status)
     VALUES ($1, 'Content User Setting', 'content@wildera.test', $2, 'ACTIVE')`,
    [contentId, hash],
  );
  await db.query(
    `INSERT INTO admin_user_roles (admin_user_id, role_id)
     VALUES ($1, $2)`,
    [contentId, contentRoleId],
  );

  // Boot app
  const { createApp } = await import('../../src/app');
  app = await createApp();
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address();
  if (!address || typeof address === 'string') {
    throw new Error('Server address not found');
  }
  appUrl = `http://127.0.0.1:${address.port}`;

  // Login as SUPER_ADMIN
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

  // Login as OPERATIONS
  const opsLoginRes = await fetch(`${appUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ops@wildera.test',
      password,
    }),
  });
  assert.equal(opsLoginRes.status, 200);
  opsCookie = opsLoginRes.headers.get('set-cookie')?.split(';')[0] ?? '';

  // Login as CONTENT
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
    if (previousEnv.databaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousEnv.databaseUrl;
    if (previousEnv.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnv.nodeEnv;
    if (previousEnv.sessionSecret === undefined)
      delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = previousEnv.sessionSecret;
  }
});

test('Site Settings Admin & Public Lifecycle (STEP 32)', async () => {
  // 1. Unauthenticated request rejected
  const unauthRes = await fetch(`${appUrl}/api/v1/admin/site-settings`);
  assert.equal(unauthRes.status, 401);

  // 2. GET admin settings as SUPER_ADMIN
  const superGetRes = await fetch(`${appUrl}/api/v1/admin/site-settings`, {
    headers: { Cookie: superAdminCookie },
  });
  assert.equal(superGetRes.status, 200);
  const superData = (await superGetRes.json()).data;
  assert.ok(superData.business_whatsapp);
  assert.ok(superData.instagram_url);
  assert.ok(superData.contact_email);
  assert.equal(typeof superData.almost_full_percentage, 'number');

  // 3. GET admin settings as OPERATIONS (allowed with SETTING_VIEW)
  const opsGetRes = await fetch(`${appUrl}/api/v1/admin/site-settings`, {
    headers: { Cookie: opsCookie },
  });
  assert.equal(opsGetRes.status, 200);

  // 4. GET admin settings as CONTENT (allowed with SETTING_VIEW)
  const contentGetRes = await fetch(`${appUrl}/api/v1/admin/site-settings`, {
    headers: { Cookie: contentCookie },
  });
  assert.equal(contentGetRes.status, 200);

  // 5. Update settings as SUPER_ADMIN
  // 5a. business_whatsapp
  const patchWaRes = await fetch(
    `${appUrl}/api/v1/admin/site-settings/business_whatsapp`,
    {
      method: 'PATCH',
      headers: {
        Cookie: superAdminCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: '081298765432' }),
    },
  );
  assert.equal(patchWaRes.status, 200);
  const waJson = await patchWaRes.json();
  assert.equal(waJson.success, true);
  assert.equal(waJson.data.value, '6281298765432');

  // 5b. instagram_url
  const patchIgRes = await fetch(
    `${appUrl}/api/v1/admin/site-settings/instagram_url`,
    {
      method: 'PATCH',
      headers: {
        Cookie: superAdminCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: 'https://instagram.com/wildera.official',
      }),
    },
  );
  assert.equal(patchIgRes.status, 200);
  const igJson = await patchIgRes.json();
  assert.equal(igJson.data.value, 'https://instagram.com/wildera.official');

  // 5c. contact_email
  const patchEmailRes = await fetch(
    `${appUrl}/api/v1/admin/site-settings/contact_email`,
    {
      method: 'PATCH',
      headers: {
        Cookie: superAdminCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: 'Support@Wildera.id' }),
    },
  );
  assert.equal(patchEmailRes.status, 200);
  const emailJson = await patchEmailRes.json();
  assert.equal(emailJson.data.value, 'support@wildera.id');

  // 5d. almost_full_percentage
  const patchPercentRes = await fetch(
    `${appUrl}/api/v1/admin/site-settings/almost_full_percentage`,
    {
      method: 'PATCH',
      headers: {
        Cookie: superAdminCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: 25 }),
    },
  );
  assert.equal(patchPercentRes.status, 200);
  const percentJson = await patchPercentRes.json();
  assert.equal(percentJson.data.value, 25);

  // 6. Permission check: OPERATIONS cannot update setting (requires SETTING_MANAGE)
  const opsPatchRes = await fetch(
    `${appUrl}/api/v1/admin/site-settings/business_whatsapp`,
    {
      method: 'PATCH',
      headers: {
        Cookie: opsCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: '6289999999999' }),
    },
  );
  assert.equal(opsPatchRes.status, 403);

  // 7. Permission check: CONTENT cannot update setting
  const contentPatchRes = await fetch(
    `${appUrl}/api/v1/admin/site-settings/business_whatsapp`,
    {
      method: 'PATCH',
      headers: {
        Cookie: contentCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: '6289999999999' }),
    },
  );
  assert.equal(contentPatchRes.status, 403);

  // 8. Validation checks
  // 8a. Unsupported or secret key
  const secretKeyRes = await fetch(
    `${appUrl}/api/v1/admin/site-settings/database_password`,
    {
      method: 'PATCH',
      headers: {
        Cookie: superAdminCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: 'secret' }),
    },
  );
  assert.equal(secretKeyRes.status, 400);

  // 8b. Invalid phone
  const invalidPhoneRes = await fetch(
    `${appUrl}/api/v1/admin/site-settings/business_whatsapp`,
    {
      method: 'PATCH',
      headers: {
        Cookie: superAdminCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: '123' }),
    },
  );
  assert.equal(invalidPhoneRes.status, 400);

  // 8c. Invalid email
  const invalidEmailRes = await fetch(
    `${appUrl}/api/v1/admin/site-settings/contact_email`,
    {
      method: 'PATCH',
      headers: {
        Cookie: superAdminCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: 'not-an-email' }),
    },
  );
  assert.equal(invalidEmailRes.status, 400);

  // 8d. Invalid percentage
  const invalidPercentRes = await fetch(
    `${appUrl}/api/v1/admin/site-settings/almost_full_percentage`,
    {
      method: 'PATCH',
      headers: {
        Cookie: superAdminCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: 105 }),
    },
  );
  assert.equal(invalidPercentRes.status, 400);

  // 9. Public endpoint check: GET /api/v1/site-settings/public
  const publicRes = await fetch(`${appUrl}/api/v1/site-settings/public`);
  assert.equal(publicRes.status, 200);
  const publicJson = await publicRes.json();
  assert.equal(publicJson.success, true);
  assert.equal(publicJson.data.business_whatsapp, '6281298765432');
  assert.equal(
    publicJson.data.instagram_url,
    'https://instagram.com/wildera.official',
  );
  assert.equal(publicJson.data.contact_email, 'support@wildera.id');
  assert.equal(publicJson.data.almost_full_percentage, 25);

  // 10. Audit logging verification
  const auditRes = await db.query(
    `SELECT action, entity_type, new_value, admin_user_id
     FROM audit_logs
     WHERE entity_type = 'SITE_SETTING'
     ORDER BY created_at ASC`,
  );
  assert.ok(auditRes.rows.length >= 4);
  assert.equal(auditRes.rows[0].action, 'SETTING_UPDATE');
  assert.equal(auditRes.rows[0].admin_user_id, superAdminId);
});
