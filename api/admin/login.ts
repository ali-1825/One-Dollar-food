import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  clearLoginAttempts,
  getClientIp,
  isLoginRateLimited,
  recordFailedLogin,
  validateAdminCredentials
} from '../../lib/auth/credentials';
import {
  buildSessionCookie,
  createSessionToken,
  isInsecureAdminEnabled
} from '../../lib/auth/session';
import { setNoStoreHeaders } from '../../lib/auth/requireAdmin';

function readBody(req: VercelRequest): { username?: string; password?: string } {
  if (req.body && typeof req.body === 'object') {
    return req.body as { username?: string; password?: string };
  }

  return {};
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setNoStoreHeaders(res);

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed.' });
    return;
  }

  const ip = getClientIp(req.headers);
  if (isLoginRateLimited(ip)) {
    res.status(429).json({ success: false, error: 'Invalid username or password.' });
    return;
  }

  const body = readBody(req);
  const username = String(body.username || '').trim();
  const password = String(body.password || '');

  if (!username || !password) {
    recordFailedLogin(ip);
    res.status(401).json({ success: false, error: 'Invalid username or password.' });
    return;
  }

  if (!validateAdminCredentials(username, password)) {
    recordFailedLogin(ip);
    res.status(401).json({ success: false, error: 'Invalid username or password.' });
    return;
  }

  const token = createSessionToken(username);
  if (!token) {
    res.status(500).json({ success: false, error: 'Admin session is not configured.' });
    return;
  }

  clearLoginAttempts(ip);
  res.setHeader('Set-Cookie', buildSessionCookie(token));
  res.status(200).json({
    success: true,
    insecureMode: isInsecureAdminEnabled()
  });
}
