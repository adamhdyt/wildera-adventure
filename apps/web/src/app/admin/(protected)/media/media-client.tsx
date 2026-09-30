'use client';

import { useRef, useState } from 'react';
import type { MediaAsset } from '@wildera/types';

interface Props {
  initialItems: MediaAsset[];
  initialTotal: number;
  loadFailed: boolean;
  userRoles: string[];
}

const PAGE_SIZE = 48;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

function formatBytes(value: number | string) {
  const bytes = Number(value);
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function MediaClient({
  initialItems,
  initialTotal,
  loadFailed,
  userRoles,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState('');
  const [altText, setAltText] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(
    loadFailed ? { type: 'error', text: 'Gagal memuat pustaka media.' } : null,
  );
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [copied, setCopied] = useState(false);
  const [editAlt, setEditAlt] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [modalError, setModalError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const canManage =
    userRoles.includes('SUPER_ADMIN') ||
    userRoles.includes('OPERATIONS') ||
    userRoles.includes('CONTENT');

  async function fetchPage(query: string, offset: number) {
    const qs = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (query.trim()) qs.set('search', query.trim());
    const res = await fetch(`/api/admin/media?${qs}`);
    if (!res.ok) throw new Error('fetch failed');
    const json = await res.json();
    const data = json.data ?? json;
    return {
      items: (data.items ?? []) as MediaAsset[],
      total: (data.total ?? 0) as number,
    };
  }

  async function runSearch(query: string) {
    setBusy(true);
    try {
      const page = await fetchPage(query, 0);
      setItems(page.items);
      setTotal(page.total);
      setMessage(null);
    } catch {
      setMessage({ type: 'error', text: 'Gagal memuat pustaka media.' });
    } finally {
      setBusy(false);
    }
  }

  async function loadMore() {
    setBusy(true);
    try {
      const page = await fetchPage(search, items.length);
      setItems((prev) => [...prev, ...page.items]);
      setTotal(page.total);
    } catch {
      setMessage({ type: 'error', text: 'Gagal memuat foto berikutnya.' });
    } finally {
      setBusy(false);
    }
  }

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setBusy(true);
    setMessage(null);
    const uploaded: MediaAsset[] = [];
    const errors: string[] = [];

    for (const file of list) {
      if (!ACCEPTED.includes(file.type)) {
        errors.push(`${file.name}: format harus JPG, PNG, atau WebP.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        errors.push(`${file.name}: ukuran melebihi 5 MB.`);
        continue;
      }
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('altText', altText.trim());
        const res = await fetch('/api/admin/media/upload', {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();
        if (!res.ok) {
          errors.push(
            `${file.name}: ${json.error?.message || json.message || 'gagal diunggah.'}`,
          );
          continue;
        }
        uploaded.push(json.data ?? json);
      } catch {
        errors.push(`${file.name}: koneksi terputus.`);
      }
    }

    if (uploaded.length > 0) {
      setItems((prev) => [...uploaded.reverse(), ...prev]);
      setTotal((prev) => prev + uploaded.length);
      setAltText('');
    }
    setMessage(
      errors.length > 0
        ? {
            type: 'error',
            text:
              uploaded.length > 0
                ? `${uploaded.length} foto terunggah. ${errors.join(' ')}`
                : errors.join(' '),
          }
        : {
            type: 'success',
            text: `${uploaded.length} foto berhasil diunggah.`,
          },
    );
    if (fileInput.current) fileInput.current.value = '';
    setBusy(false);
  }

  function openDetail(asset: MediaAsset | null) {
    setSelected(asset);
    setEditAlt(asset?.altText ?? '');
    setConfirmDelete(false);
    setModalError('');
  }

  async function saveAlt(asset: MediaAsset) {
    setBusy(true);
    setModalError('');
    try {
      const res = await fetch(`/api/admin/media/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ altText: editAlt.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        setModalError(
          json.error?.message || 'Gagal menyimpan teks alternatif.',
        );
        return;
      }
      const updated: MediaAsset = json.data ?? json;
      setItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setSelected(updated);
      setMessage({ type: 'success', text: 'Teks alternatif disimpan.' });
    } catch {
      setModalError('Koneksi terputus. Silakan coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteAsset(asset: MediaAsset) {
    setBusy(true);
    setModalError('');
    try {
      const res = await fetch(`/api/admin/media/${asset.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setModalError(json.error?.message || 'Gagal menghapus foto.');
        setConfirmDelete(false);
        return;
      }
      setItems((prev) => prev.filter((m) => m.id !== asset.id));
      setTotal((prev) => Math.max(0, prev - 1));
      setMessage({ type: 'success', text: 'Foto berhasil dihapus.' });
      openDetail(null);
    } catch {
      setModalError('Koneksi terputus. Silakan coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  async function copyUrl(asset: MediaAsset) {
    try {
      await navigator.clipboard.writeText(
        new URL(asset.url, window.location.origin).toString(),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage({ type: 'error', text: 'Gagal menyalin tautan.' });
    }
  }

  return (
    <div className="destinations-container">
      <div className="destinations-header">
        <div className="page-heading">
          <p className="login-context">KATALOG PERJALANAN</p>
          <h1>Media</h1>
          <p>
            Pustaka foto untuk trip dan gunung. Foto yang diunggah di sini dapat
            dipakai sebagai cover atau galeri di editor trip.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`alert-box ${
            message.type === 'success' ? 'alert-success' : 'alert-error'
          }`}
        >
          {message.text}
        </div>
      )}

      {canManage && (
        <div
          className={`media-dropzone${dragging ? ' is-dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void uploadFiles(e.dataTransfer.files);
          }}
        >
          <p style={{ margin: '0 0 0.75rem' }}>
            Seret foto ke sini, atau pilih berkas. JPG, PNG, WebP, AVIF · maks.
            5 MB per foto.
          </p>
          <div className="media-toolbar" style={{ justifyContent: 'center' }}>
            <input
              className="filter-input"
              type="text"
              placeholder="Teks alternatif (opsional, untuk aksesibilitas & SEO)"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              aria-label="Teks alternatif foto"
            />
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPTED.join(',')}
              multiple
              hidden
              data-testid="media-file-input"
              onChange={(e) =>
                e.target.files && void uploadFiles(e.target.files)
              }
            />
            <button
              type="button"
              className="admin-primary"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              {busy ? 'Memproses…' : '+ Unggah Foto'}
            </button>
          </div>
        </div>
      )}

      <form
        className="media-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch(search);
        }}
      >
        <input
          className="filter-input"
          type="search"
          placeholder="Cari nama berkas atau teks alternatif…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cari media"
        />
        <button type="submit" className="btn-sm btn-outline" disabled={busy}>
          Cari
        </button>
        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          {total} foto
        </span>
      </form>

      {items.length === 0 ? (
        <div className="empty-state">
          <h4>Belum ada foto</h4>
          <p>
            {search
              ? 'Tidak ada foto yang cocok dengan pencarian.'
              : 'Unggah foto pertama untuk memulai pustaka media.'}
          </p>
        </div>
      ) : (
        <div className="media-grid">
          {items.map((asset) => (
            <button
              key={asset.id}
              type="button"
              className="media-card"
              onClick={() => openDetail(asset)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.url}
                alt={asset.altText || asset.objectKey}
                loading="lazy"
              />
              <span className="media-card-meta">
                <strong>
                  {asset.altText || asset.objectKey.split('/').pop()}
                </strong>
                <span>
                  {formatBytes(asset.fileSizeBytes)} ·{' '}
                  {formatDate(asset.createdAt)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {items.length < total && (
        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <button
            type="button"
            className="btn-sm btn-outline"
            disabled={busy}
            onClick={() => void loadMore()}
          >
            Muat lebih banyak
          </button>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => openDetail(null)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>Detail Foto</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => openDetail(null)}
                aria-label="Tutup modal"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="media-detail-preview"
                src={selected.url}
                alt={selected.altText || selected.objectKey}
              />
              {canManage && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label htmlFor="media-alt">Teks alternatif</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      id="media-alt"
                      type="text"
                      maxLength={255}
                      value={editAlt}
                      onChange={(e) => setEditAlt(e.target.value)}
                      placeholder="Deskripsikan isi foto"
                    />
                    <button
                      type="button"
                      className="admin-primary"
                      disabled={
                        busy || editAlt.trim() === (selected.altText ?? '')
                      }
                      onClick={() => void saveAlt(selected)}
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              )}
              {modalError && (
                <div className="alert-box alert-error">{modalError}</div>
              )}
              <dl className="media-detail-list">
                <dt>Dipakai di</dt>
                <dd>
                  {selected.usage
                    ? `${selected.usage.trips} trip, ${selected.usage.mountains} gunung`
                    : '—'}
                </dd>
                <dt>Berkas</dt>
                <dd>{selected.objectKey}</dd>
                <dt>Tipe</dt>
                <dd>{selected.mimeType}</dd>
                <dt>Ukuran</dt>
                <dd>{formatBytes(selected.fileSizeBytes)}</dd>
                {selected.widthPx && selected.heightPx ? (
                  <>
                    <dt>Dimensi</dt>
                    <dd>
                      {selected.widthPx} × {selected.heightPx} px
                    </dd>
                  </>
                ) : null}
                <dt>Diunggah</dt>
                <dd>{formatDate(selected.createdAt)}</dd>
                <dt>URL</dt>
                <dd>{selected.url}</dd>
              </dl>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-sm btn-outline"
                onClick={() => void copyUrl(selected)}
              >
                {copied ? 'Tersalin ✓' : 'Salin URL'}
              </button>
              {canManage &&
                (confirmDelete ? (
                  <>
                    <span style={{ alignSelf: 'center', fontSize: '0.85rem' }}>
                      Hapus permanen?
                    </span>
                    <button
                      type="button"
                      className="btn-sm btn-danger"
                      disabled={busy}
                      onClick={() => void deleteAsset(selected)}
                    >
                      Ya, hapus
                    </button>
                    <button
                      type="button"
                      className="btn-sm btn-outline"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Batal
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn-sm btn-danger"
                    disabled={
                      busy ||
                      !!(
                        selected.usage &&
                        selected.usage.trips + selected.usage.mountains > 0
                      )
                    }
                    title={
                      selected.usage &&
                      selected.usage.trips + selected.usage.mountains > 0
                        ? 'Foto masih dipakai, lepaskan dulu dari trip/gunung.'
                        : undefined
                    }
                    onClick={() => setConfirmDelete(true)}
                  >
                    Hapus
                  </button>
                ))}
              <a
                className="btn-sm btn-outline"
                href={selected.url}
                target="_blank"
                rel="noreferrer"
              >
                Buka asli
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
