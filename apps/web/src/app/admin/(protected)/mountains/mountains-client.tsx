'use client';

import { useState, useTransition } from 'react';
import type { ContentStatus, Destination, Mountain } from '@wildera/types';

interface Props {
  initialItems: Mountain[];
  destinations: Destination[];
  userRoles: string[];
}

interface FormState {
  destinationId: string;
  name: string;
  slug: string;
  altitudeM: string;
  defaultDifficulty: string;
  bestSeason: string;
  latitude: string;
  longitude: string;
  status: ContentStatus;
  shortDescription: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
}

const initialForm: FormState = {
  destinationId: '',
  name: '',
  slug: '',
  altitudeM: '',
  defaultDifficulty: '',
  bestSeason: '',
  latitude: '',
  longitude: '',
  status: 'DRAFT',
  shortDescription: '',
  description: '',
  seoTitle: '',
  seoDescription: '',
};

export function MountainsClient({
  initialItems,
  destinations,
  userRoles,
}: Props) {
  const [items, setItems] = useState<Mountain[]>(initialItems);
  const [search, setSearch] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Mountain | null>(null);
  const [deletingItem, setDeletingItem] = useState<Mountain | null>(null);

  const [formData, setFormData] = useState<FormState>(initialForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const canManage =
    userRoles.includes('SUPER_ADMIN') ||
    userRoles.includes('OPERATIONS') ||
    userRoles.includes('CONTENT');

  function openCreate() {
    setEditingItem(null);
    setFormData({
      ...initialForm,
      destinationId: destinations[0]?.id ?? '',
    });
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(item: Mountain) {
    setEditingItem(item);
    setFormData({
      destinationId: item.destinationId,
      name: item.name,
      slug: item.slug,
      altitudeM: item.altitudeM !== null ? String(item.altitudeM) : '',
      defaultDifficulty: item.defaultDifficulty ?? '',
      bestSeason: item.bestSeason ?? '',
      latitude: item.latitude !== null ? String(item.latitude) : '',
      longitude: item.longitude !== null ? String(item.longitude) : '',
      status: item.status,
      shortDescription: item.shortDescription ?? '',
      description: item.description ?? '',
      seoTitle: item.seoTitle ?? '',
      seoDescription: item.seoDescription ?? '',
    });
    setFormErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingItem(null);
    setFormErrors({});
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors({});
    setFeedback(null);

    const payload: Record<string, unknown> = {
      destinationId: formData.destinationId,
      name: formData.name,
      slug: formData.slug || undefined,
      altitudeM: formData.altitudeM ? Number(formData.altitudeM) : null,
      defaultDifficulty: formData.defaultDifficulty || null,
      bestSeason: formData.bestSeason || null,
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
      status: formData.status,
      shortDescription: formData.shortDescription || null,
      description: formData.description || null,
      seoTitle: formData.seoTitle || null,
      seoDescription: formData.seoDescription || null,
    };

    startTransition(async () => {
      try {
        const url = editingItem
          ? `/api/admin/mountains/${editingItem.id}`
          : '/api/admin/mountains';
        const method = editingItem ? 'PATCH' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (!res.ok) {
          if (json.error?.fields) {
            setFormErrors(json.error.fields);
          } else {
            setFormErrors({
              _general:
                json.error?.message || 'Terjadi kesalahan saat menyimpan.',
            });
          }
          return;
        }

        const savedItem: Mountain = json.data;

        if (editingItem) {
          setItems((prev) =>
            prev.map((i) => (i.id === savedItem.id ? savedItem : i)),
          );
          setFeedback({
            type: 'success',
            message: `Gunung "${savedItem.name}" berhasil diperbarui.`,
          });
        } else {
          setItems((prev) => [savedItem, ...prev]);
          setFeedback({
            type: 'success',
            message: `Gunung "${savedItem.name}" berhasil ditambahkan.`,
          });
        }

        closeModal();
      } catch (err) {
        setFormErrors({
          _general:
            err instanceof Error
              ? err.message
              : 'Koneksi ke server bermasalah.',
        });
      }
    });
  }

  async function handleDeleteConfirm() {
    if (!deletingItem) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/mountains/${deletingItem.id}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          const json = await res.json();
          setFeedback({
            type: 'error',
            message: json.error?.message || 'Gagal menghapus gunung.',
          });
          setDeletingItem(null);
          return;
        }

        setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
        setFeedback({
          type: 'success',
          message: `Gunung "${deletingItem.name}" berhasil diarsipkan.`,
        });
        setDeletingItem(null);
      } catch (err) {
        setFeedback({
          type: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Koneksi ke server bermasalah.',
        });
        setDeletingItem(null);
      }
    });
  }

  const filteredItems = items.filter((item) => {
    if (
      destinationFilter !== 'ALL' &&
      item.destinationId !== destinationFilter
    ) {
      return false;
    }
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }
    if (
      difficultyFilter !== 'ALL' &&
      item.defaultDifficulty !== difficultyFilter
    ) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDest = item.destination?.name.toLowerCase().includes(q);
      const matchSeason = item.bestSeason?.toLowerCase().includes(q);
      return matchName || matchDest || matchSeason;
    }
    return true;
  });

  return (
    <div className="destinations-container">
      <div className="destinations-header">
        <div className="page-heading">
          <h1>Gunung</h1>
          <p>
            Kelola katalog gunung, ketinggian, tingkat kesulitan, dan jalur
            pendakian.
          </p>
        </div>
        {canManage && (
          <div className="destinations-actions">
            <button
              type="button"
              className="admin-primary btn-sm"
              onClick={openCreate}
            >
              + Tambah Gunung
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`alert-box ${
            feedback.type === 'success' ? 'alert-success' : 'alert-error'
          }`}
          role="alert"
        >
          {feedback.message}
        </div>
      )}

      <div className="filter-bar">
        <input
          type="text"
          className="filter-input"
          placeholder="Cari nama gunung, destinasi, atau musim..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={destinationFilter}
          onChange={(e) => setDestinationFilter(e.target.value)}
        >
          <option value="ALL">Semua Destinasi</option>
          {destinations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
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
        >
          <option value="ALL">Semua Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="data-panel">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Gunung</th>
                <th>Slug URL</th>
                <th>Destinasi</th>
                <th>Ketinggian</th>
                <th>Kesulitan</th>
                <th>Status</th>
                <th>Jalur</th>
                {canManage && <th style={{ textAlign: 'right' }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7}>
                    <div className="empty-state">
                      <h4>Belum ada data gunung</h4>
                      <p>
                        {search || destinationFilter !== 'ALL'
                          ? 'Tidak ada gunung yang cocok dengan filter.'
                          : 'Mulai dengan menambahkan gunung pertama untuk katalog Anda.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      {item.bestSeason && (
                        <div
                          style={{ fontSize: '0.75rem', color: 'var(--muted)' }}
                        >
                          Musim: {item.bestSeason}
                        </div>
                      )}
                    </td>
                    <td>
                      <code className="code-tag">{item.slug}</code>
                    </td>
                    <td>{item.destination?.name ?? '—'}</td>
                    <td>
                      {item.altitudeM ? (
                        <span className="badge badge-count">
                          {item.altitudeM} MDPL
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {item.defaultDifficulty ? (
                        <span
                          className={`badge badge-${item.defaultDifficulty.toLowerCase()}`}
                        >
                          {item.defaultDifficulty}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge badge-${item.status.toLowerCase()}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-count">
                        {item._count?.routes ?? 0} Jalur
                      </span>
                    </td>
                    {canManage && (
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-sm btn-outline"
                            onClick={() => openEdit(item)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-sm btn-danger"
                            onClick={() => setDeletingItem(item)}
                          >
                            Arsipkan
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>
                {editingItem ? 'Perbarui Data Gunung' : 'Tambah Gunung Baru'}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                aria-label="Tutup"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formErrors._general && (
                  <div className="alert-box alert-error">
                    {formErrors._general}
                  </div>
                )}
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="destinationId">Destinasi Terkait *</label>
                    <select
                      id="destinationId"
                      value={formData.destinationId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          destinationId: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Pilih Destinasi</option>
                      {destinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.province || 'Indonesia'})
                        </option>
                      ))}
                    </select>
                    {formErrors.destinationId && (
                      <span className="form-error">
                        {formErrors.destinationId}
                      </span>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="name">Nama Gunung *</label>
                    <input
                      id="name"
                      type="text"
                      placeholder="contoh: Gunung Rinjani"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                    {formErrors.name && (
                      <span className="form-error">{formErrors.name}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="slug">Slug URL</label>
                    <input
                      id="slug"
                      type="text"
                      placeholder="otomatis jika dikosongkan"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                    />
                    {formErrors.slug && (
                      <span className="form-error">{formErrors.slug}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="altitudeM">Ketinggian (MDPL)</label>
                    <input
                      id="altitudeM"
                      type="number"
                      placeholder="contoh: 3726"
                      value={formData.altitudeM}
                      onChange={(e) =>
                        setFormData({ ...formData, altitudeM: e.target.value })
                      }
                      min="0"
                      max="9000"
                    />
                    {formErrors.altitudeM && (
                      <span className="form-error">{formErrors.altitudeM}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="defaultDifficulty">Tingkat Kesulitan</label>
                    <select
                      id="defaultDifficulty"
                      value={formData.defaultDifficulty}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defaultDifficulty: e.target.value,
                        })
                      }
                    >
                      <option value="">Pilih Tingkat Kesulitan</option>
                      <option value="EASY">Mudah (EASY)</option>
                      <option value="MODERATE">Sedang (MODERATE)</option>
                      <option value="HARD">Sulit (HARD)</option>
                      <option value="EXTREME">Ekstrem (EXTREME)</option>
                    </select>
                    {formErrors.defaultDifficulty && (
                      <span className="form-error">
                        {formErrors.defaultDifficulty}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Status Konten</label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as ContentStatus,
                        })
                      }
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                    {formErrors.status && (
                      <span className="form-error">{formErrors.status}</span>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="bestSeason">Musim Terbaik</label>
                    <input
                      id="bestSeason"
                      type="text"
                      placeholder="contoh: April - Oktober"
                      value={formData.bestSeason}
                      onChange={(e) =>
                        setFormData({ ...formData, bestSeason: e.target.value })
                      }
                    />
                    {formErrors.bestSeason && (
                      <span className="form-error">
                        {formErrors.bestSeason}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="latitude">Latitude</label>
                    <input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="contoh: -8.4113"
                      value={formData.latitude}
                      onChange={(e) =>
                        setFormData({ ...formData, latitude: e.target.value })
                      }
                    />
                    {formErrors.latitude && (
                      <span className="form-error">{formErrors.latitude}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="longitude">Longitude</label>
                    <input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="contoh: 116.4572"
                      value={formData.longitude}
                      onChange={(e) =>
                        setFormData({ ...formData, longitude: e.target.value })
                      }
                    />
                    {formErrors.longitude && (
                      <span className="form-error">{formErrors.longitude}</span>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="shortDescription">Deskripsi Singkat</label>
                    <textarea
                      id="shortDescription"
                      rows={2}
                      placeholder="Ringkasan singkat tentang gunung untuk kartu preview..."
                      value={formData.shortDescription}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shortDescription: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="description">Deskripsi Lengkap</label>
                    <textarea
                      id="description"
                      rows={4}
                      placeholder="Informasi detail geografi, pemandangan, dan karakteristik gunung..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="seoTitle">SEO Title</label>
                    <input
                      id="seoTitle"
                      type="text"
                      placeholder="Meta title untuk search engine"
                      value={formData.seoTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, seoTitle: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="seoDescription">SEO Description</label>
                    <input
                      id="seoDescription"
                      type="text"
                      placeholder="Meta description untuk search engine"
                      value={formData.seoDescription}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seoDescription: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-sm btn-outline"
                  onClick={closeModal}
                  disabled={isPending}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="admin-primary btn-sm"
                  disabled={isPending}
                >
                  {isPending ? 'Menyimpan…' : 'Simpan Data Gunung'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingItem && (
        <div className="modal-backdrop" onClick={() => setDeletingItem(null)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: '460px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>Arsipkan Gunung</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setDeletingItem(null)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>
                Apakah Anda yakin ingin mengarsipkan gunung{' '}
                <strong>{deletingItem.name}</strong>? Gunung ini tidak akan
                tampil lagi di katalog aktif.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-sm btn-outline"
                onClick={() => setDeletingItem(null)}
                disabled={isPending}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-sm btn-danger"
                onClick={handleDeleteConfirm}
                disabled={isPending}
              >
                {isPending ? 'Memproses…' : 'Ya, Arsipkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
