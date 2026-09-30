import 'server-only';
import type {
  AdminBookingItem,
  BookingStatus,
  TripSchedule,
} from '@wildera/types';
import { fetchAdminApi } from './admin-session';

export const bookingStatusOrder: BookingStatus[] = [
  'INQUIRY',
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

export interface DashboardData {
  tripCount: number;
  openScheduleCount: number;
  bookingCount: number;
  inquiryCount: number;
  newInquiryCount: number;
  mediaCount: number;
  bookingsByStatus: Record<BookingStatus, number>;
  recentBookings: AdminBookingItem[];
  upcomingSchedules: TripSchedule[];
  failed: boolean;
}

interface Listing<T> {
  items: T[];
  total: number;
}

/** API responses differ slightly per module; accept all known list shapes. */
function readListing<T>(json: unknown): Listing<T> {
  const body = (json ?? {}) as Record<string, unknown>;
  const inner = (
    body.data && !Array.isArray(body.data) ? body.data : body
  ) as Record<string, unknown>;
  const raw = Array.isArray(body.data)
    ? body.data
    : (inner.items ?? inner.data ?? []);
  const items = Array.isArray(raw) ? (raw as T[]) : [];
  const pagination = (inner.pagination ?? {}) as Record<string, unknown>;
  const total = [
    inner.total,
    pagination.totalItems,
    inner.totalItems,
    body.total,
  ]
    .map(Number)
    .find((n) => Number.isFinite(n));
  return { items, total: total ?? items.length };
}

async function load<T>(path: string): Promise<Listing<T> | null> {
  try {
    const res = await fetchAdminApi(path);
    if (!res.ok) return null;
    return readListing<T>(await res.json());
  } catch {
    return null;
  }
}

const skipped = Promise.resolve<Listing<never>>({ items: [], total: 0 });

/** Booking and inquiry endpoints are operational-only; CONTENT staff skip them. */
export async function loadDashboardData(
  operational: boolean,
): Promise<DashboardData> {
  const today = new Date().toISOString().slice(0, 10);
  const [
    trips,
    openSchedules,
    bookings,
    inquiries,
    newInquiries,
    media,
    recent,
    upcoming,
    ...statusCounts
  ] = await Promise.all([
    load('admin/trips?pageSize=1'),
    load('admin/schedules?status=OPEN&pageSize=1'),
    operational ? load('admin/bookings?pageSize=1') : skipped,
    operational ? load('admin/private-trip-inquiries?pageSize=1') : skipped,
    operational
      ? load('admin/private-trip-inquiries?status=NEW&pageSize=1')
      : skipped,
    load('admin/media?limit=1'),
    operational
      ? load<AdminBookingItem>('admin/bookings?pageSize=5&sortOrder=desc')
      : skipped,
    load<TripSchedule>(
      `admin/schedules?status=OPEN&fromDate=${today}&pageSize=5`,
    ),
    ...bookingStatusOrder.map((status) =>
      operational
        ? load(`admin/bookings?status=${status}&pageSize=1`)
        : skipped,
    ),
  ]);

  const all = [
    trips,
    openSchedules,
    bookings,
    inquiries,
    newInquiries,
    media,
    recent,
    upcoming,
    ...statusCounts,
  ];

  const bookingsByStatus = Object.fromEntries(
    bookingStatusOrder.map((status, i) => [
      status,
      statusCounts[i]?.total ?? 0,
    ]),
  ) as Record<BookingStatus, number>;

  return {
    tripCount: trips?.total ?? 0,
    openScheduleCount: openSchedules?.total ?? 0,
    bookingCount: bookings?.total ?? 0,
    inquiryCount: inquiries?.total ?? 0,
    newInquiryCount: newInquiries?.total ?? 0,
    mediaCount: media?.total ?? 0,
    bookingsByStatus,
    recentBookings: recent?.items ?? [],
    upcomingSchedules: (upcoming?.items ?? []).sort(
      (a, b) => +new Date(a.startDate) - +new Date(b.startDate),
    ),
    failed: all.some((r) => r === null),
  };
}
