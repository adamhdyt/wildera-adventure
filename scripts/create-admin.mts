/**
 * Creates an admin account (or resets its password and role if it exists).
 * The password is generated, written to .local/admin-<email>.txt (git-ignored,
 * owner-readable only) and never printed.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/create-admin.mts --email a@b.id --name "Name" [--role SUPER_ADMIN|OPERATIONS|CONTENT]
 * Set ADMIN_PASSWORD to choose the password instead of generating one.
 */
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import argon2 from 'argon2';
import pg from 'pg';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (existsSync(join(root, '.env'))) process.loadEnvFile(join(root, '.env'));

function option(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index > 0 ? process.argv[index + 1] : undefined;
}

const email = option('email')?.trim().toLowerCase();
const name = option('name')?.trim();
const role = option('role') ?? 'SUPER_ADMIN';
if (
  !email ||
  !name ||
  !['SUPER_ADMIN', 'OPERATIONS', 'CONTENT'].includes(role)
) {
  throw new Error(
    'Usage: --email <email> --name <name> [--role SUPER_ADMIN|OPERATIONS|CONTENT]',
  );
}
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const generated = !process.env.ADMIN_PASSWORD;
const password =
  process.env.ADMIN_PASSWORD ?? `${randomBytes(15).toString('base64url')}-9Aa`;
if (password.length < 12)
  throw new Error('Password must be at least 12 characters.');
const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

const url = new URL(databaseUrl);
url.search = '';
const db = new pg.Client({ connectionString: url.toString() });
await db.connect();
try {
  await db.query('BEGIN');
  const roleRow = await db.query(`SELECT id FROM roles WHERE slug = $1`, [
    role,
  ]);
  if (!roleRow.rows[0])
    throw new Error(`Role ${role} not found; run the production seed first.`);
  const user = await db.query(
    `INSERT INTO admin_users(name, email, password_hash, status)
     VALUES ($1, $2, $3, 'ACTIVE')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, status = 'ACTIVE'
     RETURNING id`,
    [name, email, passwordHash],
  );
  await db.query(`DELETE FROM admin_user_roles WHERE admin_user_id = $1`, [
    user.rows[0].id,
  ]);
  await db.query(
    `INSERT INTO admin_user_roles(admin_user_id, role_id) VALUES ($1, $2)`,
    [user.rows[0].id, roleRow.rows[0].id],
  );
  await db.query('COMMIT');
} catch (error) {
  await db.query('ROLLBACK');
  throw error;
} finally {
  await db.end();
}

if (generated) {
  const dir = join(root, '.local');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `admin-${email.replace(/[^a-z0-9]+/g, '-')}.txt`);
  writeFileSync(
    file,
    `email: ${email}\nname: ${name}\nrole: ${role}\npassword: ${password}\n`,
    {
      mode: 0o600,
    },
  );
  console.log(`Admin ${email} (${role}) ready. Password saved to ${file}`);
} else {
  console.log(`Admin ${email} (${role}) ready.`);
}
