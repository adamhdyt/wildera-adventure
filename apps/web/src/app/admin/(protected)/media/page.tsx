import { requireAdmin, fetchAdminApi } from '../../../../lib/admin-session';
import type { MediaAsset } from '@wildera/types';
import { MediaClient } from './media-client';

export const metadata = {
  title: 'Media · Admin Wildera Adventure',
};

export default async function MediaPage() {
  const user = await requireAdmin();

  let items: MediaAsset[] = [];
  let total = 0;
  let loadFailed = false;

  try {
    const res = await fetchAdminApi('admin/media?limit=48&offset=0');
    if (res.ok) {
      const json = await res.json();
      const data = json.data ?? json;
      items = data.items ?? [];
      total = data.total ?? items.length;
    } else {
      loadFailed = true;
    }
  } catch {
    loadFailed = true;
  }

  return (
    <MediaClient
      initialItems={items}
      initialTotal={total}
      loadFailed={loadFailed}
      userRoles={user.roles}
    />
  );
}
