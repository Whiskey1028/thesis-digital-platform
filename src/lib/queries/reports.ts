import "server-only";

import {
  buildClientWhere,
  buildOrderJoinWhere,
  hasOrderOnlyFilter
} from "@/lib/queries/filter-sql";
import type { OverviewFilter } from "@/lib/queries/overview";
import { ensureSqliteDatabase, getSqliteDatabase } from "@/lib/server/sqlite/db";

export type NamedCount = { key: string; label: string; count: number };
export type NamedMoney = {
  key: string;
  label: string;
  count: number;
  amount: number;
  settled: number;
  profit: number;
  cost: number;
};

export type ClientPersonaReport = {
  bySource: NamedCount[];
  byRisk: NamedCount[];
  byEducation: NamedCount[];
  bySchoolType: NamedCount[];
  topMajors: NamedCount[];
  topSchools: NamedCount[];
  budgetBuckets: NamedCount[];
  conversion: { withOrders: number; withoutOrders: number };
  educationBySchoolType: Array<{ education: string; schoolType: string; count: number }>;
};

export type OrderPersonaReport = {
  bySource: NamedMoney[];
  byServiceType: NamedMoney[];
  byPackageMode: NamedMoney[];
  byStatus: NamedCount[];
  byPaymentStatus: NamedCount[];
  bySettled: NamedCount[];
  byUrgency: NamedCount[];
  amountBuckets: NamedCount[];
  topOwners: NamedMoney[];
  topSchools: NamedCount[];
  byEducation: NamedCount[];
  bySchoolType: NamedCount[];
  topMajors: NamedCount[];
};

export type MonthlyTrendPoint = {
  month: string;
  revenue: number;
  settled: number;
  receivable: number;
  profit: number;
  cost: number;
  orderCount: number;
};

export type ReportKpis = {
  orderCount: number;
  clientCount: number;
  revenue: number;
  settled: number;
  receivable: number;
  profit: number;
  cost: number;
};

export type ReportsPayload = {
  kpis: ReportKpis;
  clientPersona: ClientPersonaReport;
  orderPersona: OrderPersonaReport;
  monthlyTrend: MonthlyTrendPoint[];
};

async function db() {
  await ensureSqliteDatabase();
  return getSqliteDatabase();
}

function labelOrUnknown(value: string | null | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed && trimmed !== "未知" ? trimmed : "未填/未知";
}

function toNamedCounts(rows: Array<{ key: string | null; count: number }>): NamedCount[] {
  return rows.map((row) => {
    const label = labelOrUnknown(row.key);
    return { key: row.key ?? label, label, count: row.count };
  });
}

function toNamedMoney(
  rows: Array<{
    key: string | null;
    count: number;
    amount: number;
    settled: number;
    profit: number;
    cost: number;
  }>
): NamedMoney[] {
  return rows.map((row) => {
    const label = labelOrUnknown(row.key);
    return {
      key: row.key ?? label,
      label,
      count: row.count,
      amount: row.amount,
      settled: row.settled,
      profit: row.profit,
      cost: row.cost
    };
  });
}

const amountBucketExpr = `
  CASE
    WHEN o.amount IS NULL OR o.amount <= 0 THEN '未填/0'
    WHEN o.amount < 1000 THEN '<1k'
    WHEN o.amount < 3000 THEN '1–3k'
    WHEN o.amount < 8000 THEN '3–8k'
    ELSE '8k+'
  END
`;

const budgetBucketExpr = `
  CASE
    WHEN c.preferred_budget IS NULL OR c.preferred_budget <= 0 THEN '未填/0'
    WHEN c.preferred_budget < 1000 THEN '<1k'
    WHEN c.preferred_budget < 3000 THEN '1–3k'
    WHEN c.preferred_budget < 8000 THEN '3–8k'
    ELSE '8k+'
  END
`;

export async function loadReportsPayload(filter: OverviewFilter = {}): Promise<ReportsPayload> {
  const database = await db();
  const { fromWhere, params } = buildOrderJoinWhere(filter);
  const clientOnly = buildClientWhere(filter);
  const orderOnly = hasOrderOnlyFilter(filter);

  const kpisRow = database
    .prepare(
      `
      SELECT
        COUNT(*) AS order_count,
        COUNT(DISTINCT c.id) AS client_count,
        COALESCE(SUM(o.amount), 0) AS revenue,
        COALESCE(SUM(o.settled_amount), 0) AS settled,
        COALESCE(SUM(o.receivable_amount), 0) AS receivable,
        COALESCE(SUM(o.profit_amount), 0) AS profit,
        COALESCE(SUM(o.cost_amount), 0) AS cost
      ${fromWhere}
    `
    )
    .get(...params) as {
    order_count: number;
    client_count: number;
    revenue: number;
    settled: number;
    receivable: number;
    profit: number;
    cost: number;
  };

  // --- client persona ---
  const clientScopeSql = orderOnly
    ? `FROM clients c WHERE c.id IN (SELECT DISTINCT o.client_id ${fromWhere})`
    : `FROM clients c WHERE ${clientOnly.where}`;
  const clientScopeParams = orderOnly ? params : clientOnly.params;

  const bySource = toNamedCounts(
    database
      .prepare(
        `SELECT c.source_channel AS key, COUNT(*) AS count ${clientScopeSql} GROUP BY c.source_channel ORDER BY count DESC`
      )
      .all(...clientScopeParams) as Array<{ key: string | null; count: number }>
  );

  const byRisk = toNamedCounts(
    database
      .prepare(
        `SELECT c.risk_level AS key, COUNT(*) AS count ${clientScopeSql} GROUP BY c.risk_level ORDER BY count DESC`
      )
      .all(...clientScopeParams) as Array<{ key: string | null; count: number }>
  );

  const byEducation = toNamedCounts(
    database
      .prepare(
        `SELECT c.education_level AS key, COUNT(*) AS count ${clientScopeSql} GROUP BY c.education_level ORDER BY count DESC`
      )
      .all(...clientScopeParams) as Array<{ key: string | null; count: number }>
  );

  const bySchoolType = toNamedCounts(
    database
      .prepare(
        `SELECT c.school_type AS key, COUNT(*) AS count ${clientScopeSql} GROUP BY c.school_type ORDER BY count DESC`
      )
      .all(...clientScopeParams) as Array<{ key: string | null; count: number }>
  );

  const topMajors = toNamedCounts(
    database
      .prepare(
        `SELECT c.major AS key, COUNT(*) AS count ${clientScopeSql} GROUP BY c.major ORDER BY count DESC LIMIT 10`
      )
      .all(...clientScopeParams) as Array<{ key: string | null; count: number }>
  );

  const topSchools = toNamedCounts(
    database
      .prepare(
        `SELECT c.school AS key, COUNT(*) AS count ${clientScopeSql} GROUP BY c.school ORDER BY count DESC LIMIT 10`
      )
      .all(...clientScopeParams) as Array<{ key: string | null; count: number }>
  );

  const budgetBuckets = toNamedCounts(
    database
      .prepare(
        `
        SELECT ${budgetBucketExpr} AS key, COUNT(*) AS count
        ${clientScopeSql}
        GROUP BY 1
        ORDER BY
          CASE ${budgetBucketExpr}
            WHEN '未填/0' THEN 0
            WHEN '<1k' THEN 1
            WHEN '1–3k' THEN 2
            WHEN '3–8k' THEN 3
            ELSE 4
          END
      `
      )
      .all(...clientScopeParams) as Array<{ key: string | null; count: number }>
  );

  const withOrders = (
    database
      .prepare(
        `
        SELECT COUNT(*) AS count
        ${clientScopeSql}
          AND EXISTS (SELECT 1 FROM orders ox WHERE ox.client_id = c.id)
      `
      )
      .get(...clientScopeParams) as { count: number }
  ).count;

  const totalScopedClients = (
    database.prepare(`SELECT COUNT(*) AS count ${clientScopeSql}`).get(...clientScopeParams) as {
      count: number;
    }
  ).count;

  const educationBySchoolType = database
    .prepare(
      `
      SELECT c.education_level AS education, c.school_type AS schoolType, COUNT(*) AS count
      ${clientScopeSql}
      GROUP BY c.education_level, c.school_type
      ORDER BY count DESC
      LIMIT 40
    `
    )
    .all(...clientScopeParams) as Array<{ education: string; schoolType: string; count: number }>;

  // --- order persona ---
  const moneySelect = `
    COUNT(*) AS count,
    COALESCE(SUM(o.amount), 0) AS amount,
    COALESCE(SUM(o.settled_amount), 0) AS settled,
    COALESCE(SUM(o.profit_amount), 0) AS profit,
    COALESCE(SUM(o.cost_amount), 0) AS cost
  `;

  const bySourceOrders = toNamedMoney(
    database
      .prepare(
        `SELECT o.source_type AS key, ${moneySelect} ${fromWhere} GROUP BY o.source_type ORDER BY amount DESC`
      )
      .all(...params) as Array<{
      key: string | null;
      count: number;
      amount: number;
      settled: number;
      profit: number;
      cost: number;
    }>
  );

  const byServiceType = toNamedMoney(
    database
      .prepare(
        `SELECT o.service_type AS key, ${moneySelect} ${fromWhere} GROUP BY o.service_type ORDER BY amount DESC`
      )
      .all(...params) as Array<{
      key: string | null;
      count: number;
      amount: number;
      settled: number;
      profit: number;
      cost: number;
    }>
  );

  const byPackageMode = toNamedMoney(
    database
      .prepare(
        `SELECT o.package_mode AS key, ${moneySelect} ${fromWhere} GROUP BY o.package_mode ORDER BY amount DESC LIMIT 12`
      )
      .all(...params) as Array<{
      key: string | null;
      count: number;
      amount: number;
      settled: number;
      profit: number;
      cost: number;
    }>
  );

  const byStatus = toNamedCounts(
    database
      .prepare(
        `SELECT o.status AS key, COUNT(*) AS count ${fromWhere} GROUP BY o.status ORDER BY count DESC`
      )
      .all(...params) as Array<{ key: string | null; count: number }>
  );

  const byPaymentStatus = toNamedCounts(
    database
      .prepare(
        `SELECT o.payment_status AS key, COUNT(*) AS count ${fromWhere} GROUP BY o.payment_status ORDER BY count DESC`
      )
      .all(...params) as Array<{ key: string | null; count: number }>
  );

  const bySettled = toNamedCounts(
    database
      .prepare(
        `
        SELECT CASE WHEN o.is_settled = 1 THEN '已结清' ELSE '未结清' END AS key,
               COUNT(*) AS count
        ${fromWhere}
        GROUP BY o.is_settled
        ORDER BY count DESC
      `
      )
      .all(...params) as Array<{ key: string | null; count: number }>
  );

  const byUrgency = toNamedCounts(
    database
      .prepare(
        `SELECT o.urgency AS key, COUNT(*) AS count ${fromWhere} GROUP BY o.urgency ORDER BY count DESC`
      )
      .all(...params) as Array<{ key: string | null; count: number }>
  );

  const amountBuckets = toNamedCounts(
    database
      .prepare(
        `
        SELECT ${amountBucketExpr} AS key, COUNT(*) AS count
        ${fromWhere}
        GROUP BY 1
        ORDER BY
          CASE ${amountBucketExpr}
            WHEN '未填/0' THEN 0
            WHEN '<1k' THEN 1
            WHEN '1–3k' THEN 2
            WHEN '3–8k' THEN 3
            ELSE 4
          END
      `
      )
      .all(...params) as Array<{ key: string | null; count: number }>
  );

  const topOwners = toNamedMoney(
    database
      .prepare(
        `SELECT o.owner_name AS key, ${moneySelect} ${fromWhere} GROUP BY o.owner_name ORDER BY amount DESC LIMIT 10`
      )
      .all(...params) as Array<{
      key: string | null;
      count: number;
      amount: number;
      settled: number;
      profit: number;
      cost: number;
    }>
  );

  const orderTopSchools = toNamedCounts(
    database
      .prepare(
        `
        SELECT COALESCE(NULLIF(TRIM(o.school), ''), NULLIF(TRIM(c.school), ''), '未知') AS key,
               COUNT(*) AS count
        ${fromWhere}
        GROUP BY 1
        ORDER BY count DESC
        LIMIT 10
      `
      )
      .all(...params) as Array<{ key: string | null; count: number }>
  );

  const orderByEducation = toNamedCounts(
    database
      .prepare(
        `
        SELECT COALESCE(NULLIF(TRIM(o.education_level), ''), NULLIF(TRIM(c.education_level), ''), '未知') AS key,
               COUNT(*) AS count
        ${fromWhere}
        GROUP BY 1
        ORDER BY count DESC
      `
      )
      .all(...params) as Array<{ key: string | null; count: number }>
  );

  const orderBySchoolType = toNamedCounts(
    database
      .prepare(
        `
        SELECT COALESCE(NULLIF(TRIM(o.school_type), ''), NULLIF(TRIM(c.school_type), ''), '未知') AS key,
               COUNT(*) AS count
        ${fromWhere}
        GROUP BY 1
        ORDER BY count DESC
      `
      )
      .all(...params) as Array<{ key: string | null; count: number }>
  );

  const orderTopMajors = toNamedCounts(
    database
      .prepare(
        `
        SELECT COALESCE(NULLIF(TRIM(o.major), ''), NULLIF(TRIM(c.major), ''), '未知') AS key,
               COUNT(*) AS count
        ${fromWhere}
        GROUP BY 1
        ORDER BY count DESC
        LIMIT 10
      `
      )
      .all(...params) as Array<{ key: string | null; count: number }>
  );

  const monthlyTrend = (
    database
      .prepare(
        `
        SELECT
          CASE
            WHEN o.transaction_date IS NULL OR TRIM(o.transaction_date) = '' THEN '未填日期'
            ELSE substr(o.transaction_date, 1, 7)
          END AS month,
          COALESCE(SUM(o.amount), 0) AS revenue,
          COALESCE(SUM(o.settled_amount), 0) AS settled,
          COALESCE(SUM(o.receivable_amount), 0) AS receivable,
          COALESCE(SUM(o.profit_amount), 0) AS profit,
          COALESCE(SUM(o.cost_amount), 0) AS cost,
          COUNT(*) AS orderCount
        ${fromWhere}
        GROUP BY 1
        ORDER BY 1 ASC
      `
      )
      .all(...params) as MonthlyTrendPoint[]
  ).map((row) => ({
    month: row.month,
    revenue: row.revenue,
    settled: row.settled,
    receivable: row.receivable,
    profit: row.profit,
    cost: row.cost,
    orderCount: row.orderCount
  }));

  return {
    kpis: {
      orderCount: kpisRow.order_count,
      clientCount: kpisRow.client_count,
      revenue: kpisRow.revenue,
      settled: kpisRow.settled,
      receivable: kpisRow.receivable,
      profit: kpisRow.profit,
      cost: kpisRow.cost
    },
    clientPersona: {
      bySource,
      byRisk,
      byEducation,
      bySchoolType,
      topMajors,
      topSchools,
      budgetBuckets,
      conversion: {
        withOrders,
        withoutOrders: Math.max(0, totalScopedClients - withOrders)
      },
      educationBySchoolType: educationBySchoolType.map((row) => ({
        education: labelOrUnknown(row.education),
        schoolType: labelOrUnknown(row.schoolType),
        count: row.count
      }))
    },
    orderPersona: {
      bySource: bySourceOrders,
      byServiceType,
      byPackageMode,
      byStatus,
      byPaymentStatus,
      bySettled,
      byUrgency,
      amountBuckets,
      topOwners,
      topSchools: orderTopSchools,
      byEducation: orderByEducation,
      bySchoolType: orderBySchoolType,
      topMajors: orderTopMajors
    },
    monthlyTrend
  };
}
