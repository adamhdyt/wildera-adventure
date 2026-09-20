/* Revalidate the complete admin shell when returning from a restricted page. */
/* eslint-disable @next/next/no-html-link-for-pages */
import { notFound } from 'next/navigation';
import { requireAdmin } from '../../../../lib/admin-session';
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
  return (
    <>
      <div className="page-heading">
        <p className="section-label">{section.group}</p>
        <h1>{section.label}</h1>
        <p>{section.description}</p>
      </div>
      <section className="admin-state" aria-labelledby="module-state">
        <p className="state-label">Belum tersedia</p>
        <h2 id="module-state">
          {slug === 'dashboard'
            ? 'Ringkasan perjalanan belum tersedia.'
            : `Pengelolaan ${section.label.toLowerCase()} sedang disiapkan.`}
        </h2>
        <p>
          {slug === 'dashboard'
            ? 'Pilih bagian melalui menu admin. Data aktivitas akan ditampilkan setelah pengelolaan perjalanan tersedia.'
            : 'Anda dapat kembali ke halaman ini ketika fitur sudah tersedia.'}
        </p>
        {slug !== 'dashboard' && (
          <a className="admin-secondary" href="/admin/dashboard">
            Kembali ke dashboard
          </a>
        )}
      </section>
    </>
  );
}
