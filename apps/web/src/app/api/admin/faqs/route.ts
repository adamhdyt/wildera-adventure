import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminApi } from '../../../../lib/admin-session';

function verifyOrigin(request: NextRequest): boolean {
  const origin = process.env.APP_URL;
  if (!origin) return true;
  const requestOrigin = request.headers.get('origin');
  if (!requestOrigin) return true;
  try {
    return requestOrigin === new URL(origin).origin;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const upstreamUrl = `admin/faqs?${searchParams.toString()}`;

  try {
    const upstream = await fetchAdminApi(upstreamUrl);
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

  let bodyData: unknown;
  try {
    bodyData = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Format data JSON tidak valid.',
        },
      },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetchAdminApi('admin/faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });
    const result = await upstream.json();
    return NextResponse.json(result, { status: upstream.status });
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
