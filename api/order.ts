import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processOrderNotifications } from '../lib/orders/processNotifications';
import { toStoredOrder } from '../lib/orders/toStoredOrder';
import { saveOrder, updateOrder } from '../lib/storage';
import type { OrderResponse } from '../lib/types/order';
import { isPayloadTooLarge, validateOrderPayload } from '../lib/validation/order';

function readRawBody(req: VercelRequest): string {
  if (typeof req.body === 'string') {
    return req.body;
  }

  if (req.body && typeof req.body === 'object') {
    return JSON.stringify(req.body);
  }

  return '';
}

function sendJson(res: VercelResponse, statusCode: number, payload: OrderResponse): void {
  res.setHeader('Cache-Control', 'no-store');
  res.status(statusCode).json(payload);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { success: false, error: 'Method not allowed.' });
    return;
  }

  const rawBody = readRawBody(req);
  if (isPayloadTooLarge(rawBody)) {
    sendJson(res, 413, { success: false, error: 'Order payload is too large.' });
    return;
  }

  const validation = validateOrderPayload(req.body);
  if (validation.error || !validation.order) {
    sendJson(res, 400, { success: false, error: validation.error || 'Invalid order.' });
    return;
  }

  const validated = validation.order;
  let storedOrder = toStoredOrder(validated, validated.source);

  try {
    storedOrder = await saveOrder(storedOrder);
  } catch (error) {
    console.error('[order] persistence failed', {
      orderId: validated.orderId,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    sendJson(res, 500, { success: false, error: 'Could not save your order. Please try again.' });
    return;
  }

  storedOrder = await processOrderNotifications(storedOrder, validated);

  try {
    storedOrder = await updateOrder(storedOrder);
  } catch (error) {
    console.error('[order] notification update failed', {
      orderId: storedOrder.id,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  sendJson(res, 200, {
    success: true,
    orderId: storedOrder.id,
    message: 'Your order has been received.'
  });
}
