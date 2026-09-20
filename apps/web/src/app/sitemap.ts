import type { MetadataRoute } from 'next';
import { fetchPublicTrips, fetchPublicMountains } from '../lib/public-api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wildera.id';

  const [trips, mountains] = await Promise.all([
    fetchPublicTrips().catch(() => []),
    fetchPublicMountains().catch(() => []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/trip`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gunung`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/private-trip`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tentang`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cancellation`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/safety`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  // Dynamic published trips
  const tripEntries: MetadataRoute.Sitemap = (trips || [])
    .filter((t) => Boolean(t.slug))
    .map((t) => ({
      url: `${baseUrl}/trip/${t.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

  // Dynamic mountains
  const mountainEntries: MetadataRoute.Sitemap = (mountains || [])
    .filter((m) => Boolean(m.slug))
    .map((m) => ({
      url: `${baseUrl}/gunung/${m.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.75,
    }));

  return [...staticEntries, ...tripEntries, ...mountainEntries];
}
