import { Suspense } from "react";
import { ClientCreateForm } from "@/components/clients/client-create-form";
import { ClientManagementPanel } from "@/components/clients/client-management-panel";
import { Topbar } from "@/components/layout/topbar";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { GlassCard } from "@/components/ui/glass-card";
import { KpiCard } from "@/components/ui/kpi-card";
import { repositories } from "@/lib/repositories";
import { ClientCreateSection } from "@/components/clients/client-create-section";

export default async function ClientsPage() {
  const [clients, orders, writers] = await Promise.all([
    repositories.clients.list(),
    repositories.orders.list(),
    repositories.writers.list()
  ]);

  const highRiskClients = clients.filter((client) => client.riskLevel === "high").length;
  const convertibleClients = clients.filter((client) => client.preferredTitle && client.preferredBudget).length;
  const clientsWithoutOrders = clients.filter(
    (client) => !orders.some((order) => order.clientId === client.id)
  ).length;

  return (
    <div className="space-y-6 pb-10">
      <Topbar
        title="论文客户"
        description="客户档案是整个业务流程的起点。这里先录入客户信息，再通过一键生成工单，把重叠字段自动带入可编辑弹窗。"
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <KpiCard label="高风险客户" value={highRiskClients} detail="建议提高沟通频率和节点跟进" />
        <KpiCard label="可直接转工单" value={convertibleClients} detail="已具备题目和预算等选填信息" />
        <KpiCard label="尚未转化客户" value={clientsWithoutOrders} detail="适合继续跟进转单机会" />
      </section>

      <Suspense fallback={<div className="rounded-[28px] border border-white/60 bg-white/72 p-6 text-sm text-slate-500">正在载入客户创建区...</div>}>
        <ClientCreateSection />
      </Suspense>

      <Suspense fallback={<div className="rounded-[28px] border border-white/60 bg-white/72 p-6 text-sm text-slate-500">正在载入客户管理...</div>}>
        <ClientManagementPanel clients={clients} orders={orders} writers={writers} />
      </Suspense>
    </div>
  );
}
