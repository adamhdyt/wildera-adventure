import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const sessionCookie = 'wildera_admin_session';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export function authUrl(action: string) {
  const base = process.env.API_BASE_URL;
  if (!base) throw new Error('API_BASE_URL is required');
  return `${base.replace(/\/$/, '')}/auth/${action}`;
}

export function adminApiUrl(path: string) {
  const base = process.env.API_BASE_URL;
  if (!base) throw new Error('API_BASE_URL is required');
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base.replace(/\/$/, '')}/${cleanPath}`;
}

export async function fetchAdminApi(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = (await cookies()).get(sessionCookie)?.value;
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Cookie', `${sessionCookie}=${encodeURIComponent(token)}`);
  }
  return fetch(adminApiUrl(path), {
    ...init,
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
}

export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;
  const response = await fetch(authUrl('me'), {
    headers: { Cookie: `${sessionCookie}=${encodeURIComponent(token)}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Admin session service unavailable');
  const body = await response.json();
  return body.data;
});

export async function requireAdmin() {
  const user = await getAdmin();
  if (!user) redirect('/admin/login');
  return user;
}
