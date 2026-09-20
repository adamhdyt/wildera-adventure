import { requireAdmin, fetchAdminApi } from '../../../../lib/admin-session';
import type {
  Mountain,
  MountainListResponse,
  Route,
  RouteListResponse,
} from '@wildera/types';
import { RoutesClient } from './routes-client';

export default async function RoutesPage() {
  const user = await requireAdmin();

  let initialRoutes: Route[] = [];
  let mountains: Mountain[] = [];

  try {
    const [routesRes, mountainsRes] = await Promise.all([
      fetchAdminApi('admin/routes'),
      fetchAdminApi('admin/mountains'),
    ]);

    if (routesRes.ok) {
      const json = (await routesRes.json()) as {
        success?: boolean;
        data?: RouteListResponse;
        items?: Route[];
      };
      initialRoutes = json.data?.items ?? json.items ?? [];
    }

    if (mountainsRes.ok) {
      const json = (await mountainsRes.json()) as {
        success?: boolean;
        data?: MountainListResponse;
        items?: Mountain[];
      };
      mountains = json.data?.items ?? json.items ?? [];
    }
  } catch {
    // Graceful fallback to empty state
  }

  return (
    <RoutesClient
      initialItems={initialRoutes}
      mountains={mountains}
      userRoles={user.roles}
    />
  );
}
