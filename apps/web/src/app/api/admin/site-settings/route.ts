import { NextResponse } from 'next/server';
import { fetchAdminApi } from '../../../../lib/admin-session';

export async function GET() {
  try {
    const upstream = await fetchAdminApi('admin/site-settings');
    const body = await upstream.json();
    return NextResponse.json(body, { status: upstream.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Layanan admin backend tidak dapat dihubungi.',
        },
      },
      { status: 503 },
    );
  }
}
