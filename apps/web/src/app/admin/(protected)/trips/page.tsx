import { requireAdmin, fetchAdminApi } from '../../../../lib/admin-session';
import type {
  Mountain,
  MountainListResponse,
  Route,
  RouteListResponse,
  Trip,
  TripListResponse,
} from '@wildera/types';
import { TripsClient } from './trips-client';

export default async function TripsPage() {
  const user = await requireAdmin();

  let initialTrips: Trip[] = [];
  let mountains: Mountain[] = [];
  let routes: Route[] = [];

  try {
    const [tripsRes, mountainsRes, routesRes] = await Promise.all([
      fetchAdminApi('admin/trips'),
      fetchAdminApi('admin/mountains'),
      fetchAdminApi('admin/routes'),
    ]);

    if (tripsRes.ok) {
      const json = (await tripsRes.json()) as {
        success?: boolean;
        data?: TripListResponse;
        items?: Trip[];
      };
      initialTrips = json.data?.items ?? json.items ?? [];
    }

    if (mountainsRes.ok) {
      const json = (await mountainsRes.json()) as {
        success?: boolean;
        data?: MountainListResponse;
        items?: Mountain[];
      };
      mountains = json.data?.items ?? json.items ?? [];
    }

    if (routesRes.ok) {
      const json = (await routesRes.json()) as {
        success?: boolean;
        data?: RouteListResponse;
        items?: Route[];
      };
      routes = json.data?.items ?? json.items ?? [];
    }
  } catch {
    // Graceful fallback to empty state
  }

  return (
    <TripsClient
      initialItems={initialTrips}
      mountains={mountains}
      routes={routes}
      userRoles={user.roles}
    />
  );
}
