import { requireAdmin, fetchAdminApi } from '../../../../lib/admin-session';
import type { Destination, DestinationListResponse } from '@wildera/types';
import { DestinationsClient } from './destinations-client';

export const metadata = {
  title: 'Destinasi · Admin Wildera Adventure',
};

export default async function DestinationsPage() {
  const user = await requireAdmin();

  let items: Destination[] = [];
  try {
    const res = await fetchAdminApi('admin/destinations');
    if (res.ok) {
      const json: { success: boolean; data: DestinationListResponse } =
        await res.json();
      items = json.data?.items ?? [];
    }
  } catch {
    // If upstream is temporarily not reached during SSG/build, start with empty list
    items = [];
  }

  return <DestinationsClient initialItems={items} userRoles={user.roles} />;
}
