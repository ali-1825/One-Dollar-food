import {
  appendRowToGoogleSheet,
  isGoogleSheetsServiceConfigured
} from '../services/googleSheetsService';
import type { StoredOrder } from '../types/stored-order';

export interface GoogleSheetsOrderRow {
  orderId: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  city: string;
  orderedItems: string;
  quantity: number;
  totalAmount: number;
  paymentMethod: string;
  orderStatus: string;
  date: string;
  time: string;
}

const KARACHI_TIME_ZONE = 'Asia/Karachi';

function splitAddress(address: string): { street: string; city: string } {
  const parts = address
    .split(',')
    .map(function (part) {
      return part.trim();
    })
    .filter(Boolean);

  if (parts.length >= 2) {
    return {
      street: parts.slice(0, -1).join(', '),
      city: parts[parts.length - 1]
    };
  }

  return {
    street: address,
    city: ''
  };
}

function formatOrderDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-GB', {
    timeZone: KARACHI_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatOrderTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('en-GB', {
    timeZone: KARACHI_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

export function isGoogleSheetsConfigured(): boolean {
  return isGoogleSheetsServiceConfigured();
}

export function formatOrderForGoogleSheets(order: StoredOrder): GoogleSheetsOrderRow {
  const addressParts = splitAddress(order.customer.address);
  const orderedItems = order.items
    .map(function (item) {
      return item.name;
    })
    .join(', ');
  const quantity = order.items.reduce(function (total, item) {
    return total + item.quantity;
  }, 0);

  return {
    orderId: order.id,
    customerName: order.customer.name,
    phoneNumber: order.customer.phone,
    address: addressParts.street,
    city: addressParts.city,
    orderedItems: orderedItems,
    quantity: quantity,
    totalAmount: order.total,
    paymentMethod: order.paymentMethod,
    orderStatus: order.status,
    date: formatOrderDate(order.createdAt),
    time: formatOrderTime(order.createdAt)
  };
}

export function formatOrderRowValues(order: StoredOrder): Array<string | number> {
  const row = formatOrderForGoogleSheets(order);

  return [
    row.orderId,
    row.customerName,
    row.phoneNumber,
    row.address,
    row.city,
    row.orderedItems,
    row.quantity,
    row.totalAmount,
    row.paymentMethod,
    row.orderStatus,
    row.date,
    row.time
  ];
}

export async function appendOrderToGoogleSheets(order: StoredOrder): Promise<{ ok: boolean; skipped: boolean }> {
  if (!isGoogleSheetsConfigured()) {
    return { ok: true, skipped: true };
  }

  try {
    await appendRowToGoogleSheet(formatOrderRowValues(order));
    console.info('[google-sheets] order appended', {
      orderId: order.id,
      status: order.status
    });
    return { ok: true, skipped: false };
  } catch (error) {
    console.error('[google-sheets] append failed', {
      orderId: order.id,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return { ok: false, skipped: false };
  }
}

/** @deprecated Use appendOrderToGoogleSheets for new integrations. */
export async function syncOrderToGoogleSheets(
  order: StoredOrder,
  _event: 'created' | 'updated'
): Promise<{ ok: boolean; skipped: boolean }> {
  return appendOrderToGoogleSheets(order);
}
