import { Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { OrderPageSections } from "@/components/orders/order-page-sections";
import { GlassCard } from "@/components/ui/glass-card";
import { KpiCard } from "@/components/ui/kpi-card";
import { repositories } from "@/lib/repositories";

export default async function OrdersPage() {
  const [orders, writers, clients] = await Promise.all([
    repositories.orders.list(),
    repositories.writers.list(),
    repositories.clients.list()
  ]);

  const unassignedOrders = orders.filter((order) => order.writerId === null).length;
  const urgentOrders = orders.filter((order) => order.urgency === "high").length;
  const unpaidReceivables = orders.reduce((sum, order) => sum + order.receivableAmount, 0);
  const outsourcedOrders = orders.filter((order) => order.sourceType === "outsourced").length;

  return (
    <div className="space-y-6 pb-10">
      <Topbar
        title="论文工单"
        description="工单页现在已经对齐历史 Excel 的核心口径：自接/转包、学校类型、学历、服务方式、交易/交付时间、成本、利润、应收和负责人。"
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <KpiCard label="待分配工单" value={unassignedOrders} detail="适合优先安排写手" />
        <KpiCard label="高优先级工单" value={urgentOrders} detail="需要重点盯催节点" />
        <KpiCard label="转包工单" value={outsourcedOrders} detail="关注成本和利润空间" />
        <KpiCard label="应收账款" value={`¥${unpaidReceivables.toLocaleString()}`} detail="还未完全回款的金额" />
      </section>

      <GlassCard className="p-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">客户驱动的工单流转</h3>
            <p className="mt-2 text-sm text-slate-500">
              工单只能从客户页面创建，系统会自动带入客户档案中的题目、学校类型、学历、服务类型、预算等信息。
            </p>
          </div>
        </div>
      </GlassCard>
      <Suspense fallback={<div className="rounded-[28px] border border-white/60 bg-white/72 p-6 text-sm text-slate-500">正在载入工单管理...</div>}>
        <OrderPageSections orders={orders} writers={writers} clients={clients} />
      </Suspense>
    </div>
  );
}
