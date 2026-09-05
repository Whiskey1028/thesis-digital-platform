import "server-only";

import { z } from "zod";
import { ACTIVE_ORDER_STATUSES } from "@/lib/domain/order-status";
import { ensureSqliteDatabase, getSqliteDatabase } from "@/lib/server/sqlite/db";
import { mapOrderRow, type OrderRow } from "@/lib/server/sqlite/mappers";
import type { Order } from "@/lib/types";
import type { PaginatedResult } from "@/lib/api/pagination";

export const inboxQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(["all", "lead", "quoted", "in_progress", "review"]).optional(),
  sourceType: z.enum(["all", "self_owned", "outsourced"]).optional(),
  urgency: z.enum(["all", "low", "medium", "high"]).optional(),
  focus: z.enum(["all", "overdue", "due_soon", "no_deadline", "unassigned"]).optional(),
  q: z.string().trim().optional()
});

export type InboxQuery = z.infer<typeof inboxQuerySchema>;

export type InboxItem = Order & {
  daysToDeadline: number | null;
  overdue: boolean;
  dueSoon: boolean;
  noDeadline: boolean;
};

export type InboxKpis = {
  activeTotal: number;
  overdue: number;
  dueSoon: number;
  noDeadline: number;
  unassigned: number;
};

export type InboxPayload = {
  kpis: InboxKpis;
  list: PaginatedResult<InboxItem>;
};

const DUE_SOON_DAYS = 7;

async function db() {
  await ensureSqliteDatabase();
  return getSqliteDatabase();
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildInboxWhere(query: InboxQuery, today: string) {
  const activeStatuses = Array.from(ACTIVE_ORDER_STATUSES);
  const conditions: string[] = [
    `o.status IN (${activeStatuses.map(() => "?").join(", ")})`
  ];
  const params: unknown[] = [...activeStatuses];

  if (query.status && query.status !== "all") {
    conditions.push("o.status = ?");
    params.push(query.status);
  }

  if (query.sourceType && query.sourceType !== "all") {
    conditions.push("o.source_type = ?");
    params.push(query.sourceType);
  }

  if (query.urgency && query.urgency !== "all") {
    conditions.push("o.urgency = ?");
    params.push(query.urgency);
  }

  if (query.q) {
    const like = `%${query.q}%`;
    conditions.push(
      "(o.title LIKE ? OR COALESCE(o.client_name, '') LIKE ? OR o.owner_name LIKE ?)"
    );
    params.push(like, like, like);
  }

  switch (query.focus) {
    case "overdue":
      conditions.push("TRIM(COALESCE(o.deadline, '')) != '' AND o.deadline < ?");
      params.push(today);
      break;
    case "due_soon":
      conditions.push(
        "TRIM(COALESCE(o.deadline, '')) != '' AND o.deadline >= ? AND o.deadline <= date(?, '+7 days')"
      );
      params.push(today, today);
      break;
    case "no_deadline":
      conditions.push("TRIM(COALESCE(o.deadline, '')) = ''");
      break;
    case "unassigned":
      conditions.push("(o.writer_id IS NULL OR TRIM(o.writer_id) = '')");
      break;
    default:
      break;
  }

  return {
    where: `WHERE ${conditions.join(" AND ")}`,
    params
  };
}

function enrichItem(order: Order, today: string): InboxItem {
  const deadline = (order.deadline ?? "").trim();
  const noDeadline = !deadline;
  let daysToDeadline: number | null = null;

  if (!noDeadline) {
    const start = Date.parse(`${today}T00:00:00.000Z`);
    const end = Date.parse(`${deadline}T00:00:00.000Z`);
    if (Number.isFinite(start) && Number.isFinite(end)) {
      daysToDeadline = Math.round((end - start) / (24 * 60 * 60 * 1000));
    }
  }

  const overdue = daysToDeadline !== null && daysToDeadline < 0;
  const dueSoon =
    daysToDeadline !== null && daysToDeadline >= 0 && daysToDeadline <= DUE_SOON_DAYS;

  return {
    ...order,
    daysToDeadline,
    overdue,
    dueSoon,
    noDeadline
  };
}

export async function loadInboxKpis(): Promise<InboxKpis> {
  const database = await db();
  const today = todayIsoDate();
  const activeStatuses = Array.from(ACTIVE_ORDER_STATUSES);
  const placeholders = activeStatuses.map(() => "?").join(", ");

  const row = database
    .prepare(
      `
      SELECT
        COUNT(*) AS active_total,
        SUM(
          CASE
            WHEN TRIM(COALESCE(deadline, '')) != '' AND deadline < ? THEN 1
            ELSE 0
          END
        ) AS overdue,
        SUM(
          CASE
            WHEN TRIM(COALESCE(deadline, '')) != ''
              AND deadline >= ?
              AND deadline <= date(?, '+7 days')
            THEN 1
            ELSE 0
          END
        ) AS due_soon,
        SUM(
          CASE WHEN TRIM(COALESCE(deadline, '')) = '' THEN 1 ELSE 0 END
        ) AS no_deadline,
        SUM(
          CASE WHEN writer_id IS NULL OR TRIM(writer_id) = '' THEN 1 ELSE 0 END
        ) AS unassigned
      FROM orders
      WHERE status IN (${placeholders})
    `
    )
    .get(today, today, today, ...activeStatuses) as {
    active_total: number;
    overdue: number | null;
    due_soon: number | null;
    no_deadline: number | null;
    unassigned: number | null;
  };

  return {
    activeTotal: row.active_total,
    overdue: row.overdue ?? 0,
    dueSoon: row.due_soon ?? 0,
    noDeadline: row.no_deadline ?? 0,
    unassigned: row.unassigned ?? 0
  };
}

export async function loadInboxList(query: InboxQuery = {}): Promise<PaginatedResult<InboxItem>> {
  const database = await db();
  const today = todayIsoDate();
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const { where, params } = buildInboxWhere(query, today);

  const total = (
    database.prepare(`SELECT COUNT(*) AS count FROM orders o ${where}`).get(...params) as {
      count: number;
    }
  ).count;

  const rows = database
    .prepare(
      `
      SELECT o.*
      FROM orders o
      ${where}
      ORDER BY
        CASE WHEN TRIM(COALESCE(o.deadline, '')) = '' THEN 1 ELSE 0 END ASC,
        o.deadline ASC,
        CASE o.urgency
          WHEN 'high' THEN 0
          WHEN 'medium' THEN 1
          ELSE 2
        END ASC,
        CASE WHEN TRIM(COALESCE(o.writer_deadline, '')) = '' THEN 1 ELSE 0 END ASC,
        o.writer_deadline ASC,
        o.created_at DESC
      LIMIT ? OFFSET ?
    `
    )
    .all(...params, pageSize, (page - 1) * pageSize) as OrderRow[];

  return {
    items: rows.map((row) => enrichItem(mapOrderRow(row), today)),
    total,
    page,
    pageSize
  };
}

export async function loadInboxPayload(query: InboxQuery = {}): Promise<InboxPayload> {
  const [kpis, list] = await Promise.all([loadInboxKpis(), loadInboxList(query)]);
  return { kpis, list };
}
