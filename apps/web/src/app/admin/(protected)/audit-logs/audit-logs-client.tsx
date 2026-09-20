'use client';

import { useState, useCallback, useTransition } from 'react';
import type { AuditLogItem } from '@wildera/types';

interface AuditLogsClientProps {
  initialData: {
    items: AuditLogItem[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  isSuperAdmin: boolean;
  userRoles: readonly string[];
}

const COMMON_ACTIONS = [
  { value: '', label: 'Semua Aksi' },
  { value: 'TRIP_PUBLISH', label: 'Trip Published (TRIP_PUBLISH)' },
  { value: 'SCHEDULE_CAPACITY_CHANGED', label: 'Schedule Capacity Changed' },
  { value: 'SCHEDULE_UPDATE', label: 'Schedule Update' },
  { value: 'BOOKING_CREATE', label: 'Booking Created' },
  { value: 'BOOKING_CONFIRM', label: 'Booking Confirmed' },
  { value: 'BOOKING_CANCEL', label: 'Booking Cancelled' },
  { value: 'ADMIN_ROLE_CHANGED', label: 'Admin Role Changed' },
  { value: 'ADMIN_STATUS_CHANGED', label: 'Admin Status Changed' },
  { value: 'SETTING_UPDATE', label: 'Setting Update' },
  { value: 'CONTENT_PAGE_UPDATE', label: 'Content Page Update' },
  { value: 'FAQ_UPDATE', label: 'FAQ Update' },
];

const COMMON_ENTITIES = [
  { value: '', label: 'Semua Entitas' },
  { value: 'TRIP', label: 'Trip' },
  { value: 'SCHEDULE', label: 'Schedule' },
  { value: 'BOOKING', label: 'Booking' },
  { value: 'ADMIN_USER', label: 'Admin User' },
  { value: 'SITE_SETTING', label: 'Site Setting' },
  { value: 'CONTENT_PAGE', label: 'Content Page' },
  { value: 'FAQ', label: 'FAQ' },
];

export function AuditLogsClient({
  initialData,
  isSuperAdmin,
}: AuditLogsClientProps) {
  const [data, setData] = useState(initialData);
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [inspectItem, setInspectItem] = useState<AuditLogItem | null>(null);

  const fetchLogs = useCallback(
    (
      targetPage: number,
      filters?: {
        action?: string;
        entity?: string;
        search?: string;
        fromDate?: string;
        toDate?: string;
      },
    ) => {
      const activeFilters = {
        action: filters?.action ?? selectedAction,
        entity: filters?.entity ?? selectedEntity,
        search: filters?.search ?? search,
        fromDate: filters?.fromDate ?? fromDate,
        toDate: filters?.toDate ?? toDate,
      };

      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      params.set('limit', '20');
      if (activeFilters.action) params.set('action', activeFilters.action);
      if (activeFilters.entity) params.set('entityType', activeFilters.entity);
      if (activeFilters.search) params.set('search', activeFilters.search);
      if (activeFilters.fromDate)
        params.set('fromDate', activeFilters.fromDate);
      if (activeFilters.toDate) params.set('toDate', activeFilters.toDate);

      startTransition(async () => {
        try {
          const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
          if (res.ok) {
            const json = await res.json();
            if (json.data) {
              setData({
                items: json.data,
                meta: json.meta ?? {
                  total: json.data.length,
                  page: targetPage,
                  limit: 20,
                  totalPages: Math.ceil(json.data.length / 20) || 1,
                },
              });
              setPage(targetPage);
            }
          }
        } catch {
          // Keep previous data on network failure
        }
      });
    },
    [selectedAction, selectedEntity, search, fromDate, toDate],
  );

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1, {
      action: selectedAction,
      entity: selectedEntity,
      search,
      fromDate,
      toDate,
    });
  };

  const handleResetFilter = () => {
    setSelectedAction('');
    setSelectedEntity('');
    setSearch('');
    setFromDate('');
    setToDate('');
    fetchLogs(1, {
      action: '',
      entity: '',
      search: '',
      fromDate: '',
      toDate: '',
    });
  };

  const handleExportCsv = () => {
    if (!data.items || data.items.length === 0) return;

    const headers = [
      'ID',
      'Waktu',
      'Aksi',
      'Entitas',
      'Entity ID',
      'Aktor Nama',
      'Aktor Email',
      'IP Address',
      'Old Value',
      'New Value',
    ];

    const rows = data.items.map((item) => [
      item.id,
      new Date(item.createdAt).toISOString(),
      item.action,
      item.entityType,
      item.entityId ?? '',
      item.admin?.name ?? '',
      item.admin?.email ?? '',
      item.ipAddress ?? '',
      JSON.stringify(item.oldValue ?? ''),
      JSON.stringify(item.newValue ?? ''),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) =>
        r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeStyle = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('CANCEL')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (
      act.includes('CREATE') ||
      act.includes('PUBLISH') ||
      act.includes('CONFIRM')
    ) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (
      act.includes('ROLE') ||
      act.includes('UPDATE') ||
      act.includes('CHANGE')
    ) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Audit Log
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Catatan aktivitas sistem, perubahan data kritikal, dan jejak audit
            yang bersifat append-only (tidak dapat diubah atau dihapus).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={data.items.length === 0}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleApplyFilter}
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Keyword search */}
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Pencarian
            </label>
            <input
              type="text"
              placeholder="Cari aksi, aktor, atau entitas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Action */}
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Aksi
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {COMMON_ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Entitas
            </label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {COMMON_ENTITIES.map((ent) => (
                <option key={ent.value} value={ent.value}>
                  {ent.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date range from */}
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Date range to */}
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={handleResetFilter}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isPending ? 'Memuat...' : 'Terapkan Filter'}
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Waktu
                </th>
                <th scope="col" className="px-6 py-3">
                  Aksi
                </th>
                <th scope="col" className="px-6 py-3">
                  Entitas
                </th>
                <th scope="col" className="px-6 py-3">
                  Aktor
                </th>
                <th scope="col" className="px-6 py-3">
                  IP / Request
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Detail Perubahan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Tidak ada catatan audit yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-600">
                      {new Date(item.createdAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getBadgeStyle(
                          item.action,
                        )}`}
                      >
                        {item.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs">
                      <div className="font-semibold text-gray-900">
                        {item.entityType}
                      </div>
                      {item.entityId && (
                        <div className="text-gray-500 font-mono text-[11px] truncate max-w-[150px]">
                          {item.entityId}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs">
                      {item.admin ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.admin.name}
                          </div>
                          <div className="text-gray-500">
                            {item.admin.email}
                          </div>
                        </div>
                      ) : (
                        <span className="italic text-gray-400">Sistem</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-500 font-mono">
                      <div>{item.ipAddress ?? '-'}</div>
                      {item.requestId && (
                        <div className="text-[10px] text-gray-400 truncate max-w-[120px]">
                          {item.requestId}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-xs">
                      <button
                        type="button"
                        onClick={() => setInspectItem(item)}
                        className="rounded-md border border-gray-300 bg-white px-2.5 py-1 font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Lihat Data
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.meta && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3 text-xs text-gray-700">
            <div>
              Menampilkan halaman <span className="font-medium">{page}</span>{' '}
              dari <span className="font-medium">{data.meta.totalPages}</span>{' '}
              (Total {data.meta.total} log)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1 || isPending}
                className="rounded border border-gray-300 bg-white px-2.5 py-1 font-medium hover:bg-gray-100 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= data.meta.totalPages || isPending}
                className="rounded border border-gray-300 bg-white px-2.5 py-1 font-medium hover:bg-gray-100 disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Detail Audit Log
                </h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${getBadgeStyle(
                      inspectItem.action,
                    )}`}
                  >
                    {inspectItem.action}
                  </span>
                  <span>•</span>
                  <span>{inspectItem.entityType}</span>
                  {inspectItem.entityId && (
                    <>
                      <span>•</span>
                      <span className="font-mono">{inspectItem.entityId}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                ✕
              </button>
            </div>

            {/* Metadata Info */}
            <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 text-xs sm:grid-cols-4">
              <div>
                <div className="font-semibold text-gray-600">Aktor</div>
                <div className="mt-0.5 text-gray-900">
                  {inspectItem.admin?.name ?? 'Sistem'}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-600">Waktu</div>
                <div className="mt-0.5 text-gray-900">
                  {new Date(inspectItem.createdAt).toLocaleString('id-ID')}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-600">IP Address</div>
                <div className="mt-0.5 font-mono text-gray-900">
                  {inspectItem.ipAddress ?? '-'}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-600">Request ID</div>
                <div className="mt-0.5 font-mono text-gray-900 truncate">
                  {inspectItem.requestId ?? '-'}
                </div>
              </div>
            </div>

            {/* Old vs New Values */}
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Data Sebelum (Old Value)
                </h3>
                <pre className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-800">
                  {inspectItem.oldValue
                    ? JSON.stringify(inspectItem.oldValue, null, 2)
                    : '(Tidak ada data lama)'}
                </pre>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Data Sesudah (New Value)
                </h3>
                <pre className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-800">
                  {inspectItem.newValue
                    ? JSON.stringify(inspectItem.newValue, null, 2)
                    : '(Tidak ada data baru)'}
                </pre>
              </div>
            </div>

            {!isSuperAdmin && (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                Catatan: Anda memiliki peran terbatas. Data sensitif (kata
                sandi, token) disamarkan secara otomatis demi keamanan sistem.
              </div>
            )}

            <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
