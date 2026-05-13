import { Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { KpiCard } from "@/components/ui/kpi-card";
import { WriterCreateSection } from "@/components/writers/writer-create-section";
import { WriterManagementPanel } from "@/components/writers/writer-management-panel";
import { repositories } from "@/lib/repositories";

export default async function WritersPage() {
  const writers = await repositories.writers.list();

  const totalCapacity = writers.reduce((sum, writer) => sum + writer.capacity, 0);
  const activeLoad = writers.reduce((sum, writer) => sum + writer.activeOrderCount, 0);
  const averageRating =
    writers.length === 0
      ? 0
      : (writers.reduce((sum, writer) => sum + writer.rating, 0) / writers.length).toFixed(1);

  return (
    <div className="space-y-6 pb-10">
      <Topbar
        title="论文写手"
        description="写手池单独管理，不依附具体客户。这里既看人，也看当前可承载能力，方便后续做分单策略。"
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <KpiCard label="总容量" value={totalCapacity} detail="可容纳的并行工单上限" />
        <KpiCard label="当前负载" value={activeLoad} detail="当前已占用的工单容量" />
        <KpiCard label="平均评分" value={averageRating} detail="基于当前写手池统计" />
      </section>

      <Suspense fallback={<div className="rounded-[28px] border border-white/60 bg-white/72 p-6 text-sm text-slate-500">正在载入写手创建区...</div>}>
        <WriterCreateSection />
      </Suspense>

      <Suspense fallback={<div className="rounded-[28px] border border-white/60 bg-white/72 p-6 text-sm text-slate-500">正在载入写手管理...</div>}>
        <WriterManagementPanel writers={writers} />
      </Suspense>
    </div>
  );
}
