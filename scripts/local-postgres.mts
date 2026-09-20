import { randomBytes } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  chmodSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const local = join(root, '.local');
const data = join(local, 'postgres');
const passwordFile = join(local, 'postgres-password');
const port = '55432';
const action = process.argv[2];
if (!['start', 'stop', 'status'].includes(action ?? '')) {
  throw new Error('Usage: node scripts/local-postgres.mts start|stop|status');
}

const brew = spawnSync('brew', ['--prefix', 'postgresql@18'], {
  encoding: 'utf8',
});
const bin =
  process.env.PG_BIN ??
  (brew.status === 0 ? join(brew.stdout.trim(), 'bin') : '');
const executable = (name: string) => (bin ? join(bin, name) : name);
const run = (name: string, args: string[], env = process.env) => {
  const result = spawnSync(executable(name), args, {
    env: { LC_ALL: 'C', ...env },
    stdio: 'inherit',
  });
  if (result.error || result.status !== 0)
    throw new Error(`${name} failed. Install PostgreSQL 18 or set PG_BIN.`);
};
const isRunning = () =>
  existsSync(join(data, 'PG_VERSION')) &&
  spawnSync(executable('pg_ctl'), ['-D', data, 'status'], { stdio: 'ignore' })
    .status === 0;

if (action === 'status') {
  console.log(
    isRunning()
      ? 'Wildera PostgreSQL running on 127.0.0.1:55432'
      : 'Wildera PostgreSQL stopped',
  );
  process.exit(0);
}
if (action === 'stop') {
  if (isRunning()) run('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop']);
  process.exit(0);
}

mkdirSync(local, { recursive: true, mode: 0o700 });
if (!existsSync(passwordFile)) {
  if (existsSync(join(data, 'PG_VERSION')))
    throw new Error(
      'Local cluster password file is missing; restore it before continuing.',
    );
  writeFileSync(passwordFile, randomBytes(32).toString('hex'), {
    mode: 0o600,
    flag: 'wx',
  });
}
const password = readFileSync(passwordFile, 'utf8').trim();
if (!existsSync(join(data, 'PG_VERSION'))) {
  run('initdb', [
    '-D',
    data,
    '--username=wildera',
    `--pwfile=${passwordFile}`,
    '--auth=scram-sha-256',
    '--encoding=UTF8',
    '--locale=C',
  ]);
  writeFileSync(
    join(data, 'postgresql.conf'),
    "\nlisten_addresses = '127.0.0.1'\nport = 55432\nunix_socket_directories = ''\ntimezone = 'UTC'\n",
    { flag: 'a' },
  );
}
if (!isRunning())
  run('pg_ctl', ['-D', data, '-l', join(local, 'postgres.log'), '-w', 'start']);

const pgEnv = {
  ...process.env,
  PGHOST: '127.0.0.1',
  PGPORT: port,
  PGUSER: 'wildera',
  PGPASSWORD: password,
  PGDATABASE: 'postgres',
};
const result = spawnSync(
  executable('psql'),
  [
    '-XAt',
    '-v',
    'ON_ERROR_STOP=1',
    '-c',
    "SELECT 1 FROM pg_database WHERE datname = 'wildera_development'",
  ],
  { env: pgEnv, encoding: 'utf8' },
);
if (result.status !== 0)
  throw new Error(
    'Cannot authenticate to the project cluster. Check .local/postgres.log.',
  );
if (result.stdout.trim() !== '1')
  run('createdb', ['wildera_development'], pgEnv);

const url = `postgresql://wildera:${password}@127.0.0.1:${port}/wildera_development?schema=public`;
const envFile = join(root, '.env');
const existing = existsSync(envFile) ? readFileSync(envFile, 'utf8') : '';
let nextEnvironment = existing;
if (!/^\s*DATABASE_URL\s*=/m.test(existing)) {
  nextEnvironment = `${nextEnvironment}\nDATABASE_URL=${url}\n`;
} else if (!existing.includes(url)) {
  console.log(
    'Existing DATABASE_URL preserved. The local cluster URL is available in .local/database.env.',
  );
}
if (!/^\s*SESSION_SECRET\s*=/m.test(existing)) {
  nextEnvironment = `${nextEnvironment}\nSESSION_SECRET=${randomBytes(32).toString('hex')}\n`;
}
if (nextEnvironment !== existing) {
  writeFileSync(envFile, nextEnvironment, { mode: 0o600 });
  chmodSync(envFile, 0o600);
}
writeFileSync(join(local, 'database.env'), `DATABASE_URL=${url}\n`, {
  mode: 0o600,
});
console.log(
  'Wildera PostgreSQL ready on 127.0.0.1:55432. Credentials stay in ignored local files.',
);
