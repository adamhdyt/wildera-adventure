import { requireAdmin, fetchAdminApi } from '../../../../lib/admin-session';
import type {
  MeetingPoint,
  Trip,
  TripListResponse,
  TripSchedule,
} from '@wildera/types';
import { SchedulesClient } from './schedules-client';

export default async function SchedulesPage() {
  const user = await requireAdmin();

  let initialSchedules: TripSchedule[] = [];
  let trips: Trip[] = [];
  let meetingPoints: MeetingPoint[] = [];

  try {
    const [schedulesRes, tripsRes, meetingPointsRes] = await Promise.all([
      fetchAdminApi('admin/schedules?pageSize=100'),
      fetchAdminApi('admin/trips?limit=100'),
      fetchAdminApi('admin/meeting-points'),
    ]);

    if (schedulesRes.ok) {
      const json = (await schedulesRes.json()) as {
        data?: TripSchedule[] | { data?: TripSchedule[] };
        items?: TripSchedule[];
      };
      if (Array.isArray(json)) {
        initialSchedules = json;
      } else if (Array.isArray(json?.data)) {
        initialSchedules = json.data;
      } else if (
        json?.data &&
        Array.isArray((json.data as { data?: TripSchedule[] }).data)
      ) {
        initialSchedules = (json.data as { data: TripSchedule[] }).data;
      } else {
        initialSchedules = json?.items ?? [];
      }
    }

    if (tripsRes.ok) {
      const json = (await tripsRes.json()) as {
        success?: boolean;
        data?: TripListResponse;
        items?: Trip[];
      };
      trips = json.data?.items ?? json.items ?? [];
    }

    if (meetingPointsRes.ok) {
      const json = (await meetingPointsRes.json()) as
        | { success?: boolean; data?: MeetingPoint[]; items?: MeetingPoint[] }
        | MeetingPoint[];
      if (Array.isArray(json)) {
        meetingPoints = json;
      } else {
        meetingPoints = json.data ?? json.items ?? [];
      }
    }
  } catch {
    // Graceful fallback to empty state
  }

  return (
    <SchedulesClient
      initialItems={initialSchedules}
      trips={trips}
      initialMeetingPoints={meetingPoints}
      userRoles={user.roles}
    />
  );
}
