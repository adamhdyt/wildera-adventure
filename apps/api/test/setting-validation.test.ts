import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  validateUpdateSetting,
  SUPPORTED_SETTING_KEYS,
} from '@wildera/validation';

describe('Site Settings Validation (STEP 32)', () => {
  describe('Whitelisting & Security', () => {
    it('rejects unsupported or secret setting keys', () => {
      const secretKeys = [
        'database_password',
        'session_secret',
        'jwt_secret',
        'internal_api_key',
        'arbitrary_key',
      ];
      for (const key of secretKeys) {
        const res = validateUpdateSetting(key, { value: 'secret' });
        assert.equal(res.valid, false);
        assert.ok(res.errors?.key);
      }
    });

    it('rejects non-object or missing value payload', () => {
      const res1 = validateUpdateSetting('business_whatsapp', null);
      assert.equal(res1.valid, false);
      assert.ok(res1.errors?.body);

      const res2 = validateUpdateSetting('business_whatsapp', {});
      assert.equal(res2.valid, false);
      assert.ok(res2.errors?.value);
    });

    it('contains exactly the 4 required supported keys', () => {
      assert.deepEqual(
        [...SUPPORTED_SETTING_KEYS],
        [
          'business_whatsapp',
          'instagram_url',
          'contact_email',
          'almost_full_percentage',
        ],
      );
    });
  });

  describe('business_whatsapp', () => {
    it('accepts valid Indonesian phone numbers and normalizes them', () => {
      const res1 = validateUpdateSetting('business_whatsapp', {
        value: '6281234567890',
      });
      assert.equal(res1.valid, true);
      assert.equal(res1.data?.value, '6281234567890');

      const res2 = validateUpdateSetting('business_whatsapp', {
        value: '081234567890',
      });
      assert.equal(res2.valid, true);
      assert.equal(res2.data?.value, '6281234567890');

      const res3 = validateUpdateSetting('business_whatsapp', {
        value: '+62 812-3456-7890',
      });
      assert.equal(res3.valid, true);
      assert.equal(res3.data?.value, '6281234567890');
    });

    it('rejects invalid or too short numbers', () => {
      const res1 = validateUpdateSetting('business_whatsapp', { value: '123' });
      assert.equal(res1.valid, false);
      assert.ok(res1.errors?.value);

      const res2 = validateUpdateSetting('business_whatsapp', { value: 12345 });
      assert.equal(res2.valid, false);
      assert.ok(res2.errors?.value);
    });
  });

  describe('instagram_url', () => {
    it('accepts valid HTTP/HTTPS URLs', () => {
      const res = validateUpdateSetting('instagram_url', {
        value: 'https://instagram.com/wildera.adventure',
      });
      assert.equal(res.valid, true);
      assert.equal(res.data?.value, 'https://instagram.com/wildera.adventure');
    });

    it('rejects URLs without http/https protocol', () => {
      const res = validateUpdateSetting('instagram_url', {
        value: 'instagram.com/wildera',
      });
      assert.equal(res.valid, false);
      assert.ok(res.errors?.value);
    });
  });

  describe('contact_email', () => {
    it('accepts valid email format and lowercases it', () => {
      const res = validateUpdateSetting('contact_email', {
        value: 'Info@Wildera.ID',
      });
      assert.equal(res.valid, true);
      assert.equal(res.data?.value, 'info@wildera.id');
    });

    it('rejects invalid email addresses', () => {
      const res = validateUpdateSetting('contact_email', {
        value: 'not-an-email',
      });
      assert.equal(res.valid, false);
      assert.ok(res.errors?.value);
    });
  });

  describe('almost_full_percentage', () => {
    it('accepts integers between 1 and 100', () => {
      const res1 = validateUpdateSetting('almost_full_percentage', {
        value: 20,
      });
      assert.equal(res1.valid, true);
      assert.equal(res1.data?.value, 20);

      const res2 = validateUpdateSetting('almost_full_percentage', {
        value: '25',
      });
      assert.equal(res2.valid, true);
      assert.equal(res2.data?.value, 25);
    });

    it('rejects values out of range or non-integers', () => {
      const res1 = validateUpdateSetting('almost_full_percentage', {
        value: 0,
      });
      assert.equal(res1.valid, false);
      assert.ok(res1.errors?.value);

      const res2 = validateUpdateSetting('almost_full_percentage', {
        value: 101,
      });
      assert.equal(res2.valid, false);
      assert.ok(res2.errors?.value);

      const res3 = validateUpdateSetting('almost_full_percentage', {
        value: 'abc',
      });
      assert.equal(res3.valid, false);
      assert.ok(res3.errors?.value);
    });
  });
});
