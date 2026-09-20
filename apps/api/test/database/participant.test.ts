import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { Client } from 'pg';
import type { BookingParticipantItem } from '@wildera/types';

const root = resolve(__dirname, '../../../..');
const name = `wildera_pt_test_${randomUUID().replaceAll('-', '')}`;
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
  process.env.SESSION_SECRET = 'participant-test-session-secret-32-chars';
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

test('Booking participant management lifecycle & audit logs', async () => {
  const { createApp } = await import('../../src/app');
  const app = await createApp();
  await app.listen(0);
  const server = app.getHttpServer();
  const address = server.address();
  assert.ok(address && typeof address === 'object');
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

    // 2. Login to obtain session cookie
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
    assert.ok(cookie);

    // 3. Seed mountain, destination, trip, schedule, package, booking
    const destinationId = randomUUID();
    await db.query(
      "INSERT INTO destinations(id,name,slug,province,region,status) VALUES ($1,'Lombok PT','lombok-pt','NTB','Kepulauan Nusa Tenggara','ACTIVE')",
      [destinationId],
    );

    const mountainId = randomUUID();
    await db.query(
      "INSERT INTO mountains(id,destination_id,name,slug,altitude_m,default_difficulty,status) VALUES ($1,$2,'Gunung Rinjani PT','gunung-rinjani-pt',3726,'HARD','PUBLISHED')",
      [mountainId, destinationId],
    );

    const routeId = randomUUID();
    await db.query(
      "INSERT INTO routes(id,mountain_id,name,slug,distance_km,difficulty,status) VALUES ($1,$2,'Jalur Sembalun PT','jalur-sembalun-pt',8.5,'HARD','PUBLISHED')",
      [routeId, mountainId],
    );

    const tripId = randomUUID();
    await db.query(
      `INSERT INTO trips(id, mountain_id, route_id, name, slug, trip_type, duration_days, duration_nights, difficulty, status, created_by)
       VALUES ($1, $2, $3, 'Rinjani PT Expedition', 'rinjani-pt-expedition', 'OPEN_TRIP', 3, 2, 'MODERATE', 'PUBLISHED', $4)`,
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
       VALUES ($1, $2, 'Paket PT', 2750000, 'ACTIVE', 0)`,
      [packageId, scheduleId],
    );

    const bookingId = randomUUID();
    await db.query(
      `INSERT INTO bookings (id, booking_number, schedule_id, package_id, contact_name, contact_whatsapp, contact_email, participant_count, total_amount, status, source, created_by)
       VALUES ($1, 'BK-20261001-0001', $2, $3, 'Budi Santoso', '081234567890', 'budi@test.com', 2, 5500000, 'PENDING_CONFIRMATION', 'ADMIN', $4)`,
      [bookingId, scheduleId, packageId, adminId],
    );

    // 4. Create participant via API
    const createRes = await fetch(
      `${baseUrl}/api/v1/admin/bookings/${bookingId}/participants`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify({
          fullName: 'Ahmad Dahlan',
          gender: 'MALE',
          dateOfBirth: '1995-08-17',
          phone: '081234567890',
          identityType: 'KTP',
          identityNumber: '3171012345678901',
          emergencyContactName: 'Siti Walidah',
          emergencyContactPhone: '081298765432',
          notes: 'Vegetarian',
        }),
      },
    );
    assert.equal(createRes.status, 201);
    const createdParticipant =
      (await createRes.json()) as BookingParticipantItem;
    assert.equal(createdParticipant.fullName, 'Ahmad Dahlan');
    assert.equal(createdParticipant.gender, 'MALE');
    assert.equal(createdParticipant.notes, 'Vegetarian');

    // 5. List participants
    const listRes = await fetch(
      `${baseUrl}/api/v1/admin/bookings/${bookingId}/participants`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(listRes.status, 200);
    const listJson = (await listRes.json()) as BookingParticipantItem[];
    assert.equal(listJson.length, 1);
    assert.ok(listJson[0]);
    assert.equal(listJson[0].id, createdParticipant.id);

    // 6. Update participant
    const updateRes = await fetch(
      `${baseUrl}/api/v1/admin/bookings/${bookingId}/participants/${createdParticipant.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify({
          fullName: 'KH Ahmad Dahlan',
          notes: 'Vegetarian & gluten free',
        }),
      },
    );
    assert.equal(updateRes.status, 200);
    const updatedParticipant =
      (await updateRes.json()) as BookingParticipantItem;
    assert.equal(updatedParticipant.fullName, 'KH Ahmad Dahlan');
    assert.equal(updatedParticipant.notes, 'Vegetarian & gluten free');

    // 7. Delete participant
    const deleteRes = await fetch(
      `${baseUrl}/api/v1/admin/bookings/${bookingId}/participants/${createdParticipant.id}`,
      {
        method: 'DELETE',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(deleteRes.status, 200);
    const deleteJson = (await deleteRes.json()) as { success: boolean };
    assert.equal(deleteJson.success, true);

    // 8. Verify list is now empty
    const emptyListRes = await fetch(
      `${baseUrl}/api/v1/admin/bookings/${bookingId}/participants`,
      {
        headers: { Cookie: cookie },
      },
    );
    const emptyList = (await emptyListRes.json()) as BookingParticipantItem[];
    assert.equal(emptyList.length, 0);

    // 9. Verify Audit Logs recorded all actions
    const auditRes = await db.query(
      `SELECT action, entity_type FROM audit_logs WHERE entity_type = 'BOOKING_PARTICIPANT' ORDER BY created_at ASC`,
    );
    assert.equal(auditRes.rows.length, 3);
    assert.equal(auditRes.rows[0].action, 'PARTICIPANT_ADD');
    assert.equal(auditRes.rows[1].action, 'PARTICIPANT_UPDATE');
    assert.equal(auditRes.rows[2].action, 'PARTICIPANT_DELETE');
  } finally {
    await app.close();
  }
});
