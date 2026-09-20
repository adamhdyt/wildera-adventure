import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildBookingWhatsAppMessage,
  buildGlobalWhatsAppMessage,
  buildHealthRequirementWhatsAppMessage,
  buildPrivateTripWhatsAppMessage,
  buildWhatsAppUrl,
  normalizePhoneNumber,
} from '@wildera/validation';

test('normalizePhoneNumber normalizes Indonesian formats and strips special characters', () => {
  assert.equal(normalizePhoneNumber('081234567890'), '6281234567890');
  assert.equal(normalizePhoneNumber('+62 812-3456-7890'), '6281234567890');
  assert.equal(normalizePhoneNumber('6281234567890'), '6281234567890');
  assert.equal(normalizePhoneNumber(''), '6281234567890'); // default fallback
});

test('buildBookingWhatsAppMessage formats trip booking details properly without sensitive information', () => {
  const message = buildBookingWhatsAppMessage({
    tripName: 'Open Trip Gunung Prau',
    scheduleDates: '19–20 September 2026',
    packageName: 'Start Jakarta',
    priceFormatted: 'Rp1.250.000',
  });

  const expected = [
    'Halo Wildera Adventure 👋',
    '',
    'Saya tertarik dengan:',
    '',
    'Trip: Open Trip Gunung Prau',
    'Jadwal: 19–20 September 2026',
    'Paket: Start Jakarta',
    'Harga: Rp1.250.000',
    '',
    'Mohon info untuk proses booking selanjutnya.',
  ].join('\n');

  assert.equal(message, expected);
});

test('buildHealthRequirementWhatsAppMessage formats health consultation message properly', () => {
  const message = buildHealthRequirementWhatsAppMessage(
    'Open Trip Rinjani Summit 4D3N',
  );

  assert.ok(message.includes('Halo Wildera Adventure 👋'));
  assert.ok(message.includes('Open Trip Rinjani Summit 4D3N'));
  assert.ok(message.includes('surat keterangan sehat'));
});

test('buildGlobalWhatsAppMessage formats general inquiry message properly', () => {
  const message = buildGlobalWhatsAppMessage();
  assert.ok(message.includes('Halo Wildera Adventure 👋'));
  assert.ok(message.includes('jadwal trip pendakian'));
});

test('buildPrivateTripWhatsAppMessage formats custom private trip consultation message', () => {
  const generalPrivate = buildPrivateTripWhatsAppMessage();
  assert.ok(generalPrivate.includes('konsultasi pembuatan Private Trip.'));

  const mountainPrivate = buildPrivateTripWhatsAppMessage('Gunung Rinjani');
  assert.ok(
    mountainPrivate.includes(
      'konsultasi pembuatan Private Trip untuk Gunung Rinjani.',
    ),
  );
});

test('buildWhatsAppUrl constructs full valid wa.me URL with normalized phone and encoded message', () => {
  const url = buildWhatsAppUrl('0812-3456-7890', 'Halo Wildera Adventure 👋');

  assert.equal(
    url,
    'https://wa.me/6281234567890?text=Halo%20Wildera%20Adventure%20%F0%9F%91%8B',
  );
});
