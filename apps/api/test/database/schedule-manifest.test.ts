import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { Client } from 'pg';
import type { ScheduleManifestSummary } from '@wildera/types';

const root = resolve(__dirname, '../../../..');
const name = `wildera_sm_test_${randomUUID().replaceAll('-', '')}`;
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
  process.env.SESSION_SECRET = 'manifest-test-session-secret-32-chars';
});

after(async () => {
  await db.end();
  try {
    if (created) await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
  } finally {
    await admin.end();
    if (previousEnvironment.databaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousEnvironment.databaseUrl;
    }
    if (previousEnvironment.nodeEnvironment === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousEnvironment.nodeEnvironment;
    }
    if (previousEnvironment.sessionSecret === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = previousEnvironment.sessionSecret;
    }
  }
});

test('STEP 29: Schedule Manifest end-to-end API lifecycle and expected vs completed counts', async () => {
  const { createApp } = await import('../../src/app');
  const app = await createApp();
  await app.init();
  const server = app.getHttpServer();
  await new Promise<void>((resolveServer) => server.listen(0, resolveServer));
  const address = server.address();
  assert(address && typeof address === 'object');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. Seed user, role, permission
    const superAdminRoleId = randomUUID();
    await db.query(
      "INSERT INTO roles(id,name,slug,description) VALUES ($1,'Super Admin','SUPER_ADMIN','Full system access')",
      [superAdminRoleId],
    );

    const adminId = randomUUID();
    const password = 'ChangeMe123!';
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await db.query(
      "INSERT INTO admin_users(id,name,email,password_hash,status) VALUES ($1,'Super Admin','superadmin@wildera.test',$2,'ACTIVE')",
      [adminId, passwordHash],
    );
    await db.query(
      'INSERT INTO admin_user_roles(admin_user_id,role_id) VALUES ($1,$2)',
      [adminId, superAdminRoleId],
    );

    // 2. Login to get session cookie
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@wildera.test',
        password: 'ChangeMe123!',
      }),
    });
    assert.equal(loginRes.status, 200);
    const cookie = loginRes.headers.get('set-cookie');
    assert(cookie);

    // 3. Seed destination, mountain, trip, schedule, package
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

    const scheduleId = randomUUID();
    await db.query(
      `INSERT INTO trip_schedules(id, trip_id, start_date, end_date, capacity, status, created_by)
       VALUES ($1, $2, '2026-10-10', '2026-10-13', 15, 'OPEN', $3)`,
      [scheduleId, tripId, adminId],
    );

    const packageId = randomUUID();
    await db.query(
      "INSERT INTO schedule_packages(id,schedule_id,name,price,status,sort_order) VALUES ($1,$2,'Paket VIP',1500000,'ACTIVE',1)",
      [packageId, scheduleId],
    );

    // 4. Create Booking 1 (participantCount = 3, CONFIRMED)
    const booking1Id = randomUUID();
    await db.query(
      `INSERT INTO bookings(id,booking_number,schedule_id,package_id,contact_name,contact_email,contact_whatsapp,participant_count,total_amount,status,source,created_by)
       VALUES ($1,'BK-MAN-001',$2,$3,'Budi Santoso','budi@test.com','+6281111111',3,4500000,'CONFIRMED','ADMIN',$4)`,
      [booking1Id, scheduleId, packageId, adminId],
    );

    // Add 2 participants to Booking 1 (Expected: 3, Completed: 2)
    const p1Id = randomUUID();
    await db.query(
      `INSERT INTO booking_participants(id,booking_id,full_name,gender,phone,identity_type,identity_number)
       VALUES ($1,$2,'Budi Santoso','MALE','+6281111111','KTP','3171010101010001')`,
      [p1Id, booking1Id],
    );
    const p2Id = randomUUID();
    await db.query(
      `INSERT INTO booking_participants(id,booking_id,full_name,gender,phone,identity_type,identity_number)
       VALUES ($1,$2,'Siti Rahma','FEMALE','+6281111112','KTP','3171010101010002')`,
      [p2Id, booking1Id],
    );

    // 5. Create Booking 2 (participantCount = 2, CONFIRMED)
    const booking2Id = randomUUID();
    await db.query(
      `INSERT INTO bookings(id,booking_number,schedule_id,package_id,contact_name,contact_email,contact_whatsapp,participant_count,total_amount,status,source,created_by)
       VALUES ($1,'BK-MAN-002',$2,$3,'Joko Anwar','joko@test.com','+6282222222',2,3000000,'CONFIRMED','WEBSITE_WHATSAPP',$4)`,
      [booking2Id, scheduleId, packageId, adminId],
    );

    // Add 2 participants to Booking 2 (Expected: 2, Completed: 2)
    const p3Id = randomUUID();
    await db.query(
      `INSERT INTO booking_participants(id,booking_id,full_name,gender,phone,identity_type,identity_number)
       VALUES ($1,$2,'Joko Anwar','MALE','+6282222222','KTP','3271010101010001')`,
      [p3Id, booking2Id],
    );
    const p4Id = randomUUID();
    await db.query(
      `INSERT INTO booking_participants(id,booking_id,full_name,gender,phone,identity_type,identity_number)
       VALUES ($1,$2,'Maya Sari','FEMALE','+6282222223','KTP','3271010101010002')`,
      [p4Id, booking2Id],
    );

    // 6. Fetch Schedule Manifest
    const manifestRes = await fetch(
      `${baseUrl}/api/v1/admin/schedules/${scheduleId}/manifest`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(manifestRes.status, 200);
    const manifest = (await manifestRes.json()) as ScheduleManifestSummary;

    // Verify Schedule and Trip info
    assert.equal(manifest.trip.id, tripId);
    assert.equal(manifest.trip.name, 'Rinjani Sched Expedition');
    assert.equal(manifest.schedule.id, scheduleId);
    assert.equal(manifest.schedule.capacity, 15);

    // Verify Counts:
    // Confirmed Bookings: 2
    // Expected Participants: 3 + 2 = 5
    // Completed Participants: 2 + 2 = 4
    assert.equal(manifest.confirmedBookingsCount, 2);
    assert.equal(manifest.expectedParticipants, 5);
    assert.equal(manifest.completedParticipantsCount, 4);

    // Verify Booking Breakdown
    assert.equal(manifest.bookings.length, 2);
    const b1 = manifest.bookings.find((b) => b.id === booking1Id);
    assert.ok(b1);
    assert.equal(b1.participantCount, 3);
    assert.equal(b1.completedCount, 2);
    assert.equal(b1.participants.length, 2);

    const b2 = manifest.bookings.find((b) => b.id === booking2Id);
    assert.ok(b2);
    assert.equal(b2.participantCount, 2);
    assert.equal(b2.completedCount, 2);
    assert.equal(b2.participants.length, 2);

    // Verify Flat Participant List (Manifest)
    assert.equal(manifest.participantList.length, 4);
    assert.equal(manifest.participantList[0]?.fullName, 'Budi Santoso');
    assert.equal(manifest.participantList[0]?.bookingCode, 'BK-MAN-001');
    assert.equal(manifest.participantList[2]?.fullName, 'Joko Anwar');
    assert.equal(manifest.participantList[2]?.bookingCode, 'BK-MAN-002');
  } finally {
    await app.close();
  }
});
