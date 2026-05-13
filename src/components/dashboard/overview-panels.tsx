import { GlassCard } from "@/components/ui/glass-card";
import { KpiCard } from "@/components/ui/kpi-card";
import type { Client, Order, Writer } from "@/lib/types";
import { buildDashboardMetrics } from "@/lib/analytics";

function formatSourceTypeLabel(sourceType: string) {
  return sourceType === "self_owned" ? "自接" : "转包";
}

export function OverviewPanels({
  orders,
  writers,
  clients
}: {
  orders: Order[];
  writers: Writer[];
  clients: Client[];
}) {
  const metrics = buildDashboardMetrics({ orders, writers, clients });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="总收入" value={`¥${metrics.totalRevenue.toLocaleString()}`} detail="工单总价汇总" />
        <KpiCard label="已回款" value={`¥${metrics.settledRevenue.toLocaleString()}`} detail="已结算金额汇总" />
        <KpiCard label="应收账款" value={`¥${metrics.totalReceivables.toLocaleString()}`} detail="未回款余额" />
        <KpiCard label="利润估算" value={`¥${metrics.totalProfit.toLocaleString()}`} detail="收入减去成本后口径" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="活跃工单" value={metrics.activeOrders} detail="处于 lead 至 review 阶段" />
        <KpiCard label="转包工单" value={metrics.outsourcedOrders} detail="适合重点看成本与利润" />
        <KpiCard label="自接工单" value={metrics.selfOwnedOrders} detail="通常利润空间更高" />
        <KpiCard label="写手负载率" value={`${metrics.writerUtilization}%`} detail="按容量计算" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-slate-950">工单状态分布</h3>
          <p className="mt-2 text-sm text-slate-500">快速查看流程堵点、交付节奏和待催节点。</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {metrics.ordersByStatus.map(([status, count]) => (
              <div key={status} className="rounded-[24px] bg-slate-950 px-4 py-5 text-white">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{status}</p>
                <p className="mt-3 text-3xl font-semibold">{count}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-slate-950">工单来源结构</h3>
          <div className="mt-6 space-y-4">
            {metrics.ordersBySourceType.map(([sourceType, count]) => (
              <div key={sourceType}>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{formatSourceTypeLabel(sourceType)}</span>
                  <span>{count}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-slate-900"
                    style={{ width: `${Math.max(18, (count / Math.max(orders.length, 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-slate-950">服务类型分布</h3>
          <div className="mt-6 space-y-3">
            {metrics.ordersByServiceType.map(([serviceType, count]) => (
              <div key={serviceType} className="flex items-center justify-between rounded-[20px] bg-white/80 px-4 py-3">
                <span className="text-sm text-slate-600">{serviceType}</span>
                <span className="text-sm font-medium text-slate-950">{count}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-slate-950">客户来源</h3>
          <div className="mt-6 space-y-4">
            {metrics.clientsBySource.map(([source, count]) => (
              <div key={source}>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{source}</span>
                  <span>{count}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-slate-900"
                    style={{ width: `${Math.max(18, (count / Math.max(clients.length, 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-slate-950">写手池健康度</h3>
          <div className="mt-6 grid gap-4">
            <div className="rounded-[24px] bg-white/85 p-5">
              <p className="text-sm text-slate-500">平均评分</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{metrics.averageWriterRating}</p>
            </div>
            <div className="rounded-[24px] bg-white/85 p-5">
              <p className="text-sm text-slate-500">结清工单数</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{metrics.settledOrders}</p>
            </div>
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-slate-950">客户风险雷达</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {metrics.clientsByRisk.map(([risk, count]) => (
              <div key={risk} className="rounded-[24px] border border-slate-200/80 bg-white/80 p-5">
                <p className="text-sm text-slate-500">{risk.toUpperCase()}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{count}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-slate-950">成本与利润口径</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] bg-white/85 p-5">
              <p className="text-sm text-slate-500">总成本</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                ¥{metrics.totalCost.toLocaleString()}
              </p>
            </div>
            <div className="rounded-[24px] bg-white/85 p-5">
              <p className="text-sm text-slate-500">净利润</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                ¥{metrics.totalProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
