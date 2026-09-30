import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminApi } from '../../../../../lib/admin-session';

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

const forbidden = () =>
  NextResponse.json(
    {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Permintaan tidak diizinkan. Muat ulang halaman.',
      },
    },
    { status: 403 },
  );

const unavailable = () =>
  NextResponse.json(
    {
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Layanan admin backend tidak dapat dihubungi.',
      },
    },
    { status: 503 },
  );

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!verifyOrigin(request)) return forbidden();
  const { id } = await context.params;
  try {
    const body = await request.json();
    const upstream = await fetchAdminApi(
      `admin/media/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    return NextResponse.json(await upstream.json(), {
      status: upstream.status,
    });
  } catch {
    return unavailable();
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!verifyOrigin(request)) return forbidden();
  const { id } = await context.params;
  try {
    const upstream = await fetchAdminApi(
      `admin/media/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
    if (upstream.status === 204) return new NextResponse(null, { status: 204 });
    return NextResponse.json(await upstream.json(), {
      status: upstream.status,
    });
  } catch {
    return unavailable();
  }
}
