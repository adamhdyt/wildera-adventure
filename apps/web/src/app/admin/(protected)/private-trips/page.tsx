/* eslint-disable @next/next/no-html-link-for-pages */
import { requireAdmin, fetchAdminApi } from '../../../../lib/admin-session';
import {
  adminSections,
  canViewSection,
} from '../../../../lib/admin-navigation';
import type { PrivateTripInquiry } from '@wildera/types';
import { PrivateTripsClient } from './private-trips-client';

export default async function PrivateTripsPage() {
  const user = await requireAdmin();
  const section = adminSections.find((item) => item.slug === 'private-trips');
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

  let initialInquiries: PrivateTripInquiry[] = [];

  try {
    const res = await fetchAdminApi(
      'admin/private-trip-inquiries?pageSize=100',
    );
    if (res.ok) {
      const json = await res.json();
      initialInquiries = json.data ?? [];
    }
  } catch {
    // Graceful fallback
  }

  return (
    <PrivateTripsClient
      initialInquiries={initialInquiries}
      userRoles={user.roles}
    />
  );
}
