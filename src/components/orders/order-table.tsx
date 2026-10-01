"use client";

import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/stat-tile";
import type { Order, Writer } from "@/lib/types";

function statusTone(status: Order["status"]) {
  switch (status) {
    case "delivered":
      return "green";
    case "after_sales":
      return "red";
    case "in_progress":
      return "amber";
    case "quoted":
    case "review":
      return "blue";
    default:
      return "slate";
  }
}

function sourceTypeLabel(sourceType: Order["sourceType"]) {
  return sourceType === "self_owned" ? "自接" : "转包";
}

function OrderActions({
  order,
  onViewOrder,
  onEditOrder,
  compact = false
}: {
  order: Order;
  onViewOrder?: (order: Order) => void;
  onEditOrder?: (order: Order) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mt-4 flex gap-2" : "flex flex-col gap-2"}>
      <Button
        variant="secondary"
        className={compact ? "flex-1 px-3 text-sm" : "px-3 py-2 text-xs"}
        onClick={() => onViewOrder?.(order)}
      >
        详情
      </Button>
      <Button
        variant="secondary"
        className={compact ? "flex-1 px-3 text-sm" : "px-3 py-2 text-xs"}
        onClick={() => onEditOrder?.(order)}
      >
        编辑
      </Button>
    </div>
  );
}

export function OrderTable({
  orders,
  writers,
  onViewOrder,
  onEditOrder
}: {
  orders: Order[];
  writers: Writer[];
  onViewOrder?: (order: Order) => void;
  onEditOrder?: (order: Order) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="hidden overflow-x-auto rounded-[28px] border border-white/65 bg-white/75 lg:block">
        <table className="min-w-full divide-y divide-slate-200/80 text-left">
          <thead className="bg-white/90 text-sm text-slate-500">
            <tr>
              <th className="px-5 py-4 font-medium">工单</th>
              <th className="px-5 py-4 font-medium">类型</th>
              <th className="px-5 py-4 font-medium">学校/学历</th>
              <th className="px-5 py-4 font-medium">服务/包干</th>
              <th className="px-5 py-4 font-medium">写手/负责人</th>
              <th className="px-5 py-4 font-medium">金额/成本/利润</th>
              <th className="px-5 py-4 font-medium">回款</th>
              <th className="px-5 py-4 font-medium">节点</th>
              <th className="px-5 py-4 font-medium">状态</th>
              <th className="px-5 py-4 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {orders.map((order) => {
              const writer = writers.find((item) => item.id === order.writerId);

              return (
                <tr key={order.id}>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900">{order.title}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      <Link
                        href={`/clients?clientId=${order.clientId}`}
                        className="hover:text-slate-700 hover:underline"
                      >
                        {order.clientName ?? "未命名客户"}
                      </Link>
                      {" / "}
                      {order.major ?? "-"}
                    </div>
                  </td>
                  <td className="px-5 py-4">{sourceTypeLabel(order.sourceType)}</td>
                  <td className="px-5 py-4">
                    <div>{order.schoolType ?? "-"}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {order.educationLevel ?? "-"} / {order.school ?? "-"}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div>{order.serviceType}</div>
                    <div className="mt-1 text-xs text-slate-500">{order.packageMode}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      {writer ? (
                        <Link
                          href={`/writers?writerId=${writer.id}`}
                          className="hover:text-slate-700 hover:underline"
                        >
                          {writer.name}
                        </Link>
                      ) : (
                        "待分配"
                      )}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{order.ownerName}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div>¥{order.amount.toLocaleString()}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      成本 ¥{order.costAmount.toLocaleString()} / 利润 ¥
                      {order.profitAmount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div>{order.isSettled ? "已结清" : "未结清"}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      已结 ¥{order.settledAmount.toLocaleString()} / 应收 ¥
                      {order.receivableAmount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div>交易 {order.transactionDate}</div>
                    <div className="mt-1 text-xs text-slate-500">计划 {order.deadline}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      写手 {order.writerDeadline ?? "-"}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill label={order.status} tone={statusTone(order.status)} />
                  </td>
                  <td className="px-5 py-4">
                    <OrderActions order={order} onViewOrder={onViewOrder} onEditOrder={onEditOrder} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {orders.map((order) => {
          const writer = writers.find((item) => item.id === order.writerId);

          return (
            <article
              key={order.id}
              className="rounded-[24px] border border-white/65 bg-white/80 p-4 shadow-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-950">{order.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    <Link href={`/clients?clientId=${order.clientId}`} className="hover:underline">
                      {order.clientName ?? "未命名客户"}
                    </Link>
                    {" · "}
                    {sourceTypeLabel(order.sourceType)}
                  </p>
                </div>
                <StatusPill label={order.status} tone={statusTone(order.status)} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <StatTile
                  label="金额"
                  value={`¥${order.amount.toLocaleString()}`}
                  className="bg-white/90 p-3"
                  valueClassName="mt-0.5 text-sm font-medium text-slate-900"
                />
                <StatTile
                  label="回款"
                  value={order.isSettled ? "已结清" : "未结清"}
                  className="bg-white/90 p-3"
                  valueClassName="mt-0.5 text-sm font-medium text-slate-900"
                />
                <StatTile
                  label="写手"
                  value={
                    writer ? (
                      <Link href={`/writers?writerId=${writer.id}`} className="hover:underline">
                        {writer.name}
                      </Link>
                    ) : (
                      "待分配"
                    )
                  }
                  className="bg-white/90 p-3"
                  valueClassName="mt-0.5 text-sm font-medium text-slate-900"
                />
                <StatTile
                  label="计划截止"
                  value={order.deadline}
                  className="bg-white/90 p-3"
                  valueClassName="mt-0.5 text-sm font-medium text-slate-900"
                />
              </div>

              <OrderActions
                order={order}
                onViewOrder={onViewOrder}
                onEditOrder={onEditOrder}
                compact
              />
            </article>
          );
        })}
      </div>
    </div>
  );
}
