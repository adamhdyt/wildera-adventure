import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validateCreateMountain,
  validateMountainQuery,
  validateUpdateMountain,
} from '@wildera/validation';

test('validateCreateMountain succeeds with valid payload and auto slug', () => {
  const res = validateCreateMountain({
    destinationId: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Gunung Rinjani',
    altitudeM: 3726,
    defaultDifficulty: 'HARD',
  });

  assert.equal(res.valid, true);
  assert.equal(res.data?.name, 'Gunung Rinjani');
  assert.equal(res.data?.slug, 'gunung-rinjani');
  assert.equal(res.data?.altitudeM, 3726);
  assert.equal(res.data?.defaultDifficulty, 'HARD');
  assert.equal(res.data?.status, 'DRAFT');
});

test('validateCreateMountain rejects missing destinationId and name', () => {
  const res = validateCreateMountain({});
  assert.equal(res.valid, false);
  assert.ok(res.errors?.destinationId);
  assert.ok(res.errors?.name);
});

test('validateCreateMountain rejects invalid altitude and difficulty', () => {
  const res = validateCreateMountain({
    destinationId: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Gunung Bromo',
    altitudeM: -50,
    defaultDifficulty: 'IMPOSSIBLE',
  });
  assert.equal(res.valid, false);
  assert.ok(res.errors?.altitudeM);
  assert.ok(res.errors?.defaultDifficulty);
});

test('validateUpdateMountain allows partial update', () => {
  const res = validateUpdateMountain({
    altitudeM: 3726,
  });
  assert.equal(res.valid, true);
  assert.equal(res.data?.altitudeM, 3726);
});

test('validateUpdateMountain rejects empty update', () => {
  const res = validateUpdateMountain({});
  assert.equal(res.valid, false);
});

test('validateMountainQuery handles filters and limits', () => {
  const res = validateMountainQuery({
    search: 'Rinjani',
    difficulty: 'HARD',
    status: 'PUBLISHED',
    limit: 250,
    offset: 10,
  });
  assert.equal(res.search, 'Rinjani');
  assert.equal(res.difficulty, 'HARD');
  assert.equal(res.status, 'PUBLISHED');
  assert.equal(res.limit, 100);
  assert.equal(res.offset, 10);
});
