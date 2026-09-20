import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { Client } from 'pg';
import type { ScheduleListResponse, TripSchedule } from '@wildera/types';

const root = resolve(__dirname, '../../../..');
const name = `wildera_sched_test_${randomUUID().replaceAll('-', '')}`;
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
  process.env.SESSION_SECRET = 'sched-test-session-secret-at-least-32-chars';
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

test('Schedule CRUD, availability computation, lifecycle states, and capacity conflict', async () => {
  const superAdminRoleId = randomUUID();
  const adminId = randomUUID();
  const password = 'SuperSecretSched123!';
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
    "INSERT INTO destinations(id,name,slug,province,region,status) VALUES ($1,'Lombok Sched','lombok-sched','NTB','Kepulauan Nusa Tenggara','ACTIVE')",
    [destinationId],
  );

  const mountainId = randomUUID();
  await db.query(
    "INSERT INTO mountains(id,destination_id,name,slug,altitude_m,default_difficulty,status) VALUES ($1,$2,'Gunung Rinjani Sched','gunung-rinjani-sched',3726,'HARD','PUBLISHED')",
    [mountainId, destinationId],
  );

  const routeId = randomUUID();
  await db.query(
    "INSERT INTO routes(id,mountain_id,name,slug,distance_km,difficulty,status) VALUES ($1,$2,'Jalur Sembalun Sched','jalur-sembalun-sched',8.5,'HARD','PUBLISHED')",
    [routeId, mountainId],
  );

  const tripId = randomUUID();
  await db.query(
    `INSERT INTO trips(id, mountain_id, route_id, name, slug, trip_type, duration_days, duration_nights, difficulty, status, created_by)
     VALUES ($1, $2, $3, 'Rinjani Sched Expedition', 'rinjani-sched-expedition', 'OPEN_TRIP', 3, 2, 'MODERATE', 'PUBLISHED', $4)`,
    [tripId, mountainId, routeId, adminId],
  );

  const { createApp } = await import('../../src/app');
  const app = await createApp();
  await app.listen(0, '127.0.0.1');
  const baseUrl = await app.getUrl();

  try {
    // 1. Login to obtain session cookie
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@wildera.test',
        password,
      }),
    });
    assert.equal(loginRes.status, 200);
    const cookie = loginRes.headers.get('set-cookie');
    assert.ok(cookie, 'Set-Cookie header must be present');

    // 2. Create schedule (starts as DRAFT)
    const createRes = await fetch(`${baseUrl}/api/v1/admin/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        tripId,
        startDate: '2026-10-10',
        endDate: '2026-10-12',
        registrationDeadline: '2026-10-08T23:59:59.000Z',
        capacity: 15,
        minimumParticipants: 5,
        notes: 'Grup pendakian musim gugur',
      }),
    });
    assert.equal(createRes.status, 201);
    const createdSched = (await createRes.json()) as TripSchedule;
    assert.equal(createdSched.tripId, tripId);
    assert.equal(createdSched.status, 'DRAFT');
    assert.equal(createdSched.capacity, 15);
    assert.equal(createdSched.minimumParticipants, 5);
    assert.equal(createdSched.confirmedSeats, 0);
    assert.equal(createdSched.availableSeats, 15);
    assert.equal(createdSched.availabilityStatus, 'AVAILABLE');

    // 3. List schedules
    const listRes = await fetch(
      `${baseUrl}/api/v1/admin/schedules?tripId=${tripId}`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(listRes.status, 200);
    const listJson = (await listRes.json()) as ScheduleListResponse;
    assert.equal(listJson.total, 1);
    assert.equal(listJson.data[0]!.id, createdSched.id);
    assert.equal(listJson.data[0]!.trip?.name, 'Rinjani Sched Expedition');

    // 4. Update schedule (capacity & notes)
    const updateRes = await fetch(
      `${baseUrl}/api/v1/admin/schedules/${createdSched.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify({
          capacity: 12,
          notes: 'Kapasitas disesuaikan 12 orang',
        }),
      },
    );
    assert.equal(updateRes.status, 200);
    const updatedSched = (await updateRes.json()) as TripSchedule;
    assert.equal(updatedSched.capacity, 12);
    assert.equal(updatedSched.notes, 'Kapasitas disesuaikan 12 orang');

    // 5. Open schedule
    const openRes = await fetch(
      `${baseUrl}/api/v1/admin/schedules/${createdSched.id}/open`,
      {
        method: 'POST',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(openRes.status, 200);
    const openSched = (await openRes.json()) as TripSchedule;
    assert.equal(openSched.status, 'OPEN');

    // 6. Simulate bookings: insert confirmed booking with 10 participants
    const packageId = randomUUID();
    await db.query(
      `INSERT INTO schedule_packages(id, schedule_id, name, price)
       VALUES ($1, $2, 'Paket Standar', 2500000)`,
      [packageId, createdSched.id],
    );

    const customerId = randomUUID();
    await db.query(
      `INSERT INTO customers(id, full_name, whatsapp_number, email)
       VALUES ($1, 'John Trekker', '08123456789', 'john@test.com')`,
      [customerId],
    );

    const bookingId = randomUUID();
    await db.query(
      `INSERT INTO bookings(id, booking_number, customer_id, schedule_id, package_id, status, source, participant_count, contact_name, contact_whatsapp, created_by)
       VALUES ($1, 'BKG-SCHED-01', $2, $3, $4, 'CONFIRMED', 'ADMIN', 10, 'John Trekker', '08123456789', $5)`,
      [bookingId, customerId, createdSched.id, packageId, adminId],
    );

    // 7. Get schedule and check computed availability (capacity: 12, confirmed: 10 -> available: 2 -> ALMOST_FULL)
    const getAfterBooking = await fetch(
      `${baseUrl}/api/v1/admin/schedules/${createdSched.id}`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(getAfterBooking.status, 200);
    const schedWithBooking = (await getAfterBooking.json()) as TripSchedule;
    assert.equal(schedWithBooking.confirmedSeats, 10);
    assert.equal(schedWithBooking.availableSeats, 2);
    assert.equal(schedWithBooking.availabilityStatus, 'ALMOST_FULL');

    // 8. Attempting to reduce capacity below 10 should return 409 CAPACITY_BELOW_CONFIRMED
    const conflictRes = await fetch(
      `${baseUrl}/api/v1/admin/schedules/${createdSched.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify({
          capacity: 8,
        }),
      },
    );
    assert.equal(conflictRes.status, 409);
    const conflictJson = (await conflictRes.json()) as {
      error?: { code: string };
    };
    assert.equal(conflictJson.error?.code, 'CAPACITY_BELOW_CONFIRMED');

    // 9. Close schedule
    const closeRes = await fetch(
      `${baseUrl}/api/v1/admin/schedules/${createdSched.id}/close`,
      {
        method: 'POST',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(closeRes.status, 200);
    const closedSched = (await closeRes.json()) as TripSchedule;
    assert.equal(closedSched.status, 'CLOSED');

    // 10. Complete schedule
    const completeRes = await fetch(
      `${baseUrl}/api/v1/admin/schedules/${createdSched.id}/complete`,
      {
        method: 'POST',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(completeRes.status, 200);
    const completedSched = (await completeRes.json()) as TripSchedule;
    assert.equal(completedSched.status, 'COMPLETED');

    // 11. Cancel schedule with reason
    const cancelRes = await fetch(
      `${baseUrl}/api/v1/admin/schedules/${createdSched.id}/cancel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify({ reason: 'Kondisi cuaca ekstrem badai tropis' }),
      },
    );
    assert.equal(cancelRes.status, 200);
    const cancelledSched = (await cancelRes.json()) as TripSchedule;
    assert.equal(cancelledSched.status, 'CANCELLED');
    assert.ok(
      cancelledSched.notes?.includes('Kondisi cuaca ekstrem badai tropis'),
    );

    // 12. Attempting to delete schedule with booking should return 409 SCHEDULE_HAS_BOOKINGS
    const deleteBlocked = await fetch(
      `${baseUrl}/api/v1/admin/schedules/${createdSched.id}`,
      {
        method: 'DELETE',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(deleteBlocked.status, 409);
    const deleteBlockedJson = (await deleteBlocked.json()) as {
      error?: { code: string };
    };
    assert.equal(deleteBlockedJson.error?.code, 'SCHEDULE_HAS_BOOKINGS');

    // 13. Create a clean schedule without bookings, then delete it
    const cleanSchedRes = await fetch(`${baseUrl}/api/v1/admin/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        tripId,
        startDate: '2026-11-01',
        endDate: '2026-11-03',
        capacity: 10,
      }),
    });
    assert.equal(cleanSchedRes.status, 201);
    const cleanSched = (await cleanSchedRes.json()) as TripSchedule;

    const deleteSuccess = await fetch(
      `${baseUrl}/api/v1/admin/schedules/${cleanSched.id}`,
      {
        method: 'DELETE',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(deleteSuccess.status, 200);
    const deleteSuccessJson = (await deleteSuccess.json()) as {
      success: boolean;
    };
    assert.equal(deleteSuccessJson.success, true);

    // 14. Verify audit trail in database
    const auditQuery = await db.query(
      'SELECT action, entity_type FROM audit_logs WHERE entity_id = $1 ORDER BY created_at ASC',
      [createdSched.id],
    );
    const actions = auditQuery.rows.map((r: { action: string }) => r.action);
    assert.ok(actions.includes('SCHEDULE_CREATE'));
    assert.ok(actions.includes('SCHEDULE_UPDATE'));
    assert.ok(actions.includes('SCHEDULE_STATUS_CHANGE'));
    assert.ok(actions.includes('SCHEDULE_CANCEL'));
  } finally {
    await app.close();
  }
});
