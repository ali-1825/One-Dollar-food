import assert from 'node:assert/strict';
import test from 'node:test';
import { validateOrderPayload } from '../lib/validation/order';

test('validateOrderPayload rejects invalid orders', function () {
  const result = validateOrderPayload({
    customerName: '',
    phone: '03245972524',
    address: 'Test address',
    items: [{ id: 'double-dollar-smash', quantity: 1 }]
  });

  assert.equal(result.error, 'Customer name is required.');
});

test('validateOrderPayload stores server-calculated totals', function () {
  const result = validateOrderPayload({
    customerName: 'Test User',
    phone: '03245972524',
    address: 'Karachi',
    items: [
      { id: 'double-dollar-smash', quantity: 2 },
      { id: 'inferno-chicken', quantity: 1 }
    ],
    source: 'checkout'
  });

  assert.ok(result.order);
  assert.equal(result.order.totalPkr, 3);
  assert.equal(result.order.items[0].unitPricePkr, 1);
});

test('validateOrderPayload rejects honeypot submissions', function () {
  const result = validateOrderPayload({
    customerName: 'Bot',
    phone: '03245972524',
    address: 'Karachi',
    items: [{ id: 'double-dollar-smash', quantity: 1 }],
    _honeypot: 'spam'
  });

  assert.equal(result.error, 'Invalid submission.');
});
