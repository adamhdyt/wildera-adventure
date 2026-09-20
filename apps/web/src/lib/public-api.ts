import type {
  PublicContentPage,
  PublicDestination,
  PublicFaq,
  PublicMountainDetail,
  PublicMountainSummary,
  PublicSiteSettings,
  PublicTripDetail,
  PublicTripQuery,
  PublicTripSummary,
} from '@wildera/types';

export function publicApiUrl(path: string): string {
  const base = process.env.API_BASE_URL || 'http://127.0.0.1:3101/api/v1';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base.replace(/\/$/, '')}/${cleanPath}`;
}

export async function fetchPublicApi<T>(
  path: string,
  options?: RequestInit,
): Promise<T | null> {
  try {
    const res = await fetch(publicApiUrl(path), {
      ...options,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...options?.headers,
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data !== undefined ? json.data : json) as T;
  } catch {
    return null;
  }
}

export async function fetchPublicTrips(
  query?: PublicTripQuery,
): Promise<PublicTripSummary[]> {
  const searchParams = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.set(k, String(v));
      }
    });
  }
  const queryString = searchParams.toString();
  const path = queryString ? `trips?${queryString}` : 'trips';
  const data = await fetchPublicApi<PublicTripSummary[]>(path);
  return Array.isArray(data) ? data : [];
}

export async function fetchPublicTripDetail(
  slug: string,
): Promise<PublicTripDetail | null> {
  return fetchPublicApi<PublicTripDetail>(`trips/${encodeURIComponent(slug)}`);
}

export async function fetchPublicDestinations(): Promise<PublicDestination[]> {
  const data = await fetchPublicApi<PublicDestination[]>('destinations');
  return Array.isArray(data) ? data : [];
}

export async function fetchPublicMountains(): Promise<PublicMountainSummary[]> {
  const data = await fetchPublicApi<PublicMountainSummary[]>('mountains');
  return Array.isArray(data) ? data : [];
}

export async function fetchPublicMountainDetail(
  slug: string,
): Promise<PublicMountainDetail | null> {
  return fetchPublicApi<PublicMountainDetail>(
    `mountains/${encodeURIComponent(slug)}`,
  );
}

export async function fetchPublicFaqs(category?: string): Promise<PublicFaq[]> {
  const path = category
    ? `faqs?category=${encodeURIComponent(category)}`
    : 'faqs';
  const data = await fetchPublicApi<PublicFaq[]>(path);
  return Array.isArray(data) ? data : [];
}

export type { PublicContentPage } from '@wildera/types';

export async function fetchPublicSiteSettings(): Promise<PublicSiteSettings | null> {
  return fetchPublicApi<PublicSiteSettings>('site-settings/public');
}

export async function fetchPublicContentPage(
  slug: string,
): Promise<PublicContentPage | null> {
  return fetchPublicApi<PublicContentPage>(
    `content-pages/${encodeURIComponent(slug)}`,
  );
}
