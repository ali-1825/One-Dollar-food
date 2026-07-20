import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  filterOrders,
  summarizeOrders,
  toAdminOrderSummary
} from '../../lib/admin/orders';
import { isInsecureAdminEnabled } from '../../lib/auth/session';
import { requireAdminSession } from '../../lib/auth/requireAdmin';
import { getOrders } from '../../lib/storage';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed.' });
    return;
  }

  if (!requireAdminSession(req, res)) {
    return;
  }

  try {
    const allOrders = await getOrders();
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const filtered = filterOrders(allOrders, { search, status });

    res.status(200).json({
      success: true,
      insecureMode: isInsecureAdminEnabled(),
      summary: summarizeOrders(allOrders),
      orders: filtered.map(toAdminOrderSummary)
    });
  } catch (error) {
    console.error('[admin] failed to load orders', {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({ success: false, error: 'Could not load orders.' });
  }
}
