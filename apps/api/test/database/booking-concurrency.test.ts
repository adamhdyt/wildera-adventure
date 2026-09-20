import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { Client } from 'pg';

const root = resolve(__dirname, '../../../..');
const name = `wildera_bk_conc_${randomUUID().replaceAll('-', '')}`;
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
    'booking-concurrency-test-session-secret-32-chars';
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

test('STEP 25: Concurrency test for transactional booking confirmation (1 slot remaining, 2 simultaneous requests)', async () => {
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

  const destinationId = randomUUID();
  await db.query(
    "INSERT INTO destinations(id,name,slug,province,region,status) VALUES ($1,'Lombok Conc','lombok-conc','NTB','Kepulauan Nusa Tenggara','ACTIVE')",
    [destinationId],
  );

  const mountainId = randomUUID();
  await db.query(
    "INSERT INTO mountains(id,destination_id,name,slug,altitude_m,default_difficulty,status) VALUES ($1,$2,'Gunung Rinjani Conc','gunung-rinjani-conc',3726,'HARD','PUBLISHED')",
    [mountainId, destinationId],
  );

  const routeId = randomUUID();
  await db.query(
    "INSERT INTO routes(id,mountain_id,name,slug,distance_km,difficulty,status) VALUES ($1,$2,'Jalur Sembalun Conc','jalur-sembalun-conc',8.5,'HARD','PUBLISHED')",
    [routeId, mountainId],
  );

  const tripId = randomUUID();
  await db.query(
    `INSERT INTO trips(id, mountain_id, route_id, name, slug, trip_type, duration_days, duration_nights, difficulty, status, created_by)
     VALUES ($1, $2, $3, 'Rinjani Conc Expedition', 'rinjani-conc-expedition', 'OPEN_TRIP', 3, 2, 'MODERATE', 'PUBLISHED', $4)`,
    [tripId, mountainId, routeId, adminId],
  );

  // Schedule with capacity = 20
  const scheduleId = randomUUID();
  await db.query(
    `INSERT INTO trip_schedules(id, trip_id, start_date, end_date, capacity, status, created_by)
     VALUES ($1, $2, '2026-11-10', '2026-11-13', 20, 'OPEN', $3)`,
    [scheduleId, tripId, adminId],
  );

  const packageId = randomUUID();
  await db.query(
    `INSERT INTO schedule_packages(id, schedule_id, name, price, status, sort_order)
     VALUES ($1, $2, 'Paket Standard', 2500000, 'ACTIVE', 0)`,
    [packageId, scheduleId],
  );

  // Existing confirmed booking with 19 participants (1 remaining slot)
  const existingCustId = randomUUID();
  await db.query(
    `INSERT INTO customers(id, full_name, whatsapp_number, email)
     VALUES ($1, 'Group Leader', '6281111111111', 'group@wildera.test')`,
    [existingCustId],
  );

  const existingBookingId = randomUUID();
  await db.query(
    `INSERT INTO bookings(id, booking_number, customer_id, schedule_id, package_id, status, source, participant_count, total_amount, contact_name, contact_whatsapp, created_by)
     VALUES ($1, 'BK-20261110-0001', $2, $3, $4, 'CONFIRMED', 'ADMIN', 19, 47500000, 'Group Leader', '6281111111111', $5)`,
    [existingBookingId, existingCustId, scheduleId, packageId, adminId],
  );

  // Candidate Booking A (1 participant, INQUIRY)
  const custAId = randomUUID();
  await db.query(
    `INSERT INTO customers(id, full_name, whatsapp_number)
     VALUES ($1, 'Candidate A', '6282222222222')`,
    [custAId],
  );
  const bookingAId = randomUUID();
  await db.query(
    `INSERT INTO bookings(id, booking_number, customer_id, schedule_id, package_id, status, source, participant_count, total_amount, contact_name, contact_whatsapp, created_by)
     VALUES ($1, 'BK-20261110-0002', $2, $3, $4, 'INQUIRY', 'WHATSAPP', 1, 2500000, 'Candidate A', '6282222222222', $5)`,
    [bookingAId, custAId, scheduleId, packageId, adminId],
  );

  // Candidate Booking B (1 participant, INQUIRY)
  const custBId = randomUUID();
  await db.query(
    `INSERT INTO customers(id, full_name, whatsapp_number)
     VALUES ($1, 'Candidate B', '6283333333333')`,
    [custBId],
  );
  const bookingBId = randomUUID();
  await db.query(
    `INSERT INTO bookings(id, booking_number, customer_id, schedule_id, package_id, status, source, participant_count, total_amount, contact_name, contact_whatsapp, created_by)
     VALUES ($1, 'BK-20261110-0003', $2, $3, $4, 'INQUIRY', 'WHATSAPP', 1, 2500000, 'Candidate B', '6283333333333', $5)`,
    [bookingBId, custBId, scheduleId, packageId, adminId],
  );

  const { createApp } = await import('../../src/app');
  const app = await createApp();
  await app.listen(0, '127.0.0.1');
  const baseUrl = await app.getUrl();

  try {
    // 1. Login
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@wildera.test',
        password,
      }),
    });
    assert.equal(loginRes.status, 200);
    const cookie = loginRes.headers.get('set-cookie')!;

    // 2. Fire two simultaneous confirm requests
    const [resA, resB] = await Promise.all([
      fetch(`${baseUrl}/api/v1/admin/bookings/${bookingAId}/confirm`, {
        method: 'POST',
        headers: { Cookie: cookie },
      }),
      fetch(`${baseUrl}/api/v1/admin/bookings/${bookingBId}/confirm`, {
        method: 'POST',
        headers: { Cookie: cookie },
      }),
    ]);

    const statuses = [resA.status, resB.status].sort();

    // Exactly 1 must succeed (200) and exactly 1 must fail (409 Conflict)
    assert.deepEqual(
      statuses,
      [200, 409],
      `Expected [200, 409] but received [${resA.status}, ${resB.status}]`,
    );

    const successRes = resA.status === 200 ? resA : resB;
    const failRes = resA.status === 409 ? resA : resB;

    const successJson = (await successRes.json()) as {
      status?: string;
    };
    const failJson = (await failRes.json()) as {
      error?: { code?: string; message?: string };
      code?: string;
      message?: string;
    };

    assert.equal(successJson.status, 'CONFIRMED');
    assert.equal(failJson.error?.code, 'INSUFFICIENT_CAPACITY');

    // 3. Verify Database state: total confirmed seats is exactly 20
    const confirmedQuery = await db.query(
      `SELECT COALESCE(SUM(participant_count), 0)::int as total_confirmed
       FROM bookings
       WHERE schedule_id = $1 AND status = 'CONFIRMED'`,
      [scheduleId],
    );

    assert.equal(confirmedQuery.rows[0].total_confirmed, 20);

    // 4. Verify Schedule availability
    const schedRes = await fetch(
      `${baseUrl}/api/v1/admin/schedules/${scheduleId}`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(schedRes.status, 200);
    const schedJson = (await schedRes.json()) as {
      availableSeats: number;
      availabilityStatus: string;
    };
    assert.equal(schedJson.availableSeats, 0);
    assert.equal(schedJson.availabilityStatus, 'SOLD_OUT');
  } finally {
    await app.close();
  }
});
