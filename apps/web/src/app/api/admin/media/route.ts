import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminApi } from '../../../../lib/admin-session';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const limit = searchParams.get('limit') || '20';
  const offset = searchParams.get('offset') || '0';

  const qs = new URLSearchParams();
  if (search) qs.set('search', search);
  qs.set('limit', limit);
  qs.set('offset', offset);

  const res = await fetchAdminApi(`admin/media?${qs.toString()}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    return NextResponse.json({ success: false, error }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
