import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

interface CheckResult {
  name: string;
  category: string;
  status: 'PASS' | 'FAIL' | 'UNVERIFIED';
  details: string;
}

const results: CheckResult[] = [];

function runCommand(
  command: string,
  args: string[],
  env: Record<string, string> = {},
) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function runApiTest(file: string, env: Record<string, string> = {}) {
  const result = spawnSync(
    'node',
    [
      '--env-file-if-exists=../../.env',
      '-r',
      'ts-node/register',
      '--test',
      file,
    ],
    {
      cwd: resolve(root, 'apps/api'),
      env: { ...process.env, ...env },
      encoding: 'utf8',
    },
  );
  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

console.log('================================================================');
console.log('    WILDERA ADVENTURE — STEP 41: FINAL LAUNCH CHECK');
console.log(
  '================================================================\n',
);

// 1. RBAC permission mapping only
console.log('[1/11] Checking RBAC Permissions...');
const authCheck = runApiTest('test/authorization.test.ts');
if (authCheck.status === 0) {
  results.push({
    name: 'RBAC Permissions',
    category: 'Security',
    status: 'PASS',
    details:
      'Role-to-permission mapping verified; authentication and sessions not tested.',
  });
} else {
  results.push({
    name: 'RBAC Permissions',
    category: 'Security',
    status: 'FAIL',
    details: authCheck.stderr || authCheck.stdout,
  });
}

// 2. Capacity Concurrency
console.log('[2/11] Checking Capacity Concurrency...');
const concurrencyCheck = runApiTest(
  'test/database/booking-concurrency.test.ts',
);
if (concurrencyCheck.status === 0) {
  results.push({
    name: 'Capacity Concurrency',
    category: 'Booking & DB',
    status: 'PASS',
    details:
      'Concurrent booking oversubscription strictly rejected by transactional lock.',
  });
} else {
  results.push({
    name: 'Capacity Concurrency',
    category: 'Booking & DB',
    status: 'FAIL',
    details: concurrencyCheck.stderr || concurrencyCheck.stdout,
  });
}

// 3. Booking Lifecycle
console.log('[3/11] Checking Booking System...');
const bookingCheck = runApiTest('test/database/booking.test.ts');
if (bookingCheck.status === 0) {
  results.push({
    name: 'Booking System',
    category: 'Operations',
    status: 'PASS',
    details:
      'Booking creation, manifest participant management, and status transitions verified.',
  });
} else {
  results.push({
    name: 'Booking System',
    category: 'Operations',
    status: 'FAIL',
    details: bookingCheck.stderr || bookingCheck.stdout,
  });
}

// 4. WhatsApp Conversion
console.log('[4/11] Checking WhatsApp Conversion & Deep Links...');
const waCheck = runApiTest('test/whatsapp-conversion.test.ts');
if (waCheck.status === 0) {
  results.push({
    name: 'WhatsApp Conversion',
    category: 'Public UX',
    status: 'PASS',
    details:
      'Phone normalization, prefilled URL generators, and inquiry formatting verified.',
  });
} else {
  results.push({
    name: 'WhatsApp Conversion',
    category: 'Public UX',
    status: 'FAIL',
    details: waCheck.stderr || waCheck.stdout,
  });
}

// 5. Mobile UX & Responsive Components
console.log('[5/11] Checking Mobile UX & Responsive Layouts...');
const responsiveFiles = [
  'apps/web/src/components/public/navbar.tsx',
  'apps/web/src/components/public/footer.tsx',
  'apps/web/src/components/trip/trip-filter-bottom-sheet.tsx',
  'apps/web/src/components/trip-detail/booking-card.tsx',
];
const allResponsiveExist = responsiveFiles.every((f) =>
  existsSync(resolve(root, f)),
);
if (allResponsiveExist) {
  results.push({
    name: 'Mobile UX',
    category: 'Public UX',
    status: 'UNVERIFIED',
    details:
      'Component files exist only; responsive behavior and touch targets require browser verification.',
  });
} else {
  results.push({
    name: 'Mobile UX',
    category: 'Public UX',
    status: 'FAIL',
    details: 'Some responsive components missing.',
  });
}

// 6. Private Trip
console.log('[6/11] Checking Private Trip Pipeline...');
const privateTripCheck = runApiTest('test/database/private-trip.test.ts');
if (privateTripCheck.status === 0) {
  results.push({
    name: 'Private Trip',
    category: 'Operations',
    status: 'PASS',
    details:
      'Public inquiry submission and admin lead management pipeline verified.',
  });
} else {
  results.push({
    name: 'Private Trip',
    category: 'Operations',
    status: 'FAIL',
    details: privateTripCheck.stderr || privateTripCheck.stdout,
  });
}

// 7. SEO
console.log('[7/11] Checking SEO & Indexing Assets...');
const seoFiles = ['apps/web/src/app/sitemap.ts', 'apps/web/src/app/robots.ts'];
const allSeoExist = seoFiles.every((f) => existsSync(resolve(root, f)));
if (allSeoExist) {
  results.push({
    name: 'SEO & Meta Tags',
    category: 'Marketing',
    status: 'UNVERIFIED',
    details:
      'Route files exist only; rendered sitemap, robots, canonical and OpenGraph output unverified.',
  });
} else {
  results.push({
    name: 'SEO & Meta Tags',
    category: 'Marketing',
    status: 'FAIL',
    details: 'Missing SEO route files.',
  });
}

// 8. Analytics & PII Protection
console.log('[8/11] Checking Analytics & PII Stripping...');
const analyticsCheck = runApiTest('test/analytics-validation.test.ts');
if (analyticsCheck.status === 0) {
  results.push({
    name: 'Analytics Engine',
    category: 'Marketing & Privacy',
    status: 'PASS',
    details: '8 required P0 events validated and PII sanitization verified.',
  });
} else {
  results.push({
    name: 'Analytics Engine',
    category: 'Marketing & Privacy',
    status: 'FAIL',
    details: analyticsCheck.stderr || analyticsCheck.stdout,
  });
}

// 9. Database Backup
console.log('[9/11] Checking Database Backup Script...');
const backupCheck = runCommand('node', [
  '--env-file=.env',
  '--loader',
  'ts-node/esm',
  'scripts/backup-database.mts',
]);
if (backupCheck.status === 0) {
  results.push({
    name: 'Database Backup',
    category: 'Reliability',
    status: 'PASS',
    details:
      'Compressed PostgreSQL archive creation and retention rotation verified.',
  });
} else {
  results.push({
    name: 'Database Backup',
    category: 'Reliability',
    status: 'FAIL',
    details: backupCheck.stderr || backupCheck.stdout,
  });
}

// 10. Sensitive Data Protection
console.log('[10/11] Checking Sensitive Data Protection & Headers...');
const securityCheck = runApiTest('test/security.test.ts');
if (securityCheck.status === 0) {
  results.push({
    name: 'Sensitive Data Protection',
    category: 'Security',
    status: 'PASS',
    details:
      'Credential redaction in logs, OWASP security headers, and rate limiting active.',
  });
} else {
  results.push({
    name: 'Sensitive Data Protection',
    category: 'Security',
    status: 'FAIL',
    details: securityCheck.stderr || securityCheck.stdout,
  });
}

// 11. Legal Pages
console.log('[11/11] Checking Legal & Policy Pages...');
const legalRoutes = [
  'apps/web/src/app/safety/page.tsx',
  'apps/web/src/app/terms/page.tsx',
  'apps/web/src/app/cancellation/page.tsx',
  'apps/web/src/app/privacy/page.tsx',
  'apps/web/src/app/faq/page.tsx',
  'apps/web/src/app/tentang/page.tsx',
];
const allLegalExist = legalRoutes.every((f) => existsSync(resolve(root, f)));
if (allLegalExist) {
  results.push({
    name: 'Legal Pages',
    category: 'Compliance',
    status: 'UNVERIFIED',
    details:
      'Route files exist only; published content lookup, rendered pages and policy accuracy unverified.',
  });
} else {
  results.push({
    name: 'Legal Pages',
    category: 'Compliance',
    status: 'FAIL',
    details: 'Some legal policy pages are missing.',
  });
}

console.log(
  '\n================================================================',
);
console.log('                 LAUNCH GATE VERIFICATION MATRIX');
console.log(
  '================================================================\n',
);

let passCount = 0;
for (const r of results) {
  const icon = r.status === 'PASS' ? '✔' : '✖';
  console.log(`${icon} [${r.status}] ${r.name.padEnd(28)} | ${r.details}`);
  if (r.status === 'PASS') passCount++;
}

console.log(
  '\n----------------------------------------------------------------',
);
console.log(`Total Criteria Passed: ${passCount}/${results.length}`);
if (passCount === results.length) {
  console.log('STATUS: READY FOR PRODUCTION LAUNCH (STEP 42 APPROVED)');
  process.exit(0);
} else {
  console.log(
    'STATUS: BLOCKED FOR LAUNCH (Resolve failed and unverified criteria)',
  );
  process.exit(1);
}
