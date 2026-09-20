import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { Client } from 'pg';
import type { AdminBookingItem, BookingListResponse } from '@wildera/types';

const root = resolve(__dirname, '../../../..');
const name = `wildera_bk_test_${randomUUID().replaceAll('-', '')}`;
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
  process.env.SESSION_SECRET = 'booking-test-session-secret-at-least-32-chars';
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

test('Booking CRUD end-to-end API lifecycle, customer upsert, and audit trail', async () => {
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
    `INSERT INTO schedule_packages(id, schedule_id, name, price, status, sort_order)
     VALUES ($1, $2, 'Paket All-in Jakarta', 2750000, 'ACTIVE', 0)`,
    [packageId, scheduleId],
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

    // 2. Create booking (INQUIRY) with participants
    const createRes = await fetch(`${baseUrl}/api/v1/admin/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        scheduleId,
        packageId,
        contactName: 'Ahmad Fauzi',
        contactWhatsapp: '081298765432',
        contactEmail: 'ahmad.fauzi@example.com',
        source: 'WEBSITE_WHATSAPP',
        participantCount: 2,
        notes: 'Request tenda dekat air',
        participants: [
          {
            fullName: 'Ahmad Fauzi',
            gender: 'MALE',
            identityType: 'KTP',
            identityNumber: '3201112233440001',
          },
          {
            fullName: 'Nurul Hidayah',
            gender: 'FEMALE',
          },
        ],
      }),
    });

    assert.equal(createRes.status, 201);
    const createdBooking = (await createRes.json()) as AdminBookingItem;
    assert.ok(createdBooking.id);
    assert.ok(createdBooking.bookingNumber.startsWith('BK-'));
    assert.equal(createdBooking.status, 'INQUIRY');
    assert.equal(createdBooking.source, 'WEBSITE_WHATSAPP');
    assert.equal(createdBooking.contactName, 'Ahmad Fauzi');
    assert.equal(createdBooking.contactWhatsapp, '6281298765432');
    assert.equal(createdBooking.participantCount, 2);
    assert.equal(Number(createdBooking.totalAmount), 5500000); // 2 * 2,750,000
    assert.equal(createdBooking.participants?.length, 2);
    assert.ok(createdBooking.customer?.id);
    assert.equal(createdBooking.customer?.fullName, 'Ahmad Fauzi');

    const bookingId = createdBooking.id;

    // Verify customer in DB
    const customerDb = await db.query(
      `SELECT * FROM customers WHERE whatsapp_number = '6281298765432'`,
    );
    assert.equal(customerDb.rows.length, 1);
    assert.equal(customerDb.rows[0]?.full_name, 'Ahmad Fauzi');

    // 3. List Bookings
    const listRes = await fetch(
      `${baseUrl}/api/v1/admin/bookings?search=Ahmad`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(listRes.status, 200);
    const listData = (await listRes.json()) as BookingListResponse;
    assert.equal(listData.total, 1);
    assert.equal(listData.items[0]?.id, bookingId);

    // 4. Get Booking by ID
    const getRes = await fetch(
      `${baseUrl}/api/v1/admin/bookings/${bookingId}`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(getRes.status, 200);
    const getDetail = (await getRes.json()) as AdminBookingItem;
    assert.equal(getDetail.id, bookingId);
    assert.equal(getDetail.schedule?.trip?.name, 'Rinjani Sched Expedition');
    assert.equal(getDetail.package?.name, 'Paket All-in Jakarta');

    // 5. Update Booking (change status to PENDING_CONFIRMATION and add notes)
    const patchRes = await fetch(
      `${baseUrl}/api/v1/admin/bookings/${bookingId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify({
          status: 'PENDING_CONFIRMATION',
          notes: 'DP 50% sudah ditransfer via BCA',
        }),
      },
    );
    assert.equal(patchRes.status, 200);
    const patched = (await patchRes.json()) as AdminBookingItem;
    assert.equal(patched.status, 'PENDING_CONFIRMATION');
    assert.equal(patched.notes, 'DP 50% sudah ditransfer via BCA');

    // 6. Cancel Booking
    const cancelRes = await fetch(
      `${baseUrl}/api/v1/admin/bookings/${bookingId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify({
          cancellationReason: 'Peserta ada keperluan mendadak',
        }),
      },
    );
    assert.equal(cancelRes.status, 200);
    const cancelled = (await cancelRes.json()) as AdminBookingItem;
    assert.equal(cancelled.status, 'CANCELLED');
    assert.equal(
      cancelled.cancellationReason,
      'Peserta ada keperluan mendadak',
    );
    assert.ok(cancelled.cancelledAt);

    // 7. Delete Booking
    const deleteRes = await fetch(
      `${baseUrl}/api/v1/admin/bookings/${bookingId}`,
      {
        method: 'DELETE',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(deleteRes.status, 200);

    const getDeleted = await fetch(
      `${baseUrl}/api/v1/admin/bookings/${bookingId}`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(getDeleted.status, 404);

    // 8. Verify Audit Log entries
    const auditLogs = await db.query(
      `SELECT action, entity_type FROM audit_logs WHERE entity_id = $1 ORDER BY created_at ASC`,
      [bookingId],
    );
    const actions = auditLogs.rows.map((r: { action: string }) => r.action);
    assert.ok(actions.includes('BOOKING_CREATE'));
    assert.ok(actions.includes('BOOKING_UPDATE'));
    assert.ok(actions.includes('BOOKING_CANCEL'));
    assert.ok(actions.includes('BOOKING_DELETE'));
  } finally {
    await app.close();
  }
});
