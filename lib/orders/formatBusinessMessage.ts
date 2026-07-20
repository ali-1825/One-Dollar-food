import type { ValidatedOrder } from '../types/order';

export function formatBusinessOrderMessage(order: ValidatedOrder): string {
  const itemLines = order.items.map(function (item) {
    return `${item.quantity} × ${item.name}`;
  });

  return [
    'New Website Order',
    '',
    `Order ID: ${order.orderId}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}`,
    '',
    'Items:',
    ...itemLines,
    '',
    `Total: PKR ${order.totalPkr.toFixed(2)}`,
    `Payment: ${order.paymentMethod}`,
    `Notes: ${order.notes || 'None'}`
  ].join('\n');
}
