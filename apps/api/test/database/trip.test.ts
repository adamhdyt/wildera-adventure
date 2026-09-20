import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { Client } from 'pg';
import type { Trip, TripListResponse } from '@wildera/types';

const root = resolve(__dirname, '../../../..');
const name = `wildera_trip_test_${randomUUID().replaceAll('-', '')}`;
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
  process.env.SESSION_SECRET = 'trip-test-session-secret-at-least-32-chars';
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

test('Trip CRUD end-to-end API lifecycle, relations, and audit trail', async () => {
  const superAdminRoleId = randomUUID();
  const adminId = randomUUID();
  const password = 'SuperSecretTrip123!';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  await db.query(
    "INSERT INTO roles(id,name,slug,description) VALUES ($1,'Super Admin','SUPER_ADMIN','Full system access')",
    [superAdminRoleId],
  );
  await db.query(
    "INSERT INTO admin_users(id,name,email,password_hash,status) VALUES ($1,'Super Admin','superadmin@wildera.test',$2,'ACTIVE')",
    [adminId, passwordHash],
  );
  await db.query(
    'INSERT INTO admin_user_roles(admin_user_id,role_id) VALUES ($1,$2)',
    [adminId, superAdminRoleId],
  );

  const destinationId = randomUUID();
  await db.query(
    "INSERT INTO destinations(id,name,slug,province,region,status) VALUES ($1,'Lombok','lombok-trip-hub','NTB','Kepulauan Nusa Tenggara','ACTIVE')",
    [destinationId],
  );

  const mountainId = randomUUID();
  await db.query(
    "INSERT INTO mountains(id,destination_id,name,slug,altitude_m,default_difficulty,status) VALUES ($1,$2,'Gunung Rinjani','gunung-rinjani-trip',3726,'HARD','PUBLISHED')",
    [mountainId, destinationId],
  );

  const routeId = randomUUID();
  await db.query(
    "INSERT INTO routes(id,mountain_id,name,slug,distance_km,difficulty,status) VALUES ($1,$2,'Jalur Sembalun','jalur-sembalun-trip',8.5,'HARD','PUBLISHED')",
    [routeId, mountainId],
  );

  const { createApp } = await import('../../src/app');
  const app = await createApp();
  await app.listen(0, '127.0.0.1');
  const baseUrl = await app.getUrl();

  try {
    // 1. Unauthenticated request rejected
    const unauth = await fetch(`${baseUrl}/api/v1/admin/trips`);
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
    const cookie = login.headers.get('set-cookie');
    assert.ok(cookie);

    // 3. Initial list should be empty
    const initialList = await fetch(`${baseUrl}/api/v1/admin/trips`, {
      headers: { Cookie: cookie },
    });
    assert.equal(initialList.status, 200);
    const initialJson = (await initialList.json()) as TripListResponse;
    assert.equal(initialJson.total, 0);

    // 4. Validation failure when creating trip
    const invalidCreate = await fetch(`${baseUrl}/api/v1/admin/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({}),
    });
    assert.equal(invalidCreate.status, 422);

    // 5. Foreign key failure when mountainId does not exist
    const nonExistentMountain = await fetch(`${baseUrl}/api/v1/admin/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        mountainId: randomUUID(),
        name: 'Trip Invalid Mountain',
        tripType: 'OPEN_TRIP',
        durationDays: 3,
        durationNights: 2,
        difficulty: 'HARD',
      }),
    });
    assert.equal(nonExistentMountain.status, 400);

    // 6. Create trip with valid payload
    const createTrip1 = await fetch(`${baseUrl}/api/v1/admin/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        mountainId,
        routeId,
        name: 'Open Trip Rinjani Summit 3D2N',
        tripType: 'OPEN_TRIP',
        shortDescription: 'Pendakian seru menuju puncak Dewi Anjani',
        durationDays: 3,
        durationNights: 2,
        difficulty: 'HARD',
        beginnerFriendly: false,
        healthCertificateRequired: true,
        minimumAge: 15,
        featured: true,
      }),
    });
    assert.equal(createTrip1.status, 201);
    const trip1 = (await createTrip1.json()) as Trip;
    assert.ok(trip1.id);
    assert.equal(trip1.name, 'Open Trip Rinjani Summit 3D2N');
    assert.equal(trip1.slug, 'open-trip-rinjani-summit-3d2n');
    assert.equal(trip1.tripType, 'OPEN_TRIP');
    assert.equal(trip1.durationDays, 3);
    assert.equal(trip1.durationNights, 2);
    assert.equal(trip1.difficulty, 'HARD');
    assert.equal(trip1.status, 'DRAFT');
    assert.equal(trip1.featured, true);
    assert.equal(trip1.mountain?.name, 'Gunung Rinjani');
    assert.equal(trip1.route?.name, 'Jalur Sembalun');

    // 7. Duplicate slug rejected with 409 Conflict
    const dupRes = await fetch(`${baseUrl}/api/v1/admin/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        mountainId,
        name: 'Open Trip Rinjani Summit 3D2N',
        tripType: 'OPEN_TRIP',
        durationDays: 3,
        difficulty: 'HARD',
      }),
    });
    assert.equal(dupRes.status, 409);

    // 8. Create second trip (TEKTOK, PUBLISHED)
    const createTrip2 = await fetch(`${baseUrl}/api/v1/admin/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        mountainId,
        name: 'Private Tektok Rinjani Express',
        tripType: 'TEKTOK',
        durationDays: 1,
        durationNights: 0,
        difficulty: 'EXTREME',
        status: 'PUBLISHED',
      }),
    });
    assert.equal(createTrip2.status, 201);
    const trip2 = (await createTrip2.json()) as Trip;
    assert.equal(trip2.status, 'PUBLISHED');
    assert.ok(trip2.publishedAt);

    // 9. Get trip by ID
    const getByIdRes = await fetch(
      `${baseUrl}/api/v1/admin/trips/${trip1.id}`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(getByIdRes.status, 200);
    const getById = (await getByIdRes.json()) as Trip;
    assert.equal(getById.name, 'Open Trip Rinjani Summit 3D2N');

    // 10. Update trip
    const updateRes = await fetch(`${baseUrl}/api/v1/admin/trips/${trip1.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        status: 'PUBLISHED',
        minimumAge: 17,
      }),
    });
    assert.equal(updateRes.status, 200);
    const updatedTrip = (await updateRes.json()) as Trip;
    assert.equal(updatedTrip.status, 'PUBLISHED');
    assert.equal(updatedTrip.minimumAge, 17);
    assert.ok(updatedTrip.publishedAt);

    // 11. Filter and search
    const filterTripType = await fetch(
      `${baseUrl}/api/v1/admin/trips?tripType=TEKTOK`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(filterTripType.status, 200);
    const filterJson = (await filterTripType.json()) as TripListResponse;
    assert.equal(filterJson.total, 1);
    assert.equal(filterJson.items[0]?.name, 'Private Tektok Rinjani Express');

    const searchRes = await fetch(
      `${baseUrl}/api/v1/admin/trips?search=Summit`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(searchRes.status, 200);
    const searchJson = (await searchRes.json()) as TripListResponse;
    assert.equal(searchJson.total, 1);
    assert.equal(searchJson.items[0]?.name, 'Open Trip Rinjani Summit 3D2N');

    // 11b. Nested Content Management (STEP 12)
    // Initial content should be empty
    const initialContentRes = await fetch(
      `${baseUrl}/api/v1/admin/trips/${trip1.id}/content`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(initialContentRes.status, 200);
    const initialContent = await initialContentRes.json();
    assert.equal(initialContent.itineraries.length, 0);
    assert.equal(initialContent.facilities.length, 0);
    assert.equal(initialContent.gears.length, 0);
    assert.equal(initialContent.faqs.length, 0);

    // Update nested content
    const updateContentRes = await fetch(
      `${baseUrl}/api/v1/admin/trips/${trip1.id}/content`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify({
          itineraries: [
            {
              dayNumber: 1,
              title: 'Tiba di Sembalun & Pos 2',
              description: 'Briefing dan pendakian santai.',
              sortOrder: 1,
            },
            {
              dayNumber: 2,
              title: 'Plawangan Sembalun ke Puncak & Danau',
              description: 'Summit attack jam 02:00 pagi.',
              sortOrder: 2,
            },
          ],
          facilities: [
            {
              facilityType: 'INCLUDE',
              name: 'Tenda Dome & Matras Aluminium',
              sortOrder: 1,
            },
            {
              facilityType: 'EXCLUDE',
              name: 'Porter Pribadi',
              sortOrder: 2,
            },
          ],
          gears: [
            {
              gearType: 'MANDATORY',
              name: 'Headlamp & Baterai Cadangan',
              sortOrder: 1,
            },
            {
              gearType: 'RECOMMENDED',
              name: 'Trekking Pole',
              sortOrder: 2,
            },
          ],
          faqs: [
            {
              question: 'Apakah rute ini aman bagi pemula?',
              answer: 'Disarankan memiliki fisik yang telah terlatih.',
              status: 'PUBLISHED',
              sortOrder: 1,
            },
          ],
        }),
      },
    );
    assert.equal(updateContentRes.status, 200);
    const updatedContent = await updateContentRes.json();
    assert.equal(updatedContent.itineraries.length, 2);
    assert.equal(
      updatedContent.itineraries[0].title,
      'Tiba di Sembalun & Pos 2',
    );
    assert.equal(updatedContent.facilities.length, 2);
    assert.equal(updatedContent.gears.length, 2);
    assert.equal(updatedContent.faqs.length, 1);

    // 11c. Attempt publish without cover image -> expects 422
    const publishFailRes = await fetch(
      `${baseUrl}/api/v1/admin/trips/${trip1.id}/publish`,
      {
        method: 'POST',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(publishFailRes.status, 422);
    const publishFailJson = await publishFailRes.json();
    assert.equal(publishFailJson.error?.code, 'TRIP_NOT_READY_TO_PUBLISH');
    assert.equal(
      publishFailJson.error?.fields?.coverImage,
      'Cover image wajib diisi.',
    );

    // 11d. Insert media cover for trip1
    const testMediaId = randomUUID();
    await db.query(
      `INSERT INTO media_assets (id, object_key, url, mime_type, file_size_bytes, created_by)
       VALUES ($1, 'uploads/test/cover.jpg', '/uploads/test/cover.jpg', 'image/jpeg', 1024, $2)`,
      [testMediaId, adminId],
    );
    await db.query(
      `INSERT INTO trip_media (id, trip_id, media_id, media_role, sort_order)
       VALUES ($1, $2, $3, 'COVER', 0)`,
      [randomUUID(), trip1.id, testMediaId],
    );

    // 11e. Publish trip -> succeeds 200
    const publishSuccessRes = await fetch(
      `${baseUrl}/api/v1/admin/trips/${trip1.id}/publish`,
      {
        method: 'POST',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(publishSuccessRes.status, 200);
    const publishedTrip = (await publishSuccessRes.json()) as Trip;
    assert.equal(publishedTrip.status, 'PUBLISHED');
    assert.ok(publishedTrip.publishedAt);

    // 11f. Unpublish trip -> succeeds 200
    const unpublishRes = await fetch(
      `${baseUrl}/api/v1/admin/trips/${trip1.id}/unpublish`,
      {
        method: 'POST',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(unpublishRes.status, 200);
    const unpublishedTrip = (await unpublishRes.json()) as Trip;
    assert.equal(unpublishedTrip.status, 'DRAFT');

    // 11g. Duplicate trip -> succeeds 201
    const duplicateRes = await fetch(
      `${baseUrl}/api/v1/admin/trips/${trip1.id}/duplicate`,
      {
        method: 'POST',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(duplicateRes.status, 201);
    const duplicatedTrip = (await duplicateRes.json()) as Trip;
    assert.equal(duplicatedTrip.status, 'DRAFT');
    assert.ok(duplicatedTrip.name.includes('(Salinan)'));
    assert.ok(duplicatedTrip.slug.includes('-salinan'));
    assert.notEqual(duplicatedTrip.id, trip1.id);

    // Verify subresources are copied
    const duplicateContent = await (
      await fetch(
        `${baseUrl}/api/v1/admin/trips/${duplicatedTrip.id}/content`,
        {
          headers: { Cookie: cookie },
        },
      )
    ).json();
    assert.equal(duplicateContent.itineraries.length, 2);
    assert.equal(duplicateContent.facilities.length, 2);
    assert.equal(duplicateContent.gears.length, 2);
    assert.equal(duplicateContent.faqs.length, 1);

    // Verify duplicate media is copied
    const duplicateMedia = await db.query(
      `SELECT * FROM trip_media WHERE trip_id = $1`,
      [duplicatedTrip.id],
    );
    assert.equal(duplicateMedia.rows.length, 1);
    assert.equal(duplicateMedia.rows[0].media_role, 'COVER');

    // Verify NO schedules exist on duplicated trip
    const duplicateSchedules = await db.query(
      `SELECT * FROM trip_schedules WHERE trip_id = $1`,
      [duplicatedTrip.id],
    );
    assert.equal(duplicateSchedules.rows.length, 0);

    // 12. Soft delete trip
    const deleteRes = await fetch(`${baseUrl}/api/v1/admin/trips/${trip1.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    assert.equal(deleteRes.status, 200);
    const deleteJson = (await deleteRes.json()) as Trip;
    assert.equal(deleteJson.status, 'ARCHIVED');

    // Deleted trip should not be found
    const verifyDelete = await fetch(
      `${baseUrl}/api/v1/admin/trips/${trip1.id}`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(verifyDelete.status, 404);

    // 13. Verify Audit Logs
    const auditLogs = await db.query(
      "SELECT * FROM audit_logs WHERE entity_type = 'TRIP' ORDER BY created_at ASC",
    );
    assert.ok(auditLogs.rows.length >= 7);
    const actions = auditLogs.rows.map((r) => r.action);
    assert.ok(actions.includes('TRIP_CREATE'));
    assert.ok(actions.includes('TRIP_UPDATE'));
    assert.ok(actions.includes('TRIP_CONTENT_UPDATE'));
    assert.ok(actions.includes('TRIP_PUBLISH'));
    assert.ok(actions.includes('TRIP_UNPUBLISH'));
    assert.ok(actions.includes('TRIP_DUPLICATE'));
    assert.ok(actions.includes('TRIP_DELETE'));
  } finally {
    await app.close();
  }
});
