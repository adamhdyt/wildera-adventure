import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminApi } from '../../../../lib/admin-session';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams.toString();
    const path = searchParams
      ? `admin/audit-logs?${searchParams}`
      : 'admin/audit-logs';
    const upstream = await fetchAdminApi(path);
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
