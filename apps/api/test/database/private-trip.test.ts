import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { Client } from 'pg';
import type {
  PrivateTripInquiry,
  PrivateTripInquiryListResponse,
} from '@wildera/types';

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
  process.env.SESSION_SECRET = 'private-trip-test-session-secret-32-chars';
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

test('STEP 30: Private Trip public inquiry and Admin CRM lifecycle', async () => {
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

    // 3. Seed destination and mountain
    const destinationId = randomUUID();
    await db.query(
      "INSERT INTO destinations(id,name,slug,province,region,status) VALUES ($1,'Jawa Timur','jawa-timur','Jawa Timur','Jawa','ACTIVE')",
      [destinationId],
    );

    const mountainId = randomUUID();
    await db.query(
      "INSERT INTO mountains(id,destination_id,name,slug,altitude_m,default_difficulty,status) VALUES ($1,$2,'Gunung Semeru','gunung-semeru',3676,'HARD','PUBLISHED')",
      [mountainId, destinationId],
    );

    // 4. Test Public Submission 1 (with Mountain ID)
    const publicInquiryRes1 = await fetch(
      `${baseUrl}/api/v1/private-trip-inquiries`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mountainId,
          customerName: 'Aditya Pratama',
          whatsappNumber: '081234567890',
          email: 'aditya@example.com',
          preferredDate: '2026-11-20',
          alternativeDate: '2026-11-25',
          participantCount: 6,
          meetingPointRequest: 'Bandara Juanda Surabaya',
          budget: 18000000,
          requirements: 'Tenda private 2 orang per tenda & porter logistik.',
        }),
      },
    );

    assert.equal(publicInquiryRes1.status, 201);
    const inq1Body = (await publicInquiryRes1.json()) as {
      inquiry: PrivateTripInquiry;
      whatsappUrl: string;
    };
    assert.ok(inq1Body.inquiry);
    assert.equal(inq1Body.inquiry.customerName, 'Aditya Pratama');
    assert.equal(inq1Body.inquiry.status, 'NEW');
    assert.equal(inq1Body.inquiry.mountainId, mountainId);
    assert.equal(inq1Body.inquiry.mountain?.name, 'Gunung Semeru');
    assert.ok(inq1Body.inquiry.inquiryNumber.startsWith('PT-'));
    assert.ok(inq1Body.whatsappUrl.includes('wa.me'));
    const inq1Id = inq1Body.inquiry.id;

    // 5. Test Public Submission 2 (Custom destination name)
    const publicInquiryRes2 = await fetch(
      `${baseUrl}/api/v1/private-trip-inquiries`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: 'Gunung Argopuro 5D4N via Baderan',
          customerName: 'Siti Rahma',
          whatsappNumber: '082233445566',
          preferredDate: '2026-12-05',
          participantCount: 4,
          meetingPointRequest: 'Stasiun Pasar Senen',
        }),
      },
    );

    assert.equal(publicInquiryRes2.status, 201);
    const inq2Body = (await publicInquiryRes2.json()) as {
      inquiry: PrivateTripInquiry;
      whatsappUrl: string;
    };
    assert.ok(inq2Body.inquiry);
    assert.equal(
      inq2Body.inquiry.destinationOther,
      'Gunung Argopuro 5D4N via Baderan',
    );
    assert.equal(inq2Body.inquiry.status, 'NEW');
    const inq2Id = inq2Body.inquiry.id;

    // 6. Test Admin CRM listing without auth (401)
    const unauthorizedRes = await fetch(
      `${baseUrl}/api/v1/admin/private-trip-inquiries`,
    );
    assert.equal(unauthorizedRes.status, 401);

    // 7. Test Admin CRM listing with auth
    const listRes = await fetch(
      `${baseUrl}/api/v1/admin/private-trip-inquiries`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(listRes.status, 200);
    const listData = (await listRes.json()) as PrivateTripInquiryListResponse;
    assert.equal(listData.total, 2);
    assert.equal(listData.data.length, 2);

    // 8. Test Admin CRM filter by search
    const searchRes = await fetch(
      `${baseUrl}/api/v1/admin/private-trip-inquiries?search=Aditya`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(searchRes.status, 200);
    const searchData =
      (await searchRes.json()) as PrivateTripInquiryListResponse;
    assert.equal(searchData.total, 1);
    assert.equal(searchData.data[0]?.customerName, 'Aditya Pratama');

    // 9. Test Admin CRM Pipeline Transition
    // Step a: Transition NEW -> CONTACTED
    const patch1 = await fetch(
      `${baseUrl}/api/v1/admin/private-trip-inquiries/${inq1Id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          status: 'CONTACTED',
          adminNotes:
            'Sudah chat WA dengan Mas Aditya, proposal sedang disusun.',
        }),
      },
    );
    assert.equal(patch1.status, 200);
    const patch1Body = (await patch1.json()) as PrivateTripInquiry;
    assert.equal(patch1Body.status, 'CONTACTED');
    assert.equal(
      patch1Body.adminNotes,
      'Sudah chat WA dengan Mas Aditya, proposal sedang disusun.',
    );

    // Step b: Transition CONTACTED -> QUOTATION_SENT
    const patch2 = await fetch(
      `${baseUrl}/api/v1/admin/private-trip-inquiries/${inq1Id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          status: 'QUOTATION_SENT',
          adminNotes:
            'Proposal penawaran PDF Rp 17.500.000 sudah dikirim via WA.',
        }),
      },
    );
    assert.equal(patch2.status, 200);
    const patch2Body = (await patch2.json()) as PrivateTripInquiry;
    assert.equal(patch2Body.status, 'QUOTATION_SENT');

    // Step c: Transition QUOTATION_SENT -> NEGOTIATION
    const patch3 = await fetch(
      `${baseUrl}/api/v1/admin/private-trip-inquiries/${inq1Id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          status: 'NEGOTIATION',
          adminNotes: 'Customer minta bonus dokumentasi drone.',
        }),
      },
    );
    assert.equal(patch3.status, 200);
    const patch3Body = (await patch3.json()) as PrivateTripInquiry;
    assert.equal(patch3Body.status, 'NEGOTIATION');

    // Step d: Transition NEGOTIATION -> BOOKED
    const patch4 = await fetch(
      `${baseUrl}/api/v1/admin/private-trip-inquiries/${inq1Id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          status: 'BOOKED',
          adminNotes: 'Deal! DP 50% sudah diterima di rekening BCA Wildera.',
        }),
      },
    );
    assert.equal(patch4.status, 200);
    const patch4Body = (await patch4.json()) as PrivateTripInquiry;
    assert.equal(patch4Body.status, 'BOOKED');

    // 10. Verify Audit Log recorded
    const auditRes = await db.query(
      "SELECT * FROM audit_logs WHERE entity_type = 'PRIVATE_TRIP_INQUIRY' AND entity_id = $1 ORDER BY created_at DESC",
      [inq1Id],
    );
    assert(auditRes.rows.length >= 4);

    // 11. Test Delete Inquiry (inq2)
    const delRes = await fetch(
      `${baseUrl}/api/v1/admin/private-trip-inquiries/${inq2Id}`,
      {
        method: 'DELETE',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(delRes.status, 204);

    // Verify deleted
    const verifyDel = await fetch(
      `${baseUrl}/api/v1/admin/private-trip-inquiries/${inq2Id}`,
      {
        headers: { Cookie: cookie },
      },
    );
    assert.equal(verifyDel.status, 404);
  } finally {
    await app.close();
  }
});
