import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validateCreateTrip,
  validateTripQuery,
  validateUpdateTrip,
  validateUpdateTripContent,
} from '@wildera/validation';

test('validateCreateTrip succeeds with valid payload and auto slug', () => {
  const result = validateCreateTrip({
    mountainId: '11111111-1111-1111-1111-111111111111',
    name: 'Open Trip Rinjani 3D2N',
    tripType: 'OPEN_TRIP',
    durationDays: 3,
    durationNights: 2,
    difficulty: 'HARD',
    beginnerFriendly: false,
    healthCertificateRequired: true,
    minimumAge: 15,
  });

  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.data.slug, 'open-trip-rinjani-3d2n');
    assert.equal(result.data.durationDays, 3);
    assert.equal(result.data.durationNights, 2);
    assert.equal(result.data.difficulty, 'HARD');
    assert.equal(result.data.status, 'DRAFT');
  }
});

test('validateCreateTrip rejects missing mountainId and invalid duration', () => {
  const result = validateCreateTrip({
    name: 'Trip Invalid',
    tripType: 'OPEN_TRIP',
    durationDays: 0,
  });

  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.errors.mountainId);
    assert.ok(result.errors.durationDays);
  }
});

test('validateCreateTrip rejects invalid maximumAge < minimumAge', () => {
  const result = validateCreateTrip({
    mountainId: '11111111-1111-1111-1111-111111111111',
    name: 'Trip Age Invalid',
    tripType: 'OPEN_TRIP',
    durationDays: 2,
    minimumAge: 20,
    maximumAge: 15,
  });

  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.errors.maximumAge);
  }
});

test('validateUpdateTrip allows partial updates', () => {
  const result = validateUpdateTrip({
    featured: true,
    status: 'PUBLISHED',
  });

  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.data.featured, true);
    assert.equal(result.data.status, 'PUBLISHED');
  }
});

test('validateUpdateTrip rejects empty payload', () => {
  const result = validateUpdateTrip({});
  assert.equal(result.valid, false);
});

test('validateTripQuery normalizes search, filters and pagination', () => {
  const query = validateTripQuery({
    search: '  rinjani  ',
    tripType: 'OPEN_TRIP',
    status: 'PUBLISHED',
    featured: 'true',
    limit: '200',
    offset: '-5',
  });

  assert.equal(query.search, 'rinjani');
  assert.equal(query.tripType, 'OPEN_TRIP');
  assert.equal(query.status, 'PUBLISHED');
  assert.equal(query.featured, true);
  assert.equal(query.limit, 100);
  assert.equal(query.offset, 0);
});

test('validateUpdateTripContent validates nested itinerary, facilities, gears, and faqs', () => {
  const result = validateUpdateTripContent({
    itineraries: [
      {
        dayNumber: 1,
        title: 'Tiba di Sembalun & Aklimatisasi',
        description: 'Tiba di basecamp dan briefing.',
      },
      {
        dayNumber: 2,
        title: 'Pendakian ke Plawangan Sembalun',
      },
    ],
    facilities: [
      {
        facilityType: 'INCLUDE',
        name: 'Tenda & Matras',
      },
      {
        facilityType: 'EXCLUDE',
        name: 'Pengeluaran Pribadi',
      },
    ],
    gears: [
      {
        gearType: 'MANDATORY',
        name: 'Sepatu Trekking',
      },
      {
        gearType: 'RECOMMENDED',
        name: 'Trekking Pole',
      },
    ],
    faqs: [
      {
        question: 'Apakah ramah pemula?',
        answer: 'Rute ini disarankan bagi yang memiliki fisik prima.',
        status: 'PUBLISHED',
      },
    ],
  });

  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.data.itineraries?.length, 2);
    assert.equal(result.data.facilities?.length, 2);
    assert.equal(result.data.gears?.length, 2);
    assert.equal(result.data.faqs?.length, 1);
  }
});

test('validateUpdateTripContent rejects duplicate dayNumber in itineraries', () => {
  const result = validateUpdateTripContent({
    itineraries: [
      { dayNumber: 1, title: 'Hari 1 A' },
      { dayNumber: 1, title: 'Hari 1 B' },
    ],
  });

  assert.equal(result.valid, false);
});
