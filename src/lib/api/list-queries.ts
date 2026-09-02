import "server-only";

import type {
  ClientListQuery,
  OrderListQuery,
  PaginatedResult,
  WriterListQuery
} from "@/lib/api/pagination";
import {
  sqliteQueryClients,
  sqliteQueryOrderBoardItems,
  sqliteQueryOrders,
  sqliteQueryWriters,
  type ClientListItem
} from "@/lib/server/sqlite/list-queries";
import type { Client, Order, Writer } from "@/lib/types";

export type { ClientListItem };

export async function queryClients(
  query: ClientListQuery = {}
): Promise<Client[] | PaginatedResult<ClientListItem>> {
  return sqliteQueryClients(query);
}

export async function queryOrders(
  query: OrderListQuery = {}
): Promise<Order[] | PaginatedResult<Order>> {
  return sqliteQueryOrders(query);
}

export async function queryWriters(
  query: WriterListQuery = {}
): Promise<Writer[] | PaginatedResult<Writer>> {
  return sqliteQueryWriters(query);
}

export async function queryOrderBoardItems() {
  return sqliteQueryOrderBoardItems();
}
