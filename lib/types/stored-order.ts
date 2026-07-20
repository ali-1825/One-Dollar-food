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
  success: boolean;
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
