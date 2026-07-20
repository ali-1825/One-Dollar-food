import type { VercelRequest } from '@vercel/node';

export interface LoginRequestBody {
  username?: string;
  password?: string;
}

export function parseLoginBody(req: VercelRequest): {
  body: LoginRequestBody;
  malformed: boolean;
} {
  const rawBody = req.body;

  if (rawBody == null || rawBody === '') {
    return { body: {}, malformed: false };
  }

  if (typeof rawBody === 'string') {
    try {
      const parsed = JSON.parse(rawBody) as LoginRequestBody;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { body: {}, malformed: true };
      }
      return { body: parsed, malformed: false };
    } catch {
      return { body: {}, malformed: true };
    }
  }

  if (typeof rawBody === 'object') {
    return { body: rawBody as LoginRequestBody, malformed: false };
  }

  return { body: {}, malformed: true };
}
