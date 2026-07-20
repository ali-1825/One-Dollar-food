import type { VercelRequest, VercelResponse } from '@vercel/node';
import { toAdminOrderDetail } from '../../../lib/admin/orders';
import { requireAdminSession } from '../../../lib/auth/requireAdmin';
import { getOrderById } from '../../../lib/storage';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed.' });
    return;
  }

  if (!requireAdminSession(req, res)) {
    return;
  }

  const orderId = typeof req.query.orderId === 'string' ? req.query.orderId : '';
  if (!orderId) {
    res.status(400).json({ success: false, error: 'Order ID is required.' });
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
}
