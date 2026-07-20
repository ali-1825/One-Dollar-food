import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  clearLoginAttempts,
  getClientIp,
  isLoginRateLimited,
  recordFailedLogin,
  validateAdminCredentials
} from '../../lib/auth/credentials';
import {
  parseLoginJson,
  readLoginRequestBody
} from '../../lib/auth/parseLoginBody';
import { setNoStoreHeaders } from '../../lib/auth/requireAdmin';
import {
  buildSessionCookie,
  createSessionToken,
  isInsecureAdminEnabled
} from '../../lib/auth/session';

function sendLoginError(
  res: VercelResponse,
  statusCode: number,
  branch: string,
  message: string
): void {
  console.info('[admin-login] completed', { branch, statusCode });
  res.status(statusCode).json({ success: false, error: message });
}

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setNoStoreHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    sendLoginError(res, 405, 'method-not-allowed', 'Method not allowed.');
    return;
  }

  try {
    const ip = getClientIp(req.headers);

    if (isLoginRateLimited(ip)) {
      sendLoginError(res, 401, 'rate-limited', 'Invalid username or password.');
      return;
    }

    const rawBody = await readLoginRequestBody(req);
    const parsed = parseLoginJson(rawBody);
    if (parsed.malformed) {
      sendLoginError(res, 400, 'malformed-body', 'Invalid login request.');
      return;
    }

    const username = String(parsed.body.username || '').trim();
    const password = String(parsed.body.password || '');

    if (!username || !password) {
      recordFailedLogin(ip);
      sendLoginError(res, 400, 'missing-credentials', 'Invalid login request.');
      return;
    }

    if (!validateAdminCredentials(username, password)) {
      recordFailedLogin(ip);
      sendLoginError(res, 401, 'invalid-credentials', 'Invalid username or password.');
      return;
    }

    const token = createSessionToken(username);
    if (!token) {
      sendLoginError(res, 500, 'session-not-configured', 'Admin session is not configured.');
      return;
    }

    clearLoginAttempts(ip);
    res.setHeader('Set-Cookie', buildSessionCookie(token));
    console.info('[admin-login] completed', { branch: 'success', statusCode: 200 });
    res.status(200).json({
      success: true,
      insecureMode: isInsecureAdminEnabled()
    });
  } catch (error) {
    console.error('[admin-login] unexpected error', {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    sendLoginError(res, 500, 'unexpected-error', 'Admin login is temporarily unavailable.');
  }
}
