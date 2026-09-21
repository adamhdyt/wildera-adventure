/* Revalidate the complete admin shell when returning from a restricted page. */
/* eslint-disable @next/next/no-html-link-for-pages */
import { notFound } from 'next/navigation';
import { requireAdmin, fetchAdminApi } from '../../../../lib/admin-session';
import {
  adminSections,
  canViewSection,
} from '../../../../lib/admin-navigation';

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

  let tripCount = 0;
  let scheduleCount = 0;
  let bookingCount = 0;
  let inquiryCount = 0;

  if (slug === 'dashboard') {
    try {
      const [tripsRes, schedRes, bookRes, inqRes] = await Promise.all([
        fetchAdminApi('admin/trips?pageSize=1'),
        fetchAdminApi('admin/schedules?pageSize=1'),
        fetchAdminApi('admin/bookings?pageSize=1'),
        fetchAdminApi('admin/private-trip-inquiries?pageSize=1'),
      ]);
      if (tripsRes.ok) {
        const d = await tripsRes.json();
        tripCount = d.total ?? d.items?.length ?? 0;
      }
      if (schedRes.ok) {
        const d = await schedRes.json();
        scheduleCount = d.total ?? d.data?.length ?? 0;
      }
      if (bookRes.ok) {
        const d = await bookRes.json();
        bookingCount = d.total ?? d.items?.length ?? 0;
      }
      if (inqRes.ok) {
        const d = await inqRes.json();
        inquiryCount = d.total ?? d.data?.length ?? 0;
      }
    } catch {
      // Graceful fallback
    }
  }

  return (
    <>
      <div className="page-heading">
        <p className="section-label">{section.group}</p>
        <h1>{section.label}</h1>
        <p>{section.description}</p>
      </div>

      {slug === 'dashboard' ? (
        <div className="dashboard-overview" style={{ marginTop: '2rem' }}>
          <div className="admin-metrics-grid">
            <div className="metric-card">
              <span className="metric-title">Paket Trip</span>
              <span className="metric-value">{tripCount}</span>
              <span className="metric-subtext">Trip gunung terpublikasi</span>
            </div>
            <div className="metric-card">
              <span className="metric-title">Jadwal Keberangkatan</span>
              <span className="metric-value">{scheduleCount}</span>
              <span className="metric-subtext">Jadwal dengan kuota aktif</span>
            </div>
            <div className="metric-card">
              <span className="metric-title">Total Booking</span>
              <span className="metric-value">{bookingCount}</span>
              <span className="metric-subtext">
                Pesanan terdaftar di sistem
              </span>
            </div>
            <div className="metric-card">
              <span className="metric-title">Inquiry Private Trip</span>
              <span className="metric-value">{inquiryCount}</span>
              <span className="metric-subtext">Pengajuan kustom menunggu</span>
            </div>
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
              <div className="action-card" style={{ opacity: 0.85 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h3>Laporan Analitik</h3>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--muted, #64748b)',
                    }}
                  >
                    Belum tersedia
                  </span>
                </div>
                <p>
                  Rekonsiliasi transaksi pembayaran dan metrik konversi
                  otomatis.
                </p>
                <span
                  className="action-card-link"
                  style={{ color: 'var(--muted, #64748b)' }}
                >
                  Segera hadir
                </span>
              </div>
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
