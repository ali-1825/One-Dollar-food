import type { StoredOrder } from '../types/stored-order';

export interface AdminOrderSummary {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  itemCount: number;
  itemSummary: string;
  total: number;
  paymentMethod: string;
  status: StoredOrder['status'];
  businessWhatsApp: boolean;
  customerWhatsApp: boolean;
}

export function toAdminOrderSummary(order: StoredOrder): AdminOrderSummary {
  const itemSummary = order.items
    .map(function (item) {
      return `${item.quantity} × ${item.name}`;
    })
    .join(', ');

  return {
    id: order.id,
    createdAt: order.createdAt,
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    itemCount: order.items.reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0),
    itemSummary,
    total: order.total,
    paymentMethod: order.paymentMethod,
    status: order.status,
    businessWhatsApp: order.notifications.business.success,
    customerWhatsApp: order.notifications.customer.success
  };
}

export function toAdminOrderDetail(order: StoredOrder): StoredOrder {
  return order;
}

export function filterOrders(
  orders: StoredOrder[],
  options: { search?: string; status?: string }
): StoredOrder[] {
  const search = (options.search || '').trim().toLowerCase();
  const status = (options.status || '').trim().toLowerCase();

  return orders.filter(function (order) {
    const matchesStatus = !status || order.status === status;
    if (!matchesStatus) {
      return false;
    }

    if (!search) {
      return true;
    }

    return (
      order.id.toLowerCase().includes(search) ||
      order.customer.name.toLowerCase().includes(search) ||
      order.customer.phone.toLowerCase().includes(search)
    );
  });
}

export function summarizeOrders(orders: StoredOrder[]): {
  totalOrders: number;
  ordersToday: number;
  totalValue: number;
  whatsAppFailures: number;
} {
  const today = new Date().toISOString().slice(0, 10);

  return orders.reduce(
    function (summary, order) {
      summary.totalOrders += 1;
      summary.totalValue += order.total;

      if (order.createdAt.slice(0, 10) === today) {
        summary.ordersToday += 1;
      }

      if (!order.notifications.business.success || !order.notifications.customer.success) {
        summary.whatsAppFailures += 1;
      }

      return summary;
    },
    {
      totalOrders: 0,
      ordersToday: 0,
      totalValue: 0,
      whatsAppFailures: 0
    }
  );
}
