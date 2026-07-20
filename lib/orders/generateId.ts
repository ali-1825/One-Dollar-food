export function generateOrderId(now = new Date()): string {
  const datePart = now
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');

  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `ORD-${datePart}-${randomPart}`;
}
