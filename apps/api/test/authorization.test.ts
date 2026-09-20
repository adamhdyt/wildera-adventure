import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  hasPermissions,
  Permission,
} from '../src/common/authorization/permission';

test('SUPER_ADMIN receives every permission', () => {
  for (const permission of Object.values(Permission)) {
    assert.equal(hasPermissions(['SUPER_ADMIN'], [permission]), true);
  }
});

test('OPERATIONS receives operational access and read-only content access', () => {
  assert.equal(
    hasPermissions(
      ['OPERATIONS'],
      [
        Permission.TRIP_MANAGE,
        Permission.SCHEDULE_MANAGE,
        Permission.BOOKING_CONFIRM,
        Permission.BOOKING_CANCEL,
        Permission.PARTICIPANT_SENSITIVE_VIEW,
        Permission.PRIVATE_TRIP_MANAGE,
      ],
    ),
    true,
  );
  assert.equal(hasPermissions(['OPERATIONS'], [Permission.CONTENT_VIEW]), true);
  assert.equal(
    hasPermissions(['OPERATIONS'], [Permission.CONTENT_MANAGE]),
    false,
  );
  assert.equal(
    hasPermissions(['OPERATIONS'], [Permission.ADMIN_MANAGE]),
    false,
  );
});

test('CONTENT cannot operate bookings or view sensitive participants', () => {
  assert.equal(
    hasPermissions(
      ['CONTENT'],
      [
        Permission.TRIP_MANAGE,
        Permission.TRIP_PUBLISH,
        Permission.CATALOG_MANAGE,
        Permission.CONTENT_MANAGE,
        Permission.SCHEDULE_VIEW,
      ],
    ),
    true,
  );
  for (const permission of [
    Permission.BOOKING_CONFIRM,
    Permission.BOOKING_CANCEL,
    Permission.PARTICIPANT_SENSITIVE_VIEW,
  ]) {
    assert.equal(hasPermissions(['CONTENT'], [permission]), false);
  }
});

test('unknown and empty roles do not receive permissions', () => {
  assert.equal(hasPermissions([], [Permission.TRIP_VIEW]), false);
  assert.equal(hasPermissions(['FINANCE'], [Permission.TRIP_VIEW]), false);
});
