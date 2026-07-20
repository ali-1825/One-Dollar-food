import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { isValidOrderStatus, orderRequiresAttention, summarizeOrders } from '../lib/admin/orders';
import { processOrderNotifications } from '../lib/orders/processNotifications';
import { toStoredOrder } from '../lib/orders/toStoredOrder';
import { saveOrder, updateOrder } from '../lib/storage';
import { isWhatsAppConfigured } from '../lib/services/whatsapp';
import { validateOrderPayload } from '../lib/validation/order';

test('order submission succeeds when WhatsApp is not configured', async function () {
  delete process.env.WHATSAPP_ACCESS_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  delete process.env.BUSINESS_WHATSAPP_NUMBER;
  delete process.env.WHATSAPP_CUSTOMER_TEMPLATE_NAME;

  assert.equal(isWhatsAppConfigured(), false);

  const validation = validateOrderPayload({
    customerName: 'Test User',
    phone: '03245972524',
    address: 'Karachi',
    items: [{ id: 'double-dollar-smash', quantity: 1 }],
    source: 'checkout'
  });

  assert.ok(validation.order);
  let storedOrder = toStoredOrder(validation.order!, 'checkout');
  storedOrder = await processOrderNotifications(storedOrder, validation.order!);

  assert.equal(storedOrder.notifications.business.status, 'not_configured');
  assert.equal(storedOrder.notifications.customer.status, 'not_configured');
});

test('notification status becomes not_configured and does not fail the order flow', async function () {
  delete process.env.WHATSAPP_ACCESS_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;

  const validation = validateOrderPayload({
    customerName: 'Test User',
    phone: '03245972524',
    address: 'Karachi',
    items: [{ id: 'double-dollar-smash', quantity: 1 }]
  });

  let storedOrder = toStoredOrder(validation.order!, 'checkout');
  storedOrder = await processOrderNotifications(storedOrder, validation.order!);

  assert.equal(storedOrder.notifications.business.status, 'not_configured');
  assert.notEqual(storedOrder.notifications.business.status, 'failed');
});

test('orders requiring attention ignore not_configured notifications', function () {
  const summary = summarizeOrders([
    {
      id: 'ORD-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customer: { name: 'A', phone: '1', address: 'B' },
      items: [],
      subtotal: 1,
      deliveryFee: 0,
      total: 1,
      paymentMethod: 'Cash on Delivery',
      status: 'received',
      source: 'checkout',
      notifications: {
        business: { status: 'not_configured' },
        customer: { status: 'not_configured' }
      }
    }
  ]);

  assert.equal(summary.ordersRequiringAttention, 0);
  assert.equal(orderRequiresAttention({
    id: 'ORD-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customer: { name: 'A', phone: '1', address: 'B' },
    items: [],
    subtotal: 1,
    deliveryFee: 0,
    total: 1,
    paymentMethod: 'Cash on Delivery',
    status: 'received',
    source: 'checkout',
    notifications: {
      business: { status: 'not_configured' },
      customer: { status: 'not_configured' }
    }
  }), false);
});

test('admin status updates persist locally', async function (t) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'orders-test-'));
  process.env.TEST_ORDERS_DIR = tempDir;
  delete process.env.VERCEL_ENV;
  delete process.env.BLOB_READ_WRITE_TOKEN;

  t.after(async function () {
    delete process.env.TEST_ORDERS_DIR;
    await rm(tempDir, { recursive: true, force: true });
  });

  const validation = validateOrderPayload({
    customerName: 'Status Test',
    phone: '03245972524',
    address: 'Karachi',
    items: [{ id: 'double-dollar-smash', quantity: 1 }]
  });

  let storedOrder = toStoredOrder(validation.order!, 'checkout');
  storedOrder = await saveOrder(storedOrder);
  storedOrder.status = 'confirmed';
  storedOrder.updatedAt = new Date().toISOString();
  storedOrder = await updateOrder(storedOrder);

  const saved = await saveOrder(storedOrder);
  assert.equal(saved.status, 'confirmed');
});

test('invalid status updates are rejected', function () {
  assert.equal(isValidOrderStatus('confirmed'), true);
  assert.equal(isValidOrderStatus('shipped'), false);
});
