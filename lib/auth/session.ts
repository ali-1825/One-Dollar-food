import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

interface SessionPayload {
  username: string;
  exp: number;
}

function getSessionSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || null;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(payloadEncoded: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadEncoded).digest('base64url');
}

export function createSessionToken(username: string): string | null {
  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }

  const payload: SessionPayload = {
    username,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  };
  const payloadEncoded = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadEncoded, secret);
  return `${payloadEncoded}.${signature}`;
}

export function verifySessionToken(token: string | null | undefined): SessionPayload | null {
  if (!token) {
    return null;
  }

  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payloadEncoded, signature] = parts;
  const expectedSignature = signPayload(payloadEncoded, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadEncoded)) as SessionPayload;

    if (!payload.username || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce(function (cookies, part) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) {
      return cookies;
    }

    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {} as Record<string, string>);
}

export function getSessionFromCookieHeader(cookieHeader: string | undefined): SessionPayload | null {
  const cookies = parseCookieHeader(cookieHeader);
  return verifySessionToken(cookies[SESSION_COOKIE_NAME]);
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function buildSessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`
  ];

  if (secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function buildClearSessionCookie(): string {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ];

  if (secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function isInsecureAdminEnabled(): boolean {
  return process.env.ALLOW_INSECURE_ADMIN === 'true';
}
