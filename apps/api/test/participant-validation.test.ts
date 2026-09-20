import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validateCreateParticipant,
  validateUpdateParticipant,
} from '@wildera/validation';

test('validateCreateParticipant: valid payload returns valid: true', () => {
  const result = validateCreateParticipant({
    fullName: 'Joko Widodo',
    gender: 'MALE',
    dateOfBirth: '1980-05-15',
    phone: '081234567890',
    identityType: 'KTP',
    identityNumber: '3171012345670001',
    emergencyContactName: 'Iriana',
    emergencyContactPhone: '081298765432',
    notes: 'Alergi seafood',
  });

  assert.equal(result.valid, true);
  assert.equal(result.data?.fullName, 'Joko Widodo');
  assert.equal(result.data?.gender, 'MALE');
  assert.equal(result.data?.identityType, 'KTP');
  assert.equal(result.data?.identityNumber, '3171012345670001');
  assert.equal(result.data?.notes, 'Alergi seafood');
});

test('validateCreateParticipant: fails when fullName is missing or too short', () => {
  const res1 = validateCreateParticipant({
    fullName: 'A',
  });
  assert.equal(res1.valid, false);
  assert.ok(res1.errors?.fullName);

  const res2 = validateCreateParticipant({});
  assert.equal(res2.valid, false);
  assert.ok(res2.errors?.fullName);
});

test('validateCreateParticipant: fails on invalid gender or date format', () => {
  const res = validateCreateParticipant({
    fullName: 'Valid Name',
    gender: 'UNKNOWN',
    dateOfBirth: 'invalid-date',
  });
  assert.equal(res.valid, false);
  assert.ok(res.errors?.gender);
  assert.ok(res.errors?.dateOfBirth);
});

test('validateUpdateParticipant: partial updates work correctly', () => {
  const result = validateUpdateParticipant({
    fullName: 'Updated Name',
    notes: 'Updated notes',
  });

  assert.equal(result.valid, true);
  assert.equal(result.data?.fullName, 'Updated Name');
  assert.equal(result.data?.notes, 'Updated notes');
});
