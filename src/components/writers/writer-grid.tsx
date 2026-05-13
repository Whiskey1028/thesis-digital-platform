"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusPill } from "@/components/ui/status-pill";
import type { Writer } from "@/lib/types";

function availabilityTone(availability: Writer["availability"]) {
  switch (availability) {
    case "available":
      return "green";
    case "busy":
      return "amber";
    default:
      return "slate";
  }
}

export function WriterGrid({
  writers,
  onViewWriter,
  onEditWriter
}: {
  writers: Writer[];
  onViewWriter?: (writer: Writer) => void;
  onEditWriter?: (writer: Writer) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      {writers.map((writer) => (
        <GlassCard key={writer.id} className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-950">{writer.name}</h3>
              <p className="mt-2 text-sm text-slate-500">{writer.specialties.join(" / ")}</p>
            </div>
            <StatusPill label={writer.availability} tone={availabilityTone(writer.availability)} />
          </div>

          <div className="mt-3 text-sm text-slate-500">
            负责人 {writer.ownerName} / 结算方式 {writer.settlementMode}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-[22px] bg-white/85 p-4">
              <p className="text-xs text-slate-500">当前单量</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{writer.activeOrderCount}</p>
            </div>
            <div className="rounded-[22px] bg-white/85 p-4">
              <p className="text-xs text-slate-500">容量上限</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{writer.capacity}</p>
            </div>
            <div className="rounded-[22px] bg-white/85 p-4">
              <p className="text-xs text-slate-500">评分</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{writer.rating}</p>
            </div>
            <div className="rounded-[22px] bg-white/85 p-4">
              <p className="text-xs text-slate-500">完成率</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {Math.round(writer.completionRate * 100)}%
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onViewWriter?.(writer)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
            >
              查看详情
            </button>
            <button
              type="button"
              onClick={() => onEditWriter?.(writer)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
            >
              直接编辑
            </button>
            <Link
              href={`/orders?writerId=${writer.id}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
            >
              查看关联工单
            </Link>
          </div>

          <div className="mt-5 text-sm text-slate-500">
            平均交付周期 {writer.averageTurnaroundDays} 天，报价层级 {writer.priceTier}。
          </div>
          {writer.notes ? <div className="mt-3 text-sm leading-6 text-slate-500">{writer.notes}</div> : null}
        </GlassCard>
      ))}
    </div>
  );
}
