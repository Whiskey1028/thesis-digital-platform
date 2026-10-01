import { Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { OrderPageSections } from "@/components/orders/order-page-sections";
import { KpiCard } from "@/components/ui/kpi-card";
import { queryOrderBoard, queryOrders } from "@/lib/api/list-queries";
import { getOrderPageKpis } from "@/lib/queries/kpi";
import { parseOrderPageQuery } from "@/lib/queries/page-params";
import { loadWriterOptions } from "@/lib/queries/writer-options";
import { loadOverviewFilterOptions } from "@/lib/queries/overview";
import type { PaginatedResult } from "@/lib/api/pagination";
import type { Order } from "@/lib/types";

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const listQuery = parseOrderPageQuery(params);

  const [kpis, listResult, boardColumns, writers, filterOptions] = await Promise.all([
    getOrderPageKpis(),
    queryOrders(listQuery),
    queryOrderBoard(),
    loadWriterOptions(),
    loadOverviewFilterOptions()
  ]);

  const list = listResult as PaginatedResult<Order>;

  return (
    <div className="space-y-6 pb-10">
      <Topbar
        title="论文工单"
        description="自接/转包、节点、成本利润与回款；工单须从客户档案创建。"
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="待分配工单" value={kpis.unassignedOrders} detail="适合优先安排写手" />
        <KpiCard label="高优先级工单" value={kpis.urgentOrders} detail="需要重点盯催节点" />
        <KpiCard label="转包工单" value={kpis.outsourcedOrders} detail="关注成本和利润空间" />
        <KpiCard
          label="应收账款"
          value={`¥${kpis.unpaidReceivables.toLocaleString()}`}
          detail="还未完全回款的金额"
        />
      </section>

      <Suspense
        fallback={
          <div className="rounded-[28px] border border-white/60 bg-white/72 p-6 text-sm text-slate-500">
            正在载入工单管理...
          </div>
        }
      >
        <OrderPageSections
          boardColumns={boardColumns}
          list={list}
          writers={writers}
          serviceTypeFilterOptions={filterOptions.serviceTypes}
        />
      </Suspense>
    </div>
  );
}
