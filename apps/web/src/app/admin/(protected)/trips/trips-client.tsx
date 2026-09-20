/* eslint-disable @next/next/no-img-element */
'use client';

import { useMemo, useState, useTransition } from 'react';
import type {
  ContentStatus,
  DifficultyLevel,
  FacilityType,
  GearType,
  MediaAsset,
  Mountain,
  Route,
  Trip,
  TripFaq,
  TripFacility,
  TripGear,
  TripItinerary,
  TripType,
} from '@wildera/types';

interface Props {
  initialItems: Trip[];
  mountains: Mountain[];
  routes: Route[];
  userRoles: string[];
}

const TRIP_TYPES: { value: TripType; label: string }[] = [
  { value: 'OPEN_TRIP', label: 'Open Trip' },
  { value: 'PRIVATE_TRIP', label: 'Private Trip' },
  { value: 'TEKTOK', label: 'Tektok (1 Hari)' },
  { value: 'MULTI_DAY', label: 'Multi-Day Expedition' },
];

const DIFFICULTY_LEVELS: { value: DifficultyLevel; label: string }[] = [
  { value: 'EASY', label: 'Mudah (Easy)' },
  { value: 'MODERATE', label: 'Sedang (Moderate)' },
  { value: 'HARD', label: 'Sulit (Hard)' },
  { value: 'EXTREME', label: 'Ekstrem (Extreme)' },
];

const CONTENT_STATUSES: { value: ContentStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
];

interface FormValues {
  mountainId: string;
  routeId: string;
  name: string;
  slug: string;
  tripType: TripType;
  shortDescription: string;
  description: string;
  durationDays: string | number;
  durationNights: string | number;
  difficulty: DifficultyLevel;
  beginnerFriendly: boolean;
  healthCertificateRequired: boolean;
  minimumAge: string | number;
  maximumAge: string | number;
  status: ContentStatus;
  featured: boolean;
}

const defaultForm: FormValues = {
  mountainId: '',
  routeId: '',
  name: '',
  slug: '',
  tripType: 'OPEN_TRIP',
  shortDescription: '',
  description: '',
  durationDays: 3,
  durationNights: 2,
  difficulty: 'MODERATE',
  beginnerFriendly: false,
  healthCertificateRequired: false,
  minimumAge: '',
  maximumAge: '',
  status: 'DRAFT',
  featured: false,
};

interface ItineraryItem {
  dayNumber: number;
  title: string;
  description: string;
}

interface FacilityItem {
  facilityType: FacilityType;
  name: string;
  description: string;
}

interface GearItem {
  gearType: GearType;
  name: string;
  description: string;
}

interface FaqItem {
  question: string;
  answer: string;
  status: ContentStatus;
}

export function TripsClient({
  initialItems,
  mountains,
  routes,
  userRoles,
}: Props) {
  const [items, setItems] = useState<Trip[]>(initialItems);
  const [search, setSearch] = useState('');
  const [mountainFilter, setMountainFilter] = useState('ALL');
  const [tripTypeFilter, setTripTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Trip | null>(null);
  const [deletingItem, setDeletingItem] = useState<Trip | null>(null);
  const [publishValidationModal, setPublishValidationModal] = useState<{
    trip: Trip;
    errors: Record<string, string>;
  } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Nested Content & Media Editor Modal State
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [contentTrip, setContentTrip] = useState<Trip | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState<
    'itineraries' | 'facilities' | 'gears' | 'faqs' | 'media'
  >('itineraries');

  const [itineraries, setItineraries] = useState<ItineraryItem[]>([]);
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [gears, setGears] = useState<GearItem[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  const [coverMedia, setCoverMedia] = useState<MediaAsset | null>(null);
  const [galleryMedia, setGalleryMedia] = useState<MediaAsset[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [form, setForm] = useState<FormValues>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const canManage =
    userRoles.includes('SUPER_ADMIN') || userRoles.includes('OPERATIONS');

  const availableRoutes = useMemo(() => {
    if (!form.mountainId) return [];
    return routes.filter((r) => r.mountainId === form.mountainId);
  }, [routes, form.mountainId]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (mountainFilter !== 'ALL' && item.mountainId !== mountainFilter) {
        return false;
      }
      if (tripTypeFilter !== 'ALL' && item.tripType !== tripTypeFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      if (difficultyFilter !== 'ALL' && item.difficulty !== difficultyFilter) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchMountain = item.mountain?.name.toLowerCase().includes(query);
        const matchRoute = item.route?.name?.toLowerCase().includes(query);
        const matchDesc = item.shortDescription?.toLowerCase().includes(query);
        if (!matchName && !matchMountain && !matchRoute && !matchDesc) {
          return false;
        }
      }
      return true;
    });
  }, [
    items,
    search,
    mountainFilter,
    tripTypeFilter,
    statusFilter,
    difficultyFilter,
  ]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({
      ...defaultForm,
      mountainId: mountains[0]?.id || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (item: Trip) => {
    setEditingItem(item);
    setForm({
      mountainId: item.mountainId,
      routeId: item.routeId || '',
      name: item.name,
      slug: item.slug,
      tripType: item.tripType,
      shortDescription: item.shortDescription || '',
      description: item.description || '',
      durationDays: item.durationDays,
      durationNights: item.durationNights,
      difficulty: item.difficulty,
      beginnerFriendly: item.beginnerFriendly,
      healthCertificateRequired: item.healthCertificateRequired,
      minimumAge: item.minimumAge ?? '',
      maximumAge: item.maximumAge ?? '',
      status: item.status,
      featured: item.featured,
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setErrors({});
  };

  const openContentModal = async (trip: Trip) => {
    setContentTrip(trip);
    setContentLoading(true);
    setActiveContentTab('itineraries');
    setContentModalOpen(true);

    try {
      const [contentRes, mediaRes] = await Promise.all([
        fetch(`/api/admin/trips/${trip.id}/content`),
        fetch(`/api/admin/trips/${trip.id}/media`),
      ]);

      const json = await contentRes.json();
      if (contentRes.ok && (json.data || json.itineraries)) {
        const data = json.data || json;
        setItineraries(
          (data.itineraries || []).map((it: TripItinerary) => ({
            dayNumber: it.dayNumber,
            title: it.title,
            description: it.description || '',
          })),
        );
        setFacilities(
          (data.facilities || []).map((f: TripFacility) => ({
            facilityType: f.facilityType,
            name: f.name,
            description: f.description || '',
          })),
        );
        setGears(
          (data.gears || []).map((g: TripGear) => ({
            gearType: g.gearType,
            name: g.name,
            description: g.description || '',
          })),
        );
        setFaqs(
          (data.faqs || []).map((faq: TripFaq) => ({
            question: faq.question,
            answer: faq.answer,
            status: faq.status || 'DRAFT',
          })),
        );
      } else {
        setItineraries([]);
        setFacilities([]);
        setGears([]);
        setFaqs([]);
      }

      if (mediaRes.ok) {
        const mediaJson = await mediaRes.json();
        const mediaData = mediaJson.data || mediaJson;
        setCoverMedia(mediaData.cover?.media || null);
        setGalleryMedia(
          (mediaData.gallery || [])
            .map((g: { media: MediaAsset }) => g.media)
            .filter(Boolean),
        );
      } else {
        setCoverMedia(null);
        setGalleryMedia([]);
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Gagal memuat detail konten subresource.',
      });
    } finally {
      setContentLoading(false);
    }
  };

  const closeContentModal = () => {
    setContentModalOpen(false);
    setContentTrip(null);
  };

  // Itinerary actions
  const addItineraryDay = () => {
    const nextDay = itineraries.length + 1;
    setItineraries([
      ...itineraries,
      {
        dayNumber: nextDay,
        title: `Hari ${nextDay}: `,
        description: '',
      },
    ]);
  };

  const removeItineraryDay = (idx: number) => {
    const updated = itineraries.filter((_, i) => i !== idx);
    const renumbered = updated.map((item, i) => ({
      ...item,
      dayNumber: i + 1,
    }));
    setItineraries(renumbered);
  };

  const moveItinerary = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= itineraries.length) return;
    const copy = [...itineraries];
    const temp = copy[idx]!;
    copy[idx] = copy[targetIdx]!;
    copy[targetIdx] = temp;
    const renumbered = copy.map((item, i) => ({
      ...item,
      dayNumber: i + 1,
    }));
    setItineraries(renumbered);
  };

  // Facility actions
  const addFacility = (facilityType: FacilityType) => {
    setFacilities([
      ...facilities,
      {
        facilityType,
        name: '',
        description: '',
      },
    ]);
  };

  const removeFacility = (idx: number) => {
    setFacilities(facilities.filter((_, i) => i !== idx));
  };

  // Gear actions
  const addGear = (gearType: GearType) => {
    setGears([
      ...gears,
      {
        gearType,
        name: '',
        description: '',
      },
    ]);
  };

  const removeGear = (idx: number) => {
    setGears(gears.filter((_, i) => i !== idx));
  };

  // FAQ actions
  const addFaq = () => {
    setFaqs([
      ...faqs,
      {
        question: '',
        answer: '',
        status: 'PUBLISHED',
      },
    ]);
  };

  const removeFaq = (idx: number) => {
    setFaqs(faqs.filter((_, i) => i !== idx));
  };

  // Media Upload handler
  const handleUploadMedia = async (
    e: React.ChangeEvent<HTMLInputElement>,
    role: 'COVER' | 'GALLERY',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append(
        'altText',
        `${contentTrip?.name || 'Trip'} ${role.toLowerCase()}`,
      );

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: 'error',
          message:
            json.error?.message || json.message || 'Gagal mengunggah foto.',
        });
        return;
      }

      const asset: MediaAsset = json.data || json;
      if (role === 'COVER') {
        setCoverMedia(asset);
      } else {
        setGalleryMedia((prev) => [...prev, asset]);
      }
      setFeedback({
        type: 'success',
        message: `Foto ${file.name} berhasil diunggah sebagai ${
          role === 'COVER' ? 'Cover' : 'Galeri'
        }.`,
      });
    } catch {
      setFeedback({
        type: 'error',
        message: 'Gagal mengunggah berkas gambar.',
      });
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  // Save Content & Media
  const handleSaveContent = () => {
    if (!contentTrip) return;

    startTransition(async () => {
      try {
        const payload = {
          itineraries: itineraries.map((it, idx) => ({
            dayNumber: it.dayNumber,
            title: it.title.trim() || `Hari ${it.dayNumber}`,
            description: it.description.trim() || undefined,
            sortOrder: idx,
          })),
          facilities: facilities
            .filter((f) => f.name.trim().length > 0)
            .map((f, idx) => ({
              facilityType: f.facilityType,
              name: f.name.trim(),
              description: f.description.trim() || undefined,
              sortOrder: idx,
            })),
          gears: gears
            .filter((g) => g.name.trim().length > 0)
            .map((g, idx) => ({
              gearType: g.gearType,
              name: g.name.trim(),
              description: g.description.trim() || undefined,
              sortOrder: idx,
            })),
          faqs: faqs
            .filter(
              (faq) =>
                faq.question.trim().length > 0 && faq.answer.trim().length > 0,
            )
            .map((faq, idx) => ({
              question: faq.question.trim(),
              answer: faq.answer.trim(),
              status: faq.status,
              sortOrder: idx,
            })),
        };

        const [resContent, resMedia] = await Promise.all([
          fetch(`/api/admin/trips/${contentTrip.id}/content`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }),
          fetch(`/api/admin/trips/${contentTrip.id}/media`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              coverMediaId: coverMedia?.id || null,
              galleryMediaIds: galleryMedia.map((m) => m.id),
            }),
          }),
        ]);

        const json = await resContent.json();
        if (!resContent.ok) {
          setFeedback({
            type: 'error',
            message:
              json.error?.message ||
              json.message ||
              'Gagal menyimpan konten trip.',
          });
          return;
        }

        if (!resMedia.ok) {
          const mediaErr = await resMedia.json();
          setFeedback({
            type: 'error',
            message:
              mediaErr.error?.message || 'Gagal menyinkronkan media trip.',
          });
          return;
        }

        setFeedback({
          type: 'success',
          message: `Konten dan media trip "${contentTrip.name}" berhasil diperbarui.`,
        });
        closeContentModal();
      } catch {
        setFeedback({
          type: 'error',
          message: 'Terjadi kesalahan jaringan saat menyimpan konten trip.',
        });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!form.mountainId) {
      newErrors.mountainId = 'Gunung wajib dipilih.';
    }
    if (!form.name.trim()) {
      newErrors.name = 'Nama trip wajib diisi.';
    }
    if (!form.durationDays || Number(form.durationDays) < 1) {
      newErrors.durationDays = 'Durasi hari minimal 1.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    startTransition(async () => {
      try {
        const isEditing = Boolean(editingItem);
        const url = isEditing
          ? `/api/admin/trips/${editingItem?.id}`
          : '/api/admin/trips';
        const method = isEditing ? 'PATCH' : 'POST';

        const payload = {
          mountainId: form.mountainId,
          routeId: form.routeId || null,
          name: form.name.trim(),
          tripType: form.tripType,
          shortDescription: form.shortDescription.trim() || undefined,
          description: form.description.trim() || undefined,
          durationDays: Number(form.durationDays),
          durationNights: Number(form.durationNights || 0),
          difficulty: form.difficulty,
          beginnerFriendly: Boolean(form.beginnerFriendly),
          healthCertificateRequired: Boolean(form.healthCertificateRequired),
          minimumAge:
            form.minimumAge !== '' ? Number(form.minimumAge) : undefined,
          maximumAge:
            form.maximumAge !== '' ? Number(form.maximumAge) : undefined,
          status: form.status,
          featured: Boolean(form.featured),
        };

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (!res.ok) {
          const errMsg =
            json.error?.message || json.message || 'Gagal menyimpan trip.';
          if (json.error?.details || json.errors) {
            setErrors(json.error?.details || json.errors);
          } else {
            setFeedback({
              type: 'error',
              message: errMsg,
            });
          }
          return;
        }

        const savedItem: Trip = json.data ?? json;

        if (isEditing) {
          setItems((prev) =>
            prev.map((it) => (it.id === savedItem.id ? savedItem : it)),
          );
          setFeedback({
            type: 'success',
            message: `Trip "${savedItem.name}" berhasil diperbarui.`,
          });
        } else {
          setItems((prev) => [savedItem, ...prev]);
          setFeedback({
            type: 'success',
            message: `Trip "${savedItem.name}" berhasil dibuat.`,
          });
        }

        closeModal();
      } catch {
        setFeedback({
          type: 'error',
          message: 'Terjadi kesalahan jaringan saat menyimpan trip.',
        });
      }
    });
  };

  const handleArchive = (item: Trip) => {
    setDeletingItem(item);
  };

  const confirmArchive = () => {
    if (!deletingItem) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/trips/${deletingItem.id}`, {
          method: 'DELETE',
        });

        const json = await res.json();

        if (!res.ok) {
          setFeedback({
            type: 'error',
            message:
              json.error?.message || json.message || 'Gagal mengarsipkan trip.',
          });
          setDeletingItem(null);
          return;
        }

        setItems((prev) => prev.filter((it) => it.id !== deletingItem.id));
        setFeedback({
          type: 'success',
          message: `Trip "${deletingItem.name}" berhasil diarsipkan.`,
        });
        setDeletingItem(null);
      } catch {
        setFeedback({
          type: 'error',
          message: 'Terjadi kesalahan koneksi saat mengarsipkan trip.',
        });
        setDeletingItem(null);
      }
    });
  };

  const handlePublish = (trip: Trip) => {
    setActionLoadingId(trip.id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/trips/${trip.id}/publish`, {
          method: 'POST',
        });
        const json = await res.json();
        if (!res.ok) {
          if (res.status === 422 && (json.fields || json.error?.fields)) {
            setPublishValidationModal({
              trip,
              errors: json.fields || json.error?.fields || {},
            });
            return;
          }
          setFeedback({
            type: 'error',
            message:
              json.error?.message ||
              json.message ||
              'Gagal mempublikasikan trip.',
          });
          return;
        }
        setItems((prev) =>
          prev.map((it) =>
            it.id === trip.id
              ? { ...it, status: 'PUBLISHED' as ContentStatus }
              : it,
          ),
        );
        setFeedback({
          type: 'success',
          message: `Trip "${trip.name}" berhasil dipublikasikan.`,
        });
      } catch {
        setFeedback({
          type: 'error',
          message: 'Terjadi kesalahan jaringan saat mempublikasikan trip.',
        });
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const handleUnpublish = (trip: Trip) => {
    setActionLoadingId(trip.id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/trips/${trip.id}/unpublish`, {
          method: 'POST',
        });
        const json = await res.json();
        if (!res.ok) {
          setFeedback({
            type: 'error',
            message:
              json.error?.message ||
              json.message ||
              'Gagal mengembalikan trip ke Draft.',
          });
          return;
        }
        setItems((prev) =>
          prev.map((it) =>
            it.id === trip.id
              ? { ...it, status: 'DRAFT' as ContentStatus }
              : it,
          ),
        );
        setFeedback({
          type: 'success',
          message: `Trip "${trip.name}" berhasil dikembalikan ke Draft.`,
        });
      } catch {
        setFeedback({
          type: 'error',
          message: 'Terjadi kesalahan jaringan saat mengembalikan status trip.',
        });
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const handleDuplicate = (trip: Trip) => {
    setActionLoadingId(trip.id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/trips/${trip.id}/duplicate`, {
          method: 'POST',
        });
        const json = await res.json();
        if (!res.ok) {
          setFeedback({
            type: 'error',
            message:
              json.error?.message || json.message || 'Gagal menduplikasi trip.',
          });
          return;
        }
        const duplicated = json.data || json;
        setItems((prev) => [duplicated, ...prev]);
        setFeedback({
          type: 'success',
          message: `Trip "${trip.name}" berhasil diduplikasi menjadi "${duplicated.name}".`,
        });
      } catch {
        setFeedback({
          type: 'error',
          message: 'Terjadi kesalahan jaringan saat menduplikasi trip.',
        });
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const getDifficultyBadge = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'EASY':
        return <span className="admin-badge badge-published">Mudah</span>;
      case 'MODERATE':
        return <span className="admin-badge badge-draft">Sedang</span>;
      case 'HARD':
        return (
          <span
            className="admin-badge"
            style={{
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
            }}
          >
            Sulit
          </span>
        );
      case 'EXTREME':
        return (
          <span
            className="admin-badge"
            style={{ background: '#7f1d1d', color: '#ffffff' }}
          >
            Ekstrem
          </span>
        );
      default:
        return null;
    }
  };

  const getTripTypeBadge = (type: TripType) => {
    switch (type) {
      case 'OPEN_TRIP':
        return <span className="admin-badge badge-draft">Open Trip</span>;
      case 'PRIVATE_TRIP':
        return <span className="admin-badge badge-published">Private</span>;
      case 'TEKTOK':
        return (
          <span
            className="admin-badge"
            style={{
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
            }}
          >
            Tektok
          </span>
        );
      case 'MULTI_DAY':
        return (
          <span
            className="admin-badge"
            style={{
              background: '#eff6ff',
              color: '#1e40af',
              border: '1px solid #bfdbfe',
            }}
          >
            Ekspedisi
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="destinations-container">
      {/* Header */}
      <div className="destinations-header">
        <div>
          <h2 className="admin-page-title" style={{ margin: 0 }}>
            Trip
          </h2>
          <p className="admin-section-subtitle">
            Manajemen template paket perjalanan, durasi, tingkat kesulitan, dan
            spesifikasi pendakian.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={openCreateModal}
          >
            + Tambah Trip
          </button>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`feedback-banner ${
            feedback.type === 'success' ? 'feedback-success' : 'feedback-error'
          }`}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: feedback.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${
              feedback.type === 'success' ? '#a7f3d0' : '#fecaca'
            }`,
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Toolbar Search & Filters */}
      <div
        className="destinations-toolbar"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
          <input
            type="text"
            className="admin-input"
            placeholder="Cari nama trip, gunung, atau jalur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ width: '160px' }}>
          <select
            className="admin-select"
            value={mountainFilter}
            onChange={(e) => setMountainFilter(e.target.value)}
          >
            <option value="ALL">Semua Gunung</option>
            {mountains.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: '140px' }}>
          <select
            className="admin-select"
            value={tripTypeFilter}
            onChange={(e) => setTripTypeFilter(e.target.value)}
          >
            <option value="ALL">Semua Tipe</option>
            {TRIP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: '140px' }}>
          <select
            className="admin-select"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="ALL">Semua Kesulitan</option>
            {DIFFICULTY_LEVELS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: '130px' }}>
          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Semua Status</option>
            {CONTENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
        <table
          className="admin-table"
          style={{ width: '100%', borderCollapse: 'collapse' }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>
                PROGRAM TRIP
              </th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>
                LOKASI & JALUR
              </th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>
                TIPE & DURASI
              </th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>
                KESULITAN
              </th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>
                PERSYARATAN
              </th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>
                STATUS
              </th>
              {canManage && (
                <th style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>
                  AKSI
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={canManage ? 7 : 6}
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem 1rem',
                    color: '#6b7280',
                  }}
                >
                  Belum ada data trip yang sesuai dengan filter pencarian.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      {item.name}
                      {item.featured && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background: '#fef3c7',
                            color: '#92400e',
                          }}
                        >
                          FEATURED
                        </span>
                      )}
                    </div>
                    {item.shortDescription && (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          marginTop: '0.25rem',
                          maxWidth: '280px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.shortDescription}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 500, color: '#374151' }}>
                      {item.mountain?.name || 'Gunung'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {item.route ? item.route.name : 'Semua Jalur'}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ marginBottom: '0.25rem' }}>
                      {getTripTypeBadge(item.tripType)}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#4b5563',
                        fontFamily: 'monospace',
                      }}
                    >
                      {item.durationDays}D / {item.durationNights}N
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {getDifficultyBadge(item.difficulty)}
                  </td>
                  <td
                    style={{
                      padding: '0.75rem 1rem',
                      fontSize: '0.75rem',
                      color: '#4b5563',
                    }}
                  >
                    {item.beginnerFriendly && <div>✓ Ramah Pemula</div>}
                    {item.healthCertificateRequired && (
                      <div>✓ Butuh Surat Sehat</div>
                    )}
                    {item.minimumAge && <div>Min. {item.minimumAge} tahun</div>}
                    {!item.beginnerFriendly &&
                      !item.healthCertificateRequired &&
                      !item.minimumAge && (
                        <span style={{ color: '#9ca3af' }}>Standar</span>
                      )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span
                      className={`admin-badge badge-${item.status.toLowerCase()}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  {canManage && (
                    <td
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.status === 'PUBLISHED' ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          style={{
                            padding: '0.35rem 0.65rem',
                            marginRight: '0.4rem',
                          }}
                          disabled={actionLoadingId === item.id}
                          onClick={() => handleUnpublish(item)}
                          title="Kembalikan status ke Draft"
                        >
                          Draft
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="admin-btn admin-btn-primary"
                          style={{
                            padding: '0.35rem 0.65rem',
                            marginRight: '0.4rem',
                            background: '#059669',
                            borderColor: '#059669',
                          }}
                          disabled={actionLoadingId === item.id}
                          onClick={() => handlePublish(item)}
                          title="Publikasikan trip"
                        >
                          Publikasi
                        </button>
                      )}
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        style={{
                          padding: '0.35rem 0.65rem',
                          marginRight: '0.4rem',
                        }}
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleDuplicate(item)}
                        title="Duplikasi trip template (tanpa jadwal)"
                      >
                        Duplikasi
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        style={{
                          padding: '0.35rem 0.65rem',
                          marginRight: '0.4rem',
                        }}
                        onClick={() => openContentModal(item)}
                      >
                        Konten
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        style={{
                          padding: '0.35rem 0.65rem',
                          marginRight: '0.4rem',
                        }}
                        onClick={() => openEditModal(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-danger"
                        style={{ padding: '0.35rem 0.65rem' }}
                        onClick={() => handleArchive(item)}
                      >
                        Arsipkan
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Nested Content & Media Editor Modal */}
      {contentModalOpen && contentTrip && (
        <div
          className="admin-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
        >
          <div
            className="admin-modal-content"
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '0.75rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#111827' }}>
                  Kelola Konten: {contentTrip.name}
                </h3>
                <p
                  style={{
                    margin: '0.25rem 0 0',
                    fontSize: '0.8rem',
                    color: '#6b7280',
                  }}
                >
                  Atur Itinerary, Fasilitas, Perlengkapan, FAQ, dan Foto
                  Sampul/Galeri.
                </p>
              </div>
              <button
                type="button"
                onClick={closeContentModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                ✕
              </button>
            </div>

            {contentLoading ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: '#6b7280',
                }}
              >
                Memuat subresource konten & media trip...
              </div>
            ) : (
              <div>
                {/* Tabs Navigation */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    marginBottom: '1.25rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveContentTab('itineraries')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      background: 'none',
                      borderBottom:
                        activeContentTab === 'itineraries'
                          ? '2px solid #1b4332'
                          : '2px solid transparent',
                      fontWeight:
                        activeContentTab === 'itineraries' ? 600 : 400,
                      color:
                        activeContentTab === 'itineraries'
                          ? '#1b4332'
                          : '#6b7280',
                      cursor: 'pointer',
                    }}
                  >
                    📅 Itinerary ({itineraries.length} Hari)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveContentTab('facilities')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      background: 'none',
                      borderBottom:
                        activeContentTab === 'facilities'
                          ? '2px solid #1b4332'
                          : '2px solid transparent',
                      fontWeight: activeContentTab === 'facilities' ? 600 : 400,
                      color:
                        activeContentTab === 'facilities'
                          ? '#1b4332'
                          : '#6b7280',
                      cursor: 'pointer',
                    }}
                  >
                    🎒 Fasilitas ({facilities.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveContentTab('gears')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      background: 'none',
                      borderBottom:
                        activeContentTab === 'gears'
                          ? '2px solid #1b4332'
                          : '2px solid transparent',
                      fontWeight: activeContentTab === 'gears' ? 600 : 400,
                      color:
                        activeContentTab === 'gears' ? '#1b4332' : '#6b7280',
                      cursor: 'pointer',
                    }}
                  >
                    🥾 Perlengkapan ({gears.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveContentTab('faqs')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      background: 'none',
                      borderBottom:
                        activeContentTab === 'faqs'
                          ? '2px solid #1b4332'
                          : '2px solid transparent',
                      fontWeight: activeContentTab === 'faqs' ? 600 : 400,
                      color:
                        activeContentTab === 'faqs' ? '#1b4332' : '#6b7280',
                      cursor: 'pointer',
                    }}
                  >
                    ❓ FAQ ({faqs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveContentTab('media')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      background: 'none',
                      borderBottom:
                        activeContentTab === 'media'
                          ? '2px solid #1b4332'
                          : '2px solid transparent',
                      fontWeight: activeContentTab === 'media' ? 600 : 400,
                      color:
                        activeContentTab === 'media' ? '#1b4332' : '#6b7280',
                      cursor: 'pointer',
                    }}
                  >
                    🖼️ Media & Foto {coverMedia ? '✅' : '⚠️'}
                  </button>
                </div>

                {/* Tab: Itineraries */}
                {activeContentTab === 'itineraries' && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                        Daftar susunan kegiatan harian (bisa diurutkan
                        naik/turun).
                      </span>
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.85rem',
                        }}
                        onClick={addItineraryDay}
                      >
                        + Tambah Hari
                      </button>
                    </div>

                    {itineraries.length === 0 ? (
                      <div
                        style={{
                          padding: '2rem',
                          textAlign: 'center',
                          background: '#f9fafb',
                          borderRadius: '6px',
                          color: '#6b7280',
                        }}
                      >
                        Belum ada susunan itinerary. Klik{' '}
                        <strong>+ Tambah Hari</strong>.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                        }}
                      >
                        {itineraries.map((it, idx) => (
                          <div
                            key={idx}
                            style={{
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              padding: '0.75rem 1rem',
                              background: '#fcfdfd',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem',
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontSize: '0.9rem',
                                  color: '#1b4332',
                                }}
                              >
                                Hari ke-{it.dayNumber}
                              </span>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => moveItinerary(idx, 'up')}
                                  style={{
                                    padding: '0.2rem 0.5rem',
                                    fontSize: '0.75rem',
                                    cursor:
                                      idx === 0 ? 'not-allowed' : 'pointer',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    background: '#ffffff',
                                  }}
                                  title="Naikkan"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === itineraries.length - 1}
                                  onClick={() => moveItinerary(idx, 'down')}
                                  style={{
                                    padding: '0.2rem 0.5rem',
                                    fontSize: '0.75rem',
                                    cursor:
                                      idx === itineraries.length - 1
                                        ? 'not-allowed'
                                        : 'pointer',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    background: '#ffffff',
                                  }}
                                  title="Turunkan"
                                >
                                  ▼
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeItineraryDay(idx)}
                                  style={{
                                    padding: '0.2rem 0.5rem',
                                    fontSize: '0.75rem',
                                    color: '#dc2626',
                                    border: '1px solid #fecaca',
                                    borderRadius: '4px',
                                    background: '#fef2f2',
                                    cursor: 'pointer',
                                  }}
                                  title="Hapus Hari"
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              className="admin-input"
                              placeholder="Judul kegiatan (contoh: Basecamp menuju Pos 3)"
                              value={it.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItineraries((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, title: val } : item,
                                  ),
                                );
                              }}
                              style={{ marginBottom: '0.5rem' }}
                            />
                            <textarea
                              className="admin-input"
                              rows={2}
                              placeholder="Deskripsi rute, jam estimasi, briefing, pos istirahat..."
                              value={it.description}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItineraries((prev) =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? { ...item, description: val }
                                      : item,
                                  ),
                                );
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Facilities (Include / Exclude) */}
                {activeContentTab === 'facilities' && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                        Kelola item fasilitas termasuk (Include) & tidak
                        termasuk (Exclude).
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-primary"
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.85rem',
                            background: '#166534',
                          }}
                          onClick={() => addFacility('INCLUDE')}
                        >
                          + Tambah Include
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.85rem',
                            border: '1px solid #dc2626',
                            color: '#dc2626',
                          }}
                          onClick={() => addFacility('EXCLUDE')}
                        >
                          + Tambah Exclude
                        </button>
                      </div>
                    </div>

                    {facilities.length === 0 ? (
                      <div
                        style={{
                          padding: '2rem',
                          textAlign: 'center',
                          background: '#f9fafb',
                          borderRadius: '6px',
                          color: '#6b7280',
                        }}
                      >
                        Belum ada item fasilitas yang ditambahkan.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                      >
                        {facilities.map((fac, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '6px',
                              border:
                                fac.facilityType === 'INCLUDE'
                                  ? '1px solid #bbf7d0'
                                  : '1px solid #fecaca',
                              background:
                                fac.facilityType === 'INCLUDE'
                                  ? '#f0fdf4'
                                  : '#fef2f2',
                            }}
                          >
                            <select
                              className="admin-select"
                              value={fac.facilityType}
                              onChange={(e) => {
                                const val = e.target.value as FacilityType;
                                setFacilities((prev) =>
                                  prev.map((f, i) =>
                                    i === idx ? { ...f, facilityType: val } : f,
                                  ),
                                );
                              }}
                              style={{ width: '110px', fontSize: '0.85rem' }}
                            >
                              <option value="INCLUDE">Include</option>
                              <option value="EXCLUDE">Exclude</option>
                            </select>
                            <input
                              type="text"
                              className="admin-input"
                              placeholder="Nama fasilitas (contoh: Tiket Simaksi & Asuransi)"
                              value={fac.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFacilities((prev) =>
                                  prev.map((f, i) =>
                                    i === idx ? { ...f, name: val } : f,
                                  ),
                                );
                              }}
                              style={{ flex: 1, fontSize: '0.85rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => removeFacility(idx)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#dc2626',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                padding: '0.25rem 0.5rem',
                              }}
                              title="Hapus"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Gears (Mandatory / Recommended) */}
                {activeContentTab === 'gears' && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                        Daftar perlengkapan yang wajib dibawa (Mandatory) atau
                        direkomendasikan.
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-primary"
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.85rem',
                            background: '#991b1b',
                          }}
                          onClick={() => addGear('MANDATORY')}
                        >
                          + Wajib Bawa
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.85rem',
                          }}
                          onClick={() => addGear('RECOMMENDED')}
                        >
                          + Opsional
                        </button>
                      </div>
                    </div>

                    {gears.length === 0 ? (
                      <div
                        style={{
                          padding: '2rem',
                          textAlign: 'center',
                          background: '#f9fafb',
                          borderRadius: '6px',
                          color: '#6b7280',
                        }}
                      >
                        Belum ada daftar perlengkapan yang diisi.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                      >
                        {gears.map((g, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '6px',
                              border:
                                g.gearType === 'MANDATORY'
                                  ? '1px solid #fed7aa'
                                  : '1px solid #bfdbfe',
                              background:
                                g.gearType === 'MANDATORY'
                                  ? '#fff7ed'
                                  : '#eff6ff',
                            }}
                          >
                            <select
                              className="admin-select"
                              value={g.gearType}
                              onChange={(e) => {
                                const val = e.target.value as GearType;
                                setGears((prev) =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? { ...item, gearType: val }
                                      : item,
                                  ),
                                );
                              }}
                              style={{ width: '130px', fontSize: '0.85rem' }}
                            >
                              <option value="MANDATORY">Wajib</option>
                              <option value="RECOMMENDED">Disarankan</option>
                            </select>
                            <input
                              type="text"
                              className="admin-input"
                              placeholder="Nama alat (contoh: Sepatu Trekking Mid/High Cut)"
                              value={g.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setGears((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, name: val } : item,
                                  ),
                                );
                              }}
                              style={{ flex: 1, fontSize: '0.85rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => removeGear(idx)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#dc2626',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                padding: '0.25rem 0.5rem',
                              }}
                              title="Hapus"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: FAQs */}
                {activeContentTab === 'faqs' && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                        Pertanyaan yang sering ditanyakan untuk paket trip ini.
                      </span>
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.85rem',
                        }}
                        onClick={addFaq}
                      >
                        + Tambah FAQ
                      </button>
                    </div>

                    {faqs.length === 0 ? (
                      <div
                        style={{
                          padding: '2rem',
                          textAlign: 'center',
                          background: '#f9fafb',
                          borderRadius: '6px',
                          color: '#6b7280',
                        }}
                      >
                        Belum ada FAQ khusus untuk trip ini.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                        }}
                      >
                        {faqs.map((faq, idx) => (
                          <div
                            key={idx}
                            style={{
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              padding: '0.75rem 1rem',
                              background: '#f9fafb',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem',
                              }}
                            >
                              <select
                                className="admin-select"
                                value={faq.status}
                                onChange={(e) => {
                                  const val = e.target.value as ContentStatus;
                                  setFaqs((prev) =>
                                    prev.map((f, i) =>
                                      i === idx ? { ...f, status: val } : f,
                                    ),
                                  );
                                }}
                                style={{ width: '120px', fontSize: '0.8rem' }}
                              >
                                <option value="PUBLISHED">Published</option>
                                <option value="DRAFT">Draft</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => removeFaq(idx)}
                                style={{
                                  border: '1px solid #fecaca',
                                  background: '#fef2f2',
                                  color: '#dc2626',
                                  borderRadius: '4px',
                                  padding: '0.2rem 0.5rem',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                }}
                              >
                                Hapus FAQ
                              </button>
                            </div>
                            <input
                              type="text"
                              className="admin-input"
                              placeholder="Pertanyaan (contoh: Apakah ada porter tenda?)"
                              value={faq.question}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFaqs((prev) =>
                                  prev.map((f, i) =>
                                    i === idx ? { ...f, question: val } : f,
                                  ),
                                );
                              }}
                              style={{ marginBottom: '0.5rem' }}
                            />
                            <textarea
                              className="admin-input"
                              rows={2}
                              placeholder="Jawaban rinci..."
                              value={faq.answer}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFaqs((prev) =>
                                  prev.map((f, i) =>
                                    i === idx ? { ...f, answer: val } : f,
                                  ),
                                );
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Media & Cover */}
                {activeContentTab === 'media' && (
                  <div>
                    <div
                      style={{
                        marginBottom: '1.25rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '6px',
                        background: coverMedia ? '#ecfdf5' : '#fffbeb',
                        border: `1px solid ${coverMedia ? '#a7f3d0' : '#fde68a'}`,
                        color: coverMedia ? '#065f46' : '#92400e',
                        fontSize: '0.85rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>
                        <strong>Status Foto:</strong>{' '}
                        {coverMedia
                          ? 'Cover siap. Trip memenuhi syarat cover minimal (P0).'
                          : 'Cover belum dipilih. Wajib memiliki Cover image untuk dipublikasikan.'}
                      </span>
                      {uploadingMedia && <span>Mengunggah...</span>}
                    </div>

                    {/* Section: Cover Image */}
                    <div
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '1.25rem',
                        marginBottom: '1.5rem',
                        background: '#ffffff',
                      }}
                    >
                      <h4
                        style={{
                          margin: '0 0 0.5rem 0',
                          fontSize: '0.95rem',
                          color: '#111827',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        🌟 Foto Sampul / Cover Image{' '}
                        <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>
                          (Wajib P0)
                        </span>
                      </h4>
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: '#6b7280',
                          margin: '0 0 1rem 0',
                        }}
                      >
                        Format: JPG, PNG, WEBP (maks. 5MB). Akan digunakan pada
                        kartu katalog dan banner utama trip.
                      </p>

                      {coverMedia ? (
                        <div
                          style={{
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'center',
                            background: '#f9fafb',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          <div
                            style={{
                              width: '120px',
                              height: '80px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              background: '#1b4332',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: '0.75rem',
                            }}
                          >
                            <img
                              src={coverMedia.url}
                              alt={coverMedia.altText || 'Cover preview'}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display =
                                  'none';
                              }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                color: '#111827',
                              }}
                            >
                              {coverMedia.objectKey.split('/').pop()}
                            </div>
                            <div
                              style={{ fontSize: '0.75rem', color: '#6b7280' }}
                            >
                              MIME: {coverMedia.mimeType} | Ukuran:{' '}
                              {Math.round(
                                Number(coverMedia.fileSizeBytes) / 1024,
                              )}{' '}
                              KB
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCoverMedia(null)}
                            style={{
                              border: '1px solid #fecaca',
                              background: '#fef2f2',
                              color: '#dc2626',
                              borderRadius: '4px',
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            Hapus Cover
                          </button>
                        </div>
                      ) : (
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: '#1b4332',
                            color: '#ffffff',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                          }}
                        >
                          📤 Unggah Foto Cover
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={(e) => handleUploadMedia(e, 'COVER')}
                            disabled={uploadingMedia}
                          />
                        </label>
                      )}
                    </div>

                    {/* Section: Gallery Images */}
                    <div
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '1.25rem',
                        background: '#ffffff',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '1rem',
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              margin: '0 0 0.25rem 0',
                              fontSize: '0.95rem',
                              color: '#111827',
                            }}
                          >
                            📸 Galeri Foto Pendakian ({galleryMedia.length})
                          </h4>
                          <p
                            style={{
                              fontSize: '0.8rem',
                              color: '#6b7280',
                              margin: 0,
                            }}
                          >
                            Foto-foto panorama, basecamp, puncak, dan aktivitas
                            trip.
                          </p>
                        </div>
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.4rem 0.85rem',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                          }}
                        >
                          + Tambah Foto Galeri
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={(e) => handleUploadMedia(e, 'GALLERY')}
                            disabled={uploadingMedia}
                          />
                        </label>
                      </div>

                      {galleryMedia.length === 0 ? (
                        <div
                          style={{
                            padding: '2rem',
                            textAlign: 'center',
                            background: '#f9fafb',
                            borderRadius: '6px',
                            color: '#6b7280',
                            fontSize: '0.85rem',
                          }}
                        >
                          Belum ada foto galeri yang diunggah.
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              'repeat(auto-fill, minmax(140px, 1fr))',
                            gap: '0.75rem',
                          }}
                        >
                          {galleryMedia.map((m, idx) => (
                            <div
                              key={m.id || idx}
                              style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                background: '#f9fafb',
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            >
                              <div
                                style={{
                                  height: '90px',
                                  background: '#e5e7eb',
                                  position: 'relative',
                                }}
                              >
                                <img
                                  src={m.url}
                                  alt={m.altText || `Gallery photo ${idx + 1}`}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display =
                                      'none';
                                  }}
                                />
                              </div>
                              <div
                                style={{
                                  padding: '0.5rem',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    color: '#6b7280',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '70px',
                                  }}
                                >
                                  Foto #{idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setGalleryMedia((prev) =>
                                      prev.filter((_, i) => i !== idx),
                                    )
                                  }
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    color: '#dc2626',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    padding: '0 0.2rem',
                                  }}
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Save Button */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    marginTop: '1.5rem',
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: '1rem',
                  }}
                >
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={closeContentModal}
                    disabled={isPending}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={handleSaveContent}
                    disabled={isPending}
                  >
                    {isPending ? 'Menyimpan...' : 'Simpan Semua Konten & Media'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Dialog Form Create / Edit */}
      {modalOpen && (
        <div
          className="admin-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
        >
          <div
            className="admin-modal-content"
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#111827' }}>
                {editingItem ? 'Perbarui Data Trip' : 'Tambah Trip Baru'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <label className="admin-form-label" htmlFor="trip-mountain">
                    Gunung Terkait *
                  </label>
                  <select
                    id="trip-mountain"
                    className="admin-select"
                    value={form.mountainId}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        mountainId: e.target.value,
                        routeId: '',
                      });
                    }}
                  >
                    <option value="">Pilih Gunung</option>
                    {mountains.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  {errors.mountainId && (
                    <div className="admin-form-error">{errors.mountainId}</div>
                  )}
                </div>

                <div>
                  <label className="admin-form-label" htmlFor="trip-route">
                    Jalur Terkait (Opsional)
                  </label>
                  <select
                    id="trip-route"
                    className="admin-select"
                    value={form.routeId}
                    onChange={(e) =>
                      setForm({ ...form, routeId: e.target.value })
                    }
                  >
                    <option value="">Semua Jalur / Belum Ditentukan</option>
                    {availableRoutes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="admin-form-label" htmlFor="trip-name">
                  Nama Trip *
                </label>
                <input
                  id="trip-name"
                  type="text"
                  className="admin-input"
                  placeholder="Contoh: Open Trip Rinjani Summit 3D2N"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {errors.name && (
                  <div className="admin-form-error">{errors.name}</div>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <label className="admin-form-label" htmlFor="trip-type">
                    Tipe Trip
                  </label>
                  <select
                    id="trip-type"
                    className="admin-select"
                    value={form.tripType}
                    onChange={(e) =>
                      setForm({ ...form, tripType: e.target.value as TripType })
                    }
                  >
                    {TRIP_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="admin-form-label" htmlFor="trip-difficulty">
                    Tingkat Kesulitan
                  </label>
                  <select
                    id="trip-difficulty"
                    className="admin-select"
                    value={form.difficulty}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        difficulty: e.target.value as DifficultyLevel,
                      })
                    }
                  >
                    {DIFFICULTY_LEVELS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <label className="admin-form-label" htmlFor="trip-days">
                    Durasi Hari *
                  </label>
                  <input
                    id="trip-days"
                    type="number"
                    min="1"
                    className="admin-input"
                    value={form.durationDays}
                    onChange={(e) =>
                      setForm({ ...form, durationDays: e.target.value })
                    }
                  />
                  {errors.durationDays && (
                    <div className="admin-form-error">
                      {errors.durationDays}
                    </div>
                  )}
                </div>

                <div>
                  <label className="admin-form-label" htmlFor="trip-nights">
                    Durasi Malam
                  </label>
                  <input
                    id="trip-nights"
                    type="number"
                    min="0"
                    className="admin-input"
                    value={form.durationNights}
                    onChange={(e) =>
                      setForm({ ...form, durationNights: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="admin-form-label" htmlFor="trip-status">
                    Status Konten
                  </label>
                  <select
                    id="trip-status"
                    className="admin-select"
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as ContentStatus,
                      })
                    }
                  >
                    {CONTENT_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <label className="admin-form-label" htmlFor="trip-min-age">
                    Usia Minimum
                  </label>
                  <input
                    id="trip-min-age"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Contoh: 15"
                    className="admin-input"
                    value={form.minimumAge}
                    onChange={(e) =>
                      setForm({ ...form, minimumAge: e.target.value })
                    }
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    paddingTop: '1.25rem',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.beginnerFriendly}
                      onChange={(e) =>
                        setForm({ ...form, beginnerFriendly: e.target.checked })
                      }
                    />
                    Ramah Pemula
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.healthCertificateRequired}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          healthCertificateRequired: e.target.checked,
                        })
                      }
                    />
                    Wajib Surat Sehat
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) =>
                        setForm({ ...form, featured: e.target.checked })
                      }
                    />
                    Tampilkan di Rekomendasi (Featured)
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="admin-form-label" htmlFor="trip-short-desc">
                  Deskripsi Singkat (Ringkasan)
                </label>
                <textarea
                  id="trip-short-desc"
                  className="admin-input"
                  rows={2}
                  placeholder="Ringkasan paket untuk kartu katalog dan preview..."
                  value={form.shortDescription}
                  onChange={(e) =>
                    setForm({ ...form, shortDescription: e.target.value })
                  }
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="admin-form-label" htmlFor="trip-desc">
                  Deskripsi Lengkap
                </label>
                <textarea
                  id="trip-desc"
                  className="admin-input"
                  rows={4}
                  placeholder="Detail lengkap paket pendakian, highlight perjalanan..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                }}
              >
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={closeModal}
                  disabled={isPending}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={isPending}
                >
                  {isPending ? 'Menyimpan...' : 'Simpan Data Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal Archive */}
      {deletingItem && (
        <div
          className="admin-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
        >
          <div
            className="admin-modal-content"
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              maxWidth: '450px',
              width: '100%',
              padding: '1.5rem',
            }}
          >
            <h3 style={{ margin: '0 0 0.75rem 0', color: '#111827' }}>
              Arsipkan Trip
            </h3>
            <p
              style={{
                color: '#4b5563',
                fontSize: '0.9rem',
                marginBottom: '1.25rem',
              }}
            >
              Apakah Anda yakin ingin mengarsipkan trip{' '}
              <strong>&ldquo;{deletingItem.name}&rdquo;</strong>? Data tidak
              akan dihapus permanen tetapi statusnya menjadi diarsipkan.
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
              }}
            >
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setDeletingItem(null)}
                disabled={isPending}
              >
                Batal
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={confirmArchive}
                disabled={isPending}
              >
                {isPending ? 'Mengarsipkan...' : 'Ya, Arsipkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Validation Error Modal */}
      {publishValidationModal && (
        <div
          className="admin-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '1rem',
          }}
        >
          <div
            className="admin-modal-content"
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              maxWidth: '520px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <h3 style={{ margin: 0, color: '#991b1b', fontSize: '1.15rem' }}>
                Trip Belum Siap Dipublikasikan
              </h3>
            </div>
            <p
              style={{
                color: '#4b5563',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            >
              Trip{' '}
              <strong>&ldquo;{publishValidationModal.trip.name}&rdquo;</strong>{' '}
              belum memenuhi syarat kelengkapan data berikut:
            </p>
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
              }}
            >
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '1.25rem',
                  color: '#b91c1c',
                  fontSize: '0.85rem',
                }}
              >
                {Object.entries(publishValidationModal.errors).map(
                  ([field, msg]) => (
                    <li key={field} style={{ marginBottom: '0.25rem' }}>
                      {msg}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
              }}
            >
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setPublishValidationModal(null)}
              >
                Tutup
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  const targetTrip = publishValidationModal.trip;
                  setPublishValidationModal(null);
                  openContentModal(targetTrip);
                }}
              >
                Lengkapi Konten & Media &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
