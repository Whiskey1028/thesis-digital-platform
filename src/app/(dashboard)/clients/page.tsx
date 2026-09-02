import { Suspense } from "react";
import { ClientManagementPanel } from "@/components/clients/client-management-panel";
import { Topbar } from "@/components/layout/topbar";
import { KpiCard } from "@/components/ui/kpi-card";
import { queryClients } from "@/lib/api/list-queries";
import { getClientPageKpis } from "@/lib/queries/kpi";
import { parseClientPageQuery } from "@/lib/queries/page-params";
import { loadWriterOptions } from "@/lib/queries/writer-options";
import { ClientCreateSection } from "@/components/clients/client-create-section";
import type { PaginatedResult } from "@/lib/api/pagination";
import type { ClientListItem } from "@/lib/api/list-queries";

type ClientsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams;
  const listQuery = parseClientPageQuery(params);

  const [kpis, listResult, writers] = await Promise.all([
    getClientPageKpis(),
    queryClients(listQuery),
    loadWriterOptions()
  ]);

  const list = listResult as PaginatedResult<ClientListItem>;

  return (
    <div className="space-y-6 pb-10">
      <Topbar
        title="论文客户"
        description="客户档案是整个业务流程的起点。这里先录入客户信息，再通过一键生成工单，把重叠字段自动带入可编辑弹窗。"
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <KpiCard label="高风险客户" value={kpis.highRiskClients} detail="建议提高沟通频率和节点跟进" />
        <KpiCard label="可直接转工单" value={kpis.convertibleClients} detail="已具备题目和预算等选填信息" />
        <KpiCard label="尚未转化客户" value={kpis.clientsWithoutOrders} detail="适合继续跟进转单机会" />
      </section>

      <Suspense fallback={<div className="rounded-[28px] border border-white/60 bg-white/72 p-6 text-sm text-slate-500">正在载入客户创建区...</div>}>
        <ClientCreateSection />
      </Suspense>

      <Suspense fallback={<div className="rounded-[28px] border border-white/60 bg-white/72 p-6 text-sm text-slate-500">正在载入客户管理...</div>}>
        <ClientManagementPanel list={list} writers={writers} />
      </Suspense>
    </div>
  );
}
