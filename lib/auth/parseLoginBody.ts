import type { VercelRequest } from '@vercel/node';

export interface LoginRequestBody {
  username?: string;
  password?: string;
}

export function parseLoginJson(rawBody: string): {
  body: LoginRequestBody;
  malformed: boolean;
} {
  const trimmed = rawBody.trim();

  if (!trimmed) {
    return { body: {}, malformed: false };
  }

  try {
    const parsed = JSON.parse(trimmed) as LoginRequestBody;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { body: {}, malformed: true };
    }
    return { body: parsed, malformed: false };
  } catch {
    return { body: {}, malformed: true };
  }
}

export async function readLoginRequestBody(req: VercelRequest): Promise<string> {
  let rawBody: unknown;

  try {
    rawBody = req.body;
  } catch {
    return '';
  }

  if (typeof rawBody === 'string') {
    return rawBody;
  }

  if (Buffer.isBuffer(rawBody)) {
    return rawBody.toString('utf8');
  }

  if (rawBody && typeof rawBody === 'object') {
    return JSON.stringify(rawBody);
  }

  return await new Promise<string>(function (resolve, reject) {
    const chunks: Buffer[] = [];

    req.on('data', function (chunk: Buffer | string) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', function () {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', reject);
  });
}

export function parseLoginBody(req: VercelRequest): {
  body: LoginRequestBody;
  malformed: boolean;
} {
  let rawBody: unknown;

  try {
    rawBody = req.body;
  } catch {
    return { body: {}, malformed: true };
  }

  if (rawBody == null || rawBody === '') {
    return { body: {}, malformed: false };
  }

  if (typeof rawBody === 'string') {
    return parseLoginJson(rawBody);
  }

  if (Buffer.isBuffer(rawBody)) {
    return parseLoginJson(rawBody.toString('utf8'));
  }

  if (Array.isArray(rawBody)) {
    return { body: {}, malformed: true };
  }

  if (typeof rawBody === 'object') {
    return { body: rawBody as LoginRequestBody, malformed: false };
  }

  return { body: {}, malformed: true };
}
