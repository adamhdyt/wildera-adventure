/* Revalidate the complete admin shell when returning from a restricted page. */
/* eslint-disable @next/next/no-html-link-for-pages */
import { notFound } from 'next/navigation';
import { requireAdmin } from '../../../../lib/admin-session';
import {
  bookingStatusOrder,
  loadDashboardData,
} from '../../../../lib/admin-dashboard';
import {
  adminSections,
  canViewSection,
} from '../../../../lib/admin-navigation';

const bookingStatusLabel = {
  INQUIRY: 'Inquiry',
  PENDING_CONFIRMATION: 'Menunggu konfirmasi',
  CONFIRMED: 'Terkonfirmasi',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  NO_SHOW: 'Tidak hadir',
} as const;

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const user = await requireAdmin();
  const { section: slug } = await params;
  const section = adminSections.find((item) => item.slug === slug);
  if (!section) notFound();
  if (!canViewSection(user.roles, section))
    return (
      <section className="admin-state">
        <p className="state-label">Akses dibatasi</p>
        <h1>Halaman ini tidak tersedia untuk role Anda.</h1>
        <p>
          Hubungi pengelola akun jika Anda membutuhkan akses ke{' '}
          {section.label.toLowerCase()}.
        </p>
        <a className="admin-secondary" href="/admin/dashboard">
          Kembali ke dashboard
        </a>
      </section>
    );

  const operational =
    user.roles.includes('SUPER_ADMIN') || user.roles.includes('OPERATIONS');
  const data =
    slug === 'dashboard' ? await loadDashboardData(operational) : null;

  return (
    <>
      <div className="page-heading">
        <p className="section-label">{section.group}</p>
        <h1>{section.label}</h1>
        <p>{section.description}</p>
      </div>

      {slug === 'dashboard' && data ? (
        <div className="dashboard-overview" style={{ marginTop: '1.5rem' }}>
          {data.failed && (
            <div className="alert-box alert-error">
              Sebagian data dashboard gagal dimuat. Muat ulang halaman untuk
              mencoba lagi.
            </div>
          )}
          <div className="admin-metrics-grid">
            <a href="/admin/trips" className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Paket Trip</span>
                <span className="metric-badge">Katalog</span>
              </div>
              <span className="metric-value">{data.tripCount}</span>
              <span className="metric-subtext">Trip terdaftar di katalog</span>
            </a>
            <a href="/admin/schedules" className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Jadwal Dibuka</span>
                <span className="metric-badge">Operasional</span>
              </div>
              <span className="metric-value">{data.openScheduleCount}</span>
              <span className="metric-subtext">Jadwal berstatus OPEN</span>
            </a>
            {operational && (
              <>
                <a href="/admin/bookings" className="metric-card accent-orange">
                  <div className="metric-header">
                    <span className="metric-title">Total Booking</span>
                    <span className="metric-badge badge-orange">Konversi</span>
                  </div>
                  <span className="metric-value">{data.bookingCount}</span>
                  <span className="metric-subtext">
                    {data.bookingsByStatus.PENDING_CONFIRMATION +
                      data.bookingsByStatus.INQUIRY}{' '}
                    menunggu konfirmasi
                  </span>
                </a>
                <a
                  href="/admin/private-trips"
                  className="metric-card accent-orange"
                >
                  <div className="metric-header">
                    <span className="metric-title">Inquiry Private</span>
                    <span className="metric-badge badge-orange">Kustom</span>
                  </div>
                  <span className="metric-value">{data.inquiryCount}</span>
                  <span className="metric-subtext">
                    {data.newInquiryCount} baru belum ditindaklanjuti
                  </span>
                </a>
              </>
            )}
            <a href="/admin/media" className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Media</span>
                <span className="metric-badge">Pustaka</span>
              </div>
              <span className="metric-value">{data.mediaCount}</span>
              <span className="metric-subtext">Foto tersimpan</span>
            </a>
          </div>

          <div className="dashboard-panels">
            {operational && (
              <section className="dashboard-panel">
                <h2>Status Booking</h2>
                {data.bookingCount === 0 ? (
                  <p className="panel-empty">Belum ada booking.</p>
                ) : (
                  <ul className="status-bars">
                    {bookingStatusOrder.map((status) => {
                      const count = data.bookingsByStatus[status];
                      const pct = Math.round((count / data.bookingCount) * 100);
                      return (
                        <li key={status}>
                          <span className="status-bar-label">
                            {bookingStatusLabel[status]}
                          </span>
                          <span className="status-bar-track">
                            <span
                              className={`status-bar-fill status-${status.toLowerCase()}`}
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                          <span className="status-bar-count">{count}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            <section className="dashboard-panel">
              <h2>Keberangkatan Mendatang</h2>
              {data.upcomingSchedules.length === 0 ? (
                <p className="panel-empty">
                  Belum ada jadwal terbuka yang akan datang.
                </p>
              ) : (
                <ul className="panel-list">
                  {data.upcomingSchedules.map((s) => (
                    <li key={s.id}>
                      <a href="/admin/schedules">
                        <strong>{s.trip?.name ?? 'Trip'}</strong>
                        <span>
                          {formatDate(s.startDate)} · {s.confirmedSeats ?? 0}/
                          {s.capacity} peserta
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {operational && (
              <section className="dashboard-panel dashboard-panel-wide">
                <h2>Booking Terbaru</h2>
                {data.recentBookings.length === 0 ? (
                  <p className="panel-empty">Belum ada booking masuk.</p>
                ) : (
                  <div className="table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>No. Booking</th>
                          <th>Kontak</th>
                          <th>Trip</th>
                          <th>Peserta</th>
                          <th>Status</th>
                          <th>Masuk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentBookings.map((b) => (
                          <tr key={b.id}>
                            <td>
                              <a href="/admin/bookings">{b.bookingNumber}</a>
                            </td>
                            <td>{b.contactName}</td>
                            <td>{b.schedule?.trip?.name ?? '—'}</td>
                            <td>{b.participantCount}</td>
                            <td>
                              <span className="badge badge-count">
                                {bookingStatusLabel[b.status]}
                              </span>
                            </td>
                            <td>{formatDate(b.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </div>

          <div>
            <h2 style={{ marginBottom: '1.25rem', marginTop: '1rem' }}>
              Aksi Cepat Manajemen
            </h2>
            <div className="dashboard-actions-grid">
              <a href="/admin/trips" className="action-card">
                <h3>Kelola Trip</h3>
                <p>
                  Tambah dan atur paket ekspedisi gunung, rute pendakian, dan
                  fasilitas.
                </p>
                <span className="action-card-link">Buka Modul Trip →</span>
              </a>
              <a href="/admin/schedules" className="action-card">
                <h3>Jadwal & Kuota</h3>
                <p>
                  Atur tanggal keberangkatan, batas kuota peserta, dan status
                  ketersediaan.
                </p>
                <span className="action-card-link">Buka Kelola Jadwal →</span>
              </a>
              <a href="/admin/bookings" className="action-card">
                <h3>Data Booking</h3>
                <p>
                  Verifikasi pembayaran WhatsApp, mutasi status, dan daftar
                  peserta.
                </p>
                <span className="action-card-link">Buka Data Booking →</span>
              </a>
              <a href="/admin/private-trips" className="action-card">
                <h3>Inquiry Private</h3>
                <p>
                  Tinjau permintaan private trip eksklusif dan kebutuhan
                  logistik khusus.
                </p>
                <span className="action-card-link">Tinjau Inquiry →</span>
              </a>
              <a href="/admin/settings" className="action-card">
                <h3>Pengaturan Situs</h3>
                <p>
                  Atur nomor WhatsApp resmi, email operasional, dan parameter
                  sistem.
                </p>
                <span className="action-card-link">Buka Pengaturan →</span>
              </a>
              <a href="/admin/audit-logs" className="action-card">
                <h3>Audit Logs</h3>
                <p>
                  Pantau rekam jejak aktivitas staf, mutasi data, dan kepatuhan
                  keamanan.
                </p>
                <span className="action-card-link">Lihat Log Audit →</span>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <section className="admin-state" aria-labelledby="module-state">
          <p className="state-label">Belum tersedia</p>
          <h2 id="module-state">
            Pengelolaan {section.label.toLowerCase()} sedang disiapkan.
          </h2>
          <p>Anda dapat kembali ke halaman ini ketika fitur sudah tersedia.</p>
          <a className="admin-secondary" href="/admin/dashboard">
            Kembali ke dashboard
          </a>
        </section>
      )}
    </>
  );
}
