import type { Client, OrderDraft } from "@/lib/types";

export function createOrderDraftFromClient(client: Client): OrderDraft {
  const amount = client.preferredBudget ?? 0;

  return {
    clientId: client.id,
    clientName: client.name,
    sourceType: "self_owned",
    title: client.preferredTitle ?? "",
    schoolType: client.schoolType,
    school: client.school,
    educationLevel: client.educationLevel,
    major: client.major,
    serviceType: client.preferredServiceType ?? "论文全文",
    packageMode: client.preferredServiceType ?? "论文全文",
    writerId: null,
    ownerName: "自营",
    deadline: client.preferredDeadline ?? "",
    writerDeadline: client.preferredDeadline ?? "",
    completedAt: "",
    transactionDate: new Date().toISOString().slice(0, 10),
    amount,
    settledAmount: 0,
    receivableAmount: amount,
    costAmount: 0,
    profitAmount: amount,
    paymentStatus: "pending",
    isSettled: false,
    urgency: client.riskLevel === "high" ? "high" : "medium",
    status: "lead",
    sourceChannel: client.sourceChannel,
    notes: client.notes,
    remark: ""
  };
}
