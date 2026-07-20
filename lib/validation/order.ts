import { resolveCatalogItem } from '../catalog/products';
import { generateOrderId } from '../orders/generateId';
import type {
  OrderRequestPayload,
  ValidatedOrder,
  ValidatedOrderItem
} from '../types/order';

const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 20;
const MAX_ADDRESS_LENGTH = 300;
const MAX_NOTES_LENGTH = 500;
const MAX_PAYMENT_METHOD_LENGTH = 50;
const MAX_ITEMS = 20;
const MAX_QUANTITY = 10;
const MAX_BODY_BYTES = 8192;

export function isPayloadTooLarge(rawBody: string): boolean {
  return Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES;
}

export function normalizePhoneNumber(rawPhone: string): string | null {
  const digits = rawPhone.replace(/\D/g, '');

  if (!digits) {
    return null;
  }

  if (digits.startsWith('92') && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith('0') && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }

  if (digits.length === 10) {
    return `92${digits}`;
  }

  return null;
}

export function validateOrderPayload(payload: unknown): { order?: ValidatedOrder; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { error: 'Invalid order payload.' };
  }

  const body = payload as OrderRequestPayload;

  if (body._honeypot && String(body._honeypot).trim()) {
    return { error: 'Invalid submission.' };
  }

  const customerName = String(body.customerName || '').trim();
  const phone = String(body.phone || '').trim();
  const address = String(body.address || '').trim();
  const paymentMethod = String(body.paymentMethod || 'Cash on Delivery').trim();
  const notes = String(body.notes || '').trim();
  const source = body.source === 'home-form' ? 'home-form' : 'checkout';

  if (!customerName) {
    return { error: 'Customer name is required.' };
  }

  if (customerName.length > MAX_NAME_LENGTH) {
    return { error: 'Customer name is too long.' };
  }

  if (!phone) {
    return { error: 'Customer phone number is required.' };
  }

  if (phone.length > MAX_PHONE_LENGTH) {
    return { error: 'Customer phone number is too long.' };
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) {
    return { error: 'Enter a valid phone number.' };
  }

  if (!address) {
    return { error: 'Delivery address is required.' };
  }

  if (address.length > MAX_ADDRESS_LENGTH) {
    return { error: 'Delivery address is too long.' };
  }

  if (paymentMethod.length > MAX_PAYMENT_METHOD_LENGTH) {
    return { error: 'Payment method is too long.' };
  }

  if (notes.length > MAX_NOTES_LENGTH) {
    return { error: 'Notes are too long.' };
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { error: 'Your order must include at least one item.' };
  }

  if (body.items.length > MAX_ITEMS) {
    return { error: 'Too many items in one order.' };
  }

  const validatedItems: ValidatedOrderItem[] = [];
  let totalPkr = 0;

  for (const item of body.items) {
    const id = String(item?.id || '').trim();
    const quantity = Number(item?.quantity);

    if (!id) {
      return { error: 'Each order item must include a product id.' };
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return { error: 'Each item must have a valid quantity.' };
    }

    const catalogItem = resolveCatalogItem(id);
    if (!catalogItem) {
      return { error: `Unknown menu item: ${id}` };
    }

    const lineTotalPkr = catalogItem.pricePkr * quantity;
    totalPkr += lineTotalPkr;

    validatedItems.push({
      id,
      name: catalogItem.name,
      quantity,
      unitPricePkr: catalogItem.pricePkr,
      lineTotalPkr
    });
  }

  if (totalPkr <= 0) {
    return { error: 'Order total must be greater than zero.' };
  }

  return {
    order: {
      orderId: generateOrderId(),
      customerName,
      phone,
      normalizedPhone,
      address,
      items: validatedItems,
      totalPkr,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      notes,
      source
    }
  };
}
