import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { getOrderById, getOrders, saveOrder, updateOrder } from '../lib/storage';
import type { StoredOrder } from '../lib/types/stored-order';

function buildOrder(id: string): StoredOrder {
  const now = new Date().toISOString();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    customer: {
      name: 'Test User',
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
    status: 'received',
    source: 'checkout',
    notifications: {
      business: { status: 'failed', error: 'failed' },
      customer: { status: 'failed', error: 'failed' }
    }
  };
}

test('local storage saves and reads orders', async function (t) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'orders-test-'));
  process.env.TEST_ORDERS_DIR = tempDir;
  delete process.env.VERCEL_ENV;
  delete process.env.BLOB_READ_WRITE_TOKEN;

  t.after(async function () {
    delete process.env.TEST_ORDERS_DIR;
    await rm(tempDir, { recursive: true, force: true });
  });

  const order = buildOrder('ORD-20260720-TEST01');
  await saveOrder(order);

  const saved = await getOrderById(order.id);
  assert.ok(saved);
  assert.equal(saved.total, 2);

  const orders = await getOrders();
  assert.equal(orders.length, 1);
});

test('failed WhatsApp notifications do not remove saved orders', async function (t) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'orders-test-'));
  process.env.TEST_ORDERS_DIR = tempDir;
  delete process.env.VERCEL_ENV;
  delete process.env.BLOB_READ_WRITE_TOKEN;

  t.after(async function () {
    delete process.env.TEST_ORDERS_DIR;
    await rm(tempDir, { recursive: true, force: true });
  });

  const order = buildOrder('ORD-20260720-TEST02');
  await saveOrder(order);

  order.notifications.business = { status: 'failed', error: 'failed' };
  order.notifications.customer = { status: 'failed', error: 'failed' };
  await updateOrder(order);

  const saved = await getOrderById(order.id);
  assert.ok(saved);
  assert.equal(saved.notifications.business.status, 'failed');
});
