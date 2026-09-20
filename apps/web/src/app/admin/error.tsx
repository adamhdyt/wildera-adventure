'use client';

export default function AdminError() {
  return (
    <main className="admin-state">
      <p className="state-label">Halaman belum dapat dimuat</p>
      <h1>Koneksi ke layanan admin bermasalah.</h1>
      <p>Coba muat ulang halaman dalam beberapa saat.</p>
      <button
        className="admin-primary"
        onClick={() => window.location.reload()}
      >
        Coba lagi
      </button>
    </main>
  );
}
