import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminApi } from '../../../../../../lib/admin-session';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await fetchAdminApi(`admin/schedules/${id}/manifest`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    return NextResponse.json({ success: false, error }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
