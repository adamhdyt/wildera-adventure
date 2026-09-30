import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  agentRules: false,
  distDir: process.env.ADMIN_TEST_DATABASE ? '.next/playwright' : '.next',
  transpilePackages: ['@wildera/ui', '@wildera/types', '@wildera/validation'],
  async redirects() {
    return [
      {
        source: '/admin/destinasi',
        destination: '/admin/destinations',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    // Uploaded media is stored with an /api/v1/media/file/... URL; serve it
    // from the API so the same URL works on the public site and in admin.
    const apiBase = process.env.API_BASE_URL?.replace(/\/$/, '');
    if (!apiBase) return [];
    return [
      {
        source: '/api/v1/media/file/:path*',
        destination: `${apiBase}/media/file/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
