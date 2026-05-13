import type { Client, Order, Writer } from "@/lib/types";

export function buildDashboardMetrics(params: {
  orders: Order[];
  writers: Writer[];
  clients: Client[];
}) {
  const { orders, writers, clients } = params;
  const activeOrders = orders.filter((order) =>
    ["lead", "quoted", "in_progress", "review"].includes(order.status)
  ).length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
  const settledRevenue = orders.reduce((sum, order) => sum + order.settledAmount, 0);
  const totalReceivables = orders.reduce((sum, order) => sum + order.receivableAmount, 0);
  const totalCost = orders.reduce((sum, order) => sum + order.costAmount, 0);
  const totalProfit = orders.reduce((sum, order) => sum + order.profitAmount, 0);
  const outsourcedOrders = orders.filter((order) => order.sourceType === "outsourced").length;
  const selfOwnedOrders = orders.filter((order) => order.sourceType === "self_owned").length;
  const settledOrders = orders.filter((order) => order.isSettled).length;

  const capacityTotal = writers.reduce((sum, writer) => sum + writer.capacity, 0);
  const activeLoad = writers.reduce((sum, writer) => sum + writer.activeOrderCount, 0);
  const writerUtilization = capacityTotal === 0 ? 0 : Math.round((activeLoad / capacityTotal) * 100);

  const ordersByStatus = Object.entries(
    orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] ?? 0) + 1;
      return acc;
    }, {})
  );

  const ordersBySourceType = Object.entries(
    orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.sourceType] = (acc[order.sourceType] ?? 0) + 1;
      return acc;
    }, {})
  );

  const ordersByServiceType = Object.entries(
    orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.serviceType] = (acc[order.serviceType] ?? 0) + 1;
      return acc;
    }, {})
  );

  const clientsBySource = Object.entries(
    clients.reduce<Record<string, number>>((acc, client) => {
      acc[client.sourceChannel] = (acc[client.sourceChannel] ?? 0) + 1;
      return acc;
    }, {})
  );

  const clientsByRisk = Object.entries(
    clients.reduce<Record<string, number>>((acc, client) => {
      acc[client.riskLevel] = (acc[client.riskLevel] ?? 0) + 1;
      return acc;
    }, {})
  );

  const averageWriterRating =
    writers.length === 0
      ? 0
      : Number((writers.reduce((sum, writer) => sum + writer.rating, 0) / writers.length).toFixed(1));

  return {
    activeOrders,
    totalRevenue,
    settledRevenue,
    totalReceivables,
    totalCost,
    totalProfit,
    outsourcedOrders,
    selfOwnedOrders,
    settledOrders,
    writerUtilization,
    averageWriterRating,
    totalClients: clients.length,
    ordersByStatus,
    ordersBySourceType,
    ordersByServiceType,
    clientsBySource,
    clientsByRisk
  };
}
