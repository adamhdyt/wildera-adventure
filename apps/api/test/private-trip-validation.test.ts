import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCreatePrivateTripInquiry,
  validateUpdatePrivateTripInquiry,
  validatePrivateTripInquiryQuery,
} from '@wildera/validation';

test('Private Trip Inquiry Validation - Create', async (t) => {
  await t.test('accepts valid payload with mountainId', () => {
    const res = validateCreatePrivateTripInquiry({
      mountainId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      customerName: 'Aditya Pratama',
      whatsappNumber: '081234567890',
      preferredDate: '2026-11-20',
      participantCount: 5,
      meetingPointRequest: 'Bandara Juanda Surabaya',
      budget: 15000000,
      requirements: 'Butuh porter pribadi 2 orang',
    });

    assert.equal(res.valid, true);
    assert.equal(res.data?.customerName, 'Aditya Pratama');
    assert.equal(res.data?.mountainId, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d');
    assert.equal(res.data?.participantCount, 5);
    assert.equal(res.data?.budget, 15000000);
  });

  await t.test('accepts valid payload with custom destination text', () => {
    const res = validateCreatePrivateTripInquiry({
      destination: 'Gunung Argopuro 5D4N via Baderan',
      customerName: 'Siti Rahma',
      whatsappNumber: '082233445566',
      preferredDate: '2026-12-01',
      alternativeDate: '2026-12-10',
      participantCount: 8,
      meetingPointRequest: 'Stasiun Pasar Senen',
    });

    assert.equal(res.valid, true);
    assert.equal(
      res.data?.destinationOther,
      'Gunung Argopuro 5D4N via Baderan',
    );
    assert.equal(res.data?.participantCount, 8);
  });

  await t.test('rejects missing required fields', () => {
    const res = validateCreatePrivateTripInquiry({});
    assert.equal(res.valid, false);
    assert.ok(res.errors?.customerName);
    assert.ok(res.errors?.whatsappNumber);
    assert.ok(res.errors?.preferredDate);
    assert.ok(res.errors?.participantCount);
    assert.ok(res.errors?.meetingPointRequest);
    assert.ok(res.errors?.destination);
  });

  await t.test('rejects invalid participant count', () => {
    const res = validateCreatePrivateTripInquiry({
      destination: 'Gunung Rinjani',
      customerName: 'Budi',
      whatsappNumber: '08123456789',
      preferredDate: '2026-10-10',
      meetingPointRequest: 'Mataram',
      participantCount: 0,
    });
    assert.equal(res.valid, false);
    assert.ok(res.errors?.participantCount);
  });
});

test('Private Trip Inquiry Validation - Update', async (t) => {
  await t.test('accepts valid status pipeline values', () => {
    const statuses = [
      'NEW',
      'CONTACTED',
      'QUOTATION_SENT',
      'NEGOTIATION',
      'BOOKED',
      'LOST',
    ] as const;

    for (const status of statuses) {
      const res = validateUpdatePrivateTripInquiry({
        status,
        adminNotes: `Status changed to ${status}`,
      });
      assert.equal(res.valid, true);
      assert.equal(res.data?.status, status);
      assert.equal(res.data?.adminNotes, `Status changed to ${status}`);
    }
  });

  await t.test('rejects invalid status', () => {
    const res = validateUpdatePrivateTripInquiry({
      status: 'INVALID_STATUS',
    });
    assert.equal(res.valid, false);
    assert.ok(res.errors?.status);
  });
});

test('Private Trip Inquiry Validation - Query', async (t) => {
  await t.test('parses query filters correctly', () => {
    const res = validatePrivateTripInquiryQuery({
      status: 'NEW',
      search: 'Aditya',
      page: '2',
      pageSize: '15',
    });
    assert.equal(res.valid, true);
    assert.equal(res.data?.status, 'NEW');
    assert.equal(res.data?.search, 'Aditya');
    assert.equal(res.data?.page, 2);
    assert.equal(res.data?.pageSize, 15);
  });
});
