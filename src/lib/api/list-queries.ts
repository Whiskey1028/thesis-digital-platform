import "server-only";

import {
  paginate,
  isPaginatedRequest,
  type ClientListQuery,
  type OrderListQuery,
  type PaginatedResult,
  type WriterListQuery
} from "@/lib/api/pagination";
import { countActiveOrdersForWriter } from "@/lib/domain/order-status";
import { repositories } from "@/lib/repositories";
import type { Client, Order, Writer } from "@/lib/types";

function includesQuery(value: string, query?: string) {
  if (!query) {
    return true;
  }

  return value.toLowerCase().includes(query.toLowerCase());
}

function sortClients(items: Client[], sort: ClientListQuery["sort"]) {
  const next = [...items];

  switch (sort) {
    case "name_desc":
      next.sort((a, b) => b.name.localeCompare(a.name, "zh-CN"));
      break;
    case "created_desc":
      next.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case "budget_desc":
      next.sort((a, b) => (b.preferredBudget ?? 0) - (a.preferredBudget ?? 0));
      break;
    case "name_asc":
    default:
      next.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  }

  return next;
}

function sortOrders(items: Order[], sort: OrderListQuery["sort"]) {
  const next = [...items];

  switch (sort) {
    case "deadline_desc":
      next.sort((a, b) => b.deadline.localeCompare(a.deadline));
      break;
    case "amount_desc":
      next.sort((a, b) => b.amount - a.amount);
      break;
    case "created_desc":
      next.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case "deadline_asc":
    default:
      next.sort((a, b) => a.deadline.localeCompare(b.deadline));
  }

  return next;
}

function sortWriters(items: Writer[], sort: WriterListQuery["sort"]) {
  const next = [...items];

  switch (sort) {
    case "rating_desc":
      next.sort((a, b) => b.rating - a.rating);
      break;
    case "load_desc":
      next.sort((a, b) => b.activeOrderCount - a.activeOrderCount);
      break;
    case "capacity_desc":
      next.sort((a, b) => b.capacity - a.capacity);
      break;
    case "name_asc":
    default:
      next.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  }

  return next;
}

function filterClients(items: Client[], query: ClientListQuery) {
  return items.filter((client) => {
    if (query.risk && query.risk !== "all" && client.riskLevel !== query.risk) {
      return false;
    }

    if (!query.q) {
      return true;
    }

    return (
      includesQuery(client.name, query.q) ||
      includesQuery(client.contactHandle, query.q) ||
      includesQuery(client.school, query.q) ||
      includesQuery(client.major, query.q)
    );
  });
}

function filterOrders(items: Order[], query: OrderListQuery) {
  return items.filter((order) => {
    if (query.status && query.status !== "all" && order.status !== query.status) {
      return false;
    }

    if (query.sourceType && query.sourceType !== "all" && order.sourceType !== query.sourceType) {
      return false;
    }

    if (query.urgency && query.urgency !== "all" && order.urgency !== query.urgency) {
      return false;
    }

    if (query.clientId && order.clientId !== query.clientId) {
      return false;
    }

    if (query.writerId && order.writerId !== query.writerId) {
      return false;
    }

    if (!query.q) {
      return true;
    }

    return (
      includesQuery(order.title, query.q) ||
      includesQuery(order.clientName ?? "", query.q) ||
      includesQuery(order.ownerName, query.q)
    );
  });
}

function filterWriters(items: Writer[], query: WriterListQuery) {
  return items.filter((writer) => {
    if (query.availability && query.availability !== "all" && writer.availability !== query.availability) {
      return false;
    }

    if (!query.q) {
      return true;
    }

    return (
      includesQuery(writer.name, query.q) ||
      writer.specialties.some((item) => includesQuery(item, query.q))
    );
  });
}

function finalizeList<T>(items: T[], query: { page?: number; pageSize?: number }) {
  if (!isPaginatedRequest(query)) {
    return items;
  }

  return paginate(items, query.page ?? 1, query.pageSize ?? 20);
}

export async function queryClients(
  query: ClientListQuery = {}
): Promise<Client[] | PaginatedResult<Client>> {
  const clients = await repositories.clients.list();
  const filtered = sortClients(filterClients(clients, query), query.sort);
  return finalizeList(filtered, query);
}

export async function queryOrders(
  query: OrderListQuery = {}
): Promise<Order[] | PaginatedResult<Order>> {
  const orders = await repositories.orders.list();
  const filtered = sortOrders(filterOrders(orders, query), query.sort);
  return finalizeList(filtered, query);
}

export async function queryWriters(
  query: WriterListQuery = {}
): Promise<Writer[] | PaginatedResult<Writer>> {
  const [writers, orders] = await Promise.all([
    repositories.writers.list(),
    repositories.orders.list()
  ]);

  const withLoad = writers.map((writer) => ({
    ...writer,
    activeOrderCount: countActiveOrdersForWriter(writer.id, orders)
  }));

  const filtered = sortWriters(filterWriters(withLoad, query), query.sort);
  return finalizeList(filtered, query);
}
