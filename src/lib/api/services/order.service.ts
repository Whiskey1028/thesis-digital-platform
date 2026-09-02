import "server-only";

import { ApiError } from "@/lib/api/errors";
import { createEntityId } from "@/lib/api/ids";
import { queryOrders } from "@/lib/api/list-queries";
import type { OrderListQuery } from "@/lib/api/pagination";
import { createOrderDraftFromClient } from "@/lib/server/order-drafts";
import { repositories } from "@/lib/repositories";
import type { Order } from "@/lib/types";
import type { CreateOrderFromClientInput, UpdateOrderInput } from "@/lib/validation";

export async function listOrders(query: OrderListQuery = {}) {
  return queryOrders(query);
}

export async function getOrderById(id: string) {
  const order = await repositories.orders.getById(id);

  if (!order) {
    throw ApiError.notFound("Order");
  }

  return order;
}

export async function createOrderFromClient(clientId: string, input: CreateOrderFromClientInput) {
  const client = await repositories.clients.getById(clientId);

  if (!client) {
    throw ApiError.notFound("Client");
  }

  const baseDraft = createOrderDraftFromClient(client);
  const payload = { ...baseDraft, ...input };
  const now = new Date().toISOString();

  const order: Order = {
    id: createEntityId("ord"),
    clientId: client.id,
    clientName: client.name,
    sourceType: payload.sourceType,
    title: payload.title,
    schoolType: payload.schoolType,
    school: payload.school,
    educationLevel: payload.educationLevel,
    major: payload.major,
    serviceType: payload.serviceType,
    packageMode: payload.packageMode,
    writerId: payload.writerId,
    ownerName: payload.ownerName,
    status: payload.status,
    deadline: payload.deadline,
    writerDeadline: payload.writerDeadline ?? undefined,
    completedAt: payload.completedAt ?? undefined,
    transactionDate: payload.transactionDate,
    amount: payload.amount,
    settledAmount: payload.settledAmount,
    receivableAmount: payload.receivableAmount,
    costAmount: payload.costAmount,
    profitAmount: payload.profitAmount,
    paymentStatus: payload.paymentStatus,
    isSettled: payload.isSettled,
    urgency: payload.urgency,
    sourceChannel: client.sourceChannel,
    notes: payload.notes,
    remark: payload.remark,
    createdAt: now,
    updatedAt: now
  };

  return repositories.orders.create(order);
}

export async function updateOrder(id: string, input: UpdateOrderInput) {
  const updated = await repositories.orders.update(id, input);

  if (!updated) {
    throw ApiError.notFound("Order");
  }

  return updated;
}

export async function deleteOrder(id: string) {
  const removed = await repositories.orders.remove(id);

  if (!removed) {
    throw ApiError.notFound("Order");
  }
}

export function rejectDirectOrderCreation(): never {
  throw ApiError.methodNotAllowed("Orders must be created from a client profile.");
}
