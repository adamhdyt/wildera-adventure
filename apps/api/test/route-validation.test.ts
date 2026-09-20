import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validateCreateRoute,
  validateRouteQuery,
  validateUpdateRoute,
} from '@wildera/validation';

test('validateCreateRoute succeeds with valid payload and auto slug', () => {
  const result = validateCreateRoute({
    mountainId: '768ee7f3-e5cf-4dfd-b8d9-6c39f1c7e9cb',
    name: 'Jalur Sembalun',
    distanceKm: '8.5',
    elevationGainM: '1900',
    estimatedDurationHours: '7.5',
    difficulty: 'HARD',
    startingPoint: 'Pos Sembalun',
  });

  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.data.name, 'Jalur Sembalun');
    assert.equal(result.data.slug, 'jalur-sembalun');
    assert.equal(result.data.distanceKm, 8.5);
    assert.equal(result.data.elevationGainM, 1900);
    assert.equal(result.data.estimatedDurationHours, 7.5);
    assert.equal(result.data.difficulty, 'HARD');
    assert.equal(result.data.startingPoint, 'Pos Sembalun');
    assert.equal(result.data.status, 'DRAFT');
  }
});

test('validateCreateRoute rejects missing mountainId or name', () => {
  const result = validateCreateRoute({
    name: '',
  });

  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.errors.mountainId);
    assert.ok(result.errors.name);
  }
});

test('validateCreateRoute rejects invalid distance and elevation', () => {
  const result = validateCreateRoute({
    mountainId: '768ee7f3-e5cf-4dfd-b8d9-6c39f1c7e9cb',
    name: 'Jalur Senaru',
    distanceKm: -5,
    elevationGainM: 9500,
    difficulty: 'UNKNOWN',
  });

  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.errors.distanceKm);
    assert.ok(result.errors.elevationGainM);
    assert.ok(result.errors.difficulty);
  }
});

test('validateUpdateRoute allows partial updates', () => {
  const result = validateUpdateRoute({
    name: 'Jalur Senaru Updated',
    difficulty: 'MODERATE',
    status: 'PUBLISHED',
  });

  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.data.name, 'Jalur Senaru Updated');
    assert.equal(result.data.difficulty, 'MODERATE');
    assert.equal(result.data.status, 'PUBLISHED');
  }
});

test('validateUpdateRoute rejects empty payload', () => {
  const result = validateUpdateRoute({});
  assert.equal(result.valid, false);
});

test('validateRouteQuery normalizes search and filters', () => {
  const query = validateRouteQuery({
    search: '  Sembalun ',
    mountainId: '768ee7f3-e5cf-4dfd-b8d9-6c39f1c7e9cb',
    status: 'PUBLISHED',
    difficulty: 'HARD',
    limit: '200',
    offset: '10',
  });

  assert.equal(query.search, 'Sembalun');
  assert.equal(query.mountainId, '768ee7f3-e5cf-4dfd-b8d9-6c39f1c7e9cb');
  assert.equal(query.status, 'PUBLISHED');
  assert.equal(query.difficulty, 'HARD');
  assert.equal(query.limit, 100);
  assert.equal(query.offset, 10);
});
