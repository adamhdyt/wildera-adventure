import type { CookieOptions } from 'express';
import type { RuntimeEnvironment } from '../../common/config/environment';

export const SESSION_AUDIENCE = 'wildera-admin';
export const SESSION_COOKIE = 'wildera_admin_session';
export const SESSION_ISSUER = 'wildera-api';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export function sessionCookieOptions(
  environment: RuntimeEnvironment,
): CookieOptions {
  return {
    httpOnly: true,
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: '/',
    sameSite: 'lax',
    secure: environment === 'production' || environment === 'staging',
  };
}
