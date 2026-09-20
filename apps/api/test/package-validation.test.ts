import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validateCreateMeetingPoint,
  validateCreatePackage,
  validateUpdateMeetingPoint,
  validateUpdatePackage,
} from '@wildera/validation';

test('validateCreateMeetingPoint succeeds with valid payload', () => {
  const result = validateCreateMeetingPoint({
    name: 'Basecamp Sembalun',
    city: 'Lombok Timur',
    address: 'Jl. Raya Sembalun No. 10',
    latitude: -8.35,
    longitude: 116.52,
    status: 'ACTIVE',
  });

  assert.equal(result.valid, true);
  assert.equal(result.data!.name, 'Basecamp Sembalun');
  assert.equal(result.data!.city, 'Lombok Timur');
  assert.equal(result.data!.status, 'ACTIVE');
});

test('validateCreateMeetingPoint rejects missing name and invalid coordinates', () => {
  const result = validateCreateMeetingPoint({
    name: '   ',
    latitude: 95, // out of range
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors?.name);
  assert.ok(result.errors?.latitude);
});

test('validateUpdateMeetingPoint allows partial updates', () => {
  const result = validateUpdateMeetingPoint({
    name: 'Basecamp Sembalun Baru',
    city: 'Lombok Timur',
  });
  assert.equal(result.valid, true);
  assert.equal(result.data?.name, 'Basecamp Sembalun Baru');
  assert.equal(result.data?.city, 'Lombok Timur');
});

test('validateCreatePackage succeeds with valid payload and price', () => {
  const result = validateCreatePackage({
    name: 'Start Basecamp Sembalun',
    price: 750000,
    description: 'Termasuk tiket simaksi, tenda, matras',
    sortOrder: 1,
    status: 'ACTIVE',
  });

  assert.equal(result.valid, true);
  assert.equal(result.data!.name, 'Start Basecamp Sembalun');
  assert.equal(result.data!.price, 750000);
  assert.equal(result.data!.sortOrder, 1);
});

test('validateCreatePackage CRITICAL Rule 84: rejects capacity or available_seats', () => {
  // Test with capacity
  const withCapacity = validateCreatePackage({
    name: 'Paket VIP',
    price: 1500000,
    capacity: 10,
  });

  assert.equal(withCapacity.valid, false);
  assert.ok(withCapacity.errors?.capacity);
  assert.match(withCapacity.errors!.capacity, /must NOT have capacity/);

  // Test with available_seats
  const withAvailableSeats = validateCreatePackage({
    name: 'Paket Regular',
    price: 1000000,
    available_seats: 5,
  });

  assert.equal(withAvailableSeats.valid, false);
  assert.ok(withAvailableSeats.errors?.capacity);
});

test('validateCreatePackage rejects negative price', () => {
  const result = validateCreatePackage({
    name: 'Paket Gratis Minus',
    price: -5000,
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors?.price);
});

test('validateUpdatePackage rejects capacity update', () => {
  const result = validateUpdatePackage({
    price: 850000,
    capacity: 20,
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors?.capacity);
});
