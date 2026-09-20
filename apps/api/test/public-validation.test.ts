import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validatePublicMountainQuery,
  validatePublicTripQuery,
} from '@wildera/validation';

test('validatePublicTripQuery parses and clamps parameters', () => {
  const query = validatePublicTripQuery({
    search: '  Rinjani  ',
    month: '2026-10',
    type: 'OPEN_TRIP',
    difficulty: 'HARD',
    availability: 'AVAILABLE',
    mountain: 'rinjani',
    destination: 'lombok',
    page: '2',
    pageSize: '500', // exceeds max 100
    sort: 'startDate',
    order: 'asc',
  });

  assert.equal(query.search, 'Rinjani');
  assert.equal(query.month, '2026-10');
  assert.equal(query.type, 'OPEN_TRIP');
  assert.equal(query.difficulty, 'HARD');
  assert.equal(query.availability, 'AVAILABLE');
  assert.equal(query.mountain, 'rinjani');
  assert.equal(query.destination, 'lombok');
  assert.equal(query.page, 2);
  assert.equal(query.pageSize, 100); // clamped
  assert.equal(query.sort, 'startDate');
  assert.equal(query.order, 'asc');
});

test('validatePublicTripQuery ignores invalid fields', () => {
  const query = validatePublicTripQuery({
    search: '   ',
    month: 'invalid-month',
    type: 'INVALID_TYPE',
    difficulty: 'SUPER_HARD',
    availability: 'UNKNOWN',
    page: '-5',
    pageSize: 'abc',
    order: 'random',
  });

  assert.equal(query.search, undefined);
  assert.equal(query.month, undefined);
  assert.equal(query.type, undefined);
  assert.equal(query.difficulty, undefined);
  assert.equal(query.availability, undefined);
  assert.equal(query.page, 1);
  assert.equal(query.pageSize, 20);
  assert.equal(query.order, undefined);
});

test('validatePublicMountainQuery normalizes parameters', () => {
  const query = validatePublicMountainQuery({
    search: 'Prau',
    destination: 'jawa-tengah',
    difficulty: 'MODERATE',
    page: '3',
    pageSize: '10',
  });

  assert.equal(query.search, 'Prau');
  assert.equal(query.destination, 'jawa-tengah');
  assert.equal(query.difficulty, 'MODERATE');
  assert.equal(query.page, 3);
  assert.equal(query.pageSize, 10);
});
