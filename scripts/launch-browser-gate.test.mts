import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

for (const [name, stats, exitCode, expected] of [
  [
    'complete browser evidence',
    { expected: 9, unexpected: 0, skipped: 0, flaky: 0 },
    0,
    'PASS',
  ],
  [
    'skipped browser test',
    { expected: 8, unexpected: 0, skipped: 1, flaky: 0 },
    0,
    'FAIL',
  ],
  [
    'flaky browser test',
    { expected: 8, unexpected: 0, skipped: 0, flaky: 1 },
    0,
    'FAIL',
  ],
  [
    'failed subprocess',
    { expected: 9, unexpected: 0, skipped: 0, flaky: 0 },
    1,
    'FAIL',
  ],
] as const) {
  test(`launch gate: ${name}`, () => {
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `
      import childProcess from 'node:child_process';
      import { writeFileSync } from 'node:fs';
      import { syncBuiltinESMExports } from 'node:module';
      childProcess.spawnSync = (_command, args, options) => {
        if (args.includes('scripts/test-admin.mts')) {
          writeFileSync(options.env.PLAYWRIGHT_JSON_OUTPUT_NAME, JSON.stringify({stats: ${JSON.stringify(stats)}}));
          return { status: ${exitCode}, stdout: '', stderr: '' };
        }
        return { status: 0, stdout: '', stderr: '' };
      };
      syncBuiltinESMExports();
      await import(${JSON.stringify(new URL('./final-launch-check.mts', import.meta.url).href)});
    `,
      ],
      { env: {}, encoding: 'utf8' },
    );
    assert.equal(
      result.status,
      1,
      'browser evidence cannot approve production',
    );
    for (const category of ['Mobile UX', 'SEO & Meta Tags', 'Legal Pages']) {
      assert.ok(
        result.stdout.includes(`[${expected}] ${category}`),
        result.stdout,
      );
    }
    assert.match(result.stdout, /\[UNVERIFIED\] Database Backup/);
    assert.match(result.stdout, /\[UNVERIFIED\] Production approval/);
    assert.doesNotMatch(result.stdout, /STEP 42 APPROVED/);
  });
}
