import "server-only";

import { ensureSqliteDatabase, getSqliteDatabase } from "@/lib/server/sqlite/db";
import { mapWriterRow, type WriterRow } from "@/lib/server/sqlite/mappers";
import { ACTIVE_ORDER_STATUSES } from "@/lib/domain/order-status";
import type { Writer } from "@/lib/types";

const activeStatusPlaceholders = Array.from(ACTIVE_ORDER_STATUSES).map(() => "?").join(", ");

async function db() {
  await ensureSqliteDatabase();
  return getSqliteDatabase();
}

export async function getWriterWithLoad(id: string): Promise<Writer | null> {
  const database = await db();
  const row = database
    .prepare(`
      SELECT w.*,
        (
          SELECT COUNT(*)
          FROM orders o
          WHERE o.writer_id = w.id
            AND o.status IN (${activeStatusPlaceholders})
        ) AS active_order_count
      FROM writers w
      WHERE w.id = ?
    `)
    .get(...ACTIVE_ORDER_STATUSES, id) as (WriterRow & { active_order_count: number }) | undefined;

  if (!row) {
    return null;
  }

  return mapWriterRow(row, row.active_order_count);
}

export async function listWritersWithLoad(): Promise<Writer[]> {
  const database = await db();
  const rows = database
    .prepare(`
      SELECT w.*,
        (
          SELECT COUNT(*)
          FROM orders o
          WHERE o.writer_id = w.id
            AND o.status IN (${activeStatusPlaceholders})
        ) AS active_order_count
      FROM writers w
      ORDER BY w.name ASC
    `)
    .all(...ACTIVE_ORDER_STATUSES) as Array<WriterRow & { active_order_count: number }>;

  return rows.map((row) => mapWriterRow(row, row.active_order_count));
}
