'use client';

import { useState } from 'react';
import type {
  AvailabilityStatus,
  CreateMeetingPointPayload,
  CreatePackagePayload,
  CreateSchedulePayload,
  EntityStatus,
  MeetingPoint,
  ScheduleManifestSummary,
  SchedulePackage,
  ScheduleStatus,
  Trip,
  TripSchedule,
  UpdateSchedulePayload,
} from '@wildera/types';

interface SchedulesClientProps {
  initialItems: TripSchedule[];
  trips: Trip[];
  initialMeetingPoints?: MeetingPoint[];
  userRoles: string[];
}

export function SchedulesClient({
  initialItems,
  trips,
  initialMeetingPoints = [],
  userRoles,
}: SchedulesClientProps) {
  const [items, setItems] = useState<TripSchedule[]>(initialItems);
  const [filterTripId, setFilterTripId] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // --- Meeting Points State ---
  const [meetingPoints, setMeetingPoints] =
    useState<MeetingPoint[]>(initialMeetingPoints);
  const [isMeetingPointsOpen, setIsMeetingPointsOpen] = useState(false);
  const [isMpFormOpen, setIsMpFormOpen] = useState(false);
  const [mpEditingItem, setMpEditingItem] = useState<MeetingPoint | null>(null);
  const [mpFormData, setMpFormData] = useState<{
    name: string;
    city: string;
    address: string;
    latitude: string;
    longitude: string;
    notes: string;
    status: EntityStatus;
  }>({
    name: '',
    city: '',
    address: '',
    latitude: '',
    longitude: '',
    notes: '',
    status: 'ACTIVE',
  });
  const [mpLoading, setMpLoading] = useState(false);
  const [mpError, setMpError] = useState<string | null>(null);

  // --- Schedule Packages State ---
  const [selectedScheduleForPackages, setSelectedScheduleForPackages] =
    useState<TripSchedule | null>(null);
  const [isPackagesOpen, setIsPackagesOpen] = useState(false);
  const [packages, setPackages] = useState<SchedulePackage[]>([]);
  const [isPkgFormOpen, setIsPkgFormOpen] = useState(false);
  const [pkgEditingItem, setPkgEditingItem] = useState<SchedulePackage | null>(
    null,
  );
  const [pkgFormData, setPkgFormData] = useState<{
    name: string;
    description: string;
    price: number;
    meetingPointId: string;
    meetingDatetime: string;
    status: EntityStatus;
    sortOrder: number;
  }>({
    name: '',
    description: '',
    price: 0,
    meetingPointId: '',
    meetingDatetime: '',
    status: 'ACTIVE',
    sortOrder: 0,
  });
  const [pkgLoading, setPkgLoading] = useState(false);
  const [pkgError, setPkgError] = useState<string | null>(null);

  // --- Schedule Manifest State (Step 29) ---
  const [manifestTarget, setManifestTarget] = useState<TripSchedule | null>(
    null,
  );
  const [manifestData, setManifestData] =
    useState<ScheduleManifestSummary | null>(null);
  const [manifestLoading, setManifestLoading] = useState(false);
  const [manifestError, setManifestError] = useState<string | null>(null);

  const openManifest = async (schedule: TripSchedule) => {
    setManifestTarget(schedule);
    setManifestData(null);
    setManifestLoading(true);
    setManifestError(null);

    try {
      const res = await fetch(`/api/admin/schedules/${schedule.id}/manifest`);
      const json = await res.json();
      if (!res.ok) {
        setManifestError(
          json.error?.message || 'Gagal memuat manifest peserta jadwal.',
        );
        return;
      }
      setManifestData(json.data ?? json);
    } catch (err: unknown) {
      setManifestError((err as Error).message || 'Terjadi kesalahan sistem.');
    } finally {
      setManifestLoading(false);
    }
  };

  // Fetch meeting points
  const fetchMeetingPoints = async () => {
    try {
      const res = await fetch('/api/admin/meeting-points');
      if (res.ok) {
        const json = await res.json();
        setMeetingPoints(
          Array.isArray(json) ? json : (json.data ?? json.items ?? []),
        );
      }
    } catch {
      // ignore
    }
  };

  // Open meeting points modal
  const openMeetingPointsModal = () => {
    setIsMeetingPointsOpen(true);
    fetchMeetingPoints();
  };

  const openCreateMp = () => {
    setMpEditingItem(null);
    setMpFormData({
      name: '',
      city: '',
      address: '',
      latitude: '',
      longitude: '',
      notes: '',
      status: 'ACTIVE',
    });
    setMpError(null);
    setIsMpFormOpen(true);
  };

  const openEditMp = (mp: MeetingPoint) => {
    setMpEditingItem(mp);
    setMpFormData({
      name: mp.name,
      city: mp.city || '',
      address: mp.address || '',
      latitude:
        mp.latitude !== null && mp.latitude !== undefined
          ? String(mp.latitude)
          : '',
      longitude:
        mp.longitude !== null && mp.longitude !== undefined
          ? String(mp.longitude)
          : '',
      notes: mp.notes || '',
      status: mp.status,
    });
    setMpError(null);
    setIsMpFormOpen(true);
  };

  const handleMpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMpLoading(true);
    setMpError(null);

    const payload: CreateMeetingPointPayload = {
      name: mpFormData.name.trim(),
      city: mpFormData.city.trim() || undefined,
      address: mpFormData.address.trim() || undefined,
      latitude: mpFormData.latitude
        ? parseFloat(mpFormData.latitude)
        : undefined,
      longitude: mpFormData.longitude
        ? parseFloat(mpFormData.longitude)
        : undefined,
      notes: mpFormData.notes.trim() || undefined,
      status: mpFormData.status,
    };

    try {
      const url = mpEditingItem
        ? `/api/admin/meeting-points/${mpEditingItem.id}`
        : '/api/admin/meeting-points';
      const method = mpEditingItem ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) {
        setMpError(
          resJson.error?.message ||
            resJson.message ||
            'Gagal menyimpan titik temu.',
        );
        setMpLoading(false);
        return;
      }

      await fetchMeetingPoints();
      setIsMpFormOpen(false);
    } catch {
      setMpError('Terjadi kesalahan jaringan.');
    } finally {
      setMpLoading(false);
    }
  };

  const handleMpDelete = async (mpId: string) => {
    if (!confirm('Yakin ingin menghapus titik temu ini?')) return;
    setMpLoading(true);
    setMpError(null);
    try {
      const res = await fetch(`/api/admin/meeting-points/${mpId}`, {
        method: 'DELETE',
      });
      const resJson = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMpError(
          resJson.error?.code === 'MEETING_POINT_IN_USE'
            ? 'Titik temu masih digunakan dalam paket perjalanan dan tidak dapat dihapus.'
            : resJson.error?.message || 'Gagal menghapus titik temu.',
        );
        setMpLoading(false);
        return;
      }
      await fetchMeetingPoints();
    } catch {
      setMpError('Terjadi kesalahan jaringan.');
    } finally {
      setMpLoading(false);
    }
  };

  // --- Packages Handler ---
  const fetchPackages = async (schedId: string) => {
    setPkgLoading(true);
    setPkgError(null);
    try {
      const res = await fetch(`/api/admin/schedules/${schedId}/packages`);
      if (res.ok) {
        const json = await res.json();
        setPackages(
          Array.isArray(json) ? json : (json.data ?? json.items ?? []),
        );
      } else {
        setPkgError('Gagal memuat paket untuk jadwal ini.');
      }
    } catch {
      setPkgError('Terjadi kesalahan jaringan saat memuat paket.');
    } finally {
      setPkgLoading(false);
    }
  };

  const openPackagesModal = (schedule: TripSchedule) => {
    setSelectedScheduleForPackages(schedule);
    setIsPackagesOpen(true);
    setIsPkgFormOpen(false);
    setPkgEditingItem(null);
    setPkgError(null);
    fetchPackages(schedule.id);
  };

  const openCreatePkg = () => {
    setPkgEditingItem(null);
    setPkgFormData({
      name: '',
      description: '',
      price: 0,
      meetingPointId: meetingPoints[0]?.id || '',
      meetingDatetime: '',
      status: 'ACTIVE',
      sortOrder: packages.length,
    });
    setPkgError(null);
    setIsPkgFormOpen(true);
  };

  const openEditPkg = (pkg: SchedulePackage) => {
    setPkgEditingItem(pkg);
    setPkgFormData({
      name: pkg.name,
      description: pkg.description || '',
      price: Number(pkg.price),
      meetingPointId: pkg.meetingPointId || '',
      meetingDatetime: pkg.meetingDatetime
        ? pkg.meetingDatetime.slice(0, 16)
        : '',
      status: pkg.status,
      sortOrder: pkg.sortOrder,
    });
    setPkgError(null);
    setIsPkgFormOpen(true);
  };

  const handlePkgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleForPackages) return;

    setPkgLoading(true);
    setPkgError(null);

    const payload: CreatePackagePayload = {
      name: pkgFormData.name.trim(),
      description: pkgFormData.description.trim() || undefined,
      price: Number(pkgFormData.price),
      meetingPointId: pkgFormData.meetingPointId || undefined,
      meetingDatetime: pkgFormData.meetingDatetime
        ? new Date(pkgFormData.meetingDatetime).toISOString()
        : undefined,
      status: pkgFormData.status,
      sortOrder: Number(pkgFormData.sortOrder) || 0,
    };

    try {
      const url = pkgEditingItem
        ? `/api/admin/schedules/${selectedScheduleForPackages.id}/packages/${pkgEditingItem.id}`
        : `/api/admin/schedules/${selectedScheduleForPackages.id}/packages`;
      const method = pkgEditingItem ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) {
        setPkgError(
          resJson.error?.message || resJson.message || 'Gagal menyimpan paket.',
        );
        setPkgLoading(false);
        return;
      }

      await fetchPackages(selectedScheduleForPackages.id);
      setIsPkgFormOpen(false);
    } catch {
      setPkgError('Terjadi kesalahan jaringan.');
    } finally {
      setPkgLoading(false);
    }
  };

  const handlePkgDelete = async (pkgId: string) => {
    if (!selectedScheduleForPackages) return;
    if (!confirm('Yakin ingin menghapus paket ini?')) return;
    setPkgLoading(true);
    setPkgError(null);
    try {
      const res = await fetch(
        `/api/admin/schedules/${selectedScheduleForPackages.id}/packages/${pkgId}`,
        { method: 'DELETE' },
      );
      const resJson = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPkgError(
          resJson.error?.code === 'PACKAGE_HAS_BOOKINGS'
            ? 'Paket memiliki pesanan aktif dan tidak dapat dihapus.'
            : resJson.error?.message || 'Gagal menghapus paket.',
        );
        setPkgLoading(false);
        return;
      }
      await fetchPackages(selectedScheduleForPackages.id);
    } catch {
      setPkgError('Terjadi kesalahan jaringan.');
    } finally {
      setPkgLoading(false);
    }
  };

  // Form Modal (Create / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TripSchedule | null>(null);
  const [formData, setFormData] = useState<{
    tripId: string;
    startDate: string;
    endDate: string;
    registrationDeadline: string;
    capacity: number;
    minimumParticipants: string;
    notes: string;
  }>({
    tripId: trips[0]?.id || '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    capacity: 20,
    minimumParticipants: '5',
    notes: '',
  });

  // Action status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cancel Modal
  const [cancelTarget, setCancelTarget] = useState<TripSchedule | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<TripSchedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canManage =
    userRoles.includes('SUPER_ADMIN') || userRoles.includes('OPERATIONS');

  const filteredItems = items.filter((item) => {
    if (filterTripId !== 'ALL' && item.tripId !== filterTripId) return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const tripName = item.trip?.name?.toLowerCase() || '';
      const start = item.startDate.toLowerCase();
      const end = item.endDate.toLowerCase();
      if (!tripName.includes(q) && !start.includes(q) && !end.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      tripId: trips[0]?.id || '',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      capacity: 20,
      minimumParticipants: '5',
      notes: '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (schedule: TripSchedule) => {
    setEditingItem(schedule);
    setFormData({
      tripId: schedule.tripId,
      startDate: schedule.startDate.slice(0, 10),
      endDate: schedule.endDate.slice(0, 10),
      registrationDeadline: schedule.registrationDeadline
        ? schedule.registrationDeadline.slice(0, 10)
        : '',
      capacity: schedule.capacity,
      minimumParticipants:
        schedule.minimumParticipants !== null &&
        schedule.minimumParticipants !== undefined
          ? String(schedule.minimumParticipants)
          : '',
      notes: schedule.notes || '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingItem) {
        // Update Schedule
        const payload: UpdateSchedulePayload = {
          startDate: formData.startDate,
          endDate: formData.endDate,
          registrationDeadline: formData.registrationDeadline || null,
          capacity: Number(formData.capacity),
          minimumParticipants: formData.minimumParticipants
            ? Number(formData.minimumParticipants)
            : null,
          notes: formData.notes || null,
        };

        const res = await fetch(`/api/admin/schedules/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.error?.message ||
              data.message ||
              'Gagal memperbarui jadwal perjalanan.',
          );
        }

        const updated: TripSchedule = data.data || data;
        setItems((prev) =>
          prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
        );
        setIsFormOpen(false);
      } else {
        // Create Schedule
        const payload: CreateSchedulePayload = {
          tripId: formData.tripId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          registrationDeadline: formData.registrationDeadline || null,
          capacity: Number(formData.capacity),
          minimumParticipants: formData.minimumParticipants
            ? Number(formData.minimumParticipants)
            : null,
          notes: formData.notes || null,
        };

        const res = await fetch('/api/admin/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.error?.message ||
              data.message ||
              'Gagal membuat jadwal perjalanan baru.',
          );
        }

        const created: TripSchedule = data.data || data;
        setItems((prev) => [created, ...prev]);
        setIsFormOpen(false);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSchedule = async (schedule: TripSchedule) => {
    try {
      const res = await fetch(`/api/admin/schedules/${schedule.id}/open`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(
          data.error?.message ||
            data.message ||
            'Gagal membuka jadwal pendaftaran.',
        );
        return;
      }
      const updated: TripSchedule = data.data || data;
      setItems((prev) =>
        prev.map((s) =>
          s.id === schedule.id ? { ...s, status: updated.status } : s,
        ),
      );
    } catch {
      alert('Gagal menghubungkan ke server.');
    }
  };

  const handleCloseSchedule = async (schedule: TripSchedule) => {
    try {
      const res = await fetch(`/api/admin/schedules/${schedule.id}/close`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(
          data.error?.message ||
            data.message ||
            'Gagal menutup jadwal pendaftaran.',
        );
        return;
      }
      const updated: TripSchedule = data.data || data;
      setItems((prev) =>
        prev.map((s) =>
          s.id === schedule.id ? { ...s, status: updated.status } : s,
        ),
      );
    } catch {
      alert('Gagal menghubungkan ke server.');
    }
  };

  const handleCompleteSchedule = async (schedule: TripSchedule) => {
    try {
      const res = await fetch(`/api/admin/schedules/${schedule.id}/complete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(
          data.error?.message ||
            data.message ||
            'Gagal menyelesaikan jadwal perjalanan.',
        );
        return;
      }
      const updated: TripSchedule = data.data || data;
      setItems((prev) =>
        prev.map((s) =>
          s.id === schedule.id ? { ...s, status: updated.status } : s,
        ),
      );
    } catch {
      alert('Gagal menghubungkan ke server.');
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;

    setIsCancelling(true);
    try {
      const res = await fetch(
        `/api/admin/schedules/${cancelTarget.id}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: cancelReason }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        alert(
          data.error?.message ||
            data.message ||
            'Gagal membatalkan jadwal perjalanan.',
        );
        return;
      }
      const updated: TripSchedule = data.data || data;
      setItems((prev) =>
        prev.map((s) =>
          s.id === cancelTarget.id
            ? { ...s, status: updated.status, notes: updated.notes }
            : s,
        ),
      );
      setCancelTarget(null);
      setCancelReason('');
    } catch {
      alert('Gagal menghubungkan ke server.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/schedules/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(
          data.error?.message ||
            data.message ||
            'Gagal menghapus jadwal perjalanan.',
        );
        return;
      }
      setItems((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setDeleteError('Gagal menghubungkan ke server.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStatusBadge = (status: ScheduleStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="badge badge-draft">Draft</span>;
      case 'OPEN':
        return <span className="badge badge-open">Open</span>;
      case 'CLOSED':
        return <span className="badge badge-closed">Closed</span>;
      case 'CANCELLED':
        return <span className="badge badge-cancelled">Cancelled</span>;
      case 'COMPLETED':
        return <span className="badge badge-completed">Completed</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const renderAvailabilityBadge = (
    availability?: AvailabilityStatus,
    availableSeats?: number,
  ) => {
    switch (availability) {
      case 'AVAILABLE':
        return (
          <span
            className="badge badge-available"
            title={`${availableSeats ?? 0} kursi tersedia`}
          >
            Tersedia
          </span>
        );
      case 'ALMOST_FULL':
        return (
          <span
            className="badge badge-almost-full"
            title={`Sisa ${availableSeats ?? 0} kursi`}
          >
            Hampir Penuh
          </span>
        );
      case 'SOLD_OUT':
        return <span className="badge badge-sold-out">Habis</span>;
      default:
        return null;
    }
  };

  return (
    <div className="destinations-container">
      {/* Header Workspace */}
      <div className="destinations-header">
        <div>
          <h1 className="destinations-title">Jadwal</h1>
          <p className="destinations-subtitle">
            Kelola tanggal keberangkatan, kuota kursi, dan status operasional
            jadwal trip.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {canManage && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={openMeetingPointsModal}
            >
              📍 Titik Temu
            </button>
          )}
          {canManage && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={openCreateModal}
            >
              + Tambah Jadwal
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <input
            type="text"
            className="input-search"
            placeholder="Cari nama trip atau tanggal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            className="select-filter"
            value={filterTripId}
            onChange={(e) => setFilterTripId(e.target.value)}
          >
            <option value="ALL">Semua Trip</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            className="select-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Trip</th>
              <th>Tanggal Keberangkatan</th>
              <th>Batas Daftar</th>
              <th>Kapasitas & Kursi</th>
              <th>Status Operasional</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  Belum ada jadwal perjalanan yang sesuai.
                </td>
              </tr>
            ) : (
              filteredItems.map((schedule) => {
                const confirmed = schedule.confirmedSeats ?? 0;
                const capacity = schedule.capacity;
                return (
                  <tr key={schedule.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1a3325' }}>
                        {schedule.trip?.name || 'Trip Tidak Dikenal'}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: '#666',
                          marginTop: '2px',
                        }}
                      >
                        {schedule.trip?.tripType || 'OPEN_TRIP'}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          fontWeight: 500,
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                        }}
                      >
                        {schedule.startDate} &rarr; {schedule.endDate}
                      </div>
                      {schedule.notes && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#888',
                            marginTop: '2px',
                            maxWidth: '220px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          Catatan: {schedule.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#555' }}>
                        {schedule.registrationDeadline
                          ? schedule.registrationDeadline.slice(0, 10)
                          : '-'}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {confirmed} / {capacity}
                        </span>
                        {renderAvailabilityBadge(
                          schedule.availabilityStatus,
                          schedule.availableSeats,
                        )}
                      </div>
                      {schedule.minimumParticipants && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#888',
                            marginTop: '2px',
                          }}
                        >
                          Min: {schedule.minimumParticipants} pax
                        </div>
                      )}
                    </td>
                    <td>{renderStatusBadge(schedule.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions">
                        {canManage && schedule.status === 'DRAFT' && (
                          <button
                            type="button"
                            className="btn-sm btn-outline"
                            title="Buka pendaftaran jadwal ini"
                            onClick={() => handleOpenSchedule(schedule)}
                          >
                            Buka
                          </button>
                        )}

                        {canManage && schedule.status === 'OPEN' && (
                          <button
                            type="button"
                            className="btn-sm btn-outline"
                            title="Tutup pendaftaran jadwal ini"
                            onClick={() => handleCloseSchedule(schedule)}
                          >
                            Tutup
                          </button>
                        )}

                        {canManage &&
                          schedule.status !== 'CANCELLED' &&
                          schedule.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              className="btn-sm btn-outline"
                              title="Selesaikan trip ini"
                              onClick={() => handleCompleteSchedule(schedule)}
                            >
                              Selesai
                            </button>
                          )}

                        {canManage &&
                          schedule.status !== 'CANCELLED' &&
                          schedule.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              className="btn-sm btn-outline"
                              style={{ color: '#c2410c' }}
                              title="Batalkan jadwal ini"
                              onClick={() => {
                                setCancelTarget(schedule);
                                setCancelReason('');
                              }}
                            >
                              Batal
                            </button>
                          )}

                        <button
                          type="button"
                          className="btn-sm btn-outline"
                          title="Lihat manifest penumpang & peserta jadwal ini"
                          onClick={() => openManifest(schedule)}
                        >
                          👥 Manifest
                        </button>

                        {canManage && (
                          <button
                            type="button"
                            className="btn-sm btn-outline"
                            title="Kelola opsi harga dan paket jadwal ini"
                            onClick={() => openPackagesModal(schedule)}
                          >
                            📦 Paket
                          </button>
                        )}

                        {canManage && (
                          <button
                            type="button"
                            className="btn-sm btn-outline"
                            onClick={() => openEditModal(schedule)}
                          >
                            Edit
                          </button>
                        )}

                        {canManage && (
                          <button
                            type="button"
                            className="btn-sm btn-delete"
                            onClick={() => {
                              setDeleteTarget(schedule);
                              setDeleteError(null);
                            }}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog Form Create / Edit Schedule */}
      {isFormOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingItem ? 'Edit Jadwal Perjalanan' : 'Tambah Jadwal Baru'}
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsFormOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="form-layout">
              {formError && (
                <div
                  style={{
                    padding: '0.75rem',
                    background: '#fef2f2',
                    color: '#991b1b',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    border: '1px solid #fecaca',
                  }}
                >
                  {formError}
                </div>
              )}

              {!editingItem && (
                <div className="form-group">
                  <label htmlFor="scheduleTripSelect" className="form-label">
                    Pilih Program Trip *
                  </label>
                  <select
                    id="scheduleTripSelect"
                    className="form-input"
                    value={formData.tripId}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, tripId: e.target.value }))
                    }
                    required
                  >
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <div className="form-group">
                  <label htmlFor="scheduleStartDate" className="form-label">
                    Tanggal Mulai *
                  </label>
                  <input
                    id="scheduleStartDate"
                    type="date"
                    className="form-input"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, startDate: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="scheduleEndDate" className="form-label">
                    Tanggal Selesai *
                  </label>
                  <input
                    id="scheduleEndDate"
                    type="date"
                    className="form-input"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, endDate: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <div className="form-group">
                  <label htmlFor="scheduleCapacity" className="form-label">
                    Kapasitas Kursi (Pax) *
                  </label>
                  <input
                    id="scheduleCapacity"
                    type="number"
                    min="1"
                    className="form-input"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        capacity: Number(e.target.value),
                      }))
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="scheduleMinPax" className="form-label">
                    Minimal Peserta (Pax)
                  </label>
                  <input
                    id="scheduleMinPax"
                    type="number"
                    min="1"
                    className="form-input"
                    value={formData.minimumParticipants}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        minimumParticipants: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="scheduleDeadline" className="form-label">
                  Batas Pendaftaran (Deadline)
                </label>
                <input
                  id="scheduleDeadline"
                  type="date"
                  className="form-input"
                  value={formData.registrationDeadline}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      registrationDeadline: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="scheduleNotes" className="form-label">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  id="scheduleNotes"
                  className="form-input"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Informasi cuaca, logistik, atau kondisi khusus..."
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Menyimpan...'
                    : editingItem
                      ? 'Simpan Perubahan'
                      : 'Buat Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Pembatalan (Cancel) */}
      {cancelTarget && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Batalkan Jadwal Perjalanan</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setCancelTarget(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="form-layout">
              <p style={{ fontSize: '0.9rem', color: '#444' }}>
                Anda akan menandai jadwal perjalanan{' '}
                <strong>{cancelTarget.trip?.name}</strong> tanggal{' '}
                <strong>
                  {cancelTarget.startDate} s/d {cancelTarget.endDate}
                </strong>{' '}
                sebagai <strong>CANCELLED</strong>.
              </p>

              <div className="form-group">
                <label htmlFor="cancelReasonInput" className="form-label">
                  Alasan Pembatalan (Opsional)
                </label>
                <textarea
                  id="cancelReasonInput"
                  className="form-input"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Contoh: Cuaca ekstrem / status erupsi gunung ditutup..."
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCancelTarget(null)}
                  disabled={isCancelling}
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="btn btn-delete"
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Membatalkan...' : 'Ya, Batalkan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Hapus Jadwal Perjalanan</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setDeleteTarget(null)}
              >
                &times;
              </button>
            </div>

            <div className="form-layout">
              {deleteError && (
                <div
                  style={{
                    padding: '0.75rem',
                    background: '#fef2f2',
                    color: '#991b1b',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    border: '1px solid #fecaca',
                  }}
                >
                  {deleteError}
                </div>
              )}

              <p style={{ fontSize: '0.9rem', color: '#444' }}>
                Apakah Anda yakin ingin menghapus jadwal{' '}
                <strong>{deleteTarget.trip?.name}</strong> (
                {deleteTarget.startDate} s/d {deleteTarget.endDate})? Tindakan
                ini tidak dapat dibatalkan.
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-delete"
                  onClick={handleDeleteSubmit}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Menghapus...' : 'Hapus Jadwal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog Titik Temu (Meeting Points) */}
      {isMeetingPointsOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">📍 Titik Temu (Meeting Points)</h2>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: '#666',
                    margin: '4px 0 0',
                  }}
                >
                  Lokasi kumpul atau penjemputan untuk opsi paket jadwal.
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setIsMeetingPointsOpen(false);
                  setIsMpFormOpen(false);
                }}
              >
                &times;
              </button>
            </div>

            {mpError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #f87171',
                  color: '#991b1b',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  margin: '1rem 0',
                  fontSize: '0.875rem',
                }}
              >
                {mpError}
              </div>
            )}

            <div
              style={{
                margin: '1rem 0',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              {!isMpFormOpen && canManage && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={openCreateMp}
                >
                  + Tambah Titik Temu
                </button>
              )}
            </div>

            {isMpFormOpen && (
              <form
                onSubmit={handleMpSubmit}
                style={{
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '1.5rem',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 1rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {mpEditingItem ? 'Edit Titik Temu' : 'Tambah Titik Temu Baru'}
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <label className="form-label" htmlFor="mp-name">
                      Nama Titik Temu *
                    </label>
                    <input
                      id="mp-name"
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Bandara Internasional Lombok"
                      value={mpFormData.name}
                      onChange={(e) =>
                        setMpFormData({ ...mpFormData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="mp-city">
                      Kota / Wilayah
                    </label>
                    <input
                      id="mp-city"
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Praya, Lombok Tengah"
                      value={mpFormData.city}
                      onChange={(e) =>
                        setMpFormData({ ...mpFormData, city: e.target.value })
                      }
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" htmlFor="mp-address">
                      Alamat Lengkap
                    </label>
                    <input
                      id="mp-address"
                      type="text"
                      className="form-input"
                      placeholder="Alamat jalan atau patokan lokasi"
                      value={mpFormData.address}
                      onChange={(e) =>
                        setMpFormData({
                          ...mpFormData,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="mp-lat">
                      Latitude
                    </label>
                    <input
                      id="mp-lat"
                      type="number"
                      step="any"
                      className="form-input"
                      placeholder="-8.756"
                      value={mpFormData.latitude}
                      onChange={(e) =>
                        setMpFormData({
                          ...mpFormData,
                          latitude: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="mp-lng">
                      Longitude
                    </label>
                    <input
                      id="mp-lng"
                      type="number"
                      step="any"
                      className="form-input"
                      placeholder="116.275"
                      value={mpFormData.longitude}
                      onChange={(e) =>
                        setMpFormData({
                          ...mpFormData,
                          longitude: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" htmlFor="mp-notes">
                      Catatan Tambahan
                    </label>
                    <textarea
                      id="mp-notes"
                      className="form-input"
                      rows={2}
                      placeholder="Instruksi kumpul, nomor kontak penanggung jawab lokasi, dll."
                      value={mpFormData.notes}
                      onChange={(e) =>
                        setMpFormData({ ...mpFormData, notes: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="mp-status">
                      Status
                    </label>
                    <select
                      id="mp-status"
                      className="form-input"
                      value={mpFormData.status}
                      onChange={(e) =>
                        setMpFormData({
                          ...mpFormData,
                          status: e.target.value as EntityStatus,
                        })
                      }
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'flex-end',
                    marginTop: '1rem',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsMpFormOpen(false)}
                    disabled={mpLoading}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={mpLoading}
                  >
                    {mpLoading ? 'Menyimpan...' : 'Simpan Titik Temu'}
                  </button>
                </div>
              </form>
            )}

            <div
              className="table-responsive"
              style={{ maxHeight: '380px', overflowY: 'auto' }}
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nama & Catatan</th>
                    <th>Kota & Alamat</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {meetingPoints.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{ textAlign: 'center', padding: '2rem' }}
                      >
                        Belum ada titik temu. Klik tombol di atas untuk
                        menambahkan.
                      </td>
                    </tr>
                  ) : (
                    meetingPoints.map((mp) => (
                      <tr key={mp.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{mp.name}</div>
                          {mp.notes && (
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: '#666',
                                marginTop: '2px',
                              }}
                            >
                              {mp.notes}
                            </div>
                          )}
                        </td>
                        <td>
                          <div>{mp.city || '-'}</div>
                          {mp.address && (
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                              {mp.address}
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${mp.status === 'ACTIVE' ? 'badge-open' : 'badge-closed'}`}
                          >
                            {mp.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              display: 'flex',
                              gap: '0.4rem',
                              justifyContent: 'flex-end',
                            }}
                          >
                            <button
                              type="button"
                              className="btn-sm btn-outline"
                              onClick={() => openEditMp(mp)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-sm btn-delete"
                              onClick={() => handleMpDelete(mp.id)}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog Kelola Paket Harga (Schedule Packages) */}
      {isPackagesOpen && selectedScheduleForPackages && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '820px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">📦 Opsi Paket Harga Jadwal</h2>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: '#666',
                    margin: '4px 0 0',
                  }}
                >
                  Trip:{' '}
                  <strong>
                    {trips.find(
                      (t) => t.id === selectedScheduleForPackages.tripId,
                    )?.name || 'Trip'}
                  </strong>{' '}
                  | Periode:{' '}
                  {selectedScheduleForPackages.startDate.slice(0, 10)} s/d{' '}
                  {selectedScheduleForPackages.endDate.slice(0, 10)}
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setIsPackagesOpen(false);
                  setIsPkgFormOpen(false);
                }}
              >
                &times;
              </button>
            </div>

            {/* Critical Capacity Rule Notice */}
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1e40af',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                margin: '1rem 0',
                fontSize: '0.85rem',
                lineHeight: 1.4,
              }}
            >
              ℹ️ <strong>Aturan Kuota & Paket:</strong> Kapasitas kursi (
              {selectedScheduleForPackages.capacity} kursi) diatur pada level
              Jadwal, bukan Paket. Paket di bawah berfungsi sebagai opsi
              tingkatan harga, fasilitas penjemputan, dan titik temu.
            </div>

            {pkgError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #f87171',
                  color: '#991b1b',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                }}
              >
                {pkgError}
              </div>
            )}

            <div
              style={{
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              {!isPkgFormOpen && canManage && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={openCreatePkg}
                >
                  + Tambah Paket
                </button>
              )}
            </div>

            {isPkgFormOpen && (
              <form
                onSubmit={handlePkgSubmit}
                style={{
                  background: '#f8fafc',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '1.5rem',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 1rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {pkgEditingItem ? 'Edit Paket' : 'Tambah Paket Baru'}
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <label className="form-label" htmlFor="pkg-name">
                      Nama Paket *
                    </label>
                    <input
                      id="pkg-name"
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Start Jakarta / Start Basecamp"
                      value={pkgFormData.name}
                      onChange={(e) =>
                        setPkgFormData({ ...pkgFormData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="pkg-price">
                      Harga Paket (IDR) *
                    </label>
                    <input
                      id="pkg-price"
                      type="number"
                      min={0}
                      step={1000}
                      className="form-input"
                      placeholder="1250000"
                      value={pkgFormData.price}
                      onChange={(e) =>
                        setPkgFormData({
                          ...pkgFormData,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="pkg-mp">
                      Titik Temu (Meeting Point)
                    </label>
                    <select
                      id="pkg-mp"
                      className="form-input"
                      value={pkgFormData.meetingPointId}
                      onChange={(e) =>
                        setPkgFormData({
                          ...pkgFormData,
                          meetingPointId: e.target.value,
                        })
                      }
                    >
                      <option value="">-- Tanpa Titik Temu Khusus --</option>
                      {meetingPoints.map((mp) => (
                        <option key={mp.id} value={mp.id}>
                          {mp.name} {mp.city ? `(${mp.city})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="pkg-datetime">
                      Waktu Kumpul (Meeting Datetime)
                    </label>
                    <input
                      id="pkg-datetime"
                      type="datetime-local"
                      className="form-input"
                      value={pkgFormData.meetingDatetime}
                      onChange={(e) =>
                        setPkgFormData({
                          ...pkgFormData,
                          meetingDatetime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="pkg-order">
                      Urutan Tampilan
                    </label>
                    <input
                      id="pkg-order"
                      type="number"
                      min={0}
                      className="form-input"
                      value={pkgFormData.sortOrder}
                      onChange={(e) =>
                        setPkgFormData({
                          ...pkgFormData,
                          sortOrder: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="pkg-status">
                      Status Paket
                    </label>
                    <select
                      id="pkg-status"
                      className="form-input"
                      value={pkgFormData.status}
                      onChange={(e) =>
                        setPkgFormData({
                          ...pkgFormData,
                          status: e.target.value as EntityStatus,
                        })
                      }
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" htmlFor="pkg-desc">
                      Deskripsi & Inklusi Paket
                    </label>
                    <textarea
                      id="pkg-desc"
                      className="form-input"
                      rows={2}
                      placeholder="Contoh: Termasuk tiket pesawat PP, logistik camping, dan antar-jemput bandara."
                      value={pkgFormData.description}
                      onChange={(e) =>
                        setPkgFormData({
                          ...pkgFormData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'flex-end',
                    marginTop: '1rem',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsPkgFormOpen(false)}
                    disabled={pkgLoading}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={pkgLoading}
                  >
                    {pkgLoading ? 'Menyimpan...' : 'Simpan Paket'}
                  </button>
                </div>
              </form>
            )}

            <div
              className="table-responsive"
              style={{ maxHeight: '380px', overflowY: 'auto' }}
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Paket & Inklusi</th>
                    <th>Titik Temu & Waktu</th>
                    <th>Harga</th>
                    <th>Status</th>
                    <th>Urutan</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pkgLoading && packages.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{ textAlign: 'center', padding: '2rem' }}
                      >
                        Memuat daftar paket...
                      </td>
                    </tr>
                  ) : packages.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{ textAlign: 'center', padding: '2rem' }}
                      >
                        Belum ada opsi paket harga untuk jadwal ini. Klik{' '}
                        <strong>+ Tambah Paket</strong> di atas.
                      </td>
                    </tr>
                  ) : (
                    packages.map((pkg) => (
                      <tr key={pkg.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{pkg.name}</div>
                          {pkg.description && (
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: '#666',
                                marginTop: '2px',
                              }}
                            >
                              {pkg.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <div>{pkg.meetingPoint?.name || '-'}</div>
                          {pkg.meetingDatetime && (
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                              {new Date(pkg.meetingDatetime).toLocaleString(
                                'id-ID',
                                {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                },
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#10254d' }}>
                            Rp {Number(pkg.price).toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${pkg.status === 'ACTIVE' ? 'badge-open' : 'badge-closed'}`}
                          >
                            {pkg.status}
                          </span>
                        </td>
                        <td>{pkg.sortOrder}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              display: 'flex',
                              gap: '0.4rem',
                              justifyContent: 'flex-end',
                            }}
                          >
                            <button
                              type="button"
                              className="btn-sm btn-outline"
                              onClick={() => openEditPkg(pkg)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-sm btn-delete"
                              onClick={() => handlePkgDelete(pkg.id)}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Manifest Modal (Step 29) */}
      {manifestTarget && (
        <div
          className="modal-overlay"
          onClick={() => setManifestTarget(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-card"
            style={{ maxWidth: '960px', width: '95%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Manifest Peserta Jadwal</h3>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '0.85rem',
                    color: '#666',
                  }}
                >
                  {manifestTarget.trip?.name} &bull; {manifestTarget.startDate}{' '}
                  &rarr; {manifestTarget.endDate}
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                }}
              >
                <button
                  type="button"
                  className="btn-sm btn-outline"
                  onClick={() => window.print()}
                  title="Cetak Manifest"
                >
                  🖨️ Cetak
                </button>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setManifestTarget(null)}
                >
                  &times;
                </button>
              </div>
            </div>

            <div
              className="modal-body"
              style={{ maxHeight: '75vh', overflowY: 'auto' }}
            >
              {manifestLoading ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#666',
                  }}
                >
                  Memuat manifest peserta...
                </div>
              ) : manifestError ? (
                <div
                  className="feedback-toast error"
                  style={{ margin: '1rem 0' }}
                >
                  {manifestError}
                </div>
              ) : manifestData ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                  }}
                >
                  {/* Summary Metric Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          fontWeight: 600,
                        }}
                      >
                        TRIP
                      </div>
                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: '#1a3325',
                          marginTop: '2px',
                        }}
                      >
                        {manifestData.trip.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        {manifestData.trip.tripType}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          fontWeight: 600,
                        }}
                      >
                        SCHEDULE
                      </div>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#1a3325',
                          marginTop: '2px',
                        }}
                      >
                        {manifestData.schedule.startDate} &rarr;{' '}
                        {manifestData.schedule.endDate}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        Status: {manifestData.schedule.status}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          fontWeight: 600,
                        }}
                      >
                        CONFIRMED BOOKINGS
                      </div>
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: '#0369a1',
                          marginTop: '2px',
                        }}
                      >
                        {manifestData.confirmedBookingsCount}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        Transaksi Terkonfirmasi
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        background: '#f0fdf4',
                        borderRadius: '8px',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#10254d',
                          fontWeight: 600,
                        }}
                      >
                        CONFIRMED PARTICIPANTS
                      </div>
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: '#10254d',
                          marginTop: '2px',
                        }}
                      >
                        {manifestData.expectedParticipants}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#10254d',
                          fontWeight: 500,
                          marginTop: '2px',
                        }}
                      >
                        Expected: {manifestData.expectedParticipants} &bull;
                        Completed Data:{' '}
                        {manifestData.completedParticipantsCount}
                      </div>
                    </div>
                  </div>

                  {/* Booking Breakdown */}
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>
                      Rincian Booking Terkonfirmasi (
                      {manifestData.bookings.length})
                    </h4>
                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Kode Booking</th>
                            <th>Pemesan</th>
                            <th>Paket</th>
                            <th>Status Data Peserta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {manifestData.bookings.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="empty-state">
                                Belum ada booking terkonfirmasi pada jadwal ini.
                              </td>
                            </tr>
                          ) : (
                            manifestData.bookings.map((b) => (
                              <tr key={b.id}>
                                <td>
                                  <span
                                    style={{
                                      fontFamily: 'monospace',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {b.bookingCode}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 600 }}>
                                    {b.customerName}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.75rem',
                                      color: '#666',
                                    }}
                                  >
                                    {b.customerPhone}
                                  </div>
                                </td>
                                <td>{b.packageName}</td>
                                <td>
                                  <span
                                    className={`badge ${b.completedCount >= b.participantCount ? 'badge-confirmed' : 'badge-pending'}`}
                                  >
                                    Expected: {b.participantCount} | Completed
                                    Data: {b.completedCount}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Participant List (Manifest) */}
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>
                      Participant List ({manifestData.participantList.length}{' '}
                      dari {manifestData.expectedParticipants} Peserta)
                    </h4>
                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>No</th>
                            <th>Nama Lengkap</th>
                            <th>Gender / Tgl Lahir</th>
                            <th>Kontak (HP)</th>
                            <th>Identitas</th>
                            <th>Kontak Darurat</th>
                            <th>Booking</th>
                          </tr>
                        </thead>
                        <tbody>
                          {manifestData.participantList.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="empty-state">
                                Belum ada data manifest peserta yang diisi.
                              </td>
                            </tr>
                          ) : (
                            manifestData.participantList.map((p, idx) => (
                              <tr key={p.id}>
                                <td>{idx + 1}</td>
                                <td>
                                  <div style={{ fontWeight: 600 }}>
                                    {p.fullName}
                                  </div>
                                  {p.notes && (
                                    <div
                                      style={{
                                        fontSize: '0.75rem',
                                        color: '#888',
                                      }}
                                    >
                                      Catatan: {p.notes}
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <div>{p.gender || '-'}</div>
                                  <div
                                    style={{
                                      fontSize: '0.75rem',
                                      color: '#666',
                                    }}
                                  >
                                    {p.dateOfBirth || '-'}
                                  </div>
                                </td>
                                <td>{p.phone || '-'}</td>
                                <td>
                                  <div>{p.identityType || '-'}</div>
                                  <div
                                    style={{
                                      fontSize: '0.75rem',
                                      fontFamily: 'monospace',
                                      color: '#555',
                                    }}
                                  >
                                    {p.identityNumber || '-'}
                                  </div>
                                </td>
                                <td>
                                  <div>{p.emergencyContactName || '-'}</div>
                                  <div
                                    style={{
                                      fontSize: '0.75rem',
                                      color: '#666',
                                    }}
                                  >
                                    {p.emergencyContactPhone || '-'}
                                  </div>
                                </td>
                                <td>
                                  <div
                                    style={{
                                      fontFamily: 'monospace',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {p.bookingCode}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.75rem',
                                      color: '#666',
                                    }}
                                  >
                                    {p.customerName}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setManifestTarget(null)}
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
