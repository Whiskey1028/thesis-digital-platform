import { Suspense } from "react";
import { OverviewFilterPanel } from "@/components/dashboard/overview-filter-panel";
import { Topbar } from "@/components/layout/topbar";
import { loadOverviewFilterOptions, loadOverviewMetrics } from "@/lib/queries/overview";
import { parseOverviewPageQuery } from "@/lib/queries/page-params";

type OverviewPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  const params = await searchParams;
  const filter = parseOverviewPageQuery(params);

  const [metrics, options] = await Promise.all([
    loadOverviewMetrics(filter),
    loadOverviewFilterOptions()
  ]);

  return (
    <div className="pb-10">
      <Topbar
        title="经营总览"
        description="先从客户档案发起，再把工单和写手调度串起来。指标按当前筛选由 SQLite 聚合。"
      />
      <Suspense
        fallback={
          <div className="mt-6 rounded-[28px] border border-white/60 bg-white/72 p-6 text-sm text-slate-500">
            正在载入总览筛选...
          </div>
        }
      >
        <OverviewFilterPanel metrics={metrics} options={options} />
      </Suspense>
    </div>
  );
}
