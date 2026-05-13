import { NextResponse } from "next/server";
import { repositories } from "@/lib/repositories";
import { createOrderDraftFromClient } from "@/lib/server/order-drafts";
import { createOrderFromClientSchema } from "@/lib/validation";
import type { Order } from "@/lib/types";

function createOrderId() {
  return `ord_${Date.now()}`;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await repositories.clients.getById(id);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const parsed = createOrderFromClientSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const baseDraft = createOrderDraftFromClient(client);
  const payload = { ...baseDraft, ...parsed.data };

  const order: Order = {
    id: createOrderId(),
    clientId: client.id,
    sourceType: payload.sourceType,
    title: payload.title,
    serviceType: payload.serviceType,
    packageMode: payload.packageMode,
    writerId: payload.writerId,
    ownerName: payload.ownerName,
    status: payload.status,
    deadline: payload.deadline,
    writerDeadline: payload.writerDeadline || undefined,
    completedAt: payload.completedAt || undefined,
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const created = await repositories.orders.create(order);
  return NextResponse.json({ data: created }, { status: 201 });
}
