import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearLoginAttempts,
  getClientIp,
  isLoginRateLimited,
  recordFailedLogin,
  validateAdminCredentials
} from '../lib/auth/credentials';
import {
  createSessionToken,
  getSessionFromCookieHeader,
  verifySessionToken
} from '../lib/auth/session';
import { getStorageMode, useBlobStorage } from '../lib/storage/environment';

test('valid admin credentials create a verifiable session', function () {
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'admin';
  process.env.ADMIN_SESSION_SECRET = 'test-secret-value-for-session-signing';
  process.env.ALLOW_INSECURE_ADMIN = 'true';

  assert.equal(validateAdminCredentials('admin', 'admin'), true);

  const token = createSessionToken('admin');
  assert.ok(token);

  const session = verifySessionToken(token);
  assert.equal(session?.username, 'admin');
});

test('invalid admin credentials do not create a valid session', function () {
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'admin';
  process.env.ADMIN_SESSION_SECRET = 'test-secret-value-for-session-signing';
  process.env.ALLOW_INSECURE_ADMIN = 'true';

  assert.equal(validateAdminCredentials('admin', 'wrong-password'), false);
  assert.equal(verifySessionToken('invalid.token.value'), null);
});

test('missing session cookie is rejected', function () {
  process.env.ADMIN_SESSION_SECRET = 'test-secret-value-for-session-signing';
  assert.equal(getSessionFromCookieHeader(undefined), null);
});

test('login throttling blocks repeated failures', function () {
  const ip = getClientIp({ 'x-forwarded-for': '203.0.113.10' });
  clearLoginAttempts(ip);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    recordFailedLogin(ip);
  }

  assert.equal(isLoginRateLimited(ip), true);
  clearLoginAttempts(ip);
});

test('production storage uses blob mode when configured', function () {
  process.env.VERCEL_ENV = 'production';
  process.env.BLOB_READ_WRITE_TOKEN = 'blob-token-placeholder';

  assert.equal(useBlobStorage(), true);
  assert.equal(getStorageMode(), 'blob');

  delete process.env.VERCEL_ENV;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  assert.equal(useBlobStorage(), false);
  assert.equal(getStorageMode(), 'local');
});

test('admin/admin is rejected when ALLOW_INSECURE_ADMIN=false', function () {
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'admin';
  process.env.ALLOW_INSECURE_ADMIN = 'false';

  assert.equal(validateAdminCredentials('admin', 'admin'), false);
});

test('configured production credentials work when insecure mode is disabled', function () {
  process.env.ADMIN_USERNAME = 'dashboard-admin';
  process.env.ADMIN_PASSWORD = 'StrongPassword123!';
  process.env.ALLOW_INSECURE_ADMIN = 'false';

  assert.equal(validateAdminCredentials('dashboard-admin', 'StrongPassword123!'), true);
  assert.equal(validateAdminCredentials('admin', 'admin'), false);
});

test('order listing shape does not expose secrets', function () {
  const order = {
    id: 'ORD-20260720-TEST03',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customer: { name: 'Test', phone: '03245972524', address: 'Karachi' },
    items: [],
    subtotal: 1,
    deliveryFee: 0,
    total: 1,
    paymentMethod: 'Cash on Delivery',
    status: 'received' as const,
    source: 'checkout' as const,
    notifications: {
      business: { status: 'not_configured' as const },
      customer: { status: 'not_configured' as const }
    }
  };

  const serialized = JSON.stringify(order);
  assert.equal(serialized.includes('WHATSAPP_ACCESS_TOKEN'), false);
  assert.equal(serialized.includes('ADMIN_SESSION_SECRET'), false);
});
