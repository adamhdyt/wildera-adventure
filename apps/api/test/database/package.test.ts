import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { Client } from 'pg';
import type { MeetingPoint, SchedulePackage } from '@wildera/types';

const root =
  typeof __dirname !== 'undefined'
    ? resolve(__dirname, '../../../..')
    : process.cwd();
const name = `wildera_pkg_test_${randomUUID().replaceAll('-', '')}`;
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
  process.env.SESSION_SECRET = 'pkg-test-session-secret-at-least-32-chars';
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

test('Meeting Point and Schedule Package operations with integrity constraints', async () => {
  const { createApp } = await import('../../src/app');
  const app = await createApp();
  await app.listen(0, '127.0.0.1');
  const appUrl = await app.getUrl();

  try {
    // 1. Fixture: Role & Admin User
    const roleId = randomUUID();
    await db.query(
      `INSERT INTO roles (id, name, slug, description)
     VALUES ($1, 'Super Admin', 'SUPER_ADMIN', 'Super admin role')`,
      [roleId],
    );

    const userId = randomUUID();
    const passwordHash = await argon2.hash('Secret1234!', {
      type: argon2.argon2id,
    });
    await db.query(
      "INSERT INTO admin_users(id,name,email,password_hash,status) VALUES ($1,'Admin Tester','admin@wildera.test',$2,'ACTIVE')",
      [userId, passwordHash],
    );
    await db.query(
      'INSERT INTO admin_user_roles(admin_user_id,role_id) VALUES ($1,$2)',
      [userId, roleId],
    );

    // Authenticate session
    const loginRes = await fetch(`${appUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@wildera.test',
        password: 'Secret1234!',
      }),
    });
    assert.equal(loginRes.status, 200);
    const cookie = loginRes.headers.get('set-cookie')?.split(';')[0] || '';
    assert.ok(cookie);

    // 2. Fixtures: Destination, Mountain, Trip, Schedule
    const destId = randomUUID();
    await db.query(
      `INSERT INTO destinations (id, name, slug, region, description, status)
     VALUES ($1, 'Lombok', 'lombok-pkg', 'NTB', 'Pulau Lombok', 'ACTIVE')`,
      [destId],
    );

    const mountainId = randomUUID();
    await db.query(
      `INSERT INTO mountains (id, destination_id, name, slug, altitude_m, status)
     VALUES ($1, $2, 'Gunung Rinjani', 'gunung-rinjani-pkg', 3726, 'PUBLISHED')`,
      [mountainId, destId],
    );

    const tripId = randomUUID();
    await db.query(
      `INSERT INTO trips (id, mountain_id, name, slug, trip_type, duration_days, duration_nights, difficulty, status, created_by)
     VALUES ($1, $2, 'Rinjani Trekking', 'rinjani-trekking-pkg', 'OPEN_TRIP', 3, 2, 'MODERATE', 'PUBLISHED', $3)`,
      [tripId, mountainId, userId],
    );

    const scheduleId = randomUUID();
    await db.query(
      `INSERT INTO trip_schedules (id, trip_id, start_date, end_date, registration_deadline, capacity, status, created_by)
     VALUES ($1, $2, '2026-10-01', '2026-10-03', '2026-09-25 12:00:00+07', 20, 'OPEN', $3)`,
      [scheduleId, tripId, userId],
    );

    const baseUrl = `${appUrl}/api/v1/admin`;

    // 3. Meeting Point CRUD
    // 3a. Create Meeting Point
    const createMpRes = await fetch(`${baseUrl}/meeting-points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        name: 'Bandara Internasional Lombok (BIL)',
        city: 'Praya',
        address: 'Jl. Bypass BIL No. 1',
        latitude: -8.761,
        longitude: 116.275,
        notes: 'Titik kumpul di depan kedatangan domestik',
        status: 'ACTIVE',
      }),
    });
    assert.equal(createMpRes.status, 201);
    const mpData = (await createMpRes.json()) as MeetingPoint;
    assert.equal(mpData.name, 'Bandara Internasional Lombok (BIL)');
    assert.equal(mpData.city, 'Praya');
    assert.equal(mpData.status, 'ACTIVE');

    // 3b. Read Meeting Point
    const getMpRes = await fetch(`${baseUrl}/meeting-points/${mpData.id}`, {
      headers: { Cookie: cookie },
    });
    assert.equal(getMpRes.status, 200);
    const fetchedMp = (await getMpRes.json()) as MeetingPoint;
    assert.equal(fetchedMp.id, mpData.id);

    // 3c. Update Meeting Point
    const updateMpRes = await fetch(`${baseUrl}/meeting-points/${mpData.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        notes: 'Titik kumpul di Lobby Barat Kedatangan',
      }),
    });
    assert.equal(updateMpRes.status, 200);
    const updatedMp = (await updateMpRes.json()) as MeetingPoint;
    assert.equal(updatedMp.notes, 'Titik kumpul di Lobby Barat Kedatangan');

    // 3d. List Meeting Points
    const listMpRes = await fetch(`${baseUrl}/meeting-points?status=ACTIVE`, {
      headers: { Cookie: cookie },
    });
    assert.equal(listMpRes.status, 200);
    const listMps = (await listMpRes.json()) as MeetingPoint[];
    assert.ok(listMps.length >= 1);
    assert.ok(listMps.some((m) => m.id === mpData.id));

    // 4. Schedule Package CRUD & Rule 84
    // 4a. Reject package create with capacity (Rule 84)
    const capacityRejectRes = await fetch(
      `${baseUrl}/schedules/${scheduleId}/packages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          name: 'Paket Start Bandara',
          price: 1750000,
          capacity: 10, // FORBIDDEN!
        }),
      },
    );
    assert.equal(capacityRejectRes.status, 422);
    const capacityRejectJson = (await capacityRejectRes.json()) as {
      error?: { fields?: Record<string, string> };
    };
    assert.ok(capacityRejectJson.error?.fields?.capacity);

    // 4b. Reject package create with negative price
    const negPriceRes = await fetch(
      `${baseUrl}/schedules/${scheduleId}/packages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          name: 'Paket Negatif',
          price: -1000,
        }),
      },
    );
    assert.equal(negPriceRes.status, 422);

    // 4c. Create valid Schedule Packages
    const createPkg1Res = await fetch(
      `${baseUrl}/schedules/${scheduleId}/packages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          name: 'Start Bandara Lombok (BIL)',
          description: 'Termasuk transport bandara PP dan logistik',
          price: 1750000,
          meetingPointId: mpData.id,
          meetingDatetime: '2026-10-01T07:00:00.000Z',
          sortOrder: 1,
        }),
      },
    );
    assert.equal(createPkg1Res.status, 201);
    const pkg1 = (await createPkg1Res.json()) as SchedulePackage;
    assert.equal(pkg1.name, 'Start Bandara Lombok (BIL)');
    assert.equal(pkg1.price, 1750000);
    assert.equal(pkg1.meetingPoint?.name, 'Bandara Internasional Lombok (BIL)');

    const createPkg2Res = await fetch(
      `${baseUrl}/schedules/${scheduleId}/packages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          name: 'Start Basecamp Sembalun',
          description: 'Bertemu langsung di Basecamp Sembalun',
          price: 1250000,
          sortOrder: 2,
        }),
      },
    );
    assert.equal(createPkg2Res.status, 201);
    const pkg2 = (await createPkg2Res.json()) as SchedulePackage;
    assert.equal(pkg2.name, 'Start Basecamp Sembalun');

    // 4d. List packages for schedule
    const listPkgRes = await fetch(
      `${baseUrl}/schedules/${scheduleId}/packages`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(listPkgRes.status, 200);
    const listPkgs = (await listPkgRes.json()) as SchedulePackage[];
    assert.equal(listPkgs.length, 2);
    assert.equal(listPkgs[0]?.id, pkg1.id);
    assert.equal(listPkgs[1]?.id, pkg2.id);

    // 4e. Update package price
    const updatePkgRes = await fetch(
      `${baseUrl}/schedules/${scheduleId}/packages/${pkg2.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          price: 1300000,
        }),
      },
    );
    assert.equal(updatePkgRes.status, 200);
    const updatedPkg2 = (await updatePkgRes.json()) as SchedulePackage;
    assert.equal(updatedPkg2.price, 1300000);

    // 4f. Reject update with capacity
    const updateCapRejectRes = await fetch(
      `${baseUrl}/schedules/${scheduleId}/packages/${pkg2.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          capacity: 15,
        }),
      },
    );
    assert.equal(updateCapRejectRes.status, 422);

    // 5. Integrity Constraints
    // 5a. Reject deleting Meeting Point while attached to pkg1
    const deleteMpFailRes = await fetch(
      `${baseUrl}/meeting-points/${mpData.id}`,
      {
        method: 'DELETE',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(deleteMpFailRes.status, 409);
    const deleteMpFailJson = (await deleteMpFailRes.json()) as {
      error?: { code?: string };
    };
    assert.equal(deleteMpFailJson.error?.code, 'MEETING_POINT_IN_USE');

    // 5b. Attach a booking to pkg1 and verify delete pkg1 fails
    const bookingId = randomUUID();
    const customerId = randomUUID();
    await db.query(
      `INSERT INTO customers(id, full_name, whatsapp_number, email)
     VALUES ($1, 'Budi Santoso', '08123456789', 'budi@test.com')`,
      [customerId],
    );
    await db.query(
      `INSERT INTO bookings(id, booking_number, customer_id, schedule_id, package_id, status, source, participant_count, contact_name, contact_whatsapp, created_by)
     VALUES ($1, 'BKG-PKG-01', $2, $3, $4, 'CONFIRMED', 'ADMIN', 2, 'Budi Santoso', '08123456789', $5)`,
      [bookingId, customerId, scheduleId, pkg1.id, userId],
    );

    const deletePkg1FailRes = await fetch(
      `${baseUrl}/schedules/${scheduleId}/packages/${pkg1.id}`,
      {
        method: 'DELETE',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(deletePkg1FailRes.status, 409);
    const deletePkg1FailJson = (await deletePkg1FailRes.json()) as {
      error?: { code?: string };
    };
    assert.equal(deletePkg1FailJson.error?.code, 'PACKAGE_HAS_BOOKINGS');

    // 5c. Delete pkg2 (has no booking) succeeds
    const deletePkg2Res = await fetch(
      `${baseUrl}/schedules/${scheduleId}/packages/${pkg2.id}`,
      {
        method: 'DELETE',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(deletePkg2Res.status, 200);

    // 6. Audit Log Verification
    const auditRes = await db.query(
      `SELECT action, entity_type FROM audit_logs WHERE admin_user_id = $1 ORDER BY created_at ASC`,
      [userId],
    );
    const actions = auditRes.rows.map((r) => `${r.action}:${r.entity_type}`);
    assert.ok(actions.includes('MEETING_POINT_CREATE:MeetingPoint'));
    assert.ok(actions.includes('MEETING_POINT_UPDATE:MeetingPoint'));
    assert.ok(actions.includes('PACKAGE_CREATE:SchedulePackage'));
    assert.ok(actions.includes('PACKAGE_UPDATE:SchedulePackage'));
    assert.ok(actions.includes('PACKAGE_DELETE:SchedulePackage'));
  } finally {
    await app.close();
  }
});
