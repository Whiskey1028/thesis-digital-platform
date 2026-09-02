import "server-only";

import {
  isPaginatedRequest,
  type ClientListQuery,
  type OrderListQuery,
  type PaginatedResult,
  type WriterListQuery
} from "@/lib/api/pagination";
import { ACTIVE_ORDER_STATUSES } from "@/lib/domain/order-status";
import { ensureSqliteDatabase, getSqliteDatabase } from "@/lib/server/sqlite/db";
import {
  mapClientRow,
  mapOrderRow,
  mapWriterRow,
  type ClientRow,
  type OrderRow,
  type WriterRow
} from "@/lib/server/sqlite/mappers";
import type { Client, Order, Writer } from "@/lib/types";

export type ClientListItem = Client & {
  orderCount: number;
  latestOrderTitle?: string;
};

const activeStatusPlaceholders = Array.from(ACTIVE_ORDER_STATUSES).map(() => "?").join(", ");

async function db() {
  await ensureSqliteDatabase();
  return getSqliteDatabase();
}

function clientOrderBy(sort: ClientListQuery["sort"]) {
  switch (sort) {
    case "name_desc":
      return "ORDER BY c.name COLLATE NOCASE DESC";
    case "created_desc":
      return "ORDER BY c.created_at DESC";
    case "budget_desc":
      return "ORDER BY COALESCE(c.preferred_budget, 0) DESC";
    case "name_asc":
    default:
      return "ORDER BY c.name COLLATE NOCASE ASC";
  }
}

function orderOrderBy(sort: OrderListQuery["sort"]) {
  switch (sort) {
    case "deadline_desc":
      return "ORDER BY o.deadline DESC";
    case "amount_desc":
      return "ORDER BY o.amount DESC";
    case "created_desc":
      return "ORDER BY o.created_at DESC";
    case "profit_desc":
      return "ORDER BY o.profit_amount DESC";
    case "deadline_asc":
    default:
      return "ORDER BY o.deadline ASC";
  }
}

function writerOrderBy(sort: WriterListQuery["sort"]) {
  switch (sort) {
    case "rating_desc":
      return "ORDER BY w.rating DESC";
    case "load_desc":
      return "ORDER BY active_order_count DESC";
    case "capacity_desc":
      return "ORDER BY w.capacity DESC";
    case "name_asc":
    default:
      return "ORDER BY w.name COLLATE NOCASE ASC";
  }
}

function buildClientWhere(query: ClientListQuery) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.id) {
    conditions.push("c.id = ?");
    params.push(query.id);
  }

  if (query.risk && query.risk !== "all") {
    conditions.push("c.risk_level = ?");
    params.push(query.risk);
  }

  if (query.q) {
    const like = `%${query.q}%`;
    conditions.push(
      "(c.name LIKE ? OR c.contact_handle LIKE ? OR c.school LIKE ? OR c.major LIKE ? OR c.source_channel LIKE ?)"
    );
    params.push(like, like, like, like, like);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, params };
}

function buildOrderWhere(query: OrderListQuery) {
  const conditions: string[] = [];
  const params: unknown[] = [];

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

  if (query.settledState === "settled") {
    conditions.push("o.is_settled = 1");
  } else if (query.settledState === "unsettled") {
    conditions.push("o.is_settled = 0");
  }

  if (query.serviceType && query.serviceType !== "all") {
    conditions.push("o.service_type = ?");
    params.push(query.serviceType);
  }

  if (query.clientId) {
    conditions.push("o.client_id = ?");
    params.push(query.clientId);
  }

  if (query.writerId) {
    conditions.push("o.writer_id = ?");
    params.push(query.writerId);
  }

  if (query.q) {
    const like = `%${query.q}%`;
    conditions.push("(o.title LIKE ? OR COALESCE(o.client_name, '') LIKE ? OR o.owner_name LIKE ?)");
    params.push(like, like, like);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, params };
}

function buildWriterWhere(query: WriterListQuery) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.id) {
    conditions.push("w.id = ?");
    params.push(query.id);
  }

  if (query.availability && query.availability !== "all") {
    conditions.push("w.availability = ?");
    params.push(query.availability);
  }

  if (query.q) {
    const like = `%${query.q}%`;
    conditions.push(
      "(w.name LIKE ? OR w.owner_name LIKE ? OR w.settlement_mode LIKE ? OR w.specialties LIKE ?)"
    );
    params.push(like, like, like, like);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, params };
}

function mapClientListRow(
  row: ClientRow & { order_count: number; latest_order_title: string | null }
): ClientListItem {
  return {
    ...mapClientRow(row),
    orderCount: row.order_count,
    latestOrderTitle: row.latest_order_title ?? undefined
  };
}

function mapWriterListRow(
  row: WriterRow & { active_order_count: number }
): Writer {
  return mapWriterRow(row, row.active_order_count);
}

const clientSelect = `
  SELECT c.*,
    (SELECT COUNT(*) FROM orders o WHERE o.client_id = c.id) AS order_count,
    (
      SELECT o.title FROM orders o
      WHERE o.client_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 1
    ) AS latest_order_title
  FROM clients c
`;

const writerSelect = `
  SELECT w.*,
    (
      SELECT COUNT(*)
      FROM orders o
      WHERE o.writer_id = w.id
        AND o.status IN (${activeStatusPlaceholders})
    ) AS active_order_count
  FROM writers w
`;

export async function sqliteQueryClients(
  query: ClientListQuery = {}
): Promise<Client[] | PaginatedResult<ClientListItem>> {
  const database = await db();
  const { where, params } = buildClientWhere(query);
  const orderBy = clientOrderBy(query.sort);

  const totalRow = database
    .prepare(`SELECT COUNT(*) AS count FROM clients c ${where}`)
    .get(...params) as { count: number };

  if (!isPaginatedRequest(query)) {
    const rows = database
      .prepare(`${clientSelect} ${where} ${orderBy}`)
      .all(...params) as Array<ClientRow & { order_count: number; latest_order_title: string | null }>;
    return rows.map(mapClientListRow);
  }

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const offset = (page - 1) * pageSize;
  const pagedRows = database
    .prepare(`${clientSelect} ${where} ${orderBy} LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset) as Array<
    ClientRow & { order_count: number; latest_order_title: string | null }
  >;

  return {
    items: pagedRows.map(mapClientListRow),
    total: totalRow.count,
    page,
    pageSize
  };
}

export async function sqliteQueryOrders(
  query: OrderListQuery = {}
): Promise<Order[] | PaginatedResult<Order>> {
  const database = await db();
  const { where, params } = buildOrderWhere(query);
  const orderBy = orderOrderBy(query.sort);

  const totalRow = database
    .prepare(`SELECT COUNT(*) AS count FROM orders o ${where}`)
    .get(...params) as { count: number };

  if (!isPaginatedRequest(query)) {
    const rows = database
      .prepare(`SELECT o.* FROM orders o ${where} ${orderBy}`)
      .all(...params) as OrderRow[];
    return rows.map(mapOrderRow);
  }

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const offset = (page - 1) * pageSize;
  const rows = database
    .prepare(`SELECT o.* FROM orders o ${where} ${orderBy} LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset) as OrderRow[];

  return {
    items: rows.map(mapOrderRow),
    total: totalRow.count,
    page,
    pageSize
  };
}

export async function sqliteQueryWriters(
  query: WriterListQuery = {}
): Promise<Writer[] | PaginatedResult<Writer>> {
  const database = await db();
  const { where, params } = buildWriterWhere(query);
  const orderBy = writerOrderBy(query.sort);

  const totalRow = database
    .prepare(`SELECT COUNT(*) AS count FROM writers w ${where}`)
    .get(...params) as { count: number };

  if (!isPaginatedRequest(query)) {
    const rows = database.prepare(`${writerSelect} ${where} ${orderBy}`).all(...ACTIVE_ORDER_STATUSES, ...params) as Array<
      WriterRow & { active_order_count: number }
    >;
    return rows.map(mapWriterListRow);
  }

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const offset = (page - 1) * pageSize;
  const rows = database
    .prepare(`${writerSelect} ${where} ${orderBy} LIMIT ? OFFSET ?`)
    .all(...ACTIVE_ORDER_STATUSES, ...params, pageSize, offset) as Array<
    WriterRow & { active_order_count: number }
  >;

  return {
    items: rows.map(mapWriterListRow),
    total: totalRow.count,
    page,
    pageSize
  };
}

export async function sqliteQueryOrderBoard(): Promise<
  Array<{ status: string; count: number; items: Order[] }>
> {
  const database = await db();
  const statuses = ["lead", "quoted", "in_progress", "review", "delivered", "after_sales"];

  const countRows = database
    .prepare(
      `
      SELECT status, COUNT(*) AS count
      FROM orders
      GROUP BY status
    `
    )
    .all() as Array<{ status: string; count: number }>;
  const countMap = new Map(countRows.map((row) => [row.status, row.count]));

  const sampleRows = database
    .prepare(
      `
      SELECT *
      FROM (
        SELECT o.*,
          ROW_NUMBER() OVER (PARTITION BY o.status ORDER BY o.deadline ASC, o.created_at DESC) AS rn
        FROM orders o
      )
      WHERE rn <= 8
      ORDER BY status, rn
    `
    )
    .all() as Array<OrderRow & { rn: number }>;

  const samplesByStatus = new Map<string, Order[]>();
  for (const row of sampleRows) {
    const list = samplesByStatus.get(row.status) ?? [];
    list.push(mapOrderRow(row));
    samplesByStatus.set(row.status, list);
  }

  return statuses.map((status) => ({
    status,
    count: countMap.get(status) ?? 0,
    items: samplesByStatus.get(status) ?? []
  }));
}

/** @deprecated use sqliteQueryOrderBoard */
export async function sqliteQueryOrderBoardItems(): Promise<Order[]> {
  const columns = await sqliteQueryOrderBoard();
  return columns.flatMap((column) => column.items);
}
