import "server-only";

import "server-only";

import { z } from "zod";
import { ACTIVE_ORDER_STATUSES } from "@/lib/domain/order-status";
import {
  buildClientWhere,
  buildOrderJoinWhere,
  hasOrderOnlyFilter
} from "@/lib/queries/filter-sql";
import { ensureSqliteDatabase, getSqliteDatabase } from "@/lib/server/sqlite/db";

export const overviewFilterSchema = z.object({
  sourceType: z.enum(["all", "self_owned", "outsourced"]).optional(),
  clientSource: z.string().optional(),
  riskLevel: z.enum(["all", "low", "medium", "high"]).optional(),
  serviceType: z.string().optional(),
  educationLevel: z.string().optional(),
  schoolType: z.string().optional(),
  settledState: z.enum(["all", "settled", "unsettled"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
});

export type OverviewFilter = z.infer<typeof overviewFilterSchema>;

export type OverviewMetrics = {
  activeOrders: number;
  totalRevenue: number;
  settledRevenue: number;
  totalReceivables: number;
  totalCost: number;
  totalProfit: number;
  outsourcedOrders: number;
  selfOwnedOrders: number;
  settledOrders: number;
  writerUtilization: number;
  averageWriterRating: number;
  totalClients: number;
  filteredOrderCount: number;
  filteredClientCount: number;
  ordersByStatus: Array<[string, number]>;
  ordersBySourceType: Array<[string, number]>;
  ordersByServiceType: Array<[string, number]>;
  clientsBySource: Array<[string, number]>;
  clientsByRisk: Array<[string, number]>;
};

export type OverviewFilterOptions = {
  clientSources: string[];
  serviceTypes: string[];
  educationLevels: string[];
  schoolTypes: string[];
};

async function db() {
  await ensureSqliteDatabase();
  return getSqliteDatabase();
}

function toPairs(rows: Array<{ key: string; count: number }>): Array<[string, number]> {
  return rows.map((row) => [row.key, row.count]);
}

export async function loadOverviewFilterOptions(): Promise<OverviewFilterOptions> {
  const database = await db();

  const clientSources = database
    .prepare(
      `SELECT DISTINCT source_channel AS value FROM clients WHERE TRIM(source_channel) != '' ORDER BY source_channel COLLATE NOCASE`
    )
    .all() as Array<{ value: string }>;
  const serviceTypes = database
    .prepare(
      `SELECT DISTINCT service_type AS value FROM orders WHERE TRIM(service_type) != '' ORDER BY service_type COLLATE NOCASE`
    )
    .all() as Array<{ value: string }>;
  const educationLevels = database
    .prepare(
      `SELECT DISTINCT education_level AS value FROM clients WHERE TRIM(education_level) != '' ORDER BY education_level COLLATE NOCASE`
    )
    .all() as Array<{ value: string }>;
  const schoolTypes = database
    .prepare(
      `SELECT DISTINCT school_type AS value FROM clients WHERE TRIM(school_type) != '' ORDER BY school_type COLLATE NOCASE`
    )
    .all() as Array<{ value: string }>;

  return {
    clientSources: clientSources.map((item) => item.value),
    serviceTypes: serviceTypes.map((item) => item.value),
    educationLevels: educationLevels.map((item) => item.value),
    schoolTypes: schoolTypes.map((item) => item.value)
  };
}

export async function loadOverviewMetrics(filter: OverviewFilter = {}): Promise<OverviewMetrics> {
  const database = await db();
  const { fromWhere, params } = buildOrderJoinWhere(filter);
  const clientOnly = buildClientWhere(filter);
  const activeStatuses = Array.from(ACTIVE_ORDER_STATUSES);
  const activePlaceholders = activeStatuses.map(() => "?").join(", ");

  const totals = database
    .prepare(
      `
      SELECT
        COUNT(*) AS filtered_order_count,
        COALESCE(SUM(o.amount), 0) AS total_revenue,
        COALESCE(SUM(o.settled_amount), 0) AS settled_revenue,
        COALESCE(SUM(o.receivable_amount), 0) AS total_receivables,
        COALESCE(SUM(o.cost_amount), 0) AS total_cost,
        COALESCE(SUM(o.profit_amount), 0) AS total_profit,
        SUM(CASE WHEN o.status IN (${activePlaceholders}) THEN 1 ELSE 0 END) AS active_orders,
        SUM(CASE WHEN o.source_type = 'outsourced' THEN 1 ELSE 0 END) AS outsourced_orders,
        SUM(CASE WHEN o.source_type = 'self_owned' THEN 1 ELSE 0 END) AS self_owned_orders,
        SUM(CASE WHEN o.is_settled = 1 THEN 1 ELSE 0 END) AS settled_orders
      ${fromWhere}
    `
    )
    .get(...activeStatuses, ...params) as {
    filtered_order_count: number;
    total_revenue: number;
    settled_revenue: number;
    total_receivables: number;
    total_cost: number;
    total_profit: number;
    active_orders: number | null;
    outsourced_orders: number | null;
    self_owned_orders: number | null;
    settled_orders: number | null;
  };

  const filteredClientCount = hasOrderOnlyFilter(filter)
    ? (
        database.prepare(`SELECT COUNT(DISTINCT c.id) AS count ${fromWhere}`).get(...params) as {
          count: number;
        }
      ).count
    : (
        database
          .prepare(`SELECT COUNT(*) AS count FROM clients c WHERE ${clientOnly.where}`)
          .get(...clientOnly.params) as { count: number }
      ).count;

  const ordersByStatus = toPairs(
    database
      .prepare(
        `SELECT o.status AS key, COUNT(*) AS count ${fromWhere} GROUP BY o.status ORDER BY count DESC`
      )
      .all(...params) as Array<{ key: string; count: number }>
  );

  const ordersBySourceType = toPairs(
    database
      .prepare(
        `SELECT o.source_type AS key, COUNT(*) AS count ${fromWhere} GROUP BY o.source_type ORDER BY count DESC`
      )
      .all(...params) as Array<{ key: string; count: number }>
  );

  const ordersByServiceType = toPairs(
    database
      .prepare(
        `SELECT o.service_type AS key, COUNT(*) AS count ${fromWhere} GROUP BY o.service_type ORDER BY count DESC`
      )
      .all(...params) as Array<{ key: string; count: number }>
  );

  const clientsBySource = toPairs(
    (
      hasOrderOnlyFilter(filter)
        ? database
            .prepare(
              `SELECT c.source_channel AS key, COUNT(DISTINCT c.id) AS count ${fromWhere} GROUP BY c.source_channel ORDER BY count DESC`
            )
            .all(...params)
        : database
            .prepare(
              `SELECT c.source_channel AS key, COUNT(*) AS count FROM clients c WHERE ${clientOnly.where} GROUP BY c.source_channel ORDER BY count DESC`
            )
            .all(...clientOnly.params)
    ) as Array<{ key: string; count: number }>
  );

  const clientsByRisk = toPairs(
    (
      hasOrderOnlyFilter(filter)
        ? database
            .prepare(
              `SELECT c.risk_level AS key, COUNT(DISTINCT c.id) AS count ${fromWhere} GROUP BY c.risk_level ORDER BY count DESC`
            )
            .all(...params)
        : database
            .prepare(
              `SELECT c.risk_level AS key, COUNT(*) AS count FROM clients c WHERE ${clientOnly.where} GROUP BY c.risk_level ORDER BY count DESC`
            )
            .all(...clientOnly.params)
    ) as Array<{ key: string; count: number }>
  );

  const writerStats = database
    .prepare(
      `
      SELECT
        COALESCE(SUM(w.capacity), 0) AS total_capacity,
        COALESCE(SUM(active_counts.active_order_count), 0) AS active_load,
        COALESCE(AVG(w.rating), 0) AS average_rating
      FROM writers w
      LEFT JOIN (
        SELECT writer_id, COUNT(*) AS active_order_count
        FROM orders
        WHERE writer_id IS NOT NULL
          AND status IN (${activePlaceholders})
        GROUP BY writer_id
      ) active_counts ON active_counts.writer_id = w.id
    `
    )
    .get(...activeStatuses) as {
    total_capacity: number;
    active_load: number;
    average_rating: number;
  };

  const writerUtilization =
    writerStats.total_capacity === 0
      ? 0
      : Math.round((writerStats.active_load / writerStats.total_capacity) * 100);

  return {
    activeOrders: totals.active_orders ?? 0,
    totalRevenue: totals.total_revenue,
    settledRevenue: totals.settled_revenue,
    totalReceivables: totals.total_receivables,
    totalCost: totals.total_cost,
    totalProfit: totals.total_profit,
    outsourcedOrders: totals.outsourced_orders ?? 0,
    selfOwnedOrders: totals.self_owned_orders ?? 0,
    settledOrders: totals.settled_orders ?? 0,
    writerUtilization,
    averageWriterRating: Number(writerStats.average_rating.toFixed(1)),
    totalClients: filteredClientCount,
    filteredOrderCount: totals.filtered_order_count,
    filteredClientCount,
    ordersByStatus,
    ordersBySourceType,
    ordersByServiceType,
    clientsBySource,
    clientsByRisk
  };
}
