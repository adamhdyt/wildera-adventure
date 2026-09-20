import { requireAdmin, fetchAdminApi } from '../../../../lib/admin-session';
import type {
  Destination,
  DestinationListResponse,
  Mountain,
  MountainListResponse,
} from '@wildera/types';
import { MountainsClient } from './mountains-client';

export const metadata = {
  title: 'Gunung · Admin Wildera Adventure',
};

export default async function MountainsPage() {
  const user = await requireAdmin();

  let mountains: Mountain[] = [];
  let destinations: Destination[] = [];

  try {
    const [mtnRes, destRes] = await Promise.all([
      fetchAdminApi('admin/mountains'),
      fetchAdminApi('admin/destinations'),
    ]);

    if (mtnRes.ok) {
      const json: { success: boolean; data: MountainListResponse } =
        await mtnRes.json();
      mountains = json.data?.items ?? [];
    }

    if (destRes.ok) {
      const json: { success: boolean; data: DestinationListResponse } =
        await destRes.json();
      destinations = json.data?.items ?? [];
    }
  } catch {
    mountains = [];
    destinations = [];
  }

  return (
    <MountainsClient
      initialItems={mountains}
      destinations={destinations}
      userRoles={user.roles}
    />
  );
}
