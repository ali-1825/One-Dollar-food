export type NotificationStatus = 'sent' | 'failed' | 'not_configured';

export type OrderStatus = 'received' | 'confirmed' | 'cancelled';

export type OrderSource = 'checkout' | 'home-form';

export interface StoredOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface NotificationResult {
  status: NotificationStatus;
  providerMessageId?: string;
  error?: string;
}

export interface StoredOrder {
  id: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: StoredOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  notes?: string;
  status: OrderStatus;
  source: OrderSource;
  notifications: {
    business: NotificationResult;
    customer: NotificationResult;
  };
}

export function resolveNotificationStatus(notification: NotificationResult): NotificationStatus {
  if (notification.status) {
    return notification.status;
  }

  return 'failed';
}

export function createNotConfiguredNotification(): NotificationResult {
  return { status: 'not_configured' };
}

export function createSentNotification(providerMessageId?: string): NotificationResult {
  return {
    status: 'sent',
    providerMessageId
  };
}

export function createFailedNotification(error?: string): NotificationResult {
  return {
    status: 'failed',
    error: error || 'Delivery failed.'
  };
}
