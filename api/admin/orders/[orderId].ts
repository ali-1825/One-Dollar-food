import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isValidOrderStatus, toAdminOrderDetail } from '../../../lib/admin/orders';
import { requireAdminSession } from '../../../lib/auth/requireAdmin';
import { syncOrderToGoogleSheets } from '../../../lib/integrations/googleSheets';
import { getOrderById, updateOrder } from '../../../lib/storage';
import type { OrderStatus } from '../../../lib/types/stored-order';

function readBody(req: VercelRequest): { status?: string } {
  if (req.body && typeof req.body === 'object') {
    return req.body as { status?: string };
  }

  return {};
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const orderId = typeof req.query.orderId === 'string' ? req.query.orderId : '';
  if (!orderId) {
    res.status(400).json({ success: false, error: 'Order ID is required.' });
    return;
  }

  if (req.method === 'GET') {
    if (!requireAdminSession(req, res)) {
      return;
    }

    try {
      const order = await getOrderById(orderId);
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        order: toAdminOrderDetail(order)
      });
    } catch (error) {
      console.error('[admin] failed to load order', {
        orderId,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({ success: false, error: 'Could not load order.' });
    }
    return;
  }

  if (req.method === 'PATCH') {
    if (!requireAdminSession(req, res)) {
      return;
    }

    const requestedStatus = String(readBody(req).status || '').trim();
    if (!isValidOrderStatus(requestedStatus)) {
      res.status(400).json({ success: false, error: 'Invalid order status.' });
      return;
    }

    try {
      const order = await getOrderById(orderId);
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found.' });
        return;
      }

      order.status = requestedStatus as OrderStatus;
      order.updatedAt = new Date().toISOString();
      const updated = await updateOrder(order);
      await syncOrderToGoogleSheets(updated, 'updated');

      res.status(200).json({
        success: true,
        order: toAdminOrderDetail(updated)
      });
    } catch (error) {
      console.error('[admin] failed to update order status', {
        orderId,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({ success: false, error: 'Could not update order status.' });
    }
    return;
  }

  res.status(405).json({ success: false, error: 'Method not allowed.' });
}
