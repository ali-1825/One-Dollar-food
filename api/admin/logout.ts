import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildClearSessionCookie } from '../../lib/auth/session';
import { setNoStoreHeaders } from '../../lib/auth/requireAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setNoStoreHeaders(res);

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed.' });
    return;
  }

  res.setHeader('Set-Cookie', buildClearSessionCookie());
  res.status(200).json({ success: true });
}
