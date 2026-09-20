import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminApi } from '../../../../lib/admin-session';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const path = queryString
    ? `admin/private-trip-inquiries?${queryString}`
    : 'admin/private-trip-inquiries';

  const res = await fetchAdminApi(path);

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    return NextResponse.json({ success: false, error }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
