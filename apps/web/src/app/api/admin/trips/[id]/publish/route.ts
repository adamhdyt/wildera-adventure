import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminApi } from '../../../../../../lib/admin-session';

function verifyOrigin(request: NextRequest): boolean {
  const origin = process.env.APP_URL;
  if (!origin) return false;
  const requestOrigin = request.headers.get('origin');
  if (!requestOrigin) return true;
  return requestOrigin === new URL(origin).origin;
}

export async function POST(
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
  const res = await fetchAdminApi(`admin/trips/${id}/publish`, {
    method: 'POST',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    return NextResponse.json(error, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ success: true, data });
}
