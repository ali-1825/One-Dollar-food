import type { OrderSource } from '../types/stored-order';
import type { StoredOrder } from '../types/stored-order';
import type { ValidatedOrder } from '../types/order';

export function toStoredOrder(
  validated: ValidatedOrder,
  source: OrderSource
): StoredOrder {
  const now = new Date().toISOString();
  const subtotal = validated.items.reduce(function (sum, item) {
    return sum + item.lineTotalPkr;
  }, 0);
  const deliveryFee = 0;

  return {
    id: validated.orderId,
    createdAt: now,
    updatedAt: now,
    customer: {
      name: validated.customerName,
      phone: validated.phone,
      address: validated.address
    },
    items: validated.items.map(function (item) {
      return {
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPricePkr,
        lineTotal: item.lineTotalPkr
      };
    }),
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    paymentMethod: validated.paymentMethod,
    notes: validated.notes || undefined,
    status: 'received',
    source,
    notifications: {
      business: { success: false },
      customer: { success: false }
    }
  };
}
