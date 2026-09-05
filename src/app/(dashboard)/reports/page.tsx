import { Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { ReportsView } from "@/components/reports/reports-view";
import { loadOverviewFilterOptions } from "@/lib/queries/overview";
import { parseOverviewPageQuery } from "@/lib/queries/page-params";
import { loadReportsPayload } from "@/lib/queries/reports";

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const filter = parseOverviewPageQuery(params);

  const [data, options] = await Promise.all([
    loadReportsPayload(filter),
    loadOverviewFilterOptions()
  ]);

  return (
    <div className="pb-10">
      <Topbar title="可视化报表" description="客户画像、订单画像与交易月趋势；筛选与总览共用口径。" />
      <Suspense
        fallback={
          <div className="mt-6 rounded-[28px] border border-white/60 bg-white/72 p-6 text-sm text-slate-500">
            正在载入报表...
          </div>
        }
      >
        <ReportsView data={data} options={options} />
      </Suspense>
    </div>
  );
}
