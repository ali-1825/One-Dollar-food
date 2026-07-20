import type { StoredOrder } from '../types/stored-order';

export type GoogleSheetsSyncEvent = 'created' | 'updated';

export interface GoogleSheetsOrderRow {
  orderId: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  customerName: string;
  phone: string;
  address: string;
  items: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  notes: string;
  source: string;
  businessWhatsApp: string;
  customerWhatsApp: string;
}

export function isGoogleSheetsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim());
}

export function formatOrderForGoogleSheets(order: StoredOrder): GoogleSheetsOrderRow {
  const items = order.items
    .map(function (item) {
      return item.quantity + ' x ' + item.name + ' @ PKR ' + item.unitPrice.toFixed(2);
    })
    .join('; ');

  return {
    orderId: order.id,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    status: order.status,
    customerName: order.customer.name,
    phone: order.customer.phone,
    address: order.customer.address,
    items: items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    paymentMethod: order.paymentMethod,
    notes: order.notes || '',
    source: order.source,
    businessWhatsApp: order.notifications.business.status,
    customerWhatsApp: order.notifications.customer.status
  };
}

export async function syncOrderToGoogleSheets(
  order: StoredOrder,
  event: GoogleSheetsSyncEvent
): Promise<{ ok: boolean; skipped: boolean }> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return { ok: true, skipped: true };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.GOOGLE_SHEETS_SECRET || '',
        event: event,
        order: formatOrderForGoogleSheets(order)
      })
    });

    if (!response.ok) {
      const message = await response.text().catch(function () {
        return '';
      });
      console.error('[google-sheets] sync failed', {
        orderId: order.id,
        event: event,
        statusCode: response.status,
        message: message.slice(0, 200)
      });
      return { ok: false, skipped: false };
    }

    console.info('[google-sheets] sync completed', {
      orderId: order.id,
      event: event,
      status: order.status
    });
    return { ok: true, skipped: false };
  } catch (error) {
    console.error('[google-sheets] sync error', {
      orderId: order.id,
      event: event,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return { ok: false, skipped: false };
  }
}
