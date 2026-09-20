import { NextRequest, NextResponse } from 'next/server';
import { publicApiUrl } from '../../../lib/public-api';

export async function POST(request: NextRequest) {
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

  try {
    const res = await fetch(publicApiUrl('private-trip-inquiries'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true, ...data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BACKEND_ERROR',
          message: 'Gagal menghubungi server.',
          detail: err instanceof Error ? err.message : String(err),
        },
      },
      { status: 500 },
    );
  }
}
