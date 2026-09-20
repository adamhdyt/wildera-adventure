import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validateBookingQuery,
  validateCancelBooking,
  validateCreateBooking,
  validateUpdateBooking,
} from '@wildera/validation';

const VALID_UUID_1 = 'a0000000-0000-0000-0000-000000000001';
const VALID_UUID_2 = 'b0000000-0000-0000-0000-000000000002';

test('validateCreateBooking succeeds with valid payload', () => {
  const result = validateCreateBooking({
    scheduleId: VALID_UUID_1,
    packageId: VALID_UUID_2,
    contactName: '  Budi Santoso  ',
    contactWhatsapp: '081234567890',
    contactEmail: 'BUDI@Example.com',
    source: 'WEBSITE_WHATSAPP',
    participantCount: 2,
    totalAmount: 5000000,
    notes: 'Mohon tenda double.',
    participants: [
      {
        fullName: 'Budi Santoso',
        gender: 'MALE',
        identityType: 'KTP',
        identityNumber: '3201234567890001',
      },
      {
        fullName: 'Siti Rahma',
        gender: 'FEMALE',
      },
    ],
  });

  assert.equal(result.valid, true);
  assert.ok(result.data);
  assert.equal(result.data.scheduleId, VALID_UUID_1);
  assert.equal(result.data.packageId, VALID_UUID_2);
  assert.equal(result.data.contactName, 'Budi Santoso');
  assert.equal(result.data.contactWhatsapp, '6281234567890');
  assert.equal(result.data.contactEmail, 'budi@example.com');
  assert.equal(result.data.source, 'WEBSITE_WHATSAPP');
  assert.equal(result.data.participantCount, 2);
  assert.equal(result.data.totalAmount, 5000000);
  assert.equal(result.data.status, 'INQUIRY');
  assert.equal(result.data.notes, 'Mohon tenda double.');
  assert.equal(result.data.participants?.length, 2);
  assert.equal(result.data.participants?.[0]?.gender, 'MALE');
});

test('validateCreateBooking rejects invalid scheduleId or packageId', () => {
  const res1 = validateCreateBooking({
    scheduleId: 'invalid-id',
    packageId: VALID_UUID_2,
    contactName: 'Budi',
    contactWhatsapp: '081234567890',
    source: 'WEBSITE_WHATSAPP',
    participantCount: 1,
  });
  assert.equal(res1.valid, false);
  assert.ok(res1.errors?.scheduleId);

  const res2 = validateCreateBooking({
    scheduleId: VALID_UUID_1,
    packageId: 'invalid-id',
    contactName: 'Budi',
    contactWhatsapp: '081234567890',
    source: 'WEBSITE_WHATSAPP',
    participantCount: 1,
  });
  assert.equal(res2.valid, false);
  assert.ok(res2.errors?.packageId);
});

test('validateCreateBooking rejects invalid contact details', () => {
  const res1 = validateCreateBooking({
    scheduleId: VALID_UUID_1,
    packageId: VALID_UUID_2,
    contactName: 'A',
    contactWhatsapp: '081234567890',
    source: 'WEBSITE_WHATSAPP',
    participantCount: 1,
  });
  assert.equal(res1.valid, false);
  assert.ok(res1.errors?.contactName);

  const res2 = validateCreateBooking({
    scheduleId: VALID_UUID_1,
    packageId: VALID_UUID_2,
    contactName: 'Budi',
    contactWhatsapp: '123',
    source: 'WEBSITE_WHATSAPP',
    participantCount: 1,
  });
  assert.equal(res2.valid, false);
  assert.ok(res2.errors?.contactWhatsapp);

  const res3 = validateCreateBooking({
    scheduleId: VALID_UUID_1,
    packageId: VALID_UUID_2,
    contactName: 'Budi',
    contactWhatsapp: '081234567890',
    contactEmail: 'not-an-email',
    source: 'WEBSITE_WHATSAPP',
    participantCount: 1,
  });
  assert.equal(res3.valid, false);
  assert.ok(res3.errors?.contactEmail);
});

test('validateCreateBooking rejects invalid source, participantCount, or totalAmount', () => {
  const res1 = validateCreateBooking({
    scheduleId: VALID_UUID_1,
    packageId: VALID_UUID_2,
    contactName: 'Budi',
    contactWhatsapp: '081234567890',
    source: 'TIKTOK',
    participantCount: 1,
  });
  assert.equal(res1.valid, false);
  assert.ok(res1.errors?.source);

  const res2 = validateCreateBooking({
    scheduleId: VALID_UUID_1,
    packageId: VALID_UUID_2,
    contactName: 'Budi',
    contactWhatsapp: '081234567890',
    source: 'WEBSITE_WHATSAPP',
    participantCount: 0,
  });
  assert.equal(res2.valid, false);
  assert.ok(res2.errors?.participantCount);

  const res3 = validateCreateBooking({
    scheduleId: VALID_UUID_1,
    packageId: VALID_UUID_2,
    contactName: 'Budi',
    contactWhatsapp: '081234567890',
    source: 'WEBSITE_WHATSAPP',
    participantCount: 1,
    totalAmount: -1000,
  });
  assert.equal(res3.valid, false);
  assert.ok(res3.errors?.totalAmount);
});

test('validateUpdateBooking validates partial update payload', () => {
  const result = validateUpdateBooking({
    contactName: 'Budi Santoso Updated',
    participantCount: 4,
    notes: 'Tambahan porter',
  });

  assert.equal(result.valid, true);
  assert.equal(result.data?.contactName, 'Budi Santoso Updated');
  assert.equal(result.data?.participantCount, 4);
  assert.equal(result.data?.notes, 'Tambahan porter');

  const emptyRes = validateUpdateBooking({});
  assert.equal(emptyRes.valid, false);
  assert.ok(emptyRes.errors?.body);
});

test('validateCancelBooking extracts optional cancellation reason', () => {
  const res1 = validateCancelBooking({ cancellationReason: 'Peserta sakit' });
  assert.equal(res1.valid, true);
  assert.equal(res1.data?.cancellationReason, 'Peserta sakit');

  const res2 = validateCancelBooking({});
  assert.equal(res2.valid, true);
  assert.equal(res2.data?.cancellationReason, null);
});

test('validateBookingQuery parses and clamps query parameters', () => {
  const query = validateBookingQuery({
    page: '2',
    pageSize: '500',
    search: '  BK-20260919  ',
    status: 'CONFIRMED',
    source: 'WHATSAPP',
    scheduleId: VALID_UUID_1,
    sortOrder: 'asc',
  });

  assert.equal(query.page, 2);
  assert.equal(query.pageSize, 100);
  assert.equal(query.search, 'BK-20260919');
  assert.equal(query.status, 'CONFIRMED');
  assert.equal(query.source, 'WHATSAPP');
  assert.equal(query.scheduleId, VALID_UUID_1);
  assert.equal(query.sortOrder, 'asc');
});
