import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminApi } from '../../../../../lib/admin-session';

function verifyOrigin(request: NextRequest): boolean {
  const origin = process.env.APP_URL;
  if (!origin) return false;
  const requestOrigin = request.headers.get('origin');
  if (!requestOrigin) return true;
  return requestOrigin === new URL(origin).origin;
}

export async function POST(request: NextRequest) {
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

  const contentType = request.headers.get('content-type') || '';

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const altText = (formData.get('altText') as string) || '';

      if (!file) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FILE_REQUIRED',
              message: 'Berkas gambar wajib diunggah.',
            },
          },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const res = await fetchAdminApi('admin/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          contentBase64: buffer.toString('base64'),
          altText,
        }),
      });

      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const body = await request.json();
    const res = await fetchAdminApi('admin/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Gagal memproses unggahan gambar.',
        },
      },
      { status: 500 },
    );
  }
}
