"use client";

import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
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
    <div className="overflow-hidden rounded-[28px] border border-white/65 bg-white/75">
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
                    <Link href={`/clients?clientId=${order.clientId}`} className="hover:text-slate-700 hover:underline">
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
                      <Link href={`/writers?writerId=${writer.id}`} className="hover:text-slate-700 hover:underline">
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
                    成本 ¥{order.costAmount.toLocaleString()} / 利润 ¥{order.profitAmount.toLocaleString()}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div>{order.isSettled ? "已结清" : "未结清"}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    已结 ¥{order.settledAmount.toLocaleString()} / 应收 ¥{order.receivableAmount.toLocaleString()}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div>交易 {order.transactionDate}</div>
                  <div className="mt-1 text-xs text-slate-500">计划 {order.deadline}</div>
                  <div className="mt-1 text-xs text-slate-500">写手 {order.writerDeadline ?? "-"}</div>
                </td>
                <td className="px-5 py-4">
                  <StatusPill label={order.status} tone={statusTone(order.status)} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => onViewOrder?.(order)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                    >
                      详情
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditOrder?.(order)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                    >
                      编辑
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
