import { randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { Client } from 'pg';

const root = resolve(import.meta.dirname, '..');
config({ path: resolve(root, '.env'), quiet: true });
const source = new URL(process.env.DATABASE_URL ?? '');
if (!['127.0.0.1', 'localhost', '[::1]'].includes(source.hostname)) {
  throw new Error('Admin browser tests require local PostgreSQL.');
}
const name = `wildera_admin_test_${randomUUID().replaceAll('-', '')}`;
source.pathname = '/postgres';
const admin = new Client({ connectionString: source.toString() });
await admin.connect();
try {
  await admin.query(`CREATE DATABASE "${name}"`);
  source.pathname = `/${name}`;
  const env = {
    ...process.env,
    DATABASE_URL: source.toString(),
    SESSION_SECRET: randomBytes(32).toString('hex'),
    ADMIN_TEST_DATABASE: name,
  };
  const migration = spawnSync('npm', ['run', 'db:deploy'], {
    cwd: root,
    env,
    stdio: 'inherit',
  });
  if (migration.status !== 0) throw new Error('Test migration failed');
  const result = spawnSync('npx', ['playwright', 'test'], {
    cwd: resolve(root, 'apps/web'),
    env,
    stdio: 'inherit',
  });
  process.exitCode = result.status ?? 1;
} finally {
  await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
  await admin.end();
}
