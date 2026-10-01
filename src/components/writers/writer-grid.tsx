"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { StatTile } from "@/components/ui/stat-tile";
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

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <StatTile
              label="当前单量"
              value={writer.activeOrderCount}
              className="bg-white/85"
            />
            <StatTile label="容量上限" value={writer.capacity} className="bg-white/85" />
            <StatTile label="评分" value={writer.rating} className="bg-white/85" />
            <StatTile
              label="完成率"
              value={`${Math.round(writer.completionRate * 100)}%`}
              className="bg-white/85"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => onViewWriter?.(writer)}>
              查看详情
            </Button>
            <Button type="button" onClick={() => onEditWriter?.(writer)}>
              直接编辑
            </Button>
            <ButtonLink href={`/orders?writerId=${writer.id}`}>查看关联工单</ButtonLink>
          </div>

          <div className="mt-5 text-sm text-slate-500">
            平均交付周期 {writer.averageTurnaroundDays} 天，报价层级 {writer.priceTier}。
          </div>
          {writer.notes ? (
            <div className="mt-3 text-sm leading-6 text-slate-500">{writer.notes}</div>
          ) : null}
        </GlassCard>
      ))}
    </div>
  );
}
