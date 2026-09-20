import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { Client } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { Authorize } from '../../src/common/authorization/authorize.decorator';
import { Permission } from '../../src/common/authorization/permission';
import { AuthorizationModule } from '../../src/common/authorization/authorization.module';
import { AuthModule } from '../../src/modules/auth/auth.module';

@Controller('__rbac_test')
class RbacTestController {
  @Get('booking-confirm')
  @Authorize(Permission.BOOKING_CONFIRM)
  bookingConfirm() {
    return { success: true };
  }

  @Get('booking-cancel')
  @Authorize(Permission.BOOKING_CANCEL)
  bookingCancel() {
    return { success: true };
  }

  @Get('participant-sensitive')
  @Authorize(Permission.PARTICIPANT_SENSITIVE_VIEW)
  participantSensitive() {
    return { success: true };
  }

  @Get('content-manage')
  @Authorize(Permission.CONTENT_MANAGE)
  contentManage() {
    return { success: true };
  }

  @Get('schedule-view')
  @Authorize(Permission.SCHEDULE_VIEW)
  scheduleView() {
    return { success: true };
  }
}

const root = resolve(__dirname, '../../../..');
const name = `wildera_schema_test_${randomUUID().replaceAll('-', '')}`;
const source = process.env.DATABASE_URL;
if (!source)
  throw new Error(
    'DATABASE_URL is required; run npm run db:local:start first.',
  );
const url = new URL(source);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
  throw new Error(
    'Schema tests require a local PostgreSQL server with CREATEDB privileges.',
  );
}
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
  process.env.SESSION_SECRET = 'schema-test-session-secret-at-least-32-chars';
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

test('migration creates exactly 25 P0 tables and 15 enums with valid foreign keys', async () => {
  const expected = [
    'destinations',
    'mountains',
    'routes',
    'trips',
    'trip_itineraries',
    'trip_facilities',
    'trip_gears',
    'trip_faqs',
    'trip_schedules',
    'meeting_points',
    'schedule_packages',
    'customers',
    'bookings',
    'booking_participants',
    'private_trip_inquiries',
    'media_assets',
    'trip_media',
    'mountain_media',
    'faqs',
    'content_pages',
    'site_settings',
    'admin_users',
    'roles',
    'admin_user_roles',
    'audit_logs',
  ].sort();
  const tables = await db.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations' ORDER BY tablename",
  );
  assert.deepEqual(
    tables.rows.map((row) => row.tablename),
    expected,
  );
  const enums = await db.query<{ typname: string }>(
    "SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND typtype='e'",
  );
  assert.equal(enums.rowCount, 15);
  const schedule = await db.query<{ enumlabel: string }>(
    "SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_type.oid=enumtypid WHERE typname='schedule_status' ORDER BY enumsortorder",
  );
  assert.deepEqual(
    schedule.rows.map((row) => row.enumlabel),
    ['DRAFT', 'OPEN', 'CLOSED', 'CANCELLED', 'COMPLETED'],
  );
  const foreignKeys = await db.query(
    "SELECT conname, convalidated FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace",
  );
  assert.ok((foreignKeys.rowCount ?? 0) > 25);
  assert.ok(foreignKeys.rows.every((row) => row.convalidated));
  const forbidden = await db.query(
    "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND (column_name='available_seats' OR (table_name='schedule_packages' AND column_name IN ('capacity','booked_seats')) OR (table_name='audit_logs' AND column_name IN ('updated_at','deleted_at')))",
  );
  assert.equal(forbidden.rowCount, 0);
  const noPk = await db.query(
    "SELECT tablename FROM pg_tables t WHERE schemaname='public' AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid=('public.' || t.tablename)::regclass AND c.contype='p')",
  );
  assert.equal(noPk.rowCount, 0);
});

test('PostgreSQL rejects invalid data while allowing incomplete participant details', async (t) => {
  await db.query('BEGIN');
  try {
    const adminId = (
      await db.query(
        "INSERT INTO admin_users(name,email,password_hash) VALUES ('Schema test','schema@example.invalid','not-a-login-hash') RETURNING id",
      )
    ).rows[0].id;
    const destination = (
      await db.query(
        "INSERT INTO destinations(name,slug) VALUES ('Schema test','schema-test') RETURNING id",
      )
    ).rows[0].id;
    const mountain = (
      await db.query(
        "INSERT INTO mountains(destination_id,name,slug) VALUES ($1,'Schema test','schema-test') RETURNING id",
        [destination],
      )
    ).rows[0].id;
    const route = (
      await db.query(
        "INSERT INTO routes(mountain_id,name,slug) VALUES ($1,'Schema test','schema-test') RETURNING id",
        [mountain],
      )
    ).rows[0].id;
    const trip = (
      await db.query(
        "INSERT INTO trips(mountain_id,route_id,name,slug,trip_type,duration_days,difficulty,created_by) VALUES ($1,$2,'Schema test','schema-test','OPEN_TRIP',2,'MODERATE',$3) RETURNING id",
        [mountain, route, adminId],
      )
    ).rows[0].id;
    const scheduleA = (
      await db.query(
        "INSERT INTO trip_schedules(trip_id,start_date,end_date,capacity,created_by) VALUES ($1,'2026-09-19','2026-09-20',20,$2) RETURNING id",
        [trip, adminId],
      )
    ).rows[0].id;
    const scheduleB = (
      await db.query(
        "INSERT INTO trip_schedules(trip_id,start_date,end_date,capacity,created_by) VALUES ($1,'2026-09-26','2026-09-27',20,$2) RETURNING id",
        [trip, adminId],
      )
    ).rows[0].id;
    const packageId = (
      await db.query(
        "INSERT INTO schedule_packages(schedule_id,name,price) VALUES ($1,'Schema test',750000.25) RETURNING id",
        [scheduleA],
      )
    ).rows[0].id;
    const booking = (
      await db.query(
        "INSERT INTO bookings(booking_number,schedule_id,package_id,source,participant_count,contact_name,contact_whatsapp,created_by) VALUES ('SCHEMA-TEST',$1,$2,'ADMIN',5,'Schema test','0000000000',$3) RETURNING id",
        [scheduleA, packageId, adminId],
      )
    ).rows[0].id;
    await db.query(
      "INSERT INTO booking_participants(booking_id,full_name) VALUES ($1,'Schema test')",
      [booking],
    );

    const reject = async (
      label: string,
      sql: string,
      values: unknown[],
      code: string,
    ) => {
      await t.test(label, async () => {
        await db.query('SAVEPOINT invalid_data');
        try {
          await assert.rejects(
            db.query(sql, values),
            (error: unknown) =>
              typeof error === 'object' &&
              error !== null &&
              'code' in error &&
              error.code === code,
          );
        } finally {
          await db.query('ROLLBACK TO SAVEPOINT invalid_data');
          await db.query('RELEASE SAVEPOINT invalid_data');
        }
      });
    };

    await reject(
      'orphan mountain FK',
      'UPDATE mountains SET destination_id=$1 WHERE id=$2',
      [randomUUID(), mountain],
      '23503',
    );
    await reject(
      'referenced destination cannot be deleted',
      'DELETE FROM destinations WHERE id=$1',
      [destination],
      '23001',
    );
    await reject(
      'duplicate destination slug',
      "INSERT INTO destinations(name,slug) VALUES ('Duplicate','schema-test')",
      [],
      '23505',
    );
    await reject(
      'duplicate itinerary day',
      "INSERT INTO trip_itineraries(trip_id,day_number,title) VALUES ($1,1,'A'),($1,1,'B')",
      [trip],
      '23505',
    );
    await reject(
      'zero itinerary day',
      "INSERT INTO trip_itineraries(trip_id,day_number,title) VALUES ($1,0,'A')",
      [trip],
      '23514',
    );
    await reject(
      'invalid trip duration',
      'UPDATE trips SET duration_days=0 WHERE id=$1',
      [trip],
      '23514',
    );
    await reject(
      'invalid age range',
      'UPDATE trips SET minimum_age=18,maximum_age=17 WHERE id=$1',
      [trip],
      '23514',
    );
    for (const capacity of [0, -1])
      await reject(
        `invalid capacity ${capacity}`,
        'UPDATE trip_schedules SET capacity=$1 WHERE id=$2',
        [capacity, scheduleA],
        '23514',
      );
    await reject(
      'minimum participants exceeds capacity',
      'UPDATE trip_schedules SET minimum_participants=21 WHERE id=$1',
      [scheduleA],
      '23514',
    );
    await reject(
      'minimum participants must be positive',
      'UPDATE trip_schedules SET minimum_participants=0 WHERE id=$1',
      [scheduleA],
      '23514',
    );
    await reject(
      'end date before start',
      "UPDATE trip_schedules SET end_date='2026-09-18' WHERE id=$1",
      [scheduleA],
      '23514',
    );
    await reject(
      'availability is not lifecycle enum',
      "UPDATE trip_schedules SET status='SOLD_OUT' WHERE id=$1",
      [scheduleA],
      '22P02',
    );
    for (const price of ['-1', 'NaN'])
      await reject(
        `invalid package price ${price}`,
        'UPDATE schedule_packages SET price=$1 WHERE id=$2',
        [price, packageId],
        '23514',
      );
    await reject(
      'zero booking participants',
      'UPDATE bookings SET participant_count=0 WHERE id=$1',
      [booking],
      '23514',
    );
    await reject(
      'negative booking total',
      'UPDATE bookings SET total_amount=-1 WHERE id=$1',
      [booking],
      '23514',
    );
    await reject(
      'package from another schedule',
      'UPDATE bookings SET schedule_id=$1 WHERE id=$2',
      [scheduleB, booking],
      '23503',
    );
    await reject(
      'referenced package cannot move schedule',
      'UPDATE schedule_packages SET schedule_id=$1 WHERE id=$2',
      [scheduleB, packageId],
      '23001',
    );
    await reject(
      'participant full name required',
      'UPDATE booking_participants SET full_name=NULL WHERE booking_id=$1',
      [booking],
      '23502',
    );
    await reject(
      'private inquiry destination required',
      "INSERT INTO private_trip_inquiries(inquiry_number,customer_name,whatsapp_number,preferred_date,participant_count,destination_other) VALUES ('TEST','Test','000','2026-10-01',1,'   ')",
      [],
      '23514',
    );
    await reject(
      'private inquiry count positive',
      "INSERT INTO private_trip_inquiries(inquiry_number,customer_name,whatsapp_number,preferred_date,participant_count,mountain_id) VALUES ('TEST','Test','000','2026-10-01',0,$1)",
      [mountain],
      '23514',
    );
    await reject(
      'private inquiry budget nonnegative',
      "INSERT INTO private_trip_inquiries(inquiry_number,customer_name,whatsapp_number,preferred_date,participant_count,mountain_id,budget) VALUES ('TEST','Test','000','2026-10-01',1,$1,-1)",
      [mountain],
      '23514',
    );
    await db.query(
      "INSERT INTO audit_logs(action,entity_type) VALUES ('SCHEMA_TEST','test')",
    );
    for (const sql of [
      "UPDATE audit_logs SET action='CHANGED'",
      'DELETE FROM audit_logs',
      'TRUNCATE audit_logs',
    ])
      await reject(`audit append-only: ${sql.split(' ')[0]}`, sql, [], '23514');
    await t.test(
      'booking quantity and participant rows can differ',
      async () => {
        const rows = await db.query(
          'SELECT b.participant_count, count(p.id)::int AS completed FROM bookings b JOIN booking_participants p ON p.booking_id=b.id WHERE b.id=$1 GROUP BY b.id',
          [booking],
        );
        assert.deepEqual(rows.rows[0], { participant_count: 5, completed: 1 });
      },
    );
    await t.test('money uses exact NUMERIC values', async () => {
      assert.equal(
        (
          await db.query('SELECT price FROM schedule_packages WHERE id=$1', [
            packageId,
          ])
        ).rows[0].price,
        '750000.25',
      );
    });
    await t.test('customer WhatsApp is not unique', async () => {
      await db.query(
        "INSERT INTO customers(full_name,whatsapp_number) VALUES ('Test A','000'),('Test B','000')",
      );
    });
  } finally {
    await db.query('ROLLBACK');
  }
});

test('generated Prisma Client reads and writes through the PostgreSQL adapter', async () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    const created = await prisma.destination.create({
      data: { name: 'Prisma schema test', slug: randomUUID() },
    });
    assert.equal(created.status, 'ACTIVE');
    assert.ok(created.createdAt instanceof Date);
    assert.equal(
      (
        await prisma.destination.findUniqueOrThrow({
          where: { id: created.id },
        })
      ).name,
      'Prisma schema test',
    );
  } finally {
    await prisma.$disconnect();
  }
});

test('API boots and GET /health verifies the database connection', async () => {
  const { createApp } = await import('../../src/app');
  const app = await createApp();
  try {
    await app.listen(0, '127.0.0.1');
    const baseUrl = await app.getUrl();
    const response = await fetch(`${baseUrl}/health`, {
      headers: { 'X-Request-Id': 'req_health_test' },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-request-id'), 'req_health_test');
    const body = (await response.json()) as {
      status: string;
      database: string;
      timestamp: string;
    };
    assert.equal(body.status, 'ok');
    assert.equal(body.database, 'ok');
    assert.equal(Number.isNaN(Date.parse(body.timestamp)), false);

    const missing = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(missing.status, 404);
    const error = (await missing.json()) as {
      success: boolean;
      error: { code: string };
      requestId: string;
    };
    assert.equal(error.success, false);
    assert.equal(error.error.code, 'RESOURCE_NOT_FOUND');
    assert.match(error.requestId, /^req_[a-f0-9]{32}$/);
  } finally {
    await app.close();
  }
});

test('admin authentication handles credentials, session, expiry, and logout', async () => {
  const roleId = randomUUID();
  const activeAdminId = randomUUID();
  const disabledAdminId = randomUUID();
  const password = 'Valid-admin-password';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await db.query(
    "INSERT INTO roles(id,name,slug) VALUES ($1,'Super Admin','SUPER_ADMIN')",
    [roleId],
  );
  await db.query(
    "INSERT INTO admin_users(id,name,email,password_hash,status) VALUES ($1,'Active Admin','active@wildera.test',$2,'ACTIVE'),($3,'Disabled Admin','disabled@wildera.test',$2,'DISABLED')",
    [activeAdminId, passwordHash, disabledAdminId],
  );
  await db.query(
    'INSERT INTO admin_user_roles(admin_user_id,role_id) VALUES ($1,$2)',
    [activeAdminId, roleId],
  );

  const { createApp } = await import('../../src/app');
  const app = await createApp();
  try {
    await app.listen(0, '127.0.0.1');
    const baseUrl = await app.getUrl();
    const login = (email: string, suppliedPassword: string) =>
      fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: suppliedPassword }),
      });

    const valid = await login(' ACTIVE@WILDERA.TEST ', password);
    assert.equal(valid.status, 200);
    const validBody = (await valid.json()) as {
      success: boolean;
      data: {
        user: { id: string; name: string; email: string; roles: string[] };
      };
    };
    assert.deepEqual(validBody, {
      success: true,
      data: {
        user: {
          id: activeAdminId,
          name: 'Active Admin',
          email: 'active@wildera.test',
          roles: ['SUPER_ADMIN'],
        },
      },
    });
    const setCookie = valid.headers.get('set-cookie') ?? '';
    assert.match(setCookie, /^wildera_admin_session=/);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
    assert.match(setCookie, /Path=\//i);
    assert.doesNotMatch(setCookie, /; Secure/i);
    const sessionCookie = setCookie.split(';')[0] ?? '';

    const lastLogin = await db.query<{
      last_login_at: Date | null;
      updated_at: Date;
    }>('SELECT last_login_at,updated_at FROM admin_users WHERE id=$1', [
      activeAdminId,
    ]);
    assert.ok(lastLogin.rows[0]?.last_login_at instanceof Date);

    for (const response of [
      await login('active@wildera.test', 'wrong-password'),
      await login('unknown@wildera.test', password),
      await login('disabled@wildera.test', password),
    ]) {
      assert.equal(response.status, 401);
      const body = (await response.json()) as {
        error: { code: string; message: string };
      };
      assert.deepEqual(body.error, {
        code: 'INVALID_CREDENTIALS',
        message: 'Email atau password tidak valid.',
      });
    }

    const invalidInput = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid', password: '' }),
    });
    assert.equal(invalidInput.status, 422);
    const invalidBody = (await invalidInput.json()) as {
      error: { code: string; fields: Record<string, string> };
    };
    assert.equal(invalidBody.error.code, 'VALIDATION_ERROR');
    assert.deepEqual(Object.keys(invalidBody.error.fields).sort(), [
      'email',
      'password',
    ]);

    const me = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(me.status, 200);
    assert.deepEqual(await me.json(), {
      success: true,
      data: validBody.data.user,
    });

    await db.query("UPDATE admin_users SET status='DISABLED' WHERE id=$1", [
      activeAdminId,
    ]);
    const disabledSession = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(disabledSession.status, 401);
    assert.equal(
      ((await disabledSession.json()) as { error: { code: string } }).error
        .code,
      'ADMIN_DISABLED',
    );
    await db.query("UPDATE admin_users SET status='ACTIVE' WHERE id=$1", [
      activeAdminId,
    ]);

    const malformed = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: 'wildera_admin_session=not-a-jwt' },
    });
    assert.equal(malformed.status, 401);
    assert.equal(
      ((await malformed.json()) as { error: { code: string } }).error.code,
      'UNAUTHENTICATED',
    );

    const jwt = app.get(JwtService);
    const expiredToken = await jwt.signAsync(
      { sessionVersion: lastLogin.rows[0]?.updated_at.toISOString() },
      { subject: activeAdminId, expiresIn: -1 },
    );
    const expired = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        Cookie: `wildera_admin_session=${encodeURIComponent(expiredToken)}`,
      },
    });
    assert.equal(expired.status, 401);
    assert.equal(
      ((await expired.json()) as { error: { code: string } }).error.code,
      'UNAUTHENTICATED',
    );

    const logout = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    assert.equal(logout.status, 204);
    assert.equal(await logout.text(), '');
    assert.match(
      logout.headers.get('set-cookie') ?? '',
      /^wildera_admin_session=;/,
    );

    const afterLogout = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(afterLogout.status, 401);
    assert.equal(
      ((await afterLogout.json()) as { error: { code: string } }).error.code,
      'UNAUTHENTICATED',
    );
  } finally {
    await app.close();
  }
});

test('direct API access enforces RBAC and reads current database roles', async () => {
  const operationsRoleId = randomUUID();
  const contentRoleId = randomUUID();
  const operationsAdminId = randomUUID();
  const contentAdminId = randomUUID();
  const password = 'Valid-rbac-password';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await db.query(
    "INSERT INTO roles(id,name,slug) VALUES ($1,'Operations','OPERATIONS'),($2,'Content','CONTENT')",
    [operationsRoleId, contentRoleId],
  );
  await db.query(
    "INSERT INTO admin_users(id,name,email,password_hash) VALUES ($1,'Operations Admin','operations@wildera.test',$2),($3,'Content Admin','content@wildera.test',$2)",
    [operationsAdminId, passwordHash, contentAdminId],
  );
  await db.query(
    'INSERT INTO admin_user_roles(admin_user_id,role_id) VALUES ($1,$2),($3,$4)',
    [operationsAdminId, operationsRoleId, contentAdminId, contentRoleId],
  );

  const { AppModule } = await import('../../src/app.module');
  @Module({
    imports: [AppModule, AuthModule, AuthorizationModule],
    controllers: [RbacTestController],
  })
  class RbacTestModule {}

  const app = await NestFactory.create(RbacTestModule, {
    abortOnError: false,
    logger: ['error'],
  });
  app.setGlobalPrefix('api/v1');
  try {
    await app.listen(0, '127.0.0.1');
    const baseUrl = await app.getUrl();
    const login = async (email: string, loginPassword = password) => {
      const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: loginPassword }),
      });
      assert.equal(response.status, 200);
      return (response.headers.get('set-cookie') ?? '').split(';')[0] ?? '';
    };
    const request = (path: string, cookie?: string) =>
      fetch(`${baseUrl}/api/v1/__rbac_test/${path}`, {
        headers: cookie ? { Cookie: cookie } : undefined,
      });
    const expectForbidden = async (path: string, cookie: string) => {
      const response = await request(path, cookie);
      assert.equal(response.status, 403);
      const body = (await response.json()) as {
        error: { code: string; message: string };
      };
      assert.deepEqual(body.error, {
        code: 'FORBIDDEN',
        message: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
      });
    };

    const operationsCookie = await login('operations@wildera.test');
    const contentCookie = await login('content@wildera.test');
    const superAdminCookie = await login(
      'active@wildera.test',
      'Valid-admin-password',
    );

    for (const path of [
      'booking-confirm',
      'booking-cancel',
      'participant-sensitive',
    ]) {
      assert.equal((await request(path, operationsCookie)).status, 200);
      await expectForbidden(path, contentCookie);
      assert.equal((await request(path, superAdminCookie)).status, 200);
    }

    assert.equal((await request('schedule-view', contentCookie)).status, 200);
    assert.equal((await request('content-manage', contentCookie)).status, 200);
    await expectForbidden('content-manage', operationsCookie);

    const unauthenticated = await request('booking-confirm');
    assert.equal(unauthenticated.status, 401);
    assert.equal(
      ((await unauthenticated.json()) as { error: { code: string } }).error
        .code,
      'UNAUTHENTICATED',
    );

    await db.query(
      'DELETE FROM admin_user_roles WHERE admin_user_id=$1 AND role_id=$2',
      [contentAdminId, contentRoleId],
    );
    await db.query(
      'INSERT INTO admin_user_roles(admin_user_id,role_id) VALUES ($1,$2)',
      [contentAdminId, operationsRoleId],
    );
    assert.equal((await request('booking-confirm', contentCookie)).status, 200);
    await expectForbidden('content-manage', contentCookie);
  } finally {
    await app.close();
  }
});
