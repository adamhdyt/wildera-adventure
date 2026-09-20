import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateTripPublish } from '@wildera/validation';

test('validateTripPublish rejects incomplete trip without cover and itinerary', () => {
  const result = validateTripPublish({
    name: 'Trip Rinjani Test',
    slug: 'trip-rinjani-test',
    mountainId: '768903c7-4ee4-42b7-862d-0599a0d2f099',
    durationDays: 3,
    difficulty: 'HARD',
    description: 'Deskripsi lengkap...',
    hasCoverImage: false,
    itineraryCount: 0,
  });

  assert.equal(result.ready, false);
  assert.equal(result.errors.coverImage, 'Cover image wajib diisi.');
  assert.equal(
    result.errors.itinerary,
    'Itinerary minimal 1 hari wajib diisi.',
  );
});

test('validateTripPublish accepts complete trip with cover and itinerary', () => {
  const result = validateTripPublish({
    name: 'Trip Rinjani Test',
    slug: 'trip-rinjani-test',
    mountainId: '768903c7-4ee4-42b7-862d-0599a0d2f099',
    durationDays: 3,
    difficulty: 'HARD',
    description: 'Deskripsi lengkap...',
    hasCoverImage: true,
    itineraryCount: 2,
  });

  assert.equal(result.ready, true);
  assert.deepEqual(result.errors, {});
});
