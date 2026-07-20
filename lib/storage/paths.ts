export function getOrderBlobPath(orderId: string): string {
  const match = orderId.match(/^ORD-(\d{4})(\d{2})(\d{2})-/);

  if (match) {
    return `orders/${match[1]}-${match[2]}-${match[3]}/${orderId}.json`;
  }

  return `orders/unknown/${orderId}.json`;
}
