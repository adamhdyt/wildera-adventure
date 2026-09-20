'use client';

import { useState, useTransition } from 'react';
import type { Destination, DestinationStatus } from '@wildera/types';

interface Props {
  initialItems: Destination[];
  userRoles: string[];
}

interface FormState {
  name: string;
  slug: string;
  province: string;
  region: string;
  description: string;
  status: DestinationStatus;
  seoTitle: string;
  seoDescription: string;
}

const defaultForm: FormState = {
  name: '',
  slug: '',
  province: '',
  region: '',
  description: '',
  status: 'ACTIVE',
  seoTitle: '',
  seoDescription: '',
};

export function DestinationsClient({ initialItems, userRoles }: Props) {
  const [items, setItems] = useState<Destination[]>(initialItems);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | DestinationStatus>(
    'ALL',
  );
  const [isPending, startTransition] = useTransition();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(defaultForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage =
    userRoles.includes('SUPER_ADMIN') ||
    userRoles.includes('OPERATIONS') ||
    userRoles.includes('CONTENT');

  function openCreate() {
    setEditingId(null);
    setFormData(defaultForm);
    setFormErrors({});
    setGeneralError('');
    setModalOpen(true);
  }

  function openEdit(dest: Destination) {
    setEditingId(dest.id);
    setFormData({
      name: dest.name,
      slug: dest.slug,
      province: dest.province ?? '',
      region: dest.region ?? '',
      description: dest.description ?? '',
      status: dest.status,
      seoTitle: dest.seoTitle ?? '',
      seoDescription: dest.seoDescription ?? '',
    });
    setFormErrors({});
    setGeneralError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors({});
    setGeneralError('');

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || undefined,
      province: formData.province.trim() || null,
      region: formData.region.trim() || null,
      description: formData.description.trim() || null,
      status: formData.status,
      seoTitle: formData.seoTitle.trim() || null,
      seoDescription: formData.seoDescription.trim() || null,
    };

    startTransition(async () => {
      try {
        const url = editingId
          ? `/api/admin/destinations/${editingId}`
          : '/api/admin/destinations';
        const method = editingId ? 'PATCH' : 'POST';

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const resData = await response.json();

        if (!response.ok) {
          if (resData.error?.fields) {
            setFormErrors(resData.error.fields);
          } else {
            setGeneralError(resData.error?.message || 'Gagal menyimpan data.');
          }
          return;
        }

        const saved: Destination = resData.data;

        if (editingId) {
          setItems((prev) =>
            prev.map((it) => (it.id === editingId ? saved : it)),
          );
          setSuccessMessage(`Destinasi "${saved.name}" berhasil diperbarui.`);
        } else {
          setItems((prev) => [saved, ...prev]);
          setSuccessMessage(`Destinasi "${saved.name}" berhasil ditambahkan.`);
        }

        setModalOpen(false);
        setTimeout(() => setSuccessMessage(''), 4000);
      } catch {
        setGeneralError('Koneksi terputus. Silakan coba lagi.');
      }
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/destinations/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const resData = await response.json();
          alert(resData.error?.message || 'Gagal menonaktifkan destinasi.');
          return;
        }

        setItems((prev) => prev.filter((it) => it.id !== id));
        setConfirmDeleteId(null);
        setSuccessMessage('Destinasi berhasil dinonaktifkan.');
        setTimeout(() => setSuccessMessage(''), 4000);
      } catch {
        alert('Koneksi terputus saat menghapus destinasi.');
      }
    });
  }

  const filteredItems = items.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.province && item.province.toLowerCase().includes(q)) ||
      (item.region && item.region.toLowerCase().includes(q)) ||
      item.slug.toLowerCase().includes(q)
    );
  });

  return (
    <div className="destinations-container">
      <div className="destinations-header">
        <div className="page-heading">
          <p className="login-context">KATALOG PERJALANAN</p>
          <h1>Destinasi</h1>
          <p>
            Kelola wilayah destinasi resmi, cakupan gunung, dan visibilitas di
            katalog Wildera Adventure.
          </p>
        </div>
        {canManage && (
          <div className="destinations-actions">
            <button
              type="button"
              className="admin-primary"
              onClick={openCreate}
            >
              + Tambah Destinasi
            </button>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="alert-box alert-success">{successMessage}</div>
      )}

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Cari nama, provinsi, atau slug..."
          className="filter-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as 'ALL' | DestinationStatus)
          }
        >
          <option value="ALL">Semua status</option>
          <option value="ACTIVE">Aktif (ACTIVE)</option>
          <option value="INACTIVE">Nonaktif (INACTIVE)</option>
        </select>
      </div>

      <div className="data-panel">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Destinasi</th>
                <th>Slug URL</th>
                <th>Provinsi</th>
                <th>Wilayah</th>
                <th>Gunung</th>
                <th>Status</th>
                {canManage && <th style={{ textAlign: 'right' }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6}>
                    <div className="empty-state">
                      <h4>Belum ada data destinasi</h4>
                      <p>
                        {search
                          ? 'Tidak ada destinasi yang cocok dengan pencarian.'
                          : 'Mulai dengan menambahkan destinasi pertama untuk katalog Anda.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>
                      <span className="code-tag">{item.slug}</span>
                    </td>
                    <td>{item.province || '—'}</td>
                    <td>{item.region || '—'}</td>
                    <td>
                      <span className="badge badge-count">
                        {item._count?.mountains ?? 0} gunung
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          item.status === 'ACTIVE'
                            ? 'badge-active'
                            : 'badge-inactive'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    {canManage && (
                      <td>
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
                            onClick={() => setConfirmDeleteId(item.id)}
                          >
                            Hapus
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
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>
                {editingId ? 'Perbarui Destinasi' : 'Tambah Destinasi Baru'}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="Tutup modal"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {generalError && (
                  <div className="alert-box alert-error">{generalError}</div>
                )}

                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="dest-name">Nama Destinasi *</label>
                    <input
                      id="dest-name"
                      type="text"
                      required
                      placeholder="Contoh: Lombok, Jawa Tengah"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                    {formErrors.name && (
                      <span className="form-error">{formErrors.name}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="dest-slug">Slug URL</label>
                    <input
                      id="dest-slug"
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
                    <label htmlFor="dest-status">Status</label>
                    <select
                      id="dest-status"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as DestinationStatus,
                        })
                      }
                    >
                      <option value="ACTIVE">Aktif (ACTIVE)</option>
                      <option value="INACTIVE">Nonaktif (INACTIVE)</option>
                    </select>
                    {formErrors.status && (
                      <span className="form-error">{formErrors.status}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="dest-province">Provinsi</label>
                    <input
                      id="dest-province"
                      type="text"
                      placeholder="Contoh: Nusa Tenggara Barat"
                      value={formData.province}
                      onChange={(e) =>
                        setFormData({ ...formData, province: e.target.value })
                      }
                    />
                    {formErrors.province && (
                      <span className="form-error">{formErrors.province}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="dest-region">Wilayah / Region</label>
                    <input
                      id="dest-region"
                      type="text"
                      placeholder="Contoh: Kepulauan Nusa Tenggara"
                      value={formData.region}
                      onChange={(e) =>
                        setFormData({ ...formData, region: e.target.value })
                      }
                    />
                    {formErrors.region && (
                      <span className="form-error">{formErrors.region}</span>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="dest-desc">Deskripsi Destinasi</label>
                    <textarea
                      id="dest-desc"
                      placeholder="Keterangan mengenai destinasi wisata alam / pendakian ini..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                    {formErrors.description && (
                      <span className="form-error">
                        {formErrors.description}
                      </span>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="dest-seotitle">SEO Title</label>
                    <input
                      id="dest-seotitle"
                      type="text"
                      placeholder="Judul halaman untuk mesin pencari..."
                      value={formData.seoTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, seoTitle: e.target.value })
                      }
                    />
                    {formErrors.seoTitle && (
                      <span className="form-error">{formErrors.seoTitle}</span>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="dest-seodesc">SEO Description</label>
                    <textarea
                      id="dest-seodesc"
                      placeholder="Deskripsi ringkas untuk snippet hasil pencarian Google..."
                      value={formData.seoDescription}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seoDescription: e.target.value,
                        })
                      }
                    />
                    {formErrors.seoDescription && (
                      <span className="form-error">
                        {formErrors.seoDescription}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-sm btn-outline"
                  onClick={() => setModalOpen(false)}
                  disabled={isPending}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="admin-primary"
                  disabled={isPending}
                >
                  {isPending ? 'Menyimpan...' : 'Simpan Destinasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div
          className="modal-backdrop"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="modal-dialog"
            style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
          >
            <div className="modal-header">
              <h3>Nonaktifkan Destinasi?</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setConfirmDeleteId(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Destinasi ini akan di-soft delete dan statusnya berubah menjadi
                INACTIVE. Data historis trip dan gunung yang sudah ada tetap
                tersimpan aman.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-sm btn-outline"
                onClick={() => setConfirmDeleteId(null)}
                disabled={isPending}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-sm btn-danger"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={isPending}
              >
                {isPending ? 'Memproses...' : 'Ya, Nonaktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
