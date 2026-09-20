import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  slugify,
  validateCreateDestination,
  validateDestinationQuery,
  validateUpdateDestination,
} from '@wildera/validation';

test('slugify transforms strings correctly', () => {
  assert.equal(slugify('Jawa Timur'), 'jawa-timur');
  assert.equal(slugify('Gunung Prau (2.565 MDPL)'), 'gunung-prau-2565-mdpl');
  assert.equal(slugify('  Nusa Tenggara Barat  '), 'nusa-tenggara-barat');
  assert.equal(slugify('---hello---world---'), 'hello-world');
});

test('validateCreateDestination validates required name and generates slug', () => {
  const result = validateCreateDestination({
    name: 'Lombok',
    province: 'Nusa Tenggara Barat',
  });

  assert.equal(result.valid, true);
  assert.equal(result.data?.name, 'Lombok');
  assert.equal(result.data?.slug, 'lombok');
  assert.equal(result.data?.province, 'Nusa Tenggara Barat');
  assert.equal(result.data?.status, 'ACTIVE');
});

test('validateCreateDestination rejects missing or empty name', () => {
  const result = validateCreateDestination({
    name: '   ',
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors?.name, 'Nama destinasi wajib diisi.');
});

test('validateCreateDestination rejects invalid slug format', () => {
  const result = validateCreateDestination({
    name: 'Valid Name',
    slug: 'Invalid Slug with spaces',
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors?.slug);
});

test('validateCreateDestination rejects invalid status', () => {
  const result = validateCreateDestination({
    name: 'Valid Name',
    status: 'UNKNOWN_STATUS',
  });

  assert.equal(result.valid, false);
  assert.equal(
    result.errors?.status,
    'Status harus bernilai ACTIVE atau INACTIVE.',
  );
});

test('validateUpdateDestination allows partial updates', () => {
  const result = validateUpdateDestination({
    province: 'Jawa Tengah',
    status: 'INACTIVE',
  });

  assert.equal(result.valid, true);
  assert.equal(result.data?.province, 'Jawa Tengah');
  assert.equal(result.data?.status, 'INACTIVE');
  assert.equal(result.data?.name, undefined);
});

test('validateUpdateDestination rejects empty body', () => {
  const result = validateUpdateDestination({});
  assert.equal(result.valid, false);
  assert.ok(result.errors?._general);
});

test('validateDestinationQuery parses query parameters with limits', () => {
  const query = validateDestinationQuery({
    search: 'rinjani',
    status: 'ACTIVE',
    limit: '25',
    offset: '10',
  });

  assert.equal(query.search, 'rinjani');
  assert.equal(query.status, 'ACTIVE');
  assert.equal(query.limit, 25);
  assert.equal(query.offset, 10);
});

test('validateDestinationQuery clamps limit to 100', () => {
  const query = validateDestinationQuery({
    limit: '999',
  });

  assert.equal(query.limit, 100);
});
