import "server-only";

import { ensureSqliteDatabase, getSqliteDatabase } from "@/lib/server/sqlite/db";
import { ACTIVE_ORDER_STATUSES } from "@/lib/domain/order-status";

const activeStatusPlaceholders = Array.from(ACTIVE_ORDER_STATUSES).map(() => "?").join(", ");

async function db() {
  await ensureSqliteDatabase();
  return getSqliteDatabase();
}

export async function getClientPageKpis() {
  const database = await db();
  const row = database
    .prepare(`
      SELECT
        SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) AS high_risk,
        SUM(
          CASE
            WHEN preferred_title IS NOT NULL
              AND TRIM(preferred_title) != ''
              AND preferred_budget IS NOT NULL
              AND preferred_budget > 0
            THEN 1 ELSE 0
          END
        ) AS convertible,
        (
          SELECT COUNT(*)
          FROM clients c
          WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.client_id = c.id)
        ) AS without_orders
      FROM clients
    `)
    .get() as {
    high_risk: number | null;
    convertible: number | null;
    without_orders: number;
  };

  return {
    highRiskClients: row.high_risk ?? 0,
    convertibleClients: row.convertible ?? 0,
    clientsWithoutOrders: row.without_orders
  };
}

export async function getOrderPageKpis() {
  const database = await db();
  const row = database
    .prepare(`
      SELECT
        SUM(CASE WHEN writer_id IS NULL THEN 1 ELSE 0 END) AS unassigned,
        SUM(CASE WHEN urgency = 'high' THEN 1 ELSE 0 END) AS urgent,
        SUM(receivable_amount) AS receivable,
        SUM(CASE WHEN source_type = 'outsourced' THEN 1 ELSE 0 END) AS outsourced
      FROM orders
    `)
    .get() as {
    unassigned: number | null;
    urgent: number | null;
    receivable: number | null;
    outsourced: number | null;
  };

  return {
    unassignedOrders: row.unassigned ?? 0,
    urgentOrders: row.urgent ?? 0,
    unpaidReceivables: row.receivable ?? 0,
    outsourcedOrders: row.outsourced ?? 0
  };
}

export async function getWriterPageKpis() {
  const database = await db();
  const row = database
    .prepare(`
      SELECT
        COALESCE(SUM(w.capacity), 0) AS total_capacity,
        COALESCE(SUM(active_counts.active_order_count), 0) AS active_load,
        COALESCE(AVG(w.rating), 0) AS average_rating
      FROM writers w
      LEFT JOIN (
        SELECT writer_id, COUNT(*) AS active_order_count
        FROM orders
        WHERE writer_id IS NOT NULL
          AND status IN (${activeStatusPlaceholders})
        GROUP BY writer_id
      ) active_counts ON active_counts.writer_id = w.id
    `)
    .get(...ACTIVE_ORDER_STATUSES) as {
    total_capacity: number;
    active_load: number;
    average_rating: number;
  };

  return {
    totalCapacity: row.total_capacity,
    activeLoad: row.active_load,
    averageRating: row.average_rating
  };
}
