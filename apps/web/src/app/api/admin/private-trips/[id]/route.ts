import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminApi } from '../../../../../lib/admin-session';

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
  const res = await fetchAdminApi(`admin/private-trip-inquiries/${id}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    return NextResponse.json({ success: false, error }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function PATCH(
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
          message: 'Body permintaan harus berupa JSON yang valid.',
        },
      },
      { status: 400 },
    );
  }

  const res = await fetchAdminApi(`admin/private-trip-inquiries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    return NextResponse.json({ success: false, error }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function DELETE(
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

  const res = await fetchAdminApi(`admin/private-trip-inquiries/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    return NextResponse.json({ success: false, error }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}
