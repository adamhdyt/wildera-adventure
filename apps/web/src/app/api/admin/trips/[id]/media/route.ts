import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminApi } from '../../../../../../lib/admin-session';

function verifyOrigin(request: NextRequest): boolean {
  const origin = process.env.APP_URL;
  if (!origin) return false;
  const requestOrigin = request.headers.get('origin');
  if (!requestOrigin) return true;
  return requestOrigin === new URL(origin).origin;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await fetchAdminApi(`admin/trips/${id}/media`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    return NextResponse.json({ success: false, error }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyOrigin(request)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CSRF_DETECTED',
          message: 'Permintaan tidak sah dari origin lain.',
        },
      },
      { status: 403 },
    );
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Format payload request tidak valid.',
        },
      },
      { status: 400 },
    );
  }

  const res = await fetchAdminApi(`admin/trips/${id}/media`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
