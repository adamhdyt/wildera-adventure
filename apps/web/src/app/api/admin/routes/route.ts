import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminApi } from '../../../../lib/admin-session';

function verifyOrigin(request: NextRequest): boolean {
  const origin = process.env.APP_URL;
  if (!origin) return false;
  const requestOrigin = request.headers.get('origin');
  if (!requestOrigin) return true;
  return requestOrigin === new URL(origin).origin;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const path = queryString ? `admin/routes?${queryString}` : 'admin/routes';

    const response = await fetchAdminApi(path);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPSTREAM_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Gagal menghubungi server admin.',
        },
      },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!verifyOrigin(request)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Permintaan tidak diizinkan. Muat ulang halaman.',
        },
      },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const response = await fetchAdminApi('admin/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPSTREAM_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Gagal menghubungi server admin.',
        },
      },
      { status: 502 },
    );
  }
}
