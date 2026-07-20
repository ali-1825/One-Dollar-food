import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatOrderForGoogleSheets,
  isGoogleSheetsConfigured
} from '../lib/integrations/googleSheets';
import type { StoredOrder } from '../lib/types/stored-order';

const sampleOrder: StoredOrder = {
  id: 'ORD-20260720-TEST01',
  createdAt: '2026-07-20T10:00:00.000Z',
  updatedAt: '2026-07-20T10:05:00.000Z',
  customer: {
    name: 'Ali',
    phone: '03245972524',
    address: 'Karachi'
  },
  items: [
    {
      productId: 'double-dollar-smash',
      name: 'Double Dollar Smash',
      quantity: 2,
      unitPrice: 1,
      lineTotal: 2
    }
  ],
  subtotal: 2,
  deliveryFee: 0,
  total: 2,
  paymentMethod: 'Cash on Delivery',
  notes: 'Extra sauce',
  status: 'confirmed',
  source: 'checkout',
  notifications: {
    business: { status: 'not_configured' },
    customer: { status: 'not_configured' }
  }
};

test('google sheets sync is skipped when webhook is not configured', function () {
  delete process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  assert.equal(isGoogleSheetsConfigured(), false);
});

test('google sheets sync is enabled when webhook is configured', function () {
  process.env.GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/example/exec';
  assert.equal(isGoogleSheetsConfigured(), true);
  delete process.env.GOOGLE_SHEETS_WEBHOOK_URL;
});

test('formatOrderForGoogleSheets includes status and item summary', function () {
  const row = formatOrderForGoogleSheets(sampleOrder);

  assert.equal(row.orderId, 'ORD-20260720-TEST01');
  assert.equal(row.status, 'confirmed');
  assert.equal(row.customerName, 'Ali');
  assert.match(row.items, /2 x Double Dollar Smash/);
  assert.equal(row.notes, 'Extra sauce');
});

test('formatOrderForGoogleSheets does not expose secrets', function () {
  process.env.ADMIN_PASSWORD = 'secret-value';
  process.env.ADMIN_SESSION_SECRET = 'session-secret';

  const serialized = JSON.stringify(formatOrderForGoogleSheets(sampleOrder));
  assert.equal(serialized.includes('ADMIN_PASSWORD'), false);
  assert.equal(serialized.includes('secret-value'), false);
  assert.equal(serialized.includes('session-secret'), false);

  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_SESSION_SECRET;
});
