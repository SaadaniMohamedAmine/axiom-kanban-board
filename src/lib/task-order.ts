export const ORDER_GAP = 1000;

export function calculateOrderBetween(
  previousOrder: number | null,
  nextOrder: number | null
): number {
  if (previousOrder === null && nextOrder === null) {
    return ORDER_GAP;
  }
  if (previousOrder === null) {
    return Math.max(1, Math.floor((nextOrder as number) / 2));
  }
  if (nextOrder === null) {
    return (previousOrder as number) + ORDER_GAP;
  }
  return Math.floor(((previousOrder as number) + (nextOrder as number)) / 2);
}

export function calculateOrderAtStart(firstOrder: number | null): number {
  if (firstOrder === null) {
    return ORDER_GAP;
  }
  return Math.max(1, Math.floor(firstOrder / 2));
}

export function calculateOrderAtEnd(lastOrder: number | null): number {
  if (lastOrder === null) {
    return ORDER_GAP;
  }
  return (lastOrder as number) + ORDER_GAP;
}

export function needsRenumber(orders: number[]): boolean {
  if (orders.length <= 1) return false;
  const sorted = [...orders].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] < 2) {
      return true;
    }
  }
  return false;
}

export function renumberOrders(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * ORDER_GAP);
}
