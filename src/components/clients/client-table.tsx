"use client";

import { ClientOrderDialog } from "@/components/clients/client-order-dialog";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { StatTile } from "@/components/ui/stat-tile";
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
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                    {client.name}
                  </h3>
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

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:w-[720px]">
                <StatTile label="累计工单" value={client.orderCount} />
                <StatTile
                  label="预设预算"
                  value={`¥${(client.preferredBudget ?? 0).toLocaleString()}`}
                />
                <StatTile
                  label="预设服务"
                  value={client.preferredServiceType ?? "未设置"}
                  valueClassName="mt-2 text-sm font-medium text-slate-900"
                />
                <StatTile
                  label="最近工单"
                  value={client.latestOrderTitle ?? "尚未生成工单"}
                  valueClassName="mt-2 text-sm font-medium text-slate-900"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button type="button" onClick={() => onViewClient?.(client)}>
                查看详情
              </Button>
              <Button type="button" onClick={() => onEditClient?.(client)}>
                直接编辑
              </Button>
              <ButtonLink href={`/orders?clientId=${client.id}`}>查看关联工单</ButtonLink>
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
