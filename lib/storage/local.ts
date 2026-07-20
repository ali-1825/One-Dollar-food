import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { StoredOrder } from '../types/stored-order';

function getDataDir(): string {
  return process.env.TEST_ORDERS_DIR || path.join(process.cwd(), '.data');
}

function getOrdersFile(): string {
  return path.join(getDataDir(), 'orders.json');
}

async function ensureOrdersFile(): Promise<void> {
  const dataDir = getDataDir();
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(getOrdersFile());
  } catch {
    await fs.writeFile(getOrdersFile(), '[]', 'utf8');
  }
}

async function readOrdersFile(): Promise<StoredOrder[]> {
  await ensureOrdersFile();
  const raw = await fs.readFile(getOrdersFile(), 'utf8');
  const parsed = JSON.parse(raw) as StoredOrder[];
  return Array.isArray(parsed) ? parsed : [];
}

async function writeOrdersFile(orders: StoredOrder[]): Promise<void> {
  await ensureOrdersFile();
  await fs.writeFile(getOrdersFile(), JSON.stringify(orders, null, 2), 'utf8');
}

export async function saveOrderLocal(order: StoredOrder): Promise<StoredOrder> {
  const orders = await readOrdersFile();
  const existingIndex = orders.findIndex(function (entry) {
    return entry.id === order.id;
  });

  if (existingIndex >= 0) {
    orders[existingIndex] = order;
  } else {
    orders.push(order);
  }

  await writeOrdersFile(orders);
  return order;
}

export async function getOrdersLocal(): Promise<StoredOrder[]> {
  const orders = await readOrdersFile();
  return orders.sort(function (a, b) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function getOrderByIdLocal(orderId: string): Promise<StoredOrder | null> {
  const orders = await readOrdersFile();
  return orders.find(function (entry) {
    return entry.id === orderId;
  }) || null;
}

export async function updateOrderLocal(order: StoredOrder): Promise<StoredOrder> {
  return saveOrderLocal(order);
}
