import type { StoredOrder } from '../types/stored-order';
import {
  getOrderByIdBlob,
  getOrdersBlob,
  saveOrderBlob,
  updateOrderBlob
} from './blob';
import { useBlobStorage } from './environment';
import {
  getOrderByIdLocal,
  getOrdersLocal,
  saveOrderLocal,
  updateOrderLocal
} from './local';

export async function saveOrder(order: StoredOrder): Promise<StoredOrder> {
  if (useBlobStorage()) {
    return saveOrderBlob(order);
  }

  return saveOrderLocal(order);
}

export async function getOrders(): Promise<StoredOrder[]> {
  if (useBlobStorage()) {
    return getOrdersBlob();
  }

  return getOrdersLocal();
}

export async function getOrderById(orderId: string): Promise<StoredOrder | null> {
  if (useBlobStorage()) {
    return getOrderByIdBlob(orderId);
  }

  return getOrderByIdLocal(orderId);
}

export async function updateOrder(order: StoredOrder): Promise<StoredOrder> {
  order.updatedAt = new Date().toISOString();

  if (useBlobStorage()) {
    return updateOrderBlob(order);
  }

  return updateOrderLocal(order);
}

export { getStorageMode } from './environment';
