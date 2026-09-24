'use client';

import { useState } from 'react';
import type {
  AdminBookingItem,
  BookingParticipantItem,
  BookingSource,
  BookingStatus,
  GenderType,
  IdentityType,
  SchedulePackage,
  Trip,
  TripSchedule,
} from '@wildera/types';

interface BookingsClientProps {
  initialItems: AdminBookingItem[];
  trips: Trip[];
  schedules: TripSchedule[];
  userRoles: string[];
}

export function BookingsClient({
  initialItems,
  trips,
  schedules,
}: BookingsClientProps) {
  const [items, setItems] = useState<AdminBookingItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [filterTripId, setFilterTripId] = useState<string>('ALL');

  // Loading & notification states
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Detail Drawer State
  const [selectedBooking, setSelectedBooking] =
    useState<AdminBookingItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Cancel Modal State
  const [cancelTarget, setCancelTarget] = useState<AdminBookingItem | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Create Booking Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTripId, setCreateTripId] = useState('');
  const [createScheduleId, setCreateScheduleId] = useState('');
  const [createPackageId, setCreatePackageId] = useState('');
  const [createContactName, setCreateContactName] = useState('');
  const [createContactPhone, setCreateContactPhone] = useState('');
  const [createContactEmail, setCreateContactEmail] = useState('');
  const [createSource, setCreateSource] = useState<BookingSource>('ADMIN');
  const [createNotes, setCreateNotes] = useState('');
  const [createParticipants, setCreateParticipants] = useState<
    Array<{
      fullName: string;
      phone: string;
      identityType: IdentityType;
      identityNumber: string;
      gender: GenderType;
      emergencyContactName: string;
      emergencyContactPhone: string;
      notes: string;
    }>
  >([
    {
      fullName: '',
      phone: '',
      identityType: 'KTP',
      identityNumber: '',
      gender: 'MALE',
      emergencyContactName: '',
      emergencyContactPhone: '',
      notes: '',
    },
  ]);
  const [createError, setCreateError] = useState<string | null>(null);

  // Participant Modal States (Add/Edit in Drawer)
  const [participantModalMode, setParticipantModalMode] = useState<
    'create' | 'edit' | null
  >(null);
  const [editingParticipantId, setEditingParticipantId] = useState<
    string | null
  >(null);
  const [pFullName, setPFullName] = useState('');
  const [pDateOfBirth, setPDateOfBirth] = useState('');
  const [pGender, setPGender] = useState<GenderType | ''>('');
  const [pPhone, setPPhone] = useState('');
  const [pIdentityType, setPIdentityType] = useState<IdentityType | ''>('KTP');
  const [pIdentityNumber, setPIdentityNumber] = useState('');
  const [pEmergencyName, setPEmergencyName] = useState('');
  const [pEmergencyPhone, setPEmergencyPhone] = useState('');
  const [pNotes, setPNotes] = useState('');
  const [pError, setPError] = useState<string | null>(null);

  // Available schedules for selected trip in create modal
  const availableSchedules = createTripId
    ? schedules.filter(
        (s) => s.tripId === createTripId && s.status !== 'CANCELLED',
      )
    : schedules.filter((s) => s.status !== 'CANCELLED');

  const selectedSchedule = schedules.find((s) => s.id === createScheduleId);
  const availablePackages: SchedulePackage[] = selectedSchedule?.packages ?? [];
  const selectedPackage = availablePackages.find(
    (p: SchedulePackage) => p.id === createPackageId,
  );

  const calculateAutoTotal = () => {
    if (!selectedPackage) return 0;
    const priceNum =
      typeof selectedPackage.price === 'string'
        ? parseFloat(selectedPackage.price) || 0
        : selectedPackage.price;
    return priceNum * createParticipants.length;
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Reload bookings from server
  const reloadBookings = async () => {
    try {
      const res = await fetch('/api/admin/bookings');
      if (res.ok) {
        const json = await res.json();
        const fresh = Array.isArray(json)
          ? json
          : (json.data?.items ?? json.items ?? json.data ?? []);
        setItems(fresh);
      }
    } catch {
      // ignore
    }
  };

  // --- Confirm Booking Action ---
  const handleConfirm = async (booking: AdminBookingItem) => {
    const customerName =
      booking.customer?.fullName || booking.contactName || 'Pelanggan';
    if (
      !window.confirm(
        `Konfirmasi booking ${booking.bookingNumber} untuk ${customerName} (${booking.participantCount} peserta)? Kapasitas jadwal akan diverifikasi.`,
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json();

      if (!res.ok) {
        const msg =
          json.error?.message ||
          json.message ||
          'Gagal mengonfirmasi booking. Periksa kapasitas jadwal.';
        showFeedback('error', msg);
        return;
      }

      showFeedback(
        'success',
        `Booking ${booking.bookingNumber} berhasil dikonfirmasi!`,
      );
      await reloadBookings();
      if (selectedBooking?.id === booking.id) {
        setSelectedBooking((prev) =>
          prev ? { ...prev, status: 'CONFIRMED' } : null,
        );
      }
    } catch (err: unknown) {
      showFeedback(
        'error',
        (err as Error).message || 'Terjadi kesalahan sistem.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  // --- Cancel Booking Action ---
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;

    if (!cancelReason.trim() || cancelReason.trim().length < 3) {
      setCancelError('Alasan pembatalan minimal 3 karakter.');
      return;
    }

    setActionLoading(true);
    setCancelError(null);

    try {
      const res = await fetch(`/api/admin/bookings/${cancelTarget.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationReason: cancelReason.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        setCancelError(
          json.error?.message || json.message || 'Gagal membatalkan booking.',
        );
        return;
      }

      showFeedback(
        'success',
        `Booking ${cancelTarget.bookingNumber} berhasil dibatalkan.`,
      );
      setCancelTarget(null);
      setCancelReason('');
      await reloadBookings();
      if (selectedBooking?.id === cancelTarget.id) {
        setSelectedBooking((prev) =>
          prev
            ? {
                ...prev,
                status: 'CANCELLED',
                cancellationReason: cancelReason.trim(),
              }
            : null,
        );
      }
    } catch (err: unknown) {
      setCancelError((err as Error).message || 'Terjadi kesalahan sistem.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Quick Status Update (COMPLETED / NO_SHOW) ---
  const handleStatusChange = async (
    booking: AdminBookingItem,
    newStatus: BookingStatus,
  ) => {
    if (
      !window.confirm(
        `Ubah status booking ${booking.bookingNumber} menjadi ${newStatus}?`,
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();

      if (!res.ok) {
        showFeedback(
          'error',
          json.error?.message ||
            json.message ||
            'Gagal memperbarui status booking.',
        );
        return;
      }

      showFeedback(
        'success',
        `Status booking ${booking.bookingNumber} berhasil diubah ke ${newStatus}.`,
      );
      await reloadBookings();
      if (selectedBooking?.id === booking.id) {
        setSelectedBooking((prev) =>
          prev ? { ...prev, status: newStatus } : null,
        );
      }
    } catch (err: unknown) {
      showFeedback('error', (err as Error).message || 'Terjadi kesalahan.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Participant Management Handlers (Step 28) ---
  const openAddParticipant = () => {
    setPFullName('');
    setPDateOfBirth('');
    setPGender('');
    setPPhone('');
    setPIdentityType('KTP');
    setPIdentityNumber('');
    setPEmergencyName('');
    setPEmergencyPhone('');
    setPNotes('');
    setPError(null);
    setEditingParticipantId(null);
    setParticipantModalMode('create');
  };

  const openEditParticipant = (p: BookingParticipantItem) => {
    setPFullName(p.fullName);
    let dob = '';
    if (p.dateOfBirth) {
      const raw =
        typeof p.dateOfBirth === 'string'
          ? p.dateOfBirth
          : p.dateOfBirth.toISOString();
      dob = raw.split('T')[0] ?? '';
    }
    setPDateOfBirth(dob);
    setPGender(p.gender || '');
    setPPhone(p.phone || '');
    setPIdentityType(p.identityType || 'KTP');
    setPIdentityNumber(p.identityNumber || '');
    setPEmergencyName(p.emergencyContactName || '');
    setPEmergencyPhone(p.emergencyContactPhone || '');
    setPNotes(p.notes || '');
    setPError(null);
    setEditingParticipantId(p.id);
    setParticipantModalMode('edit');
  };

  const handleSaveParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setPError(null);

    if (!pFullName.trim() || pFullName.trim().length < 2) {
      setPError('Nama lengkap minimal 2 karakter.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        fullName: pFullName.trim(),
        dateOfBirth: pDateOfBirth ? pDateOfBirth : null,
        gender: pGender || null,
        phone: pPhone.trim() || null,
        identityType: pIdentityType || null,
        identityNumber: pIdentityNumber.trim() || null,
        emergencyContactName: pEmergencyName.trim() || null,
        emergencyContactPhone: pEmergencyPhone.trim() || null,
        notes: pNotes.trim() || null,
      };

      let res: Response;
      if (participantModalMode === 'create') {
        res = await fetch(
          `/api/admin/bookings/${selectedBooking.id}/participants`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        );
      } else {
        res = await fetch(
          `/api/admin/bookings/${selectedBooking.id}/participants/${editingParticipantId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        );
      }

      const json = await res.json();
      if (!res.ok) {
        setPError(json.error?.message || 'Gagal menyimpan data peserta.');
        return;
      }

      showFeedback(
        'success',
        participantModalMode === 'create'
          ? 'Peserta baru berhasil ditambahkan.'
          : 'Data peserta berhasil diperbarui.',
      );
      setParticipantModalMode(null);

      // Refresh booking details
      const detailRes = await fetch(
        `/api/admin/bookings/${selectedBooking.id}`,
      );
      if (detailRes.ok) {
        const detailJson = await detailRes.json();
        const updatedBooking = detailJson.data || detailJson;
        setSelectedBooking(updatedBooking);
      }
      await reloadBookings();
    } catch (err: unknown) {
      setPError((err as Error).message || 'Terjadi kesalahan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteParticipant = async (
    participant: BookingParticipantItem,
  ) => {
    if (!selectedBooking) return;
    if (
      !window.confirm(
        `Hapus data peserta ${participant.fullName} dari booking ini?`,
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/admin/bookings/${selectedBooking.id}/participants/${participant.id}`,
        {
          method: 'DELETE',
        },
      );

      const json = await res.json();
      if (!res.ok) {
        showFeedback(
          'error',
          json.error?.message || 'Gagal menghapus data peserta.',
        );
        return;
      }

      showFeedback('success', `Peserta ${participant.fullName} telah dihapus.`);

      // Refresh booking details
      const detailRes = await fetch(
        `/api/admin/bookings/${selectedBooking.id}`,
      );
      if (detailRes.ok) {
        const detailJson = await detailRes.json();
        const updatedBooking = detailJson.data || detailJson;
        setSelectedBooking(updatedBooking);
      }
      await reloadBookings();
    } catch (err: unknown) {
      showFeedback('error', (err as Error).message || 'Terjadi kesalahan.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Create Booking Submit ---
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createScheduleId) {
      setCreateError('Silakan pilih jadwal keberangkatan.');
      return;
    }

    if (!createPackageId) {
      setCreateError('Silakan pilih paket.');
      return;
    }

    if (!createContactName.trim()) {
      setCreateError('Nama kontak wajib diisi.');
      return;
    }

    if (!createContactPhone.trim()) {
      setCreateError('Nomor WhatsApp / telepon wajib diisi.');
      return;
    }

    // Validate participants
    for (let i = 0; i < createParticipants.length; i++) {
      const p = createParticipants[i];
      if (!p || !p.fullName.trim()) {
        setCreateError(`Nama peserta #${i + 1} wajib diisi.`);
        return;
      }
    }

    setActionLoading(true);
    try {
      const payload = {
        scheduleId: createScheduleId,
        packageId: createPackageId,
        contactName: createContactName.trim(),
        contactWhatsapp: createContactPhone.trim(),
        contactEmail: createContactEmail.trim() || undefined,
        participantCount: createParticipants.length,
        source: createSource,
        notes: createNotes.trim() || undefined,
        participants: createParticipants.map((p) => ({
          fullName: p.fullName.trim(),
          phone: p.phone.trim() || undefined,
          identityType: p.identityType,
          identityNumber: p.identityNumber.trim() || undefined,
          gender: p.gender,
          emergencyContactName: p.emergencyContactName.trim() || undefined,
          emergencyContactPhone: p.emergencyContactPhone.trim() || undefined,
          notes: p.notes.trim() || undefined,
        })),
      };

      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setCreateError(
          json.error?.message || json.message || 'Gagal membuat booking baru.',
        );
        return;
      }

      showFeedback(
        'success',
        `Booking baru berhasil dibuat (${json.bookingNumber || 'Sukses'})!`,
      );
      setIsCreateOpen(false);
      resetCreateForm();
      await reloadBookings();
    } catch (err: unknown) {
      setCreateError((err as Error).message || 'Terjadi kesalahan sistem.');
    } finally {
      setActionLoading(false);
    }
  };

  const resetCreateForm = () => {
    setCreateTripId('');
    setCreateScheduleId('');
    setCreatePackageId('');
    setCreateContactName('');
    setCreateContactPhone('');
    setCreateContactEmail('');
    setCreateSource('ADMIN');
    setCreateNotes('');
    setCreateParticipants([
      {
        fullName: '',
        phone: '',
        identityType: 'KTP',
        identityNumber: '',
        gender: 'MALE',
        emergencyContactName: '',
        emergencyContactPhone: '',
        notes: '',
      },
    ]);
    setCreateError(null);
  };

  const handleAddParticipant = () => {
    setCreateParticipants((prev) => [
      ...prev,
      {
        fullName: '',
        phone: '',
        identityType: 'KTP',
        identityNumber: '',
        gender: 'MALE',
        emergencyContactName: '',
        emergencyContactPhone: '',
        notes: '',
      },
    ]);
  };

  const handleRemoveParticipant = (index: number) => {
    if (createParticipants.length <= 1) return;
    setCreateParticipants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateParticipant = (
    index: number,
    field: string,
    value: string,
  ) => {
    setCreateParticipants((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  // --- Filtering & Searching ---
  const filteredItems = items.filter((item) => {
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (filterSource !== 'ALL' && item.source !== filterSource) return false;
    if (filterTripId !== 'ALL' && item.schedule?.trip?.id !== filterTripId)
      return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNumber = item.bookingNumber.toLowerCase().includes(q);
      const matchName = (item.customer?.fullName || item.contactName || '')
        .toLowerCase()
        .includes(q);
      const matchPhone = (
        item.customer?.whatsappNumber ||
        item.contactWhatsapp ||
        ''
      )
        .toLowerCase()
        .includes(q);
      const matchEmail = (item.customer?.email || item.contactEmail || '')
        .toLowerCase()
        .includes(q);
      const matchTrip = item.schedule?.trip?.name?.toLowerCase().includes(q);
      return matchNumber || matchName || matchPhone || matchEmail || matchTrip;
    }

    return true;
  });

  // Metrics
  const totalBookingsCount = items.length;
  const confirmedBookingsCount = items.filter(
    (b) => b.status === 'CONFIRMED',
  ).length;
  const pendingBookingsCount = items.filter(
    (b) => b.status === 'INQUIRY' || b.status === 'PENDING_CONFIRMATION',
  ).length;
  const confirmedParticipantsCount = items
    .filter((b) => b.status === 'CONFIRMED')
    .reduce((sum, b) => sum + b.participantCount, 0);

  const formatCurrency = (amount?: number | string | null) => {
    if (amount === undefined || amount === null) return 'Rp 0';
    const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateVal?: string | Date | null) => {
    if (!dateVal) return '-';
    try {
      const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateVal);
    }
  };

  const formatDateTime = (dateVal?: string | Date | null) => {
    if (!dateVal) return '-';
    try {
      const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateVal);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="badge badge-confirmed">Confirmed</span>;
      case 'INQUIRY':
        return <span className="badge badge-inquiry">Inquiry</span>;
      case 'PENDING_CONFIRMATION':
        return <span className="badge badge-pending">Pending</span>;
      case 'COMPLETED':
        return <span className="badge badge-completed">Completed</span>;
      case 'CANCELLED':
        return <span className="badge badge-cancelled">Cancelled</span>;
      case 'NO_SHOW':
        return <span className="badge badge-no-show">No Show</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="admin-content-inner">
      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`form-feedback ${
            feedbackMessage.type === 'success'
              ? 'form-feedback-success'
              : 'form-feedback-error'
          }`}
          style={{ marginBottom: '1.25rem' }}
        >
          {feedbackMessage.text}
        </div>
      )}

      {/* Header & Metrics */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--foreground)',
            }}
          >
            Booking
          </h1>
          <p
            style={{
              margin: '0.25rem 0 0',
              color: 'var(--muted)',
              fontSize: '0.9rem',
            }}
          >
            Kelola data pemesanan, konfirmasi peserta, dan alokasi kapasitas
            jadwal.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              resetCreateForm();
              setIsCreateOpen(true);
            }}
          >
            + Buat Booking Baru
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          className="stat-card"
          style={{
            padding: '1rem',
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: '6px',
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--muted)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Total Booking
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--foreground)',
              marginTop: '0.25rem',
            }}
          >
            {totalBookingsCount}
          </div>
        </div>
        <div
          className="stat-card"
          style={{
            padding: '1rem',
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: '6px',
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              color: '#166534',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Booking Confirmed
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#166534',
              marginTop: '0.25rem',
            }}
          >
            {confirmedBookingsCount}
          </div>
        </div>
        <div
          className="stat-card"
          style={{
            padding: '1rem',
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: '6px',
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              color: '#9a3412',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Inquiry & Pending
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#9a3412',
              marginTop: '0.25rem',
            }}
          >
            {pendingBookingsCount}
          </div>
        </div>
        <div
          className="stat-card"
          style={{
            padding: '1rem',
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: '6px',
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--accent)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Peserta Confirmed
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--accent)',
              marginTop: '0.25rem',
            }}
          >
            {confirmedParticipantsCount}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="filter-bar"
        style={{ marginBottom: '1.25rem', gap: '0.75rem' }}
      >
        <input
          type="search"
          className="filter-input"
          placeholder="Cari kode booking, nama, wa, email, trip..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: '1 1 240px' }}
        />

        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Filter status booking"
        >
          <option value="ALL">Semua Status</option>
          <option value="INQUIRY">Inquiry</option>
          <option value="PENDING_CONFIRMATION">Pending Confirmation</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="NO_SHOW">No Show</option>
        </select>

        <select
          className="filter-select"
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          aria-label="Filter sumber booking"
        >
          <option value="ALL">Semua Sumber</option>
          <option value="WEBSITE_WHATSAPP">Website WhatsApp</option>
          <option value="WHATSAPP">Direct WhatsApp</option>
          <option value="INSTAGRAM">Instagram</option>
          <option value="ADMIN">Admin Input</option>
          <option value="OTHER">Lainnya</option>
        </select>

        <select
          className="filter-select"
          value={filterTripId}
          onChange={(e) => setFilterTripId(e.target.value)}
          aria-label="Filter program trip"
        >
          <option value="ALL">Semua Trip</option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {(searchQuery ||
          filterStatus !== 'ALL' ||
          filterSource !== 'ALL' ||
          filterTripId !== 'ALL') && (
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('ALL');
              setFilterSource('ALL');
              setFilterTripId('ALL');
            }}
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Table Section */}
      <div
        className="table-responsive"
        style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: '6px',
        }}
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>Kode Booking</th>
              <th>Kontak Pelanggan</th>
              <th>Trip & Jadwal</th>
              <th>Paket & Nilai</th>
              <th style={{ textAlign: 'center' }}>Peserta</th>
              <th>Sumber</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: 'center',
                    padding: '3rem 1rem',
                    color: 'var(--muted)',
                  }}
                >
                  Tidak ada data booking yang sesuai dengan kriteria pencarian.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const contactDisplayName =
                  item.customer?.fullName || item.contactName;
                const contactDisplayPhone =
                  item.customer?.whatsappNumber || item.contactWhatsapp;
                const contactDisplayEmail =
                  item.customer?.email || item.contactEmail;

                return (
                  <tr key={item.id}>
                    <td>
                      <span className="code-tag" style={{ fontWeight: 600 }}>
                        {item.bookingNumber}
                      </span>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--muted)',
                          marginTop: '0.2rem',
                        }}
                      >
                        {formatDate(item.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          fontWeight: 600,
                          color: 'var(--foreground)',
                        }}
                      >
                        {contactDisplayName}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--muted)',
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                        }}
                      >
                        <span>{contactDisplayPhone}</span>
                        {contactDisplayPhone && (
                          <a
                            href={`https://wa.me/${contactDisplayPhone.replace(
                              /[^0-9]/g,
                              '',
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#166534',
                              fontSize: '0.75rem',
                              textDecoration: 'underline',
                            }}
                          >
                            WA
                          </a>
                        )}
                      </div>
                      {contactDisplayEmail && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--muted)',
                          }}
                        >
                          {contactDisplayEmail}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {item.schedule?.trip?.name || 'Trip'}
                      </div>
                      <div
                        style={{ fontSize: '0.8rem', color: 'var(--muted)' }}
                      >
                        {formatDate(item.schedule?.startDate)} -{' '}
                        {formatDate(item.schedule?.endDate)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        {item.package?.name || '-'}
                      </div>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: 'var(--accent)',
                          marginTop: '0.15rem',
                        }}
                      >
                        {formatCurrency(item.totalAmount)}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className="badge badge-count"
                        style={{
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.85rem',
                        }}
                      >
                        {item.participantCount} orang
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-source">
                        {item.source.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            setSelectedBooking(item);
                            setIsDetailOpen(true);
                          }}
                        >
                          Detail
                        </button>

                        {(item.status === 'INQUIRY' ||
                          item.status === 'PENDING_CONFIRMATION') && (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            disabled={actionLoading}
                            onClick={() => handleConfirm(item)}
                            style={{
                              background: '#10254d',
                              borderColor: '#10254d',
                            }}
                          >
                            Konfirmasi
                          </button>
                        )}

                        {item.status !== 'CANCELLED' &&
                          item.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline btn-danger"
                              disabled={actionLoading}
                              onClick={() => {
                                setCancelTarget(item);
                                setCancelReason('');
                                setCancelError(null);
                              }}
                            >
                              Batal
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

      {/* DETAIL DRAWER / MODAL */}
      {isDetailOpen && selectedBooking && (
        <div className="modal-backdrop" onClick={() => setIsDetailOpen(false)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <h3 style={{ margin: 0 }}>
                    Detail Booking: {selectedBooking.bookingNumber}
                  </h3>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--muted)',
                    marginTop: '0.25rem',
                  }}
                >
                  Dibuat pada {formatDateTime(selectedBooking.createdAt)} ·
                  Sumber:{' '}
                  <span style={{ fontWeight: 600 }}>
                    {selectedBooking.source}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsDetailOpen(false)}
              >
                &times;
              </button>
            </div>

            <div
              className="modal-body"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              {/* Status Alert if Cancelled */}
              {selectedBooking.status === 'CANCELLED' && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '4px',
                    color: '#991b1b',
                    fontSize: '0.85rem',
                  }}
                >
                  <strong>Booking Dibatalkan</strong>
                  {selectedBooking.cancellationReason && (
                    <div style={{ marginTop: '0.25rem' }}>
                      Alasan: {selectedBooking.cancellationReason}
                    </div>
                  )}
                  {selectedBooking.cancelledAt && (
                    <div style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>
                      Waktu batal: {formatDateTime(selectedBooking.cancelledAt)}
                    </div>
                  )}
                </div>
              )}

              {/* Customer & Trip Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                {/* Customer Box */}
                <div
                  style={{
                    padding: '1rem',
                    background: '#faf7f2',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                >
                  <h4
                    style={{
                      margin: '0 0 0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--foreground)',
                    }}
                  >
                    Data Pelanggan (Contact)
                  </h4>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    <div>
                      <strong>Nama:</strong>{' '}
                      {selectedBooking.customer?.fullName ||
                        selectedBooking.contactName}
                    </div>
                    <div>
                      <strong>WhatsApp / HP:</strong>{' '}
                      {selectedBooking.customer?.whatsappNumber ||
                        selectedBooking.contactWhatsapp}{' '}
                      {(selectedBooking.customer?.whatsappNumber ||
                        selectedBooking.contactWhatsapp) && (
                        <a
                          href={`https://wa.me/${(
                            selectedBooking.customer?.whatsappNumber ||
                            selectedBooking.contactWhatsapp
                          )?.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#166534', marginLeft: '0.25rem' }}
                        >
                          (Chat WA)
                        </a>
                      )}
                    </div>
                    {(selectedBooking.customer?.email ||
                      selectedBooking.contactEmail) && (
                      <div>
                        <strong>Email:</strong>{' '}
                        {selectedBooking.customer?.email ||
                          selectedBooking.contactEmail}
                      </div>
                    )}
                  </div>
                </div>

                {/* Trip & Schedule Box */}
                <div
                  style={{
                    padding: '1rem',
                    background: '#faf7f2',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                >
                  <h4
                    style={{
                      margin: '0 0 0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--foreground)',
                    }}
                  >
                    Informasi Jadwal & Trip
                  </h4>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    <div>
                      <strong>Trip:</strong>{' '}
                      {selectedBooking.schedule?.trip?.name || '-'}
                    </div>
                    <div>
                      <strong>Tanggal:</strong>{' '}
                      {formatDate(selectedBooking.schedule?.startDate)} s/d{' '}
                      {formatDate(selectedBooking.schedule?.endDate)}
                    </div>
                    <div>
                      <strong>Paket:</strong>{' '}
                      {selectedBooking.package?.name || '-'}
                    </div>
                    <div>
                      <strong>Meeting Point:</strong>{' '}
                      {selectedBooking.package?.meetingPoint?.name ||
                        'Titik Kumpul Trip'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial & Summary Box */}
              <div
                style={{
                  padding: '1rem',
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    Total Biaya ({selectedBooking.participantCount} Peserta)
                  </div>
                  <div
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      color: 'var(--accent)',
                      marginTop: '0.15rem',
                    }}
                  >
                    {formatCurrency(selectedBooking.totalAmount)}
                  </div>
                </div>
                <div>
                  {selectedBooking.confirmedAt && (
                    <div style={{ fontSize: '0.8rem', color: '#166534' }}>
                      Dikonfirmasi pada{' '}
                      {formatDateTime(selectedBooking.confirmedAt)}
                    </div>
                  )}
                </div>
              </div>

              {/* Participants Section */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>
                    Daftar Peserta ({selectedBooking.participants?.length || 0}{' '}
                    / {selectedBooking.participantCount} Orang)
                  </h4>
                  {selectedBooking.status !== 'CANCELLED' && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={openAddParticipant}
                      style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}
                    >
                      + Tambah Peserta
                    </button>
                  )}
                </div>
                <div
                  className="table-responsive"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                  }}
                >
                  <table
                    className="admin-table"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nama Lengkap</th>
                        <th>Identitas</th>
                        <th>Gender</th>
                        <th>Kontak / WA</th>
                        <th>Kontak Darurat</th>
                        <th>Catatan Medis</th>
                        <th style={{ textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBooking.participants &&
                      selectedBooking.participants.length > 0 ? (
                        selectedBooking.participants.map((p, idx) => (
                          <tr key={p.id || idx}>
                            <td>{idx + 1}</td>
                            <td>
                              <strong>{p.fullName}</strong>
                            </td>
                            <td>
                              {p.identityNumber ? (
                                <span>
                                  {p.identityType}:{' '}
                                  <span className="code-tag">
                                    {p.identityNumber}
                                  </span>
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td>
                              {p.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'}
                            </td>
                            <td>{p.phone || '-'}</td>
                            <td>
                              {p.emergencyContactName ? (
                                <div>
                                  {p.emergencyContactName} (
                                  {p.emergencyContactPhone || '-'})
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td>{p.notes || '-'}</td>
                            <td
                              style={{
                                textAlign: 'right',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => openEditParticipant(p)}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.2rem 0.4rem',
                                  marginRight: '0.25rem',
                                }}
                              >
                                Edit
                              </button>
                              {selectedBooking.status !== 'CANCELLED' &&
                                selectedBooking.status !== 'COMPLETED' && (
                                  <button
                                    type="button"
                                    className="btn-danger"
                                    onClick={() => handleDeleteParticipant(p)}
                                    style={{
                                      fontSize: '0.75rem',
                                      padding: '0.2rem 0.4rem',
                                    }}
                                  >
                                    Hapus
                                  </button>
                                )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={8}
                            style={{
                              textAlign: 'center',
                              color: 'var(--muted)',
                              padding: '1rem',
                            }}
                          >
                            Data rincian peserta belum diisi secara detail.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                  }}
                >
                  <strong>Catatan Khusus:</strong>
                  <p style={{ margin: '0.25rem 0 0' }}>
                    {selectedBooking.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div
              className="modal-footer"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {selectedBooking.status === 'CONFIRMED' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      disabled={actionLoading}
                      onClick={() =>
                        handleStatusChange(selectedBooking, 'COMPLETED')
                      }
                    >
                      Tandai Selesai (Completed)
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      disabled={actionLoading}
                      onClick={() =>
                        handleStatusChange(selectedBooking, 'NO_SHOW')
                      }
                    >
                      Tandai No Show
                    </button>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Tutup
                </button>

                {(selectedBooking.status === 'INQUIRY' ||
                  selectedBooking.status === 'PENDING_CONFIRMATION') && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={actionLoading}
                    onClick={() => handleConfirm(selectedBooking)}
                    style={{
                      background: '#10254d',
                      borderColor: '#10254d',
                    }}
                  >
                    Konfirmasi Booking Sekarang
                  </button>
                )}

                {selectedBooking.status !== 'CANCELLED' &&
                  selectedBooking.status !== 'COMPLETED' && (
                    <button
                      type="button"
                      className="btn btn-outline btn-danger"
                      disabled={actionLoading}
                      onClick={() => {
                        setCancelTarget(selectedBooking);
                        setCancelReason('');
                        setCancelError(null);
                      }}
                    >
                      Batalkan Booking
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelTarget && (
        <div className="modal-backdrop" onClick={() => setCancelTarget(null)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ margin: 0, color: '#991b1b' }}>
                Batalkan Booking: {cancelTarget.bookingNumber}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setCancelTarget(null)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCancelSubmit}>
              <div
                className="modal-body"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {cancelError && (
                  <div className="form-feedback form-feedback-error">
                    {cancelError}
                  </div>
                )}
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: 'var(--foreground)',
                  }}
                >
                  Apakah Anda yakin ingin membatalkan reservasi ini untuk
                  pelanggan{' '}
                  <strong>
                    {cancelTarget.customer?.fullName ||
                      cancelTarget.contactName}
                  </strong>{' '}
                  ({cancelTarget.participantCount} peserta)?
                </p>
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    color: '#991b1b',
                  }}
                >
                  Kapasitas kursi ({cancelTarget.participantCount} slot) akan
                  otomatis dikembalikan ke kuota jadwal yang tersedia.
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cancelReason">
                    Alasan Pembatalan <span style={{ color: 'red' }}>*</span>
                  </label>
                  <textarea
                    id="cancelReason"
                    className="form-textarea"
                    rows={3}
                    placeholder="Contoh: Permintaan pembatalan dari pelanggan via WhatsApp / Reschedule ke tanggal lain"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCancelTarget(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Memproses...' : 'Konfirmasi Batalkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE BOOKING MODAL */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Buat Booking Manual (Admin Input)</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsCreateOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div
                className="modal-body"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
                {createError && (
                  <div className="form-feedback form-feedback-error">
                    {createError}
                  </div>
                )}

                {/* Step 1: Trip & Schedule Selection */}
                <div
                  style={{
                    padding: '1rem',
                    background: '#faf7f2',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                >
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem' }}>
                    1. Pilih Trip & Jadwal Keberangkatan
                  </h4>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                    }}
                  >
                    <div className="form-group">
                      <label className="form-label" htmlFor="createTrip">
                        Pilih Trip
                      </label>
                      <select
                        id="createTrip"
                        className="form-select"
                        value={createTripId}
                        onChange={(e) => {
                          setCreateTripId(e.target.value);
                          setCreateScheduleId('');
                          setCreatePackageId('');
                        }}
                      >
                        <option value="">-- Pilih Program Trip --</option>
                        {trips.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="createSchedule">
                        Pilih Jadwal <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        id="createSchedule"
                        className="form-select"
                        value={createScheduleId}
                        onChange={(e) => {
                          setCreateScheduleId(e.target.value);
                          setCreatePackageId('');
                        }}
                        required
                      >
                        <option value="">-- Pilih Tanggal Jadwal --</option>
                        {availableSchedules.map((s) => (
                          <option key={s.id} value={s.id}>
                            {formatDate(s.startDate)} - {formatDate(s.endDate)}{' '}
                            (Status: {s.status}, Kapasitas: {s.capacity})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Package Selection */}
                  {selectedSchedule && (
                    <div
                      className="form-group"
                      style={{ marginTop: '0.75rem' }}
                    >
                      <label className="form-label" htmlFor="createPackage">
                        Pilih Paket Layanan{' '}
                        <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        id="createPackage"
                        className="form-select"
                        value={createPackageId}
                        onChange={(e) => setCreatePackageId(e.target.value)}
                        required
                      >
                        <option value="">-- Pilih Paket --</option>
                        {availablePackages.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name} — {formatCurrency(pkg.price)} / orang
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Step 2: Customer Contact Profile */}
                <div
                  style={{
                    padding: '1rem',
                    background: '#faf7f2',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                >
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem' }}>
                    2. Data Kontak Utama (Customer / Pemesan)
                  </h4>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                    }}
                  >
                    <div className="form-group">
                      <label className="form-label" htmlFor="contactName">
                        Nama Lengkap Pemesan{' '}
                        <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        id="contactName"
                        type="text"
                        className="form-input"
                        placeholder="Contoh: Rian Pratama"
                        value={createContactName}
                        onChange={(e) => setCreateContactName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="contactPhone">
                        Nomor WhatsApp / HP{' '}
                        <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        id="contactPhone"
                        type="tel"
                        className="form-input"
                        placeholder="Contoh: 081234567890"
                        value={createContactPhone}
                        onChange={(e) => setCreateContactPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    <div className="form-group">
                      <label className="form-label" htmlFor="contactEmail">
                        Email (Opsional)
                      </label>
                      <input
                        id="contactEmail"
                        type="email"
                        className="form-input"
                        placeholder="rian@example.com"
                        value={createContactEmail}
                        onChange={(e) => setCreateContactEmail(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="bookingSource">
                        Sumber Booking
                      </label>
                      <select
                        id="bookingSource"
                        className="form-select"
                        value={createSource}
                        onChange={(e) =>
                          setCreateSource(e.target.value as BookingSource)
                        }
                      >
                        <option value="ADMIN">Admin Input</option>
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="WEBSITE_WHATSAPP">
                          Website WhatsApp
                        </option>
                        <option value="INSTAGRAM">Instagram</option>
                        <option value="OTHER">Lainnya</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Step 3: Participants Form */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>
                      3. Data Rincian Peserta ({createParticipants.length}{' '}
                      Orang)
                    </h4>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={handleAddParticipant}
                    >
                      + Tambah Peserta
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    {createParticipants.map((p, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.85rem',
                          background: '#fff',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <span
                            style={{ fontWeight: 600, fontSize: '0.85rem' }}
                          >
                            Peserta #{idx + 1}
                          </span>
                          {createParticipants.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline btn-danger"
                              style={{
                                padding: '0.1rem 0.4rem',
                                fontSize: '0.75rem',
                              }}
                              onClick={() => handleRemoveParticipant(idx)}
                            >
                              Hapus
                            </button>
                          )}
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '0.5rem',
                          }}
                        >
                          <div className="form-group">
                            <label
                              className="form-label"
                              style={{ fontSize: '0.75rem' }}
                            >
                              Nama Lengkap{' '}
                              <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Nama peserta"
                              value={p.fullName}
                              onChange={(e) =>
                                handleUpdateParticipant(
                                  idx,
                                  'fullName',
                                  e.target.value,
                                )
                              }
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label
                              className="form-label"
                              style={{ fontSize: '0.75rem' }}
                            >
                              Gender
                            </label>
                            <select
                              className="form-select"
                              value={p.gender}
                              onChange={(e) =>
                                handleUpdateParticipant(
                                  idx,
                                  'gender',
                                  e.target.value,
                                )
                              }
                            >
                              <option value="MALE">Laki-laki</option>
                              <option value="FEMALE">Perempuan</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label
                              className="form-label"
                              style={{ fontSize: '0.75rem' }}
                            >
                              No. WhatsApp / HP
                            </label>
                            <input
                              type="tel"
                              className="form-input"
                              placeholder="08..."
                              value={p.phone}
                              onChange={(e) =>
                                handleUpdateParticipant(
                                  idx,
                                  'phone',
                                  e.target.value,
                                )
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label
                              className="form-label"
                              style={{ fontSize: '0.75rem' }}
                            >
                              Tipe & No. Identitas
                            </label>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <select
                                className="form-select"
                                style={{ width: '80px' }}
                                value={p.identityType}
                                onChange={(e) =>
                                  handleUpdateParticipant(
                                    idx,
                                    'identityType',
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="KTP">KTP</option>
                                <option value="PASSPORT">Paspor</option>
                                <option value="OTHER">Lainnya</option>
                              </select>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Nomor KTP/Paspor"
                                value={p.identityNumber}
                                onChange={(e) =>
                                  handleUpdateParticipant(
                                    idx,
                                    'identityNumber',
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem',
                            marginTop: '0.5rem',
                          }}
                        >
                          <div className="form-group">
                            <label
                              className="form-label"
                              style={{ fontSize: '0.75rem' }}
                            >
                              Kontak Darurat (Nama & No. HP)
                            </label>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Nama kerabat"
                                value={p.emergencyContactName}
                                onChange={(e) =>
                                  handleUpdateParticipant(
                                    idx,
                                    'emergencyContactName',
                                    e.target.value,
                                  )
                                }
                              />
                              <input
                                type="tel"
                                className="form-input"
                                placeholder="No. HP kerabat"
                                value={p.emergencyContactPhone}
                                onChange={(e) =>
                                  handleUpdateParticipant(
                                    idx,
                                    'emergencyContactPhone',
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label
                              className="form-label"
                              style={{ fontSize: '0.75rem' }}
                            >
                              Catatan Medis / Riwayat Alergi
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Misal: Asma, alergi dingin, dll"
                              value={p.notes}
                              onChange={(e) =>
                                handleUpdateParticipant(
                                  idx,
                                  'notes',
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 4: Financial Summary & Notes */}
                <div
                  style={{
                    padding: '1rem',
                    background: '#faf7f2',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                      Total Biaya Estimasi ({createParticipants.length} x{' '}
                      {selectedPackage
                        ? formatCurrency(selectedPackage.price)
                        : 'Rp 0'}
                      )
                    </div>
                    <div
                      style={{
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color: 'var(--accent)',
                      }}
                    >
                      {formatCurrency(calculateAutoTotal())}
                    </div>
                  </div>
                  <div style={{ width: '50%' }}>
                    <label className="form-label" htmlFor="createNotes">
                      Catatan Tambahan
                    </label>
                    <input
                      id="createNotes"
                      type="text"
                      className="form-input"
                      placeholder="Permintaan tenda terpisah, vegetarian, dll"
                      value={createNotes}
                      onChange={(e) => setCreateNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participant Modal (Add / Edit) - Step 28 */}
      {participantModalMode && (
        <div
          className="modal-backdrop"
          onClick={() => setParticipantModalMode(null)}
          style={{ zIndex: 1100 }}
        >
          <div
            className="modal-card"
            style={{ maxWidth: '600px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                {participantModalMode === 'create'
                  ? 'Tambah Peserta'
                  : 'Edit Data Peserta'}
              </h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setParticipantModalMode(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveParticipant}>
              <div
                className="modal-body"
                style={{ display: 'grid', gap: '1rem' }}
              >
                {pError && <div className="alert-error">{pError}</div>}

                <div>
                  <label className="form-label" htmlFor="pFullName">
                    Nama Lengkap <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    id="pFullName"
                    type="text"
                    className="form-input"
                    placeholder="Nama sesuai KTP / Paspor"
                    value={pFullName}
                    onChange={(e) => setPFullName(e.target.value)}
                    required
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <label className="form-label" htmlFor="pGender">
                      Gender
                    </label>
                    <select
                      id="pGender"
                      className="form-select"
                      value={pGender}
                      onChange={(e) =>
                        setPGender(e.target.value as GenderType | '')
                      }
                    >
                      <option value="">-- Pilih Gender --</option>
                      <option value="MALE">Laki-laki</option>
                      <option value="FEMALE">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="pDateOfBirth">
                      Tanggal Lahir
                    </label>
                    <input
                      id="pDateOfBirth"
                      type="date"
                      className="form-input"
                      value={pDateOfBirth}
                      onChange={(e) => setPDateOfBirth(e.target.value)}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <label className="form-label" htmlFor="pIdentityType">
                      Jenis ID
                    </label>
                    <select
                      id="pIdentityType"
                      className="form-select"
                      value={pIdentityType}
                      onChange={(e) =>
                        setPIdentityType(e.target.value as IdentityType | '')
                      }
                    >
                      <option value="KTP">KTP</option>
                      <option value="PASSPORT">Paspor</option>
                      <option value="OTHER">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="pIdentityNumber">
                      Nomor Identitas
                    </label>
                    <input
                      id="pIdentityNumber"
                      type="text"
                      className="form-input"
                      placeholder="Nomor KTP / Paspor"
                      value={pIdentityNumber}
                      onChange={(e) => setPIdentityNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" htmlFor="pPhone">
                    Nomor Kontak / WhatsApp
                  </label>
                  <input
                    id="pPhone"
                    type="tel"
                    className="form-input"
                    placeholder="08xxxxxxxxxx"
                    value={pPhone}
                    onChange={(e) => setPPhone(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <label className="form-label" htmlFor="pEmergencyName">
                      Nama Kontak Darurat
                    </label>
                    <input
                      id="pEmergencyName"
                      type="text"
                      className="form-input"
                      placeholder="Nama kerabat/keluarga"
                      value={pEmergencyName}
                      onChange={(e) => setPEmergencyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="pEmergencyPhone">
                      Nomor Kontak Darurat
                    </label>
                    <input
                      id="pEmergencyPhone"
                      type="tel"
                      className="form-input"
                      placeholder="08xxxxxxxxxx"
                      value={pEmergencyPhone}
                      onChange={(e) => setPEmergencyPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" htmlFor="pNotes">
                    Catatan Khusus / Medis (Opsional)
                  </label>
                  <input
                    id="pNotes"
                    type="text"
                    className="form-input"
                    placeholder="Misal: riwayat asma, alergi makanan, dll"
                    value={pNotes}
                    onChange={(e) => setPNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setParticipantModalMode(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Peserta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
