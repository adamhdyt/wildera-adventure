import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import type { AnalyticsEventName } from '@wildera/types';
import {
  VALID_ANALYTICS_EVENTS,
  sanitizeAnalyticsProperties,
  validateAnalyticsEvent,
} from '@wildera/validation';

describe('Analytics Validation & PII Sanitizer (STEP 35)', () => {
  describe('VALID_ANALYTICS_EVENTS', () => {
    test('contains all 8 P0 required event names per roadmap', () => {
      const required: AnalyticsEventName[] = [
        'view_home',
        'view_trip_list',
        'view_trip',
        'select_schedule',
        'select_package',
        'click_book_whatsapp',
        'click_health_whatsapp',
        'private_trip_inquiry',
      ];

      for (const eventName of required) {
        assert.ok(
          VALID_ANALYTICS_EVENTS.includes(eventName),
          `Missing event: ${eventName}`,
        );
      }
      assert.equal(VALID_ANALYTICS_EVENTS.length, 8);
    });
  });

  describe('validateAnalyticsEvent', () => {
    test('accepts all 8 valid events with non-PII properties', () => {
      for (const event of VALID_ANALYTICS_EVENTS) {
        const res = validateAnalyticsEvent({
          event,
          properties: {
            tripSlug: 'rinjani-summit',
            count: 2,
          },
        });
        assert.equal(res.valid, true);
        assert.equal(res.data?.event, event);
        assert.equal(res.data?.properties.tripSlug, 'rinjani-summit');
      }
    });

    test('rejects invalid or unknown event names', () => {
      const res = validateAnalyticsEvent({
        event: 'invalid_event_name',
        properties: {},
      });
      assert.equal(res.valid, false);
      assert.ok(res.errors?.event);
    });

    test('rejects empty or non-object payloads', () => {
      assert.equal(validateAnalyticsEvent(null).valid, false);
      assert.equal(validateAnalyticsEvent(undefined).valid, false);
      assert.equal(validateAnalyticsEvent('event_string').valid, false);
    });

    test('auto-generates valid ISO timestamp when omitted', () => {
      const res = validateAnalyticsEvent({
        event: 'view_home',
      });
      assert.equal(res.valid, true);
      assert.ok(res.data?.timestamp);
      assert.doesNotThrow(() => new Date(res.data!.timestamp).toISOString());
    });
  });

  describe('sanitizeAnalyticsProperties (PII Protection)', () => {
    test('strictly strips all prohibited PII fields', () => {
      const raw = {
        tripSlug: 'rinjani-summit',
        price: 2500000,
        // PII fields that must NEVER reach analytics
        phone: '08123456789',
        phoneNumber: '08123456789',
        whatsapp: '+6281234567890',
        whatsappNumber: '6281234567890',
        email: 'user@example.com',
        contactEmail: 'user@example.com',
        name: 'Budi Santoso',
        fullName: 'Budi Santoso',
        customerName: 'Budi Santoso',
        identity: '3201234567890001',
        identityNumber: '3201234567890001',
        nik: '3201234567890001',
        passport: 'A1234567',
        medical: 'Asma kronis',
        medicalData: { heartCondition: true },
        medicalHistory: 'Pernah patah tulang',
        healthNote: 'Perlu tabung oksigen',
        allergies: 'Alergi dingin',
        emergencyContact: 'Ibu Budi',
        emergencyPhone: '081298765432',
      };

      const sanitized = sanitizeAnalyticsProperties(raw);

      // Prohibited PII must be completely removed
      assert.equal(sanitized.phone, undefined);
      assert.equal(sanitized.phoneNumber, undefined);
      assert.equal(sanitized.whatsapp, undefined);
      assert.equal(sanitized.whatsappNumber, undefined);
      assert.equal(sanitized.email, undefined);
      assert.equal(sanitized.contactEmail, undefined);
      assert.equal(sanitized.name, undefined);
      assert.equal(sanitized.fullName, undefined);
      assert.equal(sanitized.customerName, undefined);
      assert.equal(sanitized.identity, undefined);
      assert.equal(sanitized.identityNumber, undefined);
      assert.equal(sanitized.nik, undefined);
      assert.equal(sanitized.passport, undefined);
      assert.equal(sanitized.medical, undefined);
      assert.equal(sanitized.medicalData, undefined);
      assert.equal(sanitized.medicalHistory, undefined);
      assert.equal(sanitized.healthNote, undefined);
      assert.equal(sanitized.allergies, undefined);
      assert.equal(sanitized.emergencyContact, undefined);
      assert.equal(sanitized.emergencyPhone, undefined);

      // Safe non-PII properties must be preserved
      assert.equal(sanitized.tripSlug, 'rinjani-summit');
      assert.equal(sanitized.price, 2500000);
    });

    test('strips arbitrary keys whose values look like emails or phone numbers', () => {
      const raw = {
        destination: 'Gunung Rinjani',
        customField1: 'john.doe@example.com',
        customField2: '+628123456789',
        customField3: '081987654321',
      };

      const sanitized = sanitizeAnalyticsProperties(raw);

      assert.equal(sanitized.destination, 'Gunung Rinjani');
      assert.equal(sanitized.customField1, undefined);
      assert.equal(sanitized.customField2, undefined);
      assert.equal(sanitized.customField3, undefined);
    });
  });
});
