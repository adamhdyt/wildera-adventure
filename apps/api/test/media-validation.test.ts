import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validateImageUpload,
  validateUpdateMediaAssignment,
} from '@wildera/validation';

test('validateImageUpload accepts valid JPEG, PNG, WEBP and size <= 5MB', () => {
  const result = validateImageUpload({
    filename: 'rinjani-summit.jpg',
    mimeType: 'image/jpeg',
    size: 2 * 1024 * 1024,
  });

  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.data.extension, '.jpg');
    assert.equal(result.data.mimeType, 'image/jpeg');
  }
});

test('validateImageUpload rejects invalid extension or unsupported mime type', () => {
  const badExt = validateImageUpload({
    filename: 'script.exe',
    mimeType: 'application/octet-stream',
    size: 1024,
  });
  assert.equal(badExt.valid, false);
  if (!badExt.valid) {
    assert.ok(badExt.errors.extension);
    assert.ok(badExt.errors.mimeType);
  }

  const mismatchMime = validateImageUpload({
    filename: 'photo.jpg',
    mimeType: 'application/pdf',
    size: 1024,
  });
  assert.equal(mismatchMime.valid, false);
});

test('validateImageUpload rejects file larger than 5MB', () => {
  const tooLarge = validateImageUpload({
    filename: 'giant-photo.png',
    mimeType: 'image/png',
    size: 6 * 1024 * 1024,
  });
  assert.equal(tooLarge.valid, false);
  if (!tooLarge.valid) {
    assert.ok(tooLarge.errors.size);
  }
});

test('validateUpdateMediaAssignment parses valid cover and gallery UUIDs', () => {
  const result = validateUpdateMediaAssignment({
    coverMediaId: '51b26c54-d737-4812-9531-e0f0a4b5a252',
    galleryMediaIds: ['d2b61e51-32e7-45bb-856f-51625cd56bc1'],
  });
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(
      result.data.coverMediaId,
      '51b26c54-d737-4812-9531-e0f0a4b5a252',
    );
    assert.equal(result.data.galleryMediaIds?.length, 1);
  }
});
