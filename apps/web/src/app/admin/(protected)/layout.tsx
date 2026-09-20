import type { ReactNode } from 'react';
import { requireAdmin } from '../../../lib/admin-session';
import { AdminShell } from './shell';

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdmin();
  return <AdminShell user={user}>{children}</AdminShell>;
}
