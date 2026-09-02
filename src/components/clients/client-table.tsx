"use client";

import Link from "next/link";
import { ClientOrderDialog } from "@/components/clients/client-order-dialog";
import { StatusPill } from "@/components/ui/status-pill";
import { createOrderDraftFromClient } from "@/lib/server/order-drafts";
import type { ClientListItem } from "@/lib/api/list-queries";
import type { Writer } from "@/lib/types";

function riskTone(risk: ClientListItem["riskLevel"]) {
  switch (risk) {
    case "high":
      return "red";
    case "medium":
      return "amber";
    default:
      return "green";
  }
}

export function ClientTable({
  clients,
  writers,
  onViewClient,
  onEditClient
}: {
  clients: ClientListItem[];
  writers: Writer[];
  onViewClient?: (client: ClientListItem) => void;
  onEditClient?: (client: ClientListItem) => void;
}) {
  return (
    <div className="space-y-4">
      {clients.map((client) => {
        const draft = createOrderDraftFromClient(client);

        return (
          <article
            key={client.id}
            className="rounded-[30px] border border-white/65 bg-white/78 p-5 shadow-soft backdrop-blur-xl"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{client.name}</h3>
                  <StatusPill label={client.riskLevel} tone={riskTone(client.riskLevel)} />
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                    {client.sourceChannel}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  {client.schoolType} / {client.educationLevel} / {client.school} / {client.major}
                </p>
                <p className="mt-2 text-sm text-slate-500">联系方式 {client.contactHandle}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{client.notes}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-4 xl:w-[720px]">
                <div className="rounded-[22px] bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">累计工单</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{client.orderCount}</p>
                </div>
                <div className="rounded-[22px] bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">预设预算</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    ¥{(client.preferredBudget ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-[22px] bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">预设服务</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {client.preferredServiceType ?? "未设置"}
                  </p>
                </div>
                <div className="rounded-[22px] bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">最近工单</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {client.latestOrderTitle ?? "尚未生成工单"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onViewClient?.(client)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
              >
                查看详情
              </button>
              <button
                type="button"
                onClick={() => onEditClient?.(client)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
              >
                直接编辑
              </button>
              <Link
                href={`/orders?clientId=${client.id}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
              >
                查看关联工单
              </Link>
            </div>

            <div className="mt-5 flex flex-col gap-4 rounded-[24px] bg-slate-950 px-5 py-4 text-white lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-slate-300">自动带入字段</p>
                <p className="mt-2 text-sm leading-6">
                  题目、学校类型、学历、学校、专业、来源、默认预算、默认截止时间和服务类型将直接进入工单弹窗。
                </p>
              </div>
              <ClientOrderDialog client={client} draft={draft} writers={writers} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
