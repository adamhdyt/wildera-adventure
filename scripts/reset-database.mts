import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw new Error('DATABASE_URL wajib diisi untuk reset database.');

const databaseUrl = new URL(rawUrl);
const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1));
const localHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);
const allowedName =
  databaseName === 'wildera_development' ||
  /^wildera_[a-z0-9_]*test[a-z0-9_]*$/.test(databaseName);
if (!localHosts.has(databaseUrl.hostname) || !allowedName) {
  throw new Error(
    'Reset ditolak: gunakan PostgreSQL lokal dan database wildera_development atau database test Wildera.',
  );
}

function prisma(args: string[]) {
  const env = {
    ...process.env,
    PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION:
      process.env.PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION ?? 'yes',
  };
  const result = spawnSync(
    process.execPath,
    ['node_modules/prisma/build/index.js', ...args],
    { cwd: root, env, stdio: 'inherit' },
  );
  if (result.error || result.status !== 0) {
    throw new Error(`Prisma ${args.join(' ')} gagal.`);
  }
}

prisma(['migrate', 'reset', '--force']);
prisma(['db', 'seed']);
