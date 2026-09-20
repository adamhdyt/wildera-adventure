import { requireAdmin, fetchAdminApi } from '../../../../lib/admin-session';
import { AuditLogsClient } from './audit-logs-client';
import type { AuditLogItem } from '@wildera/types';

export const metadata = {
  title: 'Audit Log · Admin Wildera Adventure',
};

export default async function AuditLogsPage() {
  const user = await requireAdmin();

  const isAllowed =
    user.roles.includes('SUPER_ADMIN') || user.roles.includes('OPERATIONS');

  if (!isAllowed) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Akses ditolak: Anda tidak memiliki izin untuk melihat catatan audit
          sistem.
        </div>
      </div>
    );
  }

  let initialData: {
    items: AuditLogItem[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  } = {
    items: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
  };

  try {
    const res = await fetchAdminApi('admin/audit-logs?limit=20&page=1');
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        initialData = {
          items: json.data,
          meta: json.meta ?? {
            total: json.data.length,
            page: 1,
            limit: 20,
            totalPages: Math.ceil(json.data.length / 20) || 1,
          },
        };
      }
    }
  } catch {
    // Fallback gracefully to empty data
  }

  const isSuperAdmin = user.roles.includes('SUPER_ADMIN');

  return (
    <AuditLogsClient
      initialData={initialData}
      isSuperAdmin={isSuperAdmin}
      userRoles={user.roles}
    />
  );
}
