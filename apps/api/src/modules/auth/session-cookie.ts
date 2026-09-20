import { SESSION_COOKIE } from './session.constants';

export function readSessionCookie(cookieHeader: string | undefined) {
  if (!cookieHeader) return undefined;
  for (const pair of cookieHeader.split(';')) {
    const separator = pair.indexOf('=');
    if (separator < 0) continue;
    const name = pair.slice(0, separator).trim();
    if (name !== SESSION_COOKIE) continue;
    const value = pair.slice(separator + 1).trim();
    if (!value) return undefined;
    try {
      return decodeURIComponent(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
}
