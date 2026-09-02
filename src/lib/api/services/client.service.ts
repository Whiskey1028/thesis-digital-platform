import "server-only";

import { createEntityId } from "@/lib/api/ids";
import { ApiError } from "@/lib/api/errors";
import { type ClientListQuery } from "@/lib/api/pagination";
import { queryClients } from "@/lib/api/list-queries";
import { repositories } from "@/lib/repositories";
import type { Client } from "@/lib/types";
import type { ClientInput } from "@/lib/validation";

export async function listClients(query: ClientListQuery = {}) {
  return queryClients(query);
}

export async function getClientById(id: string) {
  const client = await repositories.clients.getById(id);

  if (!client) {
    throw ApiError.notFound("Client");
  }

  return client;
}

export async function createClient(input: ClientInput) {
  const now = new Date().toISOString();
  const client: Client = {
    id: createEntityId("cli"),
    ...input,
    lastContactAt: now,
    createdAt: now
  };

  return repositories.clients.create(client);
}

export async function updateClient(id: string, input: Partial<ClientInput>) {
  const updated = await repositories.clients.update(id, input);

  if (!updated) {
    throw ApiError.notFound("Client");
  }

  return updated;
}

export async function deleteClient(id: string) {
  const relatedOrders = await repositories.orders.countByClientId(id);

  if (relatedOrders > 0) {
    throw ApiError.conflict("Client has related orders and cannot be deleted.", {
      relatedOrderCount: relatedOrders
    });
  }

  const removed = await repositories.clients.remove(id);

  if (!removed) {
    throw ApiError.notFound("Client");
  }
}
