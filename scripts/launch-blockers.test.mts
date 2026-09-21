import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const backupUrl = new URL('./backup-database.mts', import.meta.url).href;

// Fake pg_dump only: no environment files, database access, or real backup.
test('backup avoids shell expansion and never exposes credentials on failure', () => {
  const temp = mkdtempSync(join(tmpdir(), 'wildera-backup-test-'));
  try {
    const fakeDump = join(temp, 'pg_dump');
    writeFileSync(
      fakeDump,
      `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.writeFileSync(process.env.CAPTURE, JSON.stringify({ args, database: process.env.PGDATABASE }));
if (process.env.FAIL_DUMP === '1') {
  console.error(process.env.PGDATABASE || args.join(' '));
  process.exit(1);
}
fs.writeFileSync(args[args.indexOf('-f') + 1], 'fake archive');
`,
    );
    chmodSync(fakeDump, 0o700);
    const capture = join(temp, 'capture.json');
    const connection = new URL(
      'postgresql://test@localhost/test?schema=public&connection_limit=1&pool_timeout=2&sslmode=require',
    );
    connection.password = 'regression-secret';
    const databaseUrl = connection.toString();
    const outputDir = join(temp, 'backup $(touch SHELL_EXECUTED)');
    const invoke = (fail: boolean, url = databaseUrl) =>
      spawnSync(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          `import { runBackup } from ${JSON.stringify(backupUrl)};
try { runBackup(${JSON.stringify({ databaseUrl: url, outputDir })}); }
catch (error) { console.error(error); process.exitCode = 1; }`,
        ],
        {
          cwd: temp,
          env: {
            PATH: `${temp}:/usr/bin:/bin`,
            CAPTURE: capture,
            FAIL_DUMP: fail ? '1' : '0',
          },
          encoding: 'utf8',
        },
      );

    const success = invoke(false);
    assert.equal(
      existsSync(join(temp, 'SHELL_EXECUTED')),
      false,
      'output path must not execute shell syntax',
    );
    assert.equal(success.status, 0, 'fake backup must succeed');
    const captured = JSON.parse(readFileSync(capture, 'utf8'));
    const cleanConnection = new URL(captured.database);
    assert.equal(cleanConnection.password, 'regression-secret');
    assert.equal(cleanConnection.search, '?sslmode=require');
    assert.equal(captured.args.includes(databaseUrl), false);
    assert.equal(
      captured.args.some((arg: string) => arg.includes('regression-secret')),
      false,
    );
    assert.deepEqual(captured.args.slice(0, 5), [
      '-F',
      'c',
      '--no-owner',
      '--no-acl',
      '-f',
    ]);
    assert.equal(captured.args[5].startsWith(outputDir), true);

    for (const url of [databaseUrl, 'invalid-regression-secret']) {
      const failed = invoke(true, url);
      assert.equal(failed.status, 1);
      assert.equal(
        `${failed.stdout}${failed.stderr}`.includes('regression-secret'),
        false,
        'failure output must be sanitized',
      );
      assert.match(failed.stderr, /Backup database gagal/);
    }
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('launch stays blocked when file-only checks exist and all subprocesses pass', () => {
  const launchUrl = new URL('./final-launch-check.mts', import.meta.url).href;
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
childProcess.spawnSync = () => ({ status: 0, stdout: '', stderr: '' });
syncBuiltinESMExports();
await import(${JSON.stringify(launchUrl)});
`,
    ],
    { env: {}, encoding: 'utf8' },
  );
  assert.equal(result.status, 1, 'file existence cannot approve launch');
  for (const name of ['Mobile UX', 'SEO & Meta Tags', 'Legal Pages']) {
    assert.ok(result.stdout.includes(`[UNVERIFIED] ${name}`));
  }
  assert.match(result.stdout, /\[PASS\] RBAC Permissions/);
  assert.doesNotMatch(result.stdout, /Argon2id hashing|STEP 42 APPROVED/);
  assert.match(result.stdout, /BLOCKED FOR LAUNCH/);
});

test('fresh production legal page keys match public lookups without running seed', () => {
  const seed = readFileSync(
    new URL('../database/seeds/production.ts', import.meta.url),
    'utf8',
  );
  for (const key of ['privacy', 'terms', 'cancellation', 'safety']) {
    const route = readFileSync(
      new URL(`../apps/web/src/app/${key}/page.tsx`, import.meta.url),
      'utf8',
    );
    assert.ok(route.includes(`fetchPublicContentPage('${key}')`));
    assert.ok(
      seed.includes(`pageKey: '${key}'`),
      `production seed missing ${key} key`,
    );
  }
});
