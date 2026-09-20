import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { Client } from 'pg';

const root = resolve(__dirname, '../../../..');
const name = `wildera_seed_test_${randomUUID().replaceAll('-', '')}`;
const password = 'Step-3-local-password';
const source = process.env.DATABASE_URL;
if (!source) {
  throw new Error(
    'DATABASE_URL is required; run npm run db:local:start first.',
  );
}
const url = new URL(source);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
  throw new Error('Seed tests require a local PostgreSQL server.');
}
url.pathname = `/${name}`;
url.search = '';
const connectionString = url.toString();
url.pathname = '/postgres';
const admin = new Client({ connectionString: url.toString() });
const database = new Client({ connectionString });
const commandEnvironment = {
  ...process.env,
  DATABASE_URL: connectionString,
  SEED_ADMIN_PASSWORD: password,
  SEED_ADMIN_EMAIL: 'admin@wildera.test',
  SEED_ADMIN_NAME: 'Admin Wildera',
};
let created = false;

function run(args: string[]) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    env: commandEnvironment,
    encoding: 'utf8',
    timeout: 120000,
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
}

before(async () => {
  await admin.connect();
  await admin.query(`CREATE DATABASE "${name}"`);
  created = true;
  run(['node_modules/prisma/build/index.js', 'migrate', 'deploy']);
  await database.connect();
});

after(async () => {
  await database.end();
  try {
    if (created) await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
  } finally {
    await admin.end();
  }
});

async function verifyDevelopmentData() {
  const counts = await database.query<{
    roles: string;
    admins: string;
    destinations: string;
    mountains: string;
    routes: string;
    trips: string;
    schedules: string;
    packages: string;
    meeting_points: string;
    faqs: string;
    customers: string;
    bookings: string;
  }>(`SELECT
    (SELECT count(*) FROM roles) roles,
    (SELECT count(*) FROM admin_users) admins,
    (SELECT count(*) FROM destinations) destinations,
    (SELECT count(*) FROM mountains) mountains,
    (SELECT count(*) FROM routes) routes,
    (SELECT count(*) FROM trips) trips,
    (SELECT count(*) FROM trip_schedules) schedules,
    (SELECT count(*) FROM schedule_packages) packages,
    (SELECT count(*) FROM meeting_points) meeting_points,
    (SELECT count(*) FROM faqs) faqs,
    (SELECT count(*) FROM customers) customers,
    (SELECT count(*) FROM bookings) bookings`);
  assert.deepEqual(counts.rows[0], {
    roles: '3',
    admins: '1',
    destinations: '1',
    mountains: '1',
    routes: '1',
    trips: '1',
    schedules: '1',
    packages: '2',
    meeting_points: '1',
    faqs: '1',
    customers: '0',
    bookings: '0',
  });

  const roleRows = await database.query<{ slug: string }>(
    'SELECT slug FROM roles ORDER BY slug',
  );
  assert.deepEqual(
    roleRows.rows.map((row) => row.slug),
    ['CONTENT', 'OPERATIONS', 'SUPER_ADMIN'],
  );

  const adminRow = await database.query<{
    email: string;
    password_hash: string;
    role: string;
  }>(`SELECT a.email, a.password_hash, r.slug role
      FROM admin_users a
      JOIN admin_user_roles ar ON ar.admin_user_id = a.id
      JOIN roles r ON r.id = ar.role_id`);
  assert.equal(adminRow.rows[0]?.email, 'admin@wildera.test');
  assert.equal(adminRow.rows[0]?.role, 'SUPER_ADMIN');
  assert.match(adminRow.rows[0]?.password_hash ?? '', /^\$argon2id\$/);
  assert.equal(
    await argon2.verify(adminRow.rows[0]?.password_hash ?? '', password),
    true,
  );

  const trip = await database.query<{
    destination: string;
    mountain: string;
    route: string;
    trip: string;
    start_date: string;
    end_date: string;
    capacity: number;
  }>(`SELECT d.name destination, m.name mountain, r.name route, t.name trip,
      to_char(s.start_date, 'YYYY-MM-DD') start_date,
      to_char(s.end_date, 'YYYY-MM-DD') end_date, s.capacity
      FROM trip_schedules s
      JOIN trips t ON t.id = s.trip_id
      JOIN mountains m ON m.id = t.mountain_id
      JOIN destinations d ON d.id = m.destination_id
      JOIN routes r ON r.id = t.route_id`);
  assert.deepEqual(trip.rows[0], {
    destination: 'Jawa Tengah',
    mountain: 'Gunung Prau',
    route: 'Prau via Patak Banteng',
    trip: 'Open Trip Prau',
    start_date: '2026-09-19',
    end_date: '2026-09-20',
    capacity: 20,
  });

  const packages = await database.query<{
    name: string;
    price: string;
    meeting_point: string | null;
  }>(`SELECT p.name, p.price::text, m.name meeting_point
      FROM schedule_packages p
      LEFT JOIN meeting_points m ON m.id = p.meeting_point_id
      ORDER BY p.sort_order`);
  assert.deepEqual(packages.rows, [
    { name: 'Start Jakarta', price: '1250000.00', meeting_point: 'Blok M' },
    { name: 'Start Basecamp', price: '750000.00', meeting_point: null },
  ]);
  return adminRow.rows[0]?.password_hash;
}

test('development seed is idempotent and reset reproduces the fixture', async () => {
  const seedCommand = ['node_modules/prisma/build/index.js', 'db', 'seed'];
  run(seedCommand);
  const firstHash = await verifyDevelopmentData();

  run(seedCommand);
  const secondHash = await verifyDevelopmentData();
  assert.equal(secondHash, firstHash);

  const productionUrl = new URL(connectionString);
  productionUrl.pathname = '/wildera_production';
  const rejectedReset = spawnSync(
    process.execPath,
    ['scripts/reset-database.mts'],
    {
      cwd: root,
      env: {
        ...commandEnvironment,
        DATABASE_URL: productionUrl.toString(),
      },
      encoding: 'utf8',
    },
  );
  assert.notEqual(rejectedReset.status, 0);
  assert.match(rejectedReset.stderr, /Reset ditolak/);

  await database.query(
    "INSERT INTO destinations(name, slug) VALUES ('Temporary', 'temporary')",
  );
  run(['scripts/reset-database.mts']);
  await verifyDevelopmentData();
  const temporary = await database.query(
    "SELECT id FROM destinations WHERE slug = 'temporary'",
  );
  assert.equal(temporary.rowCount, 0);
});
