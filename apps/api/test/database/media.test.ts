import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { Client } from 'pg';
import type {
  MediaAsset,
  MountainMediaResponse,
  TripMediaResponse,
} from '@wildera/types';

const root = resolve(__dirname, '../../../..');
const name = `wildera_media_test_${randomUUID().replaceAll('-', '')}`;
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
    'test_session_secret_for_wildera_adventure_at_least_32_chars';
});

after(async () => {
  if (previousEnvironment.databaseUrl) {
    process.env.DATABASE_URL = previousEnvironment.databaseUrl;
  }
  if (previousEnvironment.nodeEnvironment) {
    process.env.NODE_ENV = previousEnvironment.nodeEnvironment;
  }
  if (previousEnvironment.sessionSecret) {
    process.env.SESSION_SECRET = previousEnvironment.sessionSecret;
  }
  await db.end().catch(() => {});
  if (created) {
    await admin.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${name}' AND pid <> pg_backend_pid()`,
    );
    await admin.query(`DROP DATABASE IF EXISTS "${name}"`);
  }
  await admin.end().catch(() => {});
});

test('Media upload, listing, trip/mountain attachment, and audit trail', async () => {
  const adminId = randomUUID();
  const email = 'superadmin.media@wildera.test';
  const password = 'Password123!';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const superAdminRoleId = randomUUID();
  await db.query(
    "INSERT INTO roles(id,name,slug,description) VALUES ($1,'Super Administrator','SUPER_ADMIN','Full access')",
    [superAdminRoleId],
  );
  await db.query(
    "INSERT INTO admin_users(id,name,email,password_hash,status) VALUES ($1,'Super Admin Media',$2,$3,'ACTIVE')",
    [adminId, email, passwordHash],
  );
  await db.query(
    'INSERT INTO admin_user_roles(admin_user_id,role_id) VALUES ($1,$2)',
    [adminId, superAdminRoleId],
  );

  const destinationId = randomUUID();
  await db.query(
    `INSERT INTO destinations (id, name, slug, province, region, status)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      destinationId,
      'Lombok Media Hub',
      'lombok-media-hub',
      'NTB',
      'Indonesia',
      'ACTIVE',
    ],
  );

  const mountainId = randomUUID();
  await db.query(
    `INSERT INTO mountains (id, destination_id, name, slug, altitude_m, default_difficulty, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      mountainId,
      destinationId,
      'Gunung Rinjani Media',
      'gunung-rinjani-media',
      3726,
      'HARD',
      'PUBLISHED',
    ],
  );

  const tripId = randomUUID();
  await db.query(
    `INSERT INTO trips (id, mountain_id, name, slug, trip_type, duration_days, duration_nights, difficulty, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      tripId,
      mountainId,
      'Rinjani Media Expedition',
      'rinjani-media-expedition',
      'OPEN_TRIP',
      3,
      2,
      'HARD',
      'DRAFT',
      adminId,
    ],
  );

  const { createApp } = await import('../../src/app');
  const app = await createApp();
  await app.init();
  await app.listen(0);
  const server = app.getHttpServer();
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Login
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(loginRes.status, 200);
    const cookie = loginRes.headers.get('set-cookie')?.split(';')[0] || '';

    // 2. Reject bad upload (wrong extension / mime type)
    const badUpload = await fetch(`${baseUrl}/api/v1/admin/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        filename: 'malicious.sh',
        mimeType: 'application/x-sh',
        contentBase64: Buffer.from('echo "bad"').toString('base64'),
      }),
    });
    assert.equal(badUpload.status, 422);

    // 3. Successful upload: image 1 (Cover)
    const dummyImage1 = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0xff, 0xd9,
    ]);
    const upload1Res = await fetch(`${baseUrl}/api/v1/admin/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        filename: 'rinjani-cover.jpg',
        mimeType: 'image/jpeg',
        contentBase64: dummyImage1.toString('base64'),
        altText: 'Cover Puncak Rinjani',
      }),
    });
    assert.equal(upload1Res.status, 201);
    const media1 = (await upload1Res.json()) as MediaAsset;
    assert.ok(media1.id);
    assert.equal(media1.mimeType, 'image/jpeg');
    assert.equal(media1.altText, 'Cover Puncak Rinjani');

    // 4. Successful upload: image 2 (Gallery)
    const upload2Res = await fetch(`${baseUrl}/api/v1/admin/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        filename: 'rinjani-lake.jpg',
        mimeType: 'image/jpeg',
        contentBase64: dummyImage1.toString('base64'),
        altText: 'Danau Segara Anak',
      }),
    });
    assert.equal(upload2Res.status, 201);
    const media2 = (await upload2Res.json()) as MediaAsset;

    // 5. List media
    const listRes = await fetch(`${baseUrl}/api/v1/admin/media`, {
      headers: { Cookie: cookie },
    });
    assert.equal(listRes.status, 200);
    const listJson = (await listRes.json()) as {
      items: MediaAsset[];
      total: number;
    };
    assert.ok(listJson.total >= 2);

    // 6. Assign cover & gallery to Trip
    const assignTripRes = await fetch(
      `${baseUrl}/api/v1/admin/trips/${tripId}/media`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          coverMediaId: media1.id,
          galleryMediaIds: [media2.id],
        }),
      },
    );
    assert.equal(assignTripRes.status, 200);
    const tripMedia = (await assignTripRes.json()) as TripMediaResponse;
    assert.equal(tripMedia.cover?.mediaId, media1.id);
    assert.equal(tripMedia.gallery.length, 1);
    assert.equal(tripMedia.gallery[0]?.mediaId, media2.id);

    // 7. Get trip media
    const getTripMediaRes = await fetch(
      `${baseUrl}/api/v1/admin/trips/${tripId}/media`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(getTripMediaRes.status, 200);
    const fetchedTripMedia =
      (await getTripMediaRes.json()) as TripMediaResponse;
    assert.equal(
      fetchedTripMedia.cover?.media?.altText,
      'Cover Puncak Rinjani',
    );

    // 8. Assign media to Mountain
    const assignMountainRes = await fetch(
      `${baseUrl}/api/v1/admin/mountains/${mountainId}/media`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          coverMediaId: media1.id,
          galleryMediaIds: [media2.id],
        }),
      },
    );
    assert.equal(assignMountainRes.status, 200);
    const mountainMedia =
      (await assignMountainRes.json()) as MountainMediaResponse;
    assert.equal(mountainMedia.cover?.mediaId, media1.id);

    // 9. Verify audit logs
    const auditLogs = await db.query(
      `SELECT action, entity_type, entity_id FROM audit_logs ORDER BY created_at ASC`,
    );
    const actions = auditLogs.rows.map((r) => r.action);
    assert.ok(actions.includes('MEDIA_UPLOAD'));
    assert.ok(actions.includes('TRIP_MEDIA_UPDATE'));
    assert.ok(actions.includes('MOUNTAIN_MEDIA_UPDATE'));
  } finally {
    await app.close();
  }
});
