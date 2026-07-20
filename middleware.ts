const SESSION_COOKIE_NAME = 'admin_session';

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

async function signPayload(payloadEncoded: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payloadEncoded)
  );
  return Buffer.from(signature).toString('base64url');
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
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

export async function verifyAdminSessionCookie(cookieHeader: string | null): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    return false;
  }

  const cookies = parseCookies(cookieHeader);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return false;
  }

  const [payloadEncoded, signature] = parts;
  const expectedSignature = await signPayload(payloadEncoded, secret);

  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < signature.length; index += 1) {
    mismatch |= signature.charCodeAt(index) ^ expectedSignature.charCodeAt(index);
  }

  if (mismatch !== 0) {
    return false;
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadEncoded)) as { exp?: number };
    return Boolean(payload.exp && payload.exp >= Math.floor(Date.now() / 1000));
  } catch {
    return false;
  }
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);

  if (url.pathname === '/admin/login' || url.pathname.startsWith('/admin/login/')) {
    return undefined;
  }

  const isProtectedPage =
    url.pathname === '/admin/orders' || url.pathname.startsWith('/admin/orders/');

  if (!isProtectedPage) {
    return undefined;
  }

  const authorized = await verifyAdminSessionCookie(request.headers.get('cookie'));
  if (authorized) {
    return undefined;
  }

  return Response.redirect(new URL('/admin/login', request.url), 302);
}

export const config = {
  matcher: ['/admin/orders', '/admin/orders/:path*']
};
