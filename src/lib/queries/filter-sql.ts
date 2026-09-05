import "server-only";

import type { OverviewFilter } from "@/lib/queries/overview";

export function hasOrderOnlyFilter(filter: OverviewFilter) {
  return Boolean(
    (filter.sourceType && filter.sourceType !== "all") ||
      (filter.serviceType && filter.serviceType !== "all") ||
      (filter.settledState && filter.settledState !== "all") ||
      filter.dateFrom ||
      filter.dateTo
  );
}

export function buildClientWhere(filter: OverviewFilter) {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (filter.clientSource && filter.clientSource !== "all") {
    conditions.push("c.source_channel = ?");
    params.push(filter.clientSource);
  }
  if (filter.riskLevel && filter.riskLevel !== "all") {
    conditions.push("c.risk_level = ?");
    params.push(filter.riskLevel);
  }
  if (filter.educationLevel && filter.educationLevel !== "all") {
    conditions.push("c.education_level = ?");
    params.push(filter.educationLevel);
  }
  if (filter.schoolType && filter.schoolType !== "all") {
    conditions.push("c.school_type = ?");
    params.push(filter.schoolType);
  }

  return { where: conditions.join(" AND "), params };
}

export function buildOrderJoinWhere(filter: OverviewFilter) {
  const client = buildClientWhere(filter);
  const conditions = [client.where];
  const params = [...client.params];

  if (filter.sourceType && filter.sourceType !== "all") {
    conditions.push("o.source_type = ?");
    params.push(filter.sourceType);
  }
  if (filter.serviceType && filter.serviceType !== "all") {
    conditions.push("o.service_type = ?");
    params.push(filter.serviceType);
  }
  if (filter.settledState === "settled") {
    conditions.push("o.is_settled = 1");
  } else if (filter.settledState === "unsettled") {
    conditions.push("o.is_settled = 0");
  }
  if (filter.dateFrom) {
    conditions.push("o.transaction_date >= ?");
    params.push(filter.dateFrom);
  }
  if (filter.dateTo) {
    conditions.push("o.transaction_date <= ?");
    params.push(filter.dateTo);
  }

  return {
    fromWhere: `
      FROM orders o
      INNER JOIN clients c ON c.id = o.client_id
      WHERE ${conditions.join(" AND ")}
    `,
    params
  };
}
