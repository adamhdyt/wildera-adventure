/* Returning to the dashboard also revalidates the session and navigation roles. */
/* eslint-disable @next/next/no-html-link-for-pages */
export default function AdminNotFound() {
  return (
    <main className="admin-state">
      <h1>Halaman admin tidak ditemukan.</h1>
      <p>Periksa alamat halaman atau kembali ke ruang kerja.</p>
      <a className="admin-secondary" href="/admin/dashboard">
        Kembali ke dashboard
      </a>
    </main>
  );
}
