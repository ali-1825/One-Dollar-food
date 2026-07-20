import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatOrderForGoogleSheets,
  isGoogleSheetsConfigured
} from '../lib/integrations/googleSheets';
import { isGoogleSheetsServiceConfigured } from '../lib/services/googleSheetsService';
import type { StoredOrder } from '../lib/types/stored-order';

const sampleOrder: StoredOrder = {
  id: 'ORD-20260720-TEST01',
  createdAt: '2026-07-20T10:00:00.000Z',
  updatedAt: '2026-07-20T10:05:00.000Z',
  customer: {
    name: 'Ali',
    phone: '03245972524',
    address: 'Block 5, Clifton, Karachi'
  },
  items: [
    {
      productId: 'double-dollar-smash',
      name: 'Double Dollar Smash',
      quantity: 2,
      unitPrice: 1,
      lineTotal: 2
    },
    {
      productId: 'inferno-chicken',
      name: 'Inferno Chicken',
      quantity: 1,
      unitPrice: 1,
      lineTotal: 1
    }
  ],
  subtotal: 3,
  deliveryFee: 0,
  total: 3,
  paymentMethod: 'Cash on Delivery',
  notes: 'Extra sauce',
  status: 'received',
  source: 'checkout',
  notifications: {
    business: { status: 'not_configured' },
    customer: { status: 'not_configured' }
  }
};

function clearGoogleSheetsEnv(): void {
  delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  delete process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  delete process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  delete process.env.GOOGLE_SHEETS_SHEET_NAME;
  delete process.env.GOOGLE_SHEETS_WEBHOOK_URL;
}

test('google sheets sync is skipped when service account is not configured', function () {
  clearGoogleSheetsEnv();
  assert.equal(isGoogleSheetsServiceConfigured(), false);
  assert.equal(isGoogleSheetsConfigured(), false);
});

test('google sheets sync is enabled when service account env vars exist', function () {
  clearGoogleSheetsEnv();
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID = 'sheet-id';
  process.env.GOOGLE_SHEETS_CLIENT_EMAIL = 'service-account@project.iam.gserviceaccount.com';
  process.env.GOOGLE_SHEETS_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----';

  assert.equal(isGoogleSheetsServiceConfigured(), true);
  assert.equal(isGoogleSheetsConfigured(), true);

  clearGoogleSheetsEnv();
});

test('formatOrderForGoogleSheets maps required columns', function () {
  const row = formatOrderForGoogleSheets(sampleOrder);

  assert.equal(row.orderId, 'ORD-20260720-TEST01');
  assert.equal(row.customerName, 'Ali');
  assert.equal(row.phoneNumber, '03245972524');
  assert.equal(row.address, 'Block 5, Clifton');
  assert.equal(row.city, 'Karachi');
  assert.equal(row.orderedItems, 'Double Dollar Smash, Inferno Chicken');
  assert.equal(row.quantity, 3);
  assert.equal(row.totalAmount, 3);
  assert.equal(row.paymentMethod, 'Cash on Delivery');
  assert.equal(row.orderStatus, 'received');
  assert.match(row.date, /^\d{2}\/\d{2}\/\d{4}$/);
  assert.match(row.time, /^\d{2}:\d{2}:\d{2}$/);
});

test('formatOrderForGoogleSheets does not expose secrets', function () {
  process.env.ADMIN_PASSWORD = 'secret-value';
  process.env.GOOGLE_SHEETS_PRIVATE_KEY = 'private-key-value';

  const serialized = JSON.stringify(formatOrderForGoogleSheets(sampleOrder));
  assert.equal(serialized.includes('secret-value'), false);
  assert.equal(serialized.includes('private-key-value'), false);

  delete process.env.ADMIN_PASSWORD;
  delete process.env.GOOGLE_SHEETS_PRIVATE_KEY;
});
