'use client';

import { useState } from 'react';
import type { PrivateTripInquiry, PrivateTripStatus } from '@wildera/types';

interface Props {
  initialInquiries: PrivateTripInquiry[];
  userRoles?: string[];
}

const STATUS_OPTIONS: {
  value: PrivateTripStatus;
  label: string;
  color: string;
}[] = [
  { value: 'NEW', label: 'New Lead', color: '#2563eb' },
  { value: 'CONTACTED', label: 'Contacted', color: '#d97706' },
  { value: 'QUOTATION_SENT', label: 'Quotation Sent', color: '#7c3aed' },
  { value: 'NEGOTIATION', label: 'Negotiation', color: '#0891b2' },
  { value: 'BOOKED', label: 'Booked / Deal', color: '#16a34a' },
  { value: 'LOST', label: 'Lost', color: '#dc2626' },
];

export function PrivateTripsClient({
  initialInquiries,
  userRoles = [],
}: Props) {
  const [inquiries, setInquiries] =
    useState<PrivateTripInquiry[]>(initialInquiries);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [selectedInquiry, setSelectedInquiry] =
    useState<PrivateTripInquiry | null>(null);

  // Edit / Notes modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<PrivateTripStatus>('NEW');
  const [editNotes, setEditNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const canManage =
    userRoles.includes('SUPER_ADMIN') || userRoles.includes('OPERATIONS');

  const filtered = inquiries.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = item.customerName.toLowerCase().includes(q);
      const matchNum = item.inquiryNumber.toLowerCase().includes(q);
      const matchWa = item.whatsappNumber.toLowerCase().includes(q);
      const matchDest = (item.mountain?.name || item.destinationOther || '')
        .toLowerCase()
        .includes(q);
      return matchName || matchNum || matchWa || matchDest;
    }
    return true;
  });

  const getStatusBadge = (status: PrivateTripStatus) => {
    const opt = STATUS_OPTIONS.find((s) => s.value === status);
    return (
      <span
        className="admin-badge"
        style={{
          backgroundColor: `${opt?.color ?? '#536158'}15`,
          color: opt?.color ?? '#536158',
          borderColor: `${opt?.color ?? '#536158'}40`,
        }}
      >
        {opt?.label ?? status}
      </span>
    );
  };

  const handleOpenEdit = (inquiry: PrivateTripInquiry) => {
    setSelectedInquiry(inquiry);
    setEditStatus(inquiry.status);
    setEditNotes(inquiry.adminNotes ?? '');
    setFeedback(null);
    setEditModalOpen(true);
  };

  const handleQuickStatusChange = async (
    id: string,
    newStatus: PrivateTripStatus,
  ) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/private-trips/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await res.json();
        setInquiries((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)),
        );
        if (selectedInquiry?.id === id) {
          setSelectedInquiry((prev) =>
            prev ? { ...prev, status: newStatus } : null,
          );
        }
      }
    } catch {
      // Ignored
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;

    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(
        `/api/admin/private-trips/${selectedInquiry.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: editStatus,
            adminNotes: editNotes.trim() || null,
          }),
        },
      );

      if (!res.ok) {
        setFeedback({
          type: 'error',
          message: 'Gagal memperbarui data inkuiri.',
        });
        return;
      }

      await res.json();
      setInquiries((prev) =>
        prev.map((i) =>
          i.id === selectedInquiry.id
            ? { ...i, status: editStatus, adminNotes: editNotes.trim() || null }
            : i,
        ),
      );
      setSelectedInquiry((prev) =>
        prev
          ? {
              ...prev,
              status: editStatus,
              adminNotes: editNotes.trim() || null,
            }
          : null,
      );
      setEditModalOpen(false);
    } catch {
      setFeedback({
        type: 'error',
        message: 'Terjadi kesalahan saat menyimpan.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tiket permintaan ini?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/private-trips/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setInquiries((prev) => prev.filter((i) => i.id !== id));
        if (selectedInquiry?.id === id) {
          setSelectedInquiry(null);
          setEditModalOpen(false);
        }
      }
    } catch {
      // Ignored
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div>
          <p className="state-label">Operasional</p>
          <h1>Private trip</h1>
          <p className="admin-subtitle">
            Kelola permintaan inkuiri perjalanan privat, pipeline penawaran, dan
            tindak lanjut pelanggan.
          </p>
        </div>
      </div>

      {/* KPI Stats & Pipeline Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          margin: '20px 0',
        }}
      >
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`admin-tab-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid var(--line)',
            background: statusFilter === 'ALL' ? 'var(--ink)' : 'white',
            color: statusFilter === 'ALL' ? 'white' : 'var(--ink)',
            fontWeight: 600,
            fontSize: '13px',
          }}
        >
          Semua ({inquiries.length})
        </button>
        {STATUS_OPTIONS.map((opt) => {
          const count = inquiries.filter((i) => i.status === opt.value).length;
          const isActive = statusFilter === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`admin-tab-btn ${isActive ? 'active' : ''}`}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: isActive ? opt.color : 'white',
                color: isActive ? 'white' : 'var(--ink)',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              {opt.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Cari nama, WhatsApp, nomor tiket, atau destinasi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            maxWidth: '480px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--line)',
            fontSize: '14px',
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="admin-secondary"
            style={{ padding: '8px 12px', fontSize: '13px' }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          className="admin-state"
          style={{ padding: '40px 20px', textAlign: 'center' }}
        >
          <p>Tidak ada data permintaan private trip yang sesuai filter.</p>
        </div>
      ) : (
        <div
          style={{
            overflowX: 'auto',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid var(--line)',
          }}
        >
          <table
            className="admin-table"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--paper)',
                  borderBottom: '1px solid var(--line)',
                  textAlign: 'left',
                }}
              >
                <th style={{ padding: '12px' }}>No. Tiket</th>
                <th style={{ padding: '12px' }}>Pelanggan</th>
                <th style={{ padding: '12px' }}>Destinasi</th>
                <th style={{ padding: '12px' }}>Rencana Tanggal</th>
                <th style={{ padding: '12px' }}>Peserta</th>
                <th style={{ padding: '12px' }}>Status Pipeline</th>
                <th style={{ padding: '12px' }}>Catatan Admin</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const dest =
                  item.mountain?.name ?? item.destinationOther ?? '-';
                const cleanPhone = item.whatsappNumber.replace(/[^0-9]/g, '');
                const waUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(
                  `Halo Kak ${item.customerName}, menindaklanjuti permintaan Private Trip ${dest} (No Tiket: ${item.inquiryNumber}) di Wildera Adventure...`,
                )}`;

                return (
                  <tr
                    key={item.id}
                    style={{ borderBottom: '1px solid var(--line)' }}
                  >
                    <td
                      style={{
                        padding: '12px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                      }}
                    >
                      {item.inquiryNumber}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {item.customerName}
                      </div>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#16a34a',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        💬 {item.whatsappNumber}
                      </a>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 500 }}>{dest}</div>
                      {item.meetingPointRequest && (
                        <div
                          style={{ fontSize: '11px', color: 'var(--muted)' }}
                        >
                          MP: {item.meetingPointRequest}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div>{item.preferredDate}</div>
                      {item.alternativeDate && (
                        <div
                          style={{ fontSize: '11px', color: 'var(--muted)' }}
                        >
                          Alt: {item.alternativeDate}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>
                      {item.participantCount} Orang
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        {getStatusBadge(item.status)}
                        {canManage && (
                          <select
                            value={item.status}
                            disabled={actionLoading}
                            onChange={(e) =>
                              handleQuickStatusChange(
                                item.id,
                                e.target.value as PrivateTripStatus,
                              )
                            }
                            style={{
                              fontSize: '11px',
                              padding: '2px 4px',
                              borderRadius: '4px',
                              border: '1px solid var(--line)',
                              background: 'white',
                            }}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                Ubah: {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px', maxWidth: '200px' }}>
                      {item.adminNotes ? (
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--ink)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={item.adminNotes}
                        >
                          {item.adminNotes}
                        </div>
                      ) : (
                        <span
                          style={{ fontSize: '11px', color: 'var(--muted)' }}
                        >
                          -
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="admin-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          Detail & Catatan
                        </button>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="admin-secondary"
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              color: '#dc2626',
                            }}
                            title="Hapus inkuiri"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail & Notes Modal */}
      {editModalOpen && selectedInquiry && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--line)',
                paddingBottom: '12px',
                marginBottom: '16px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px' }}>
                  Detail Permintaan Private Trip
                </h3>
                <span
                  style={{
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    color: 'var(--muted)',
                  }}
                >
                  {selectedInquiry.inquiryNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {feedback && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  background: feedback.type === 'error' ? '#fee2e2' : '#dcfce7',
                  color: feedback.type === 'error' ? '#991b1b' : '#166534',
                }}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSaveModal}>
              {/* Inquiry Details Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  background: 'var(--paper)',
                  padding: '12px',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <div style={{ color: 'var(--muted)' }}>Nama Pemesan:</div>
                  <div style={{ fontWeight: 'bold' }}>
                    {selectedInquiry.customerName}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)' }}>WhatsApp:</div>
                  <div>
                    <a
                      href={`https://wa.me/${selectedInquiry.whatsappNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#16a34a', textDecoration: 'none' }}
                    >
                      💬 {selectedInquiry.whatsappNumber}
                    </a>
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)' }}>Destinasi:</div>
                  <div style={{ fontWeight: 'bold' }}>
                    {selectedInquiry.mountain?.name ??
                      selectedInquiry.destinationOther ??
                      '-'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)' }}>Jumlah Peserta:</div>
                  <div style={{ fontWeight: 'bold' }}>
                    {selectedInquiry.participantCount} Orang
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)' }}>Tanggal Rencana:</div>
                  <div>{selectedInquiry.preferredDate}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)' }}>
                    Tanggal Alternatif:
                  </div>
                  <div>{selectedInquiry.alternativeDate ?? '-'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)' }}>Meeting Point:</div>
                  <div>{selectedInquiry.meetingPointRequest ?? '-'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)' }}>Estimasi Budget:</div>
                  <div>
                    {selectedInquiry.budget
                      ? `Rp ${selectedInquiry.budget.toLocaleString('id-ID')}`
                      : '-'}
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: 'var(--muted)' }}>Email Pemesan:</div>
                  <div>{selectedInquiry.email ?? '-'}</div>
                </div>
                {selectedInquiry.requirements && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ color: 'var(--muted)' }}>
                      Kebutuhan / Permintaan Khusus:
                    </div>
                    <div
                      style={{
                        background: 'white',
                        padding: '8px',
                        borderRadius: '6px',
                        marginTop: '4px',
                      }}
                    >
                      {selectedInquiry.requirements}
                    </div>
                  </div>
                )}
              </div>

              {/* Editable Fields */}
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}
                >
                  Status Pipeline CRM
                </label>
                <select
                  value={editStatus}
                  disabled={!canManage}
                  onChange={(e) =>
                    setEditStatus(e.target.value as PrivateTripStatus)
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontSize: '13px',
                  }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}
                >
                  Catatan Internal Admin (CRM)
                </label>
                <textarea
                  rows={4}
                  value={editNotes}
                  disabled={!canManage}
                  placeholder="Tuliskan perkembangan komunikasi, kesepakatan harga penawaran, nomor rekening tujuan DP, dll..."
                  onChange={(e) => setEditNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontSize: '13px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="admin-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Tutup
                </button>
                {canManage && (
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="admin-primary"
                    style={{ padding: '8px 16px' }}
                  >
                    {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
