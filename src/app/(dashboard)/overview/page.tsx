import { Suspense } from "react";
import { OverviewFilterPanel } from "@/components/dashboard/overview-filter-panel";
import { Topbar } from "@/components/layout/topbar";
import { repositories } from "@/lib/repositories";

export default async function OverviewPage() {
  const [orders, writers, clients] = await Promise.all([
    repositories.orders.list(),
    repositories.writers.list(),
    repositories.clients.list()
  ]);

  return (
    <div className="pb-10">
      <Topbar
        title="经营总览"
        description="先从客户档案发起，再把工单和写手调度串起来。这里先提供轻量级数据统计，未来切到 SQLite 后也能平滑迁移到 Grafana。"
      />
      <Suspense fallback={<div className="mt-6 rounded-[28px] border border-white/60 bg-white/72 p-6 text-sm text-slate-500">正在载入总览筛选...</div>}>
        <OverviewFilterPanel orders={orders} writers={writers} clients={clients} />
      </Suspense>
    </div>
  );
}
