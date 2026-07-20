import { get, list, put } from '@vercel/blob';
import type { StoredOrder } from '../types/stored-order';
import { getOrderBlobPath } from './paths';

async function readOrderFromPathname(pathname: string): Promise<StoredOrder | null> {
  try {
    const result = await get(pathname, { access: 'private' });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }

    const text = await new Response(result.stream).text();
    return JSON.parse(text) as StoredOrder;
  } catch (error) {
    console.error('[storage] failed to read blob order', {
      pathname,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
}

export async function saveOrderBlob(order: StoredOrder): Promise<StoredOrder> {
  const pathname = getOrderBlobPath(order.id);

  await put(pathname, JSON.stringify(order), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  });

  return order;
}

export async function getOrdersBlob(): Promise<StoredOrder[]> {
  const orders: StoredOrder[] = [];
  let cursor: string | undefined;

  do {
    const result = await list({
      prefix: 'orders/',
      cursor,
      limit: 1000
    });

    for (const blob of result.blobs) {
      const order = await readOrderFromPathname(blob.pathname);
      if (order) {
        orders.push(order);
      }
    }

    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return orders.sort(function (a, b) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function getOrderByIdBlob(orderId: string): Promise<StoredOrder | null> {
  return readOrderFromPathname(getOrderBlobPath(orderId));
}

export async function updateOrderBlob(order: StoredOrder): Promise<StoredOrder> {
  return saveOrderBlob(order);
}
