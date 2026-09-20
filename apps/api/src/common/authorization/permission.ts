export enum Permission {
  ADMIN_MANAGE = 'admin.manage',
  AUDIT_VIEW = 'audit.view',
  AUDIT_VIEW_LIMITED = 'audit.view_limited',
  BOOKING_CANCEL = 'booking.cancel',
  BOOKING_CONFIRM = 'booking.confirm',
  BOOKING_MANAGE = 'booking.manage',
  BOOKING_VIEW = 'booking.view',
  CATALOG_MANAGE = 'catalog.manage',
  CATALOG_VIEW = 'catalog.view',
  CONTENT_MANAGE = 'content.manage',
  CONTENT_VIEW = 'content.view',
  DASHBOARD_VIEW = 'dashboard.view',
  PARTICIPANT_MANAGE = 'participant.manage',
  PARTICIPANT_SENSITIVE_VIEW = 'participant.sensitive_view',
  PARTICIPANT_VIEW = 'participant.view',
  PRIVATE_TRIP_MANAGE = 'private_trip.manage',
  PRIVATE_TRIP_VIEW = 'private_trip.view',
  SCHEDULE_MANAGE = 'schedule.manage',
  SCHEDULE_VIEW = 'schedule.view',
  SETTING_MANAGE = 'setting.manage',
  SETTING_VIEW = 'setting.view',
  TRIP_MANAGE = 'trip.manage',
  TRIP_PUBLISH = 'trip.publish',
  TRIP_VIEW = 'trip.view',
}

export type AdminRole = 'CONTENT' | 'OPERATIONS' | 'SUPER_ADMIN';

const permissionsByRole: Record<
  Exclude<AdminRole, 'SUPER_ADMIN'>,
  ReadonlySet<Permission>
> = {
  OPERATIONS: new Set([
    Permission.AUDIT_VIEW_LIMITED,
    Permission.BOOKING_CANCEL,
    Permission.BOOKING_CONFIRM,
    Permission.BOOKING_MANAGE,
    Permission.BOOKING_VIEW,
    Permission.CATALOG_MANAGE,
    Permission.CATALOG_VIEW,
    Permission.CONTENT_VIEW,
    Permission.DASHBOARD_VIEW,
    Permission.PARTICIPANT_MANAGE,
    Permission.PARTICIPANT_SENSITIVE_VIEW,
    Permission.PARTICIPANT_VIEW,
    Permission.PRIVATE_TRIP_MANAGE,
    Permission.PRIVATE_TRIP_VIEW,
    Permission.SCHEDULE_MANAGE,
    Permission.SCHEDULE_VIEW,
    Permission.SETTING_VIEW,
    Permission.TRIP_MANAGE,
    Permission.TRIP_PUBLISH,
    Permission.TRIP_VIEW,
  ]),
  CONTENT: new Set([
    Permission.CATALOG_MANAGE,
    Permission.CATALOG_VIEW,
    Permission.CONTENT_MANAGE,
    Permission.CONTENT_VIEW,
    Permission.DASHBOARD_VIEW,
    Permission.SCHEDULE_VIEW,
    Permission.SETTING_VIEW,
    Permission.TRIP_MANAGE,
    Permission.TRIP_PUBLISH,
    Permission.TRIP_VIEW,
  ]),
};

export function hasPermissions(
  roles: readonly string[],
  required: readonly Permission[],
) {
  if (roles.includes('SUPER_ADMIN')) return true;
  return required.every((permission) =>
    roles.some(
      (role) =>
        (role === 'OPERATIONS' || role === 'CONTENT') &&
        permissionsByRole[role].has(permission),
    ),
  );
}
