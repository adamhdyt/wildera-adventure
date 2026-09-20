/* eslint-disable @next/next/no-html-link-for-pages */
import { requireAdmin, fetchAdminApi } from '../../../../lib/admin-session';
import {
  adminSections,
  canViewSection,
} from '../../../../lib/admin-navigation';
import type {
  AdminBookingItem,
  BookingListResponse,
  Trip,
  TripSchedule,
} from '@wildera/types';
import { BookingsClient } from './bookings-client';

export default async function BookingsPage() {
  const user = await requireAdmin();
  const section = adminSections.find((item) => item.slug === 'bookings');
  if (section && !canViewSection(user.roles, section)) {
    return (
      <section className="admin-state">
        <p className="state-label">Akses dibatasi</p>
        <h1>Halaman ini tidak tersedia untuk role Anda.</h1>
        <p>
          Hubungi pengelola akun jika Anda membutuhkan akses ke{' '}
          {section.label.toLowerCase()}.
        </p>
        <a className="admin-secondary" href="/admin/dashboard">
          Kembali ke dashboard
        </a>
      </section>
    );
  }

  let initialBookings: AdminBookingItem[] = [];
  let trips: Trip[] = [];
  let schedules: TripSchedule[] = [];

  try {
    const [bookingsRes, tripsRes, schedulesRes] = await Promise.all([
      fetchAdminApi('admin/bookings?limit=100'),
      fetchAdminApi('admin/trips'),
      fetchAdminApi('admin/schedules'),
    ]);

    if (bookingsRes.ok) {
      const json = (await bookingsRes.json()) as
        | {
            success?: boolean;
            data?: BookingListResponse;
            items?: AdminBookingItem[];
          }
        | BookingListResponse
        | AdminBookingItem[];

      if (Array.isArray(json)) {
        initialBookings = json;
      } else if ('items' in json && Array.isArray(json.items)) {
        initialBookings = json.items;
      } else if ('data' in json && json.data) {
        if ('items' in json.data && Array.isArray(json.data.items)) {
          initialBookings = json.data.items;
        } else if (Array.isArray(json.data)) {
          initialBookings = json.data as AdminBookingItem[];
        }
      }
    }

    if (tripsRes.ok) {
      const json = (await tripsRes.json()) as Record<string, unknown>;
      if (Array.isArray(json)) {
        trips = json as Trip[];
      } else if (Array.isArray(json.items)) {
        trips = json.items as Trip[];
      } else if (
        json.data &&
        typeof json.data === 'object' &&
        'items' in json.data &&
        Array.isArray((json.data as { items?: unknown[] }).items)
      ) {
        trips = (json.data as { items: Trip[] }).items;
      } else if (Array.isArray(json.data)) {
        trips = json.data as Trip[];
      }
    }

    if (schedulesRes.ok) {
      const json = (await schedulesRes.json()) as Record<string, unknown>;
      if (Array.isArray(json)) {
        schedules = json as TripSchedule[];
      } else if (Array.isArray(json.data)) {
        schedules = json.data as TripSchedule[];
      } else if (
        json.data &&
        typeof json.data === 'object' &&
        'data' in json.data &&
        Array.isArray((json.data as { data?: unknown[] }).data)
      ) {
        schedules = (json.data as { data: TripSchedule[] }).data;
      } else if (Array.isArray(json.items)) {
        schedules = json.items as TripSchedule[];
      }
    }
  } catch (err) {
    console.error('Failed to load initial data for bookings page:', err);
  }

  return (
    <BookingsClient
      initialItems={initialBookings}
      trips={trips}
      schedules={schedules}
      userRoles={user.roles}
    />
  );
}
