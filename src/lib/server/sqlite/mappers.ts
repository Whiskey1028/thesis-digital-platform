import type { Client, Order, Writer } from "@/lib/types";

type ClientRow = {
  id: string;
  name: string;
  contact_handle: string;
  source_channel: string;
  school_type: string;
  school: string;
  education_level: string;
  major: string;
  risk_level: string;
  preferred_title: string | null;
  preferred_service_type: string | null;
  preferred_deadline: string | null;
  preferred_budget: number | null;
  notes: string | null;
  last_contact_at: string;
  created_at: string;
};

type WriterRow = {
  id: string;
  name: string;
  specialties: string;
  availability: string;
  capacity: number;
  rating: number;
  completion_rate: number;
  average_turnaround_days: number;
  price_tier: string;
  owner_name: string;
  settlement_mode: string;
  notes: string | null;
};

type OrderRow = {
  id: string;
  client_id: string;
  client_name: string | null;
  source_type: string;
  title: string;
  school_type: string | null;
  school: string | null;
  education_level: string | null;
  major: string | null;
  service_type: string;
  package_mode: string;
  writer_id: string | null;
  owner_name: string;
  status: string;
  deadline: string;
  writer_deadline: string | null;
  completed_at: string | null;
  transaction_date: string;
  amount: number;
  settled_amount: number;
  receivable_amount: number;
  cost_amount: number;
  profit_amount: number;
  payment_status: string;
  is_settled: number;
  urgency: string;
  source_channel: string;
  notes: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
};

export function mapClientRow(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    contactHandle: row.contact_handle,
    sourceChannel: row.source_channel,
    schoolType: row.school_type,
    school: row.school,
    educationLevel: row.education_level as Client["educationLevel"],
    major: row.major,
    riskLevel: row.risk_level as Client["riskLevel"],
    preferredTitle: row.preferred_title ?? undefined,
    preferredServiceType: row.preferred_service_type ?? undefined,
    preferredDeadline: row.preferred_deadline ?? undefined,
    preferredBudget: row.preferred_budget ?? undefined,
    notes: row.notes ?? undefined,
    lastContactAt: row.last_contact_at,
    createdAt: row.created_at
  };
}

export function clientToRow(client: Client): ClientRow {
  return {
    id: client.id,
    name: client.name,
    contact_handle: client.contactHandle,
    source_channel: client.sourceChannel,
    school_type: client.schoolType,
    school: client.school,
    education_level: client.educationLevel,
    major: client.major,
    risk_level: client.riskLevel,
    preferred_title: client.preferredTitle ?? null,
    preferred_service_type: client.preferredServiceType ?? null,
    preferred_deadline: client.preferredDeadline ?? null,
    preferred_budget: client.preferredBudget ?? null,
    notes: client.notes ?? null,
    last_contact_at: client.lastContactAt,
    created_at: client.createdAt
  };
}

export function mapWriterRow(row: WriterRow, activeOrderCount = 0): Writer {
  return {
    id: row.id,
    name: row.name,
    specialties: JSON.parse(row.specialties) as string[],
    availability: row.availability as Writer["availability"],
    capacity: row.capacity,
    activeOrderCount,
    rating: row.rating,
    completionRate: row.completion_rate,
    averageTurnaroundDays: row.average_turnaround_days,
    priceTier: row.price_tier as Writer["priceTier"],
    ownerName: row.owner_name,
    settlementMode: row.settlement_mode,
    notes: row.notes ?? undefined
  };
}

export function writerToRow(writer: Writer): WriterRow {
  return {
    id: writer.id,
    name: writer.name,
    specialties: JSON.stringify(writer.specialties),
    availability: writer.availability,
    capacity: writer.capacity,
    rating: writer.rating,
    completion_rate: writer.completionRate,
    average_turnaround_days: writer.averageTurnaroundDays,
    price_tier: writer.priceTier,
    owner_name: writer.ownerName,
    settlement_mode: writer.settlementMode,
    notes: writer.notes ?? null
  };
}

export function mapOrderRow(row: OrderRow): Order {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name ?? undefined,
    sourceType: row.source_type as Order["sourceType"],
    title: row.title,
    schoolType: row.school_type ?? undefined,
    school: row.school ?? undefined,
    educationLevel: (row.education_level as Order["educationLevel"]) ?? undefined,
    major: row.major ?? undefined,
    serviceType: row.service_type,
    packageMode: row.package_mode,
    writerId: row.writer_id,
    ownerName: row.owner_name,
    status: row.status as Order["status"],
    deadline: row.deadline,
    writerDeadline: row.writer_deadline ?? undefined,
    completedAt: row.completed_at ?? undefined,
    transactionDate: row.transaction_date,
    amount: row.amount,
    settledAmount: row.settled_amount,
    receivableAmount: row.receivable_amount,
    costAmount: row.cost_amount,
    profitAmount: row.profit_amount,
    paymentStatus: row.payment_status as Order["paymentStatus"],
    isSettled: row.is_settled === 1,
    urgency: row.urgency as Order["urgency"],
    sourceChannel: row.source_channel,
    notes: row.notes ?? undefined,
    remark: row.remark ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function orderToRow(order: Order) {
  return {
    id: order.id,
    client_id: order.clientId,
    client_name: order.clientName ?? null,
    source_type: order.sourceType,
    title: order.title,
    school_type: order.schoolType ?? null,
    school: order.school ?? null,
    education_level: order.educationLevel ?? null,
    major: order.major ?? null,
    service_type: order.serviceType,
    package_mode: order.packageMode,
    writer_id: order.writerId,
    owner_name: order.ownerName,
    status: order.status,
    deadline: order.deadline,
    writer_deadline: order.writerDeadline ?? null,
    completed_at: order.completedAt ?? null,
    transaction_date: order.transactionDate,
    amount: order.amount,
    settled_amount: order.settledAmount,
    receivable_amount: order.receivableAmount,
    cost_amount: order.costAmount,
    profit_amount: order.profitAmount,
    payment_status: order.paymentStatus,
    is_settled: order.isSettled ? 1 : 0,
    urgency: order.urgency,
    source_channel: order.sourceChannel,
    notes: order.notes ?? null,
    remark: order.remark ?? null,
    created_at: order.createdAt,
    updated_at: order.updatedAt
  };
}

export type { ClientRow, WriterRow, OrderRow };
