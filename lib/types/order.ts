export interface OrderItemInput {
  id: string;
  quantity: number;
}

export interface OrderRequestPayload {
  customerName: string;
  phone: string;
  address: string;
  items: OrderItemInput[];
  paymentMethod?: string;
  notes?: string;
  source?: 'checkout' | 'home-form';
  _honeypot?: string;
}

export interface ValidatedOrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPricePkr: number;
  lineTotalPkr: number;
}

export interface ValidatedOrder {
  orderId: string;
  customerName: string;
  phone: string;
  normalizedPhone: string;
  address: string;
  items: ValidatedOrderItem[];
  totalPkr: number;
  paymentMethod: string;
  notes: string;
  source: 'checkout' | 'home-form';
}

export interface OrderSuccessResponse {
  success: true;
  orderId: string;
  message: string;
}

export interface OrderErrorResponse {
  success: false;
  error: string;
  orderId?: string;
}

export type OrderResponse = OrderSuccessResponse | OrderErrorResponse;
