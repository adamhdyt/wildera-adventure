import { NextRequest, NextResponse } from 'next/server';
import { authUrl, sessionCookie } from '../../../../../lib/admin-session';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ action: string }> },
) {
  const { action } = await context.params;
  if (action !== 'login' && action !== 'logout')
    return new Response(null, { status: 404 });
  const origin = process.env.APP_URL;
  if (!origin || request.headers.get('origin') !== new URL(origin).origin) {
    return NextResponse.json(
      { message: 'Permintaan tidak diizinkan. Muat ulang halaman.' },
      { status: 403 },
    );
  }
  let body: string | undefined;
  if (action === 'login') {
    try {
      const input = await request.json();
      body = JSON.stringify({ email: input.email, password: input.password });
    } catch {
      return NextResponse.json(
        { message: 'Isi email dan kata sandi dengan benar.' },
        { status: 422 },
      );
    }
  }
  try {
    const token = request.cookies.get(sessionCookie)?.value;
    const upstream = await fetch(authUrl(action), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token
          ? { Cookie: `${sessionCookie}=${encodeURIComponent(token)}` }
          : {}),
      },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const expiredLogout = action === 'logout' && upstream.status === 401;
    const response =
      upstream.ok || expiredLogout
        ? new NextResponse(null, { status: 204 })
        : NextResponse.json(
            {
              message:
                upstream.status === 401
                  ? 'Email atau kata sandi salah, atau akun tidak aktif.'
                  : upstream.status === 422
                    ? 'Periksa kembali email dan kata sandi Anda.'
                    : 'Layanan admin belum dapat dihubungi. Coba lagi.',
            },
            { status: upstream.status },
          );
    response.headers.set('Cache-Control', 'no-store');
    const cookie = upstream.headers.get('set-cookie');
    if (cookie && upstream.ok) response.headers.set('Set-Cookie', cookie);
    if (expiredLogout)
      response.cookies.set(sessionCookie, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: new URL(origin).protocol === 'https:',
        path: '/',
        maxAge: 0,
      });
    return response;
  } catch {
    return NextResponse.json(
      { message: 'Layanan admin belum dapat dihubungi. Coba lagi.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
