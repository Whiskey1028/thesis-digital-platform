import type { Order, OrderStatus } from "@/lib/types";

export const ACTIVE_ORDER_STATUSES = new Set<OrderStatus>([
  "lead",
  "quoted",
  "in_progress",
  "review"
]);

export function isActiveOrder(order: Order) {
  return ACTIVE_ORDER_STATUSES.has(order.status);
}

export function countActiveOrdersForWriter(writerId: string, orders: Order[]) {
  return orders.filter((order) => order.writerId === writerId && isActiveOrder(order)).length;
}
