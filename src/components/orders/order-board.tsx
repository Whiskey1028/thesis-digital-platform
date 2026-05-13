import { GlassCard } from "@/components/ui/glass-card";
import { StatusPill } from "@/components/ui/status-pill";
import type { Client, Order, OrderStatus } from "@/lib/types";

const columns: OrderStatus[] = ["lead", "quoted", "in_progress", "review", "delivered", "after_sales"];

const toneMap = {
  lead: "slate",
  quoted: "blue",
  in_progress: "amber",
  review: "blue",
  delivered: "green",
  after_sales: "red"
} as const;

export function OrderBoard({ orders, clients }: { orders: Order[]; clients: Client[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
      {columns.map((column) => {
        const scoped = orders.filter((order) => order.status === column);
        return (
          <GlassCard key={column} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium capitalize text-slate-800">{column}</p>
              <StatusPill label={`${scoped.length} 项`} tone={toneMap[column]} />
            </div>
            <div className="mt-4 space-y-3">
              {scoped.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-slate-200 bg-white/60 p-4 text-sm text-slate-400">
                  当前没有记录
                </div>
              ) : (
                scoped.map((order) => (
                  <article key={order.id} className="rounded-[22px] bg-white/90 p-4 shadow-soft">
                    <p className="text-sm font-medium text-slate-900">{order.title}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {clients.find((client) => client.id === order.clientId)?.name ?? "未命名客户"}
                    </p>
                    <p className="mt-3 text-xs text-slate-400">截止 {order.deadline}</p>
                  </article>
                ))
              )}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
