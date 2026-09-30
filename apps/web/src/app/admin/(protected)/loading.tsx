/* Keeps the sidebar and header on screen while a page's data loads. */
export default function ProtectedLoading() {
  return (
    <div className="admin-skeleton" role="status" aria-label="Memuat halaman">
      <span className="admin-skeleton-line admin-skeleton-title" />
      <span className="admin-skeleton-line" />
      <div className="admin-skeleton-grid">
        <span className="admin-skeleton-card" />
        <span className="admin-skeleton-card" />
        <span className="admin-skeleton-card" />
        <span className="admin-skeleton-card" />
      </div>
    </div>
  );
}
