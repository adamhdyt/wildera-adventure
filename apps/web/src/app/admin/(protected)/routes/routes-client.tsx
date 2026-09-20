'use client';

import { useState, useTransition } from 'react';
import type { ContentStatus, Mountain, Route } from '@wildera/types';

interface Props {
  initialItems: Route[];
  mountains: Mountain[];
  userRoles?: string[];
}

export function RoutesClient({
  initialItems,
  mountains,
  userRoles = [],
}: Props) {
  const [items, setItems] = useState<Route[]>(initialItems);
  const [search, setSearch] = useState('');
  const [mountainFilter, setMountainFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Route | null>(null);
  const [deletingItem, setDeletingItem] = useState<Route | null>(null);

  const [formValues, setFormValues] = useState<{
    mountainId: string;
    name: string;
    slug: string;
    distanceKm: string;
    elevationGainM: string;
    estimatedDurationHours: string;
    difficulty: string;
    startingPoint: string;
    status: ContentStatus;
    description: string;
  }>({
    mountainId: mountains[0]?.id ?? '',
    name: '',
    slug: '',
    distanceKm: '',
    elevationGainM: '',
    estimatedDurationHours: '',
    difficulty: '',
    startingPoint: '',
    status: 'DRAFT',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const canManage =
    userRoles.includes('SUPER_ADMIN') ||
    userRoles.includes('OPERATIONS') ||
    userRoles.includes('CONTENT');

  const filteredItems = items.filter((item) => {
    if (mountainFilter !== 'ALL' && item.mountainId !== mountainFilter) {
      return false;
    }
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }
    if (difficultyFilter !== 'ALL' && item.difficulty !== difficultyFilter) {
      return false;
    }
    if (search.trim().length > 0) {
      const q = search.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchStarting = item.startingPoint?.toLowerCase().includes(q);
      const matchMountain = item.mountain?.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      return matchName || matchStarting || matchMountain || matchDesc;
    }
    return true;
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormValues({
      mountainId: mountains[0]?.id ?? '',
      name: '',
      slug: '',
      distanceKm: '',
      elevationGainM: '',
      estimatedDurationHours: '',
      difficulty: '',
      startingPoint: '',
      status: 'DRAFT',
      description: '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (item: Route) => {
    setEditingItem(item);
    setFormValues({
      mountainId: item.mountainId,
      name: item.name,
      slug: item.slug,
      distanceKm: item.distanceKm ? String(item.distanceKm) : '',
      elevationGainM: item.elevationGainM ? String(item.elevationGainM) : '',
      estimatedDurationHours: item.estimatedDurationHours
        ? String(item.estimatedDurationHours)
        : '',
      difficulty: item.difficulty ?? '',
      startingPoint: item.startingPoint ?? '',
      status: item.status,
      description: item.description ?? '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formValues.mountainId.trim()) {
      newErrors.mountainId = 'Gunung wajib dipilih.';
    }
    if (!formValues.name.trim()) {
      newErrors.name = 'Nama jalur wajib diisi.';
    }
    if (formValues.distanceKm && Number.isNaN(Number(formValues.distanceKm))) {
      newErrors.distanceKm = 'Jarak harus angka valid.';
    }
    if (
      formValues.elevationGainM &&
      Number.isNaN(Number(formValues.elevationGainM))
    ) {
      newErrors.elevationGainM = 'Elevasi harus angka valid.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    startTransition(async () => {
      try {
        const payload: Record<string, unknown> = {
          mountainId: formValues.mountainId,
          name: formValues.name.trim(),
          status: formValues.status,
        };

        if (formValues.slug.trim()) {
          payload.slug = formValues.slug.trim();
        }
        if (formValues.distanceKm.trim()) {
          payload.distanceKm = Number(formValues.distanceKm);
        }
        if (formValues.elevationGainM.trim()) {
          payload.elevationGainM = Number.parseInt(
            formValues.elevationGainM,
            10,
          );
        }
        if (formValues.estimatedDurationHours.trim()) {
          payload.estimatedDurationHours = Number(
            formValues.estimatedDurationHours,
          );
        }
        if (formValues.difficulty.trim()) {
          payload.difficulty = formValues.difficulty;
        }
        if (formValues.startingPoint.trim()) {
          payload.startingPoint = formValues.startingPoint.trim();
        }
        if (formValues.description.trim()) {
          payload.description = formValues.description.trim();
        }

        const isEditing = Boolean(editingItem);
        const url = isEditing
          ? `/api/admin/routes/${editingItem?.id}`
          : '/api/admin/routes';
        const method = isEditing ? 'PATCH' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (!res.ok) {
          const errMsg =
            json.error?.message || json.message || 'Gagal menyimpan jalur.';
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

        const savedItem: Route = json.data ?? json;

        if (isEditing) {
          setItems((prev) =>
            prev.map((it) => (it.id === savedItem.id ? savedItem : it)),
          );
          setFeedback({
            type: 'success',
            message: `Jalur "${savedItem.name}" berhasil diperbarui.`,
          });
        } else {
          setItems((prev) => [savedItem, ...prev]);
          setFeedback({
            type: 'success',
            message: `Jalur "${savedItem.name}" berhasil dibuat.`,
          });
        }

        setModalOpen(false);
      } catch {
        setFeedback({
          type: 'error',
          message: 'Terjadi kesalahan jaringan.',
        });
      }
    });
  };

  const confirmArchive = async () => {
    if (!deletingItem) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/routes/${deletingItem.id}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          const err = await res.json();
          setFeedback({
            type: 'error',
            message: err.message || 'Gagal mengarsipkan jalur.',
          });
          setDeletingItem(null);
          return;
        }

        setItems((prev) => prev.filter((it) => it.id !== deletingItem.id));
        setFeedback({
          type: 'success',
          message: `Jalur "${deletingItem.name}" berhasil diarsipkan.`,
        });
        setDeletingItem(null);
      } catch {
        setFeedback({
          type: 'error',
          message: 'Terjadi kesalahan jaringan.',
        });
        setDeletingItem(null);
      }
    });
  };

  const getDifficultyBadge = (difficulty: string | null) => {
    if (!difficulty) return <span className="status-badge badge-draft">-</span>;
    switch (difficulty) {
      case 'EASY':
        return <span className="status-badge badge-easy">EASY</span>;
      case 'MODERATE':
        return <span className="status-badge badge-moderate">MODERATE</span>;
      case 'HARD':
        return <span className="status-badge badge-hard">HARD</span>;
      case 'EXTREME':
        return <span className="status-badge badge-extreme">EXTREME</span>;
      default:
        return <span className="status-badge badge-draft">{difficulty}</span>;
    }
  };

  const getStatusBadge = (status: ContentStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="status-badge badge-draft">DRAFT</span>;
      case 'PUBLISHED':
        return <span className="status-badge badge-published">PUBLISHED</span>;
      case 'ARCHIVED':
        return <span className="status-badge badge-archived">ARCHIVED</span>;
      default:
        return <span className="status-badge badge-draft">{status}</span>;
    }
  };

  return (
    <div className="destinations-container">
      {feedback && (
        <div
          className={`login-alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}
          style={{ marginBottom: '1rem' }}
        >
          {feedback.message}
        </div>
      )}

      <div className="destinations-header">
        <div>
          <h2 className="admin-page-title" style={{ margin: 0 }}>
            Jalur pendakian
          </h2>
          <p className="admin-section-subtitle" style={{ margin: 0 }}>
            Kelola jalur pendakian per gunung, estimasi jarak, elevasi, dan
            tingkat kesulitan.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="action-btn-primary"
            onClick={openCreateModal}
          >
            + Tambah Jalur
          </button>
        )}
      </div>

      <div className="destinations-toolbar">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Cari nama jalur, titik awal, atau gunung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={mountainFilter}
            onChange={(e) => setMountainFilter(e.target.value)}
            aria-label="Filter Gunung"
          >
            <option value="ALL">Semua Gunung</option>
            {mountains.map((mtn) => (
              <option key={mtn.id} value={mtn.id}>
                {mtn.name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            aria-label="Filter Kesulitan"
          >
            <option value="ALL">Semua Kesulitan</option>
            <option value="EASY">Mudah (EASY)</option>
            <option value="MODERATE">Sedang (MODERATE)</option>
            <option value="HARD">Sulit (HARD)</option>
            <option value="EXTREME">Ekstrem (EXTREME)</option>
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter Status"
          >
            <option value="ALL">Semua Status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>NAMA JALUR</th>
              <th>GUNUNG</th>
              <th>JARAK</th>
              <th>ELEVASI</th>
              <th>DURASI</th>
              <th>KESULITAN</th>
              <th>STATUS</th>
              {canManage && <th style={{ textAlign: 'right' }}>AKSI</th>}
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={canManage ? 8 : 7}
                  style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#666',
                  }}
                >
                  Belum ada jalur pendakian yang sesuai filter.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    {item.startingPoint && (
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        Start: {item.startingPoint}
                      </div>
                    )}
                  </td>
                  <td>
                    <div>{item.mountain?.name ?? '-'}</div>
                    {item.mountain?.destination && (
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>
                        {item.mountain.destination.name}
                      </div>
                    )}
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {item.distanceKm ? `${item.distanceKm} KM` : '-'}
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {item.elevationGainM ? `${item.elevationGainM} M` : '-'}
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {item.estimatedDurationHours
                      ? `${item.estimatedDurationHours} Jam`
                      : '-'}
                  </td>
                  <td>{getDifficultyBadge(item.difficulty)}</td>
                  <td>{getStatusBadge(item.status)}</td>
                  {canManage && (
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => openEditModal(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-action-delete"
                        onClick={() => setDeletingItem(item)}
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

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <h3 className="admin-page-title" style={{ marginTop: 0 }}>
              {editingItem ? 'Perbarui Data Jalur' : 'Tambah Jalur Baru'}
            </h3>

            <form onSubmit={handleFormSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="route-mountain">
                  Gunung Terkait *
                </label>
                <select
                  id="route-mountain"
                  className="form-input"
                  value={formValues.mountainId}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      mountainId: e.target.value,
                    }))
                  }
                  disabled={isPending}
                >
                  <option value="">Pilih Gunung</option>
                  {mountains.map((mtn) => (
                    <option key={mtn.id} value={mtn.id}>
                      {mtn.name}
                    </option>
                  ))}
                </select>
                {errors.mountainId && (
                  <div className="form-error-inline">{errors.mountainId}</div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="route-name">
                  Nama Jalur *
                </label>
                <input
                  id="route-name"
                  type="text"
                  className="form-input"
                  placeholder="cth: Jalur Sembalun"
                  value={formValues.name}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={isPending}
                />
                {errors.name && (
                  <div className="form-error-inline">{errors.name}</div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="route-slug">
                  Slug Jalur (Opsional)
                </label>
                <input
                  id="route-slug"
                  type="text"
                  className="form-input"
                  placeholder="cth: jalur-sembalun (auto jika kosong)"
                  value={formValues.slug}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  disabled={isPending}
                />
                {errors.slug && (
                  <div className="form-error-inline">{errors.slug}</div>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="route-distance">
                    Jarak (KM)
                  </label>
                  <input
                    id="route-distance"
                    type="number"
                    step="0.1"
                    className="form-input"
                    placeholder="cth: 8.5"
                    value={formValues.distanceKm}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        distanceKm: e.target.value,
                      }))
                    }
                    disabled={isPending}
                  />
                  {errors.distanceKm && (
                    <div className="form-error-inline">{errors.distanceKm}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="route-elevation">
                    Elevasi (M)
                  </label>
                  <input
                    id="route-elevation"
                    type="number"
                    className="form-input"
                    placeholder="cth: 1900"
                    value={formValues.elevationGainM}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        elevationGainM: e.target.value,
                      }))
                    }
                    disabled={isPending}
                  />
                  {errors.elevationGainM && (
                    <div className="form-error-inline">
                      {errors.elevationGainM}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="route-duration">
                    Durasi (Jam)
                  </label>
                  <input
                    id="route-duration"
                    type="number"
                    step="0.5"
                    className="form-input"
                    placeholder="cth: 7.5"
                    value={formValues.estimatedDurationHours}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        estimatedDurationHours: e.target.value,
                      }))
                    }
                    disabled={isPending}
                  />
                  {errors.estimatedDurationHours && (
                    <div className="form-error-inline">
                      {errors.estimatedDurationHours}
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="route-difficulty">
                    Tingkat Kesulitan
                  </label>
                  <select
                    id="route-difficulty"
                    className="form-input"
                    value={formValues.difficulty}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        difficulty: e.target.value,
                      }))
                    }
                    disabled={isPending}
                  >
                    <option value="">Pilih Tingkat Kesulitan</option>
                    <option value="EASY">Mudah (EASY)</option>
                    <option value="MODERATE">Sedang (MODERATE)</option>
                    <option value="HARD">Sulit (HARD)</option>
                    <option value="EXTREME">Ekstrem (EXTREME)</option>
                  </select>
                  {errors.difficulty && (
                    <div className="form-error-inline">{errors.difficulty}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="route-status">
                    Status Konten
                  </label>
                  <select
                    id="route-status"
                    className="form-input"
                    value={formValues.status}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        status: e.target.value as ContentStatus,
                      }))
                    }
                    disabled={isPending}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="route-starting">
                  Titik Awal (Starting Point)
                </label>
                <input
                  id="route-starting"
                  type="text"
                  className="form-input"
                  placeholder="cth: Pos Sembalun, Desa Sembalun Bumbung"
                  value={formValues.startingPoint}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      startingPoint: e.target.value,
                    }))
                  }
                  disabled={isPending}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="route-desc">
                  Deskripsi Jalur
                </label>
                <textarea
                  id="route-desc"
                  className="form-input"
                  rows={3}
                  placeholder="Rincian jalur, medan pendakian, pos istirahat, dll..."
                  value={formValues.description}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  disabled={isPending}
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
                  className="btn-action-cancel"
                  onClick={() => setModalOpen(false)}
                  disabled={isPending}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="action-btn-primary"
                  disabled={isPending}
                >
                  {isPending ? 'Menyimpan...' : 'Simpan Data Jalur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingItem && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <h3 className="admin-page-title" style={{ marginTop: 0 }}>
              Arsipkan Jalur
            </h3>
            <p>
              Apakah Anda yakin ingin mengarsipkan jalur{' '}
              <strong>{deletingItem.name}</strong>? Jalur ini tidak akan muncul
              di katalog publik.
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '1.5rem',
              }}
            >
              <button
                type="button"
                className="btn-action-cancel"
                onClick={() => setDeletingItem(null)}
                disabled={isPending}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-action-delete"
                onClick={confirmArchive}
                disabled={isPending}
              >
                {isPending ? 'Mengarsipkan...' : 'Ya, Arsipkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
