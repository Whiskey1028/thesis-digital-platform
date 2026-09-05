import "server-only";

import {
  clientListQuerySchema,
  orderListQuerySchema,
  writerListQuerySchema,
  type ClientListQuery,
  type OrderListQuery,
  type WriterListQuery
} from "@/lib/api/pagination";
import { overviewFilterSchema } from "@/lib/queries/overview";
import { inboxQuerySchema, type InboxQuery } from "@/lib/queries/inbox";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function toParamRecord(searchParams: SearchParams) {
  const record: Record<string, string> = {};

  for (const [key, value] of Object.entries(searchParams)) {
    const normalized = firstValue(value);
    if (normalized !== undefined) {
      record[key] = normalized;
    }
  }

  return record;
}

export function parseClientPageQuery(searchParams: SearchParams): ClientListQuery {
  const raw = toParamRecord(searchParams);

  return clientListQuerySchema.parse({
    q: raw.clientQuery ?? raw.clientListQuery,
    risk: raw.clientRisk ?? raw.clientListRisk,
    sort: raw.clientSort ?? raw.clientQuickSort ?? raw.clientListSort,
    id: raw.clientId,
    page: raw.clientPage ?? "1",
    pageSize: raw.clientPageSize ?? "10"
  });
}

function mapOrderSort(raw?: string) {
  if (raw === "date_desc") {
    return "created_desc";
  }

  return raw;
}

export function parseOrderPageQuery(searchParams: SearchParams): OrderListQuery {
  const raw = toParamRecord(searchParams);

  return orderListQuerySchema.parse({
    q: raw.orderQuery ?? raw.orderListQuery,
    status: raw.orderStatus ?? raw.orderListStatus,
    sourceType: raw.orderSourceType ?? raw.orderListSourceType,
    urgency: raw.orderUrgency,
    settledState: raw.orderSettledState,
    serviceType: raw.orderServiceType,
    clientId: raw.clientId,
    writerId: raw.writerId,
    sort: mapOrderSort(raw.orderSort ?? raw.orderQuickSort ?? raw.orderListSort),
    page: raw.orderPage ?? "1",
    pageSize: raw.orderPageSize ?? raw.orderListPageSize ?? "10"
  });
}

export function parseWriterPageQuery(searchParams: SearchParams): WriterListQuery {
  const raw = toParamRecord(searchParams);
  const sortRaw = raw.writerSort ?? raw.writerQuickSort ?? raw.writerListSort;
  const sort = sortRaw === "created_desc" ? "name_asc" : sortRaw;

  return writerListQuerySchema.parse({
    q: raw.writerQuery ?? raw.writerListQuery,
    availability: raw.writerAvailability ?? raw.writerListAvailability,
    id: raw.writerId,
    sort,
    page: raw.writerPage ?? "1",
    pageSize: raw.writerPageSize ?? "8"
  });
}

export function parseOverviewPageQuery(searchParams: SearchParams) {
  const raw = toParamRecord(searchParams);

  return overviewFilterSchema.parse({
    sourceType: raw.overviewSourceType,
    clientSource: raw.overviewClientSource,
    riskLevel: raw.overviewRiskLevel,
    serviceType: raw.overviewServiceType,
    educationLevel: raw.overviewEducationLevel,
    schoolType: raw.overviewSchoolType,
    settledState: raw.overviewSettledState,
    dateFrom: raw.overviewDateFrom,
    dateTo: raw.overviewDateTo
  });
}

export function parseInboxPageQuery(searchParams: SearchParams): InboxQuery {
  const raw = toParamRecord(searchParams);

  return inboxQuerySchema.parse({
    q: raw.inboxQuery,
    status: raw.inboxStatus,
    sourceType: raw.inboxSourceType,
    urgency: raw.inboxUrgency,
    focus: raw.inboxFocus,
    page: raw.inboxPage ?? "1",
    pageSize: raw.inboxPageSize ?? "20"
  });
}
