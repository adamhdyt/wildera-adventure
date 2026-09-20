import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  computeAvailability,
  validateCreateSchedule,
  validateScheduleQuery,
  validateUpdateSchedule,
} from '@wildera/validation';

test('validateCreateSchedule succeeds with valid payload', () => {
  const result = validateCreateSchedule({
    tripId: 'a0000000-0000-0000-0000-000000000001',
    startDate: '2026-09-19',
    endDate: '2026-09-21',
    registrationDeadline: '2026-09-18T18:00:00Z',
    capacity: 20,
    minimumParticipants: 8,
    notes: 'Jadwal open trip libur akhir pekan',
  });

  assert.equal(result.valid, true);
  assert.equal(result.data!.capacity, 20);
  assert.equal(result.data!.minimumParticipants, 8);
  assert.equal(result.data!.startDate, '2026-09-19');
});

test('validateCreateSchedule rejects invalid dates, negative capacity, or minimum > capacity', () => {
  const badDate = validateCreateSchedule({
    tripId: 'a0000000-0000-0000-0000-000000000001',
    startDate: '2026-09-25',
    endDate: '2026-09-20', // end < start
    capacity: 10,
  });
  assert.equal(badDate.valid, false);

  const badCapacity = validateCreateSchedule({
    tripId: 'a0000000-0000-0000-0000-000000000001',
    startDate: '2026-09-19',
    endDate: '2026-09-21',
    capacity: 0,
  });
  assert.equal(badCapacity.valid, false);

  const badMin = validateCreateSchedule({
    tripId: 'a0000000-0000-0000-0000-000000000001',
    startDate: '2026-09-19',
    endDate: '2026-09-21',
    capacity: 10,
    minimumParticipants: 15,
  });
  assert.equal(badMin.valid, false);
});

test('validateUpdateSchedule allows partial fields and validates status', () => {
  const result = validateUpdateSchedule({
    capacity: 25,
    status: 'OPEN',
  });
  assert.equal(result.valid, true);
  assert.equal(result.data!.capacity, 25);
  assert.equal(result.data!.status, 'OPEN');

  const badStatus = validateUpdateSchedule({
    status: 'UNKNOWN_STATUS',
  });
  assert.equal(badStatus.valid, false);
});

test('computeAvailability calculates remaining seats and availability status', () => {
  const full = computeAvailability(20, 20);
  assert.equal(full.availableSeats, 0);
  assert.equal(full.availabilityStatus, 'SOLD_OUT');

  const almostFull = computeAvailability(20, 18);
  assert.equal(almostFull.availableSeats, 2);
  assert.equal(almostFull.availabilityStatus, 'ALMOST_FULL');

  const available = computeAvailability(20, 5);
  assert.equal(available.availableSeats, 15);
  assert.equal(available.availabilityStatus, 'AVAILABLE');
});

test('validateScheduleQuery parses filters and clamps pageSize', () => {
  const query = validateScheduleQuery({
    status: 'OPEN',
    page: '2',
    pageSize: '200',
  });

  assert.equal(query.status, 'OPEN');
  assert.equal(query.page, 2);
  assert.equal(query.pageSize, 100);
});
