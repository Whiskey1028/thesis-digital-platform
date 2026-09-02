"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { OrderTable } from "@/components/orders/order-table";
import { FieldRow } from "@/components/ui/field-row";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Pagination } from "@/components/ui/pagination";
import { ModalShell } from "@/components/ui/modal-shell";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { SearchableSingleSelect, SegmentedSelect } from "@/components/ui/form-controls";
import { serviceTypeOptions } from "@/lib/constants";
import { apiFetch, formatApiError } from "@/lib/client/api-fetch";
import {
  getBooleanParam,
  getEnumParam,
  getNumberParam,
  getStringParam,
  replaceUrlParams
} from "@/lib/client-url-state";
import type { PaginatedResult } from "@/lib/api/pagination";
import type { Order, Writer } from "@/lib/types";

const inputClassName = "w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm";
const sourceOptions = ["all", "self_owned", "outsourced"] as const;
const statusOptions = ["all", "lead", "quoted", "in_progress", "review", "delivered", "after_sales"] as const;
const urgencyOptions = ["all", "low", "medium", "high"] as const;
const orderSortOptions = ["created_desc", "amount_desc", "deadline_asc", "profit_desc"] as const;

export function OrderManagementPanel({
  list,
  writers
}: {
  list: PaginatedResult<Order>;
  writers: Writer[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [listOpen, setListOpen] = useState(() => getBooleanParam(searchParams, "orderListOpen", true));

  const [editSourceType, setEditSourceType] = useState<"self_owned" | "outsourced">("self_owned");
  const [editServiceType, setEditServiceType] = useState("论文全文");
  const [editPackageMode, setEditPackageMode] = useState("论文全文");
  const [editWriterId, setEditWriterId] = useState("");

  const clientId = getStringParam(searchParams, "clientId", "");
  const writerId = getStringParam(searchParams, "writerId", "");
  const status = getEnumParam(searchParams, "orderStatus", statusOptions, "all");
  const sourceType = getEnumParam(searchParams, "orderSourceType", sourceOptions, "all");
  const urgency = getEnumParam(searchParams, "orderUrgency", urgencyOptions, "all");
  const sort = getEnumParam(searchParams, "orderSort", orderSortOptions, "created_desc");
  const page = getNumberParam(searchParams, "orderPage", 1);
  const pageSize = getNumberParam(searchParams, "orderPageSize", 10);
  const queryFromUrl = getStringParam(searchParams, "orderQuery", "");
  const [queryInput, setQueryInput] = useState(queryFromUrl);

  useEffect(() => {
    setQueryInput(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (queryInput === queryFromUrl) {
        return;
      }

      replaceUrlParams({
        pathname,
        router,
        updates: {
          orderQuery: queryInput || null,
          orderPage: null
        }
      });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [pathname, queryFromUrl, queryInput, router]);

  useEffect(() => {
    replaceUrlParams({
      pathname,
      router,
      updates: {
        orderListOpen: listOpen ? null : "0"
      }
    });
  }, [listOpen, pathname, router]);

  function updateParams(updates: Record<string, string | null>) {
    replaceUrlParams({ pathname, router, updates });
  }

  function openOrderEditor(order: Order) {
    setSelectedOrder(order);
    setEditSourceType(order.sourceType);
    setEditServiceType(order.serviceType);
    setEditPackageMode(order.packageMode);
    setEditWriterId(order.writerId ?? "");
    setViewingOrder(null);
  }

  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <div className="space-y-6">
      <CollapsibleSection
        title="工单列表"
        description="筛选与分页在服务端执行，只加载当前页数据。"
        open={listOpen}
        onToggle={setListOpen}
      >
        <div className="mb-5 grid gap-4 rounded-[24px] border border-white/60 bg-white/75 p-5 md:grid-cols-4">
          <input
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="搜索题目、客户、负责人"
            className={inputClassName}
          />
          <select
            value={status}
            onChange={(event) =>
              updateParams({
                orderStatus: event.target.value === "all" ? null : event.target.value,
                orderPage: null
              })
            }
            className={inputClassName}
          >
            <option value="all">全部状态</option>
            {statusOptions.slice(1).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={sourceType}
            onChange={(event) =>
              updateParams({
                orderSourceType: event.target.value === "all" ? null : event.target.value,
                orderPage: null
              })
            }
            className={inputClassName}
          >
            <option value="all">全部来源</option>
            <option value="self_owned">自接</option>
            <option value="outsourced">转包</option>
          </select>
          <select
            value={urgency}
            onChange={(event) =>
              updateParams({
                orderUrgency: event.target.value === "all" ? null : event.target.value,
                orderPage: null
              })
            }
            className={inputClassName}
          >
            <option value="all">全部优先级</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
          <select
            value={sort}
            onChange={(event) =>
              updateParams({
                orderSort: event.target.value === "created_desc" ? null : event.target.value,
                orderPage: null
              })
            }
            className={inputClassName}
          >
            <option value="created_desc">按创建时间最新</option>
            <option value="amount_desc">按金额从高到低</option>
            <option value="deadline_asc">按截止日期最近</option>
            <option value="profit_desc">按利润从高到低</option>
          </select>
          <div className="flex items-center rounded-[18px] bg-slate-950 px-4 py-3 text-sm text-white">
            共 {list.total} 条工单
          </div>
          <button
            type="button"
            onClick={() =>
              updateParams({
                orderQuery: null,
                orderStatus: null,
                orderSourceType: null,
                orderUrgency: null,
                orderSort: null,
                clientId: null,
                writerId: null,
                orderPage: null,
                orderPageSize: null
              })
            }
            className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
          >
            重置筛选
          </button>
          <ExportExcelButton exportUrl="/api/export/orders" label="导出工单 Excel" />
        </div>

        {clientId || writerId ? (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-500">
            {clientId ? <span>当前按客户 {clientId} 过滤。</span> : null}
            {writerId ? <span>当前按写手 {writerId} 过滤。</span> : null}
            <button
              type="button"
              onClick={() => updateParams({ clientId: null, writerId: null, orderPage: null })}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
            >
              清除关联过滤
            </button>
          </div>
        ) : null}

        <OrderTable
          orders={list.items}
          writers={writers}
          onViewOrder={setViewingOrder}
          onEditOrder={openOrderEditor}
        />
        <div className="mt-4">
          <Pagination
            page={Math.min(page, totalPages)}
            totalPages={totalPages}
            pageSize={pageSize}
            onChange={(nextPage) => updateParams({ orderPage: nextPage === 1 ? null : String(nextPage) })}
            onPageSizeChange={(size) =>
              updateParams({
                orderPageSize: size === 10 ? null : String(size),
                orderPage: null
              })
            }
          />
        </div>
      </CollapsibleSection>

      {viewingOrder ? (
        <ModalShell
          title="工单详情"
          subtitle="客户与学校信息来自工单快照字段。"
          onClose={() => setViewingOrder(null)}
        >
          {(() => {
            const writer = writers.find((item) => item.id === viewingOrder.writerId);
            return (
              <>
                <div className="mt-6 space-y-4">
                  <FieldRow label="论文题目">
                    <div className="px-1 py-3 text-sm text-slate-800">{viewingOrder.title}</div>
                  </FieldRow>
                  <FieldRow label="客户">
                    <div className="px-1 py-3 text-sm text-slate-800">{viewingOrder.clientName ?? "-"}</div>
                  </FieldRow>
                  <FieldRow label="学校信息">
                    <div className="px-1 py-3 text-sm text-slate-800">
                      {viewingOrder.schoolType ?? "-"} / {viewingOrder.educationLevel ?? "-"} /{" "}
                      {viewingOrder.school ?? "-"}
                    </div>
                  </FieldRow>
                  <FieldRow label="专业">
                    <div className="px-1 py-3 text-sm text-slate-800">{viewingOrder.major ?? "-"}</div>
                  </FieldRow>
                  <FieldRow label="类型/状态">
                    <div className="px-1 py-3 text-sm text-slate-800">
                      {viewingOrder.sourceType === "self_owned" ? "自接" : "转包"} / {viewingOrder.status}
                    </div>
                  </FieldRow>
                  <FieldRow label="服务/包干">
                    <div className="px-1 py-3 text-sm text-slate-800">
                      {viewingOrder.serviceType} / {viewingOrder.packageMode}
                    </div>
                  </FieldRow>
                  <FieldRow label="写手信息">
                    <div className="px-1 py-3 text-sm text-slate-800">
                      {writer ? `${writer.name} / ${writer.ownerName}` : "待分配"}
                    </div>
                  </FieldRow>
                  <FieldRow label="金额口径">
                    <div className="px-1 py-3 text-sm text-slate-800">
                      总价 ¥{viewingOrder.amount.toLocaleString()} / 成本 ¥
                      {viewingOrder.costAmount.toLocaleString()} / 利润 ¥
                      {viewingOrder.profitAmount.toLocaleString()}
                    </div>
                  </FieldRow>
                  <FieldRow label="回款口径">
                    <div className="px-1 py-3 text-sm text-slate-800">
                      已结 ¥{viewingOrder.settledAmount.toLocaleString()} / 应收 ¥
                      {viewingOrder.receivableAmount.toLocaleString()}
                    </div>
                  </FieldRow>
                  <FieldRow label="备注">
                    <div className="px-1 py-3 text-sm text-slate-800">
                      {viewingOrder.notes ?? viewingOrder.remark ?? "-"}
                    </div>
                  </FieldRow>
                </div>
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => openOrderEditor(viewingOrder)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
                  >
                    编辑工单
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/clients?clientId=${viewingOrder.clientId}`)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
                  >
                    跳到客户
                  </button>
                </div>
              </>
            );
          })()}
        </ModalShell>
      ) : null}

      {selectedOrder ? (
        <ModalShell title="编辑工单" onClose={() => setSelectedOrder(null)}>
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const amount = Number(formData.get("amount") ?? 0);
              const settledAmount = Number(formData.get("settledAmount") ?? 0);
              const costAmount = Number(formData.get("costAmount") ?? 0);

              const payload = {
                title: String(formData.get("title") ?? ""),
                sourceType: String(formData.get("sourceType") ?? "self_owned"),
                serviceType: String(formData.get("serviceType") ?? ""),
                packageMode: String(formData.get("packageMode") ?? ""),
                status: String(formData.get("status") ?? "lead"),
                ownerName: String(formData.get("ownerName") ?? ""),
                writerId:
                  String(formData.get("sourceType") ?? "self_owned") === "outsourced" && formData.get("writerId")
                    ? String(formData.get("writerId"))
                    : null,
                amount,
                settledAmount,
                receivableAmount: Math.max(amount - settledAmount, 0),
                costAmount,
                profitAmount: amount - costAmount,
                isSettled: String(formData.get("isSettled") ?? "false") === "true",
                paymentStatus: String(formData.get("paymentStatus") ?? "pending"),
                deadline: String(formData.get("deadline") ?? "")
              };

              startTransition(() => {
                void (async () => {
                  const result = await apiFetch(`/api/orders/${selectedOrder.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                  });

                  if (result.ok) {
                    setMessage("工单已更新。");
                    setSelectedOrder(null);
                    router.refresh();
                  } else {
                    setMessage(formatApiError(result.error));
                  }
                })();
              });
            }}
          >
            <FieldRow label="论文题目">
              <input name="title" defaultValue={selectedOrder.title} className={inputClassName} />
            </FieldRow>
            <FieldRow label="关联客户">
              <div className="rounded-[16px] bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {selectedOrder.clientName ?? "-"} / {selectedOrder.schoolType ?? "-"} /{" "}
                {selectedOrder.educationLevel ?? "-"}
              </div>
            </FieldRow>
            <FieldRow label="工单类型">
              <SegmentedSelect
                name="sourceType"
                value={editSourceType}
                onChange={(value) => setEditSourceType(value as "self_owned" | "outsourced")}
                options={[
                  { value: "self_owned", label: "自接" },
                  { value: "outsourced", label: "转包" }
                ]}
              />
            </FieldRow>
            <FieldRow label="服务类型">
              <SearchableSingleSelect
                name="serviceType"
                value={editServiceType}
                onChange={setEditServiceType}
                placeholder="选择服务类型"
                options={serviceTypeOptions}
              />
            </FieldRow>
            <FieldRow label="包干方式">
              <SearchableSingleSelect
                name="packageMode"
                value={editPackageMode}
                onChange={setEditPackageMode}
                placeholder="选择包干方式"
                options={serviceTypeOptions}
              />
            </FieldRow>
            <FieldRow label="负责人">
              <input name="ownerName" defaultValue={selectedOrder.ownerName} className={inputClassName} />
            </FieldRow>
            <FieldRow label="写手">
              {editSourceType === "outsourced" ? (
                <select
                  name="writerId"
                  value={editWriterId}
                  onChange={(event) => setEditWriterId(event.target.value)}
                  className={inputClassName}
                >
                  <option value="">暂不分配</option>
                  {writers.map((writer) => (
                    <option key={writer.id} value={writer.id}>
                      {writer.name}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input type="hidden" name="writerId" value="" />
                  <div className="rounded-[16px] bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    自接工单不关联写手
                  </div>
                </>
              )}
            </FieldRow>
            <FieldRow label="状态">
              <select name="status" defaultValue={selectedOrder.status} className={inputClassName}>
                {statusOptions.slice(1).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="总价">
              <input name="amount" type="number" defaultValue={selectedOrder.amount} className={inputClassName} />
            </FieldRow>
            <FieldRow label="已结算">
              <input
                name="settledAmount"
                type="number"
                defaultValue={selectedOrder.settledAmount}
                className={inputClassName}
              />
            </FieldRow>
            <FieldRow label="成本">
              <input name="costAmount" type="number" defaultValue={selectedOrder.costAmount} className={inputClassName} />
            </FieldRow>
            <FieldRow label="付款状态">
              <select name="paymentStatus" defaultValue={selectedOrder.paymentStatus} className={inputClassName}>
                <option value="pending">pending</option>
                <option value="partial">partial</option>
                <option value="paid">paid</option>
              </select>
            </FieldRow>
            <FieldRow label="是否结清">
              <select name="isSettled" defaultValue={selectedOrder.isSettled ? "true" : "false"} className={inputClassName}>
                <option value="false">否</option>
                <option value="true">是</option>
              </select>
            </FieldRow>
            <FieldRow label="计划完成日期">
              <input name="deadline" type="date" defaultValue={selectedOrder.deadline} className={inputClassName} />
            </FieldRow>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-slate-950 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {isPending ? "保存中..." : "保存修改"}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {message ? <p className="text-sm text-slate-500">{message}</p> : null}
    </div>
  );
}
