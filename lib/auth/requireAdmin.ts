import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionFromCookieHeader } from './session';

export function setNoStoreHeaders(res: VercelResponse): void {
  res.setHeader('Cache-Control', 'no-store');
}

export function requireAdminSession(req: VercelRequest, res: VercelResponse): boolean {
  setNoStoreHeaders(res);

  const session = getSessionFromCookieHeader(req.headers.cookie);
  if (!session) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return false;
  }

  return true;
}

export function getAuthenticatedUsername(req: VercelRequest): string | null {
  const session = getSessionFromCookieHeader(req.headers.cookie);
  return session?.username || null;
}
