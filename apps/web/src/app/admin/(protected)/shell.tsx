'use client';

/* Full document navigation refreshes the session and role-based shell on each page. */
/* eslint-disable @next/next/no-html-link-for-pages */

import { useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  adminSections,
  canViewSection,
  roleLabel,
} from '../../../lib/admin-navigation';
import type { AdminUser } from '../../../lib/admin-session';

export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const menuButton = useRef<HTMLButtonElement>(null);
  const visible = adminSections.filter((section) =>
    canViewSection(user.roles, section),
  );
  const title =
    adminSections.find((section) => pathname === `/admin/${section.slug}`)
      ?.label ?? 'Admin';
  async function logout() {
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/admin/auth/logout', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('logout failed');
      window.location.replace('/admin/login');
    } catch {
      setPending(false);
      setError('Belum berhasil keluar. Coba lagi.');
    }
  }
  return (
    <div
      className="admin-shell"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <a className="admin-skip" href="#admin-main">
        Lewati navigasi
      </a>
      <aside className="admin-sidebar">
        <div className="sidebar-heading">
          <a href="/admin/dashboard" className="admin-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Wildera Logo" />
            <div>
              Wildera<span>Adventure · Admin</span>
            </div>
          </a>
          <button
            ref={menuButton}
            type="button"
            className="admin-menu"
            aria-expanded={open}
            aria-controls="admin-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? 'Tutup menu' : 'Menu'}
          </button>
        </div>
        <nav
          id="admin-navigation"
          aria-label="Navigasi admin"
          className={open ? 'admin-navigation is-open' : 'admin-navigation'}
        >
          {[...new Set(visible.map((section) => section.group))].map(
            (group) => (
              <div className="nav-group" key={group}>
                <p>{group}</p>
                {visible
                  .filter((section) => section.group === group)
                  .map((section) => (
                    <a
                      key={section.slug}
                      href={`/admin/${section.slug}`}
                      aria-current={
                        pathname === `/admin/${section.slug}`
                          ? 'page'
                          : undefined
                      }
                    >
                      {section.label}
                    </a>
                  ))}
              </div>
            ),
          )}
        </nav>
        <p className="sidebar-note">Ruang kerja tim perjalanan</p>
      </aside>
      <div className="admin-workspace">
        <header className="admin-header">
          <p>{title}</p>
          <div className="admin-account">
            <div>
              <strong>{user.name}</strong>
              <span>
                {user.roles.map(roleLabel).join(', ') || 'Tanpa role'}
              </span>
            </div>
            <button
              type="button"
              className="admin-secondary"
              disabled={pending}
              onClick={logout}
            >
              {pending ? 'Keluar…' : 'Keluar'}
            </button>
          </div>
        </header>
        {error && (
          <p className="admin-alert logout-error" role="alert">
            {error}
          </p>
        )}
        <main id="admin-main" tabIndex={-1} className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
