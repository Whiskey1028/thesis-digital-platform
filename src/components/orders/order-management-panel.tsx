"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Client, Order, Writer } from "@/lib/types";
import { OrderTable } from "@/components/orders/order-table";
import { FieldRow } from "@/components/ui/field-row";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Pagination } from "@/components/ui/pagination";
import { ModalShell } from "@/components/ui/modal-shell";
import { SearchableSingleSelect, SegmentedSelect } from "@/components/ui/form-controls";
import { serviceTypeOptions } from "@/lib/constants";
import {
  getBooleanParam,
  getEnumParam,
  getNumberParam,
  getStringParam,
  replaceUrlParams
} from "@/lib/client-url-state";

const inputClassName = "w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm";
const sourceOptions = ["all", "self_owned", "outsourced"] as const;
const statusOptions = ["all", "lead", "quoted", "in_progress", "review", "delivered", "after_sales"] as const;
const settledOptions = ["all", "settled", "unsettled"] as const;
const paymentOptions = ["all", "pending", "partial", "paid"] as const;
const urgencyOptions = ["all", "low", "medium", "high"] as const;
const assignmentOptions = ["all", "assigned", "unassigned"] as const;
const orderSortOptions = ["date_desc", "amount_desc", "deadline_asc", "profit_desc"] as const;

export function OrderManagementPanel({
  orders,
  writers,
  clients
}: {
  orders: Order[];
  writers: Writer[];
  clients: Client[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => getStringParam(searchParams, "orderQuery", ""));
  const [sourceType, setSourceType] = useState<"all" | "self_owned" | "outsourced">(() =>
    getEnumParam(searchParams, "orderSourceType", sourceOptions, "all")
  );
  const [status, setStatus] = useState<"all" | Order["status"]>(() =>
    getEnumParam(searchParams, "orderStatus", statusOptions, "all")
  );
  const [serviceType, setServiceType] = useState(() => getStringParam(searchParams, "orderServiceType", "all"));
  const [settledState, setSettledState] = useState<"all" | "settled" | "unsettled">(() =>
    getEnumParam(searchParams, "orderSettledState", settledOptions, "all")
  );
  const [paymentStatus, setPaymentStatus] = useState<"all" | Order["paymentStatus"]>(() =>
    getEnumParam(searchParams, "orderPaymentStatus", paymentOptions, "all")
  );
  const [urgency, setUrgency] = useState<"all" | Order["urgency"]>(() =>
    getEnumParam(searchParams, "orderUrgency", urgencyOptions, "all")
  );
  const [assignmentState, setAssignmentState] = useState<"all" | "assigned" | "unassigned">(() =>
    getEnumParam(searchParams, "orderAssignment", assignmentOptions, "all")
  );
  const [dateFrom, setDateFrom] = useState(() => getStringParam(searchParams, "orderDateFrom", ""));
  const [dateTo, setDateTo] = useState(() => getStringParam(searchParams, "orderDateTo", ""));
  const [quickSort, setQuickSort] = useState<(typeof orderSortOptions)[number]>(() =>
    getEnumParam(searchParams, "orderQuickSort", orderSortOptions, "date_desc")
  );
  const [clientId, setClientId] = useState(() => getStringParam(searchParams, "clientId", ""));
  const [writerId, setWriterId] = useState(() => getStringParam(searchParams, "writerId", ""));
  const [listQuery, setListQuery] = useState(() => getStringParam(searchParams, "orderListQuery", ""));
  const [listSourceType, setListSourceType] = useState<"all" | "self_owned" | "outsourced">(() =>
    getEnumParam(searchParams, "orderListSourceType", sourceOptions, "all")
  );
  const [listStatus, setListStatus] = useState<"all" | Order["status"]>(() =>
    getEnumParam(searchParams, "orderListStatus", statusOptions, "all")
  );
  const [listSort, setListSort] = useState<(typeof orderSortOptions)[number]>(() =>
    getEnumParam(searchParams, "orderListSort", orderSortOptions, "date_desc")
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editSourceType, setEditSourceType] = useState<"self_owned" | "outsourced">("self_owned");
  const [editServiceType, setEditServiceType] = useState("论文全文");
  const [editPackageMode, setEditPackageMode] = useState("论文全文");
  const [editWriterId, setEditWriterId] = useState("");
  const [page, setPage] = useState(() => getNumberParam(searchParams, "orderPage", 1));
  const [pageSize, setPageSize] = useState(() => getNumberParam(searchParams, "orderPageSize", 10));
  const [listPage, setListPage] = useState(() => getNumberParam(searchParams, "orderListPage", 1));
  const [listPageSize, setListPageSize] = useState(() => getNumberParam(searchParams, "orderListPageSize", 10));
  const [quickOpen, setQuickOpen] = useState(() =>
    getBooleanParam(searchParams, "orderQuickOpen", true)
  );
  const [listOpen, setListOpen] = useState(() =>
    getBooleanParam(searchParams, "orderListOpen", true)
  );
  const [isPending, startTransition] = useTransition();

  function sortOrders(items: Order[], sort: (typeof orderSortOptions)[number]) {
    return [...items].sort((a, b) => {
      switch (sort) {
        case "amount_desc":
          return b.amount - a.amount;
        case "deadline_asc":
          return a.deadline.localeCompare(b.deadline);
        case "profit_desc":
          return b.profitAmount - a.profitAmount;
        default:
          return b.transactionDate.localeCompare(a.transactionDate);
      }
    });
  }

  const serviceTypeFilterOptions = useMemo(
    () => ["all", ...Array.from(new Set(orders.map((order) => order.serviceType))).sort()],
    [orders]
  );

  const filteredOrders = useMemo(() => {
    return sortOrders(orders.filter((order) => {
      const client = clients.find((item) => item.id === order.clientId);
      const matchesQuery =
        query.trim() === "" ||
        [
          order.title,
          client?.name ?? "",
          client?.major ?? "",
          client?.school ?? "",
          order.ownerName
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.trim().toLowerCase());
      const matchesSource = sourceType === "all" || order.sourceType === sourceType;
      const matchesStatus = status === "all" || order.status === status;
      const matchesServiceType = serviceType === "all" || order.serviceType === serviceType;
      const matchesSettled =
        settledState === "all" ||
        (settledState === "settled" && order.isSettled) ||
        (settledState === "unsettled" && !order.isSettled);
      const matchesPayment = paymentStatus === "all" || order.paymentStatus === paymentStatus;
      const matchesUrgency = urgency === "all" || order.urgency === urgency;
      const matchesAssignment =
        assignmentState === "all" ||
        (assignmentState === "assigned" && !!order.writerId) ||
        (assignmentState === "unassigned" && !order.writerId);
      const matchesClient = !clientId || order.clientId === clientId;
      const matchesWriter = !writerId || order.writerId === writerId;
      const matchesDateFrom = !dateFrom || order.transactionDate >= dateFrom;
      const matchesDateTo = !dateTo || order.transactionDate <= dateTo;
      return (
        matchesQuery &&
        matchesSource &&
        matchesStatus &&
        matchesServiceType &&
        matchesSettled &&
        matchesPayment &&
        matchesUrgency &&
        matchesAssignment &&
        matchesClient &&
        matchesWriter &&
        matchesDateFrom &&
        matchesDateTo
      );
    }), quickSort);
  }, [
    assignmentState,
    clientId,
    clients,
    dateFrom,
    dateTo,
    orders,
    paymentStatus,
    query,
    serviceType,
    settledState,
    sourceType,
    status,
    urgency,
    writerId,
    quickSort
  ]);
  const mainFilteredOrders = useMemo(() => {
    return sortOrders(
      orders.filter((order) => {
        const client = clients.find((item) => item.id === order.clientId);
        const matchesQuery =
          listQuery.trim() === "" ||
          [order.title, client?.name ?? "", client?.major ?? "", client?.school ?? "", order.ownerName]
            .join(" ")
            .toLowerCase()
            .includes(listQuery.trim().toLowerCase());
        const matchesSource = listSourceType === "all" || order.sourceType === listSourceType;
        const matchesStatus = listStatus === "all" || order.status === listStatus;
        return matchesQuery && matchesSource && matchesStatus;
      }),
      listSort
    );
  }, [clients, listQuery, listSourceType, listSort, listStatus, orders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedOrders = useMemo(
    () => filteredOrders.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredOrders, pageSize, safePage]
  );
  const listTotalPages = Math.max(1, Math.ceil(mainFilteredOrders.length / listPageSize));
  const safeListPage = Math.min(listPage, listTotalPages);
  const pagedMainOrders = useMemo(
    () => mainFilteredOrders.slice((safeListPage - 1) * listPageSize, safeListPage * listPageSize),
    [listPageSize, mainFilteredOrders, safeListPage]
  );

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);
  useEffect(() => {
    if (listPage !== safeListPage) {
      setListPage(safeListPage);
    }
  }, [listPage, safeListPage]);

  useEffect(() => {
    replaceUrlParams({
      pathname,
      router,
      updates: {
        orderQuery: query || null,
        orderSourceType: sourceType === "all" ? null : sourceType,
        orderStatus: status === "all" ? null : status,
        orderServiceType: serviceType === "all" ? null : serviceType,
        orderSettledState: settledState === "all" ? null : settledState,
        orderPaymentStatus: paymentStatus === "all" ? null : paymentStatus,
        orderUrgency: urgency === "all" ? null : urgency,
        orderAssignment: assignmentState === "all" ? null : assignmentState,
        orderDateFrom: dateFrom || null,
        orderDateTo: dateTo || null,
        orderQuickSort: quickSort === "date_desc" ? null : quickSort,
        clientId: clientId || null,
        writerId: writerId || null,
        orderPage: safePage === 1 ? null : String(safePage),
        orderPageSize: pageSize === 10 ? null : String(pageSize),
        orderListQuery: listQuery || null,
        orderListSourceType: listSourceType === "all" ? null : listSourceType,
        orderListStatus: listStatus === "all" ? null : listStatus,
        orderListSort: listSort === "date_desc" ? null : listSort,
        orderListPage: safeListPage === 1 ? null : String(safeListPage),
        orderListPageSize: listPageSize === 10 ? null : String(listPageSize),
        orderQuickOpen: quickOpen ? null : "0",
        orderListOpen: listOpen ? null : "0"
      }
    });
  }, [
    clientId,
    listOpen,
    pageSize,
    paymentStatus,
    pathname,
    query,
    quickOpen,
    router,
    safePage,
    serviceType,
    settledState,
    sourceType,
    status,
    urgency,
    assignmentState,
    dateFrom,
    dateTo,
    listPageSize,
    listQuery,
    listSort,
    listSourceType,
    listStatus,
    writerId
  ]);

  function resetFilters() {
    setQuery("");
    setSourceType("all");
    setStatus("all");
    setServiceType("all");
    setSettledState("all");
    setPaymentStatus("all");
    setUrgency("all");
    setAssignmentState("all");
    setDateFrom("");
    setDateTo("");
    setQuickSort("date_desc");
    setClientId("");
    setWriterId("");
    setPage(1);
    setPageSize(10);
  }
  function resetListFilters() {
    setListQuery("");
    setListSourceType("all");
    setListStatus("all");
    setListSort("date_desc");
    setListPage(1);
    setListPageSize(10);
  }

  function openOrderDetails(order: Order) {
    setViewingOrder(order);
    setSelectedOrder(null);
  }

  function openOrderEditor(order: Order) {
    setSelectedOrder(order);
    setViewingOrder(null);
    setMessage(null);
    setEditSourceType(order.sourceType);
    setEditServiceType(order.serviceType);
    setEditPackageMode(order.packageMode);
    setEditWriterId(order.writerId ?? "");
  }

  useEffect(() => {
    if (editSourceType === "self_owned") {
      setEditWriterId("");
    }
  }, [editSourceType]);

  return (
    <div className="space-y-6">
      <CollapsibleSection
        title="工单筛选与快捷操作"
        description="支持快速搜索、筛选，以及在大量数据下收起无关区域。"
        open={quickOpen}
        onToggle={setQuickOpen}
      >
        <div className="space-y-5">
          <div className="grid gap-4 rounded-[28px] border border-white/60 bg-white/75 p-5 md:grid-cols-2 xl:grid-cols-4">
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="搜索标题、客户、专业、学校"
              className={inputClassName}
            />
            <select
              value={sourceType}
              onChange={(event) => {
                setSourceType(event.target.value as "all" | "self_owned" | "outsourced");
                setPage(1);
              }}
              className={inputClassName}
            >
              <option value="all">全部类型</option>
              <option value="self_owned">仅自接</option>
              <option value="outsourced">仅转包</option>
            </select>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as "all" | Order["status"]);
                setPage(1);
              }}
              className={inputClassName}
            >
              <option value="all">全部状态</option>
              <option value="lead">lead</option>
              <option value="quoted">quoted</option>
              <option value="in_progress">in_progress</option>
              <option value="review">review</option>
              <option value="delivered">delivered</option>
              <option value="after_sales">after_sales</option>
            </select>
            <select
              value={serviceType}
              onChange={(event) => {
                setServiceType(event.target.value);
                setPage(1);
              }}
              className={inputClassName}
            >
              {serviceTypeFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "全部服务类型" : option}
                </option>
              ))}
            </select>
            <select
              value={settledState}
              onChange={(event) => {
                setSettledState(event.target.value as "all" | "settled" | "unsettled");
                setPage(1);
              }}
              className={inputClassName}
            >
              <option value="all">全部结清状态</option>
              <option value="settled">仅已结清</option>
              <option value="unsettled">仅未结清</option>
            </select>
            <select
              value={paymentStatus}
              onChange={(event) => {
                setPaymentStatus(event.target.value as "all" | Order["paymentStatus"]);
                setPage(1);
              }}
              className={inputClassName}
            >
              <option value="all">全部付款状态</option>
              <option value="pending">pending</option>
              <option value="partial">partial</option>
              <option value="paid">paid</option>
            </select>
            <select
              value={urgency}
              onChange={(event) => {
                setUrgency(event.target.value as "all" | Order["urgency"]);
                setPage(1);
              }}
              className={inputClassName}
            >
              <option value="all">全部紧急度</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
            <select
              value={assignmentState}
              onChange={(event) => {
                setAssignmentState(event.target.value as "all" | "assigned" | "unassigned");
                setPage(1);
              }}
              className={inputClassName}
            >
              <option value="all">全部分配状态</option>
              <option value="assigned">仅已分配</option>
              <option value="unassigned">仅未分配</option>
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setPage(1);
                }}
                className={inputClassName}
              />
              <input
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setPage(1);
                }}
                className={inputClassName}
              />
            </div>
            <select
              value={quickSort}
              onChange={(event) => {
                setQuickSort(event.target.value as (typeof orderSortOptions)[number]);
                setPage(1);
              }}
              className={inputClassName}
            >
              <option value="date_desc">按交易日期最新</option>
              <option value="amount_desc">按金额从高到低</option>
              <option value="deadline_asc">按截止日期最近</option>
              <option value="profit_desc">按利润从高到低</option>
            </select>
            <div className="flex items-center rounded-[18px] bg-slate-950 px-4 py-3 text-sm text-white">
              当前筛选结果 {filteredOrders.length} 条
            </div>
          </div>

          {(clientId || writerId) ? (
            <div className="flex flex-wrap items-center gap-3 rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <span>
                {clientId ? "已按客户联动筛选。" : null}
                {clientId && writerId ? " " : null}
                {writerId ? "已按写手联动筛选。" : null}
              </span>
              <button
                type="button"
                onClick={() => {
                  setClientId("");
                  setWriterId("");
                  setPage(1);
                }}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
              >
                清除联动筛选
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
            >
              重置筛选
            </button>
          </div>

          <div className="space-y-3">
            {pagedOrders.map((order) => {
              const client = clients.find((item) => item.id === order.clientId);
              const writer = writers.find((item) => item.id === order.writerId);
              return (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-[24px] border border-white/60 bg-white/75 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="text-base font-medium text-slate-950">{order.title}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {client?.name ?? "未命名客户"} / {order.sourceType === "self_owned" ? "自接" : "转包"} / {order.status}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {client?.schoolType ?? "-"} / {client?.educationLevel ?? "-"} / {writer?.name ?? "待分配写手"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openOrderDetails(order)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
                  >
                    详情
                  </button>
                  <button
                    type="button"
                    onClick={() => openOrderEditor(order)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/clients?clientId=${order.clientId}`)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
                  >
                    查看客户
                  </button>
                  <button
                    type="button"
                    onClick={() => order.writerId && router.push(`/writers?writerId=${order.writerId}`)}
                    disabled={!order.writerId}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-40"
                  >
                    查看写手
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const confirmed = window.confirm("删除工单后无法恢复。确认删除吗？");
                      if (!confirmed) return;
                      startTransition(() => {
                        void (async () => {
                          const response = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
                          if (response.ok) {
                            setMessage("工单已删除。");
                            router.refresh();
                          } else {
                            setMessage("工单删除失败。");
                          }
                        })();
                      });
                    }}
                    disabled={isPending}
                    className="rounded-full bg-rose-500 px-4 py-2 text-sm text-white disabled:opacity-60"
                  >
                    删除
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </div>
        <div className="mt-4">
          <Pagination
            page={safePage}
            totalPages={totalPages}
            pageSize={pageSize}
            onChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="工单列表"
        description="可以收起此区域，避免历史数据多时页面过长。"
        open={listOpen}
        onToggle={setListOpen}
      >
        <div className="mb-5 grid gap-4 rounded-[24px] border border-white/60 bg-white/75 p-5 md:grid-cols-4">
          <input
            value={listQuery}
            onChange={(event) => {
              setListQuery(event.target.value);
              setListPage(1);
            }}
            placeholder="筛选主列表中的工单"
            className={inputClassName}
          />
          <select
            value={listSourceType}
            onChange={(event) => {
              setListSourceType(event.target.value as "all" | "self_owned" | "outsourced");
              setListPage(1);
            }}
            className={inputClassName}
          >
            <option value="all">全部类型</option>
            <option value="self_owned">仅自接</option>
            <option value="outsourced">仅转包</option>
          </select>
          <select
            value={listStatus}
            onChange={(event) => {
              setListStatus(event.target.value as "all" | Order["status"]);
              setListPage(1);
            }}
            className={inputClassName}
          >
            <option value="all">全部状态</option>
            <option value="lead">lead</option>
            <option value="quoted">quoted</option>
            <option value="in_progress">in_progress</option>
            <option value="review">review</option>
            <option value="delivered">delivered</option>
            <option value="after_sales">after_sales</option>
          </select>
          <select
            value={listSort}
            onChange={(event) => {
              setListSort(event.target.value as (typeof orderSortOptions)[number]);
              setListPage(1);
            }}
            className={inputClassName}
          >
            <option value="date_desc">按交易日期最新</option>
            <option value="amount_desc">按金额从高到低</option>
            <option value="deadline_asc">按截止日期最近</option>
            <option value="profit_desc">按利润从高到低</option>
          </select>
          <button type="button" onClick={resetListFilters} className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            重置主列表
          </button>
        </div>
        <OrderTable
          orders={pagedMainOrders}
          writers={writers}
          clients={clients}
          onViewOrder={openOrderDetails}
          onEditOrder={openOrderEditor}
        />
        <div className="mt-4">
          <Pagination
            page={safeListPage}
            totalPages={listTotalPages}
            pageSize={listPageSize}
            onChange={setListPage}
            onPageSizeChange={(size) => {
              setListPageSize(size);
              setListPage(1);
            }}
          />
        </div>
      </CollapsibleSection>

      {viewingOrder ? (
        <ModalShell
          title="工单详情"
          subtitle="这里会同时展示工单本身、对应客户档案和写手档案。"
          onClose={() => setViewingOrder(null)}
        >
          {(() => {
            const client = clients.find((item) => item.id === viewingOrder.clientId);
            const writer = writers.find((item) => item.id === viewingOrder.writerId);
            return (
              <>
            <div className="mt-6 space-y-4">
              <FieldRow label="论文题目"><div className="px-1 py-3 text-sm text-slate-800">{viewingOrder.title}</div></FieldRow>
              <FieldRow label="客户"><div className="px-1 py-3 text-sm text-slate-800">{client?.name ?? "-"}</div></FieldRow>
              <FieldRow label="客户学校信息"><div className="px-1 py-3 text-sm text-slate-800">{client?.schoolType ?? "-"} / {client?.educationLevel ?? "-"} / {client?.school ?? "-"}</div></FieldRow>
              <FieldRow label="客户专业"><div className="px-1 py-3 text-sm text-slate-800">{client?.major ?? "-"}</div></FieldRow>
              <FieldRow label="客户联系方式"><div className="px-1 py-3 text-sm text-slate-800">{client?.contactHandle ?? "-"}</div></FieldRow>
              <FieldRow label="类型/状态"><div className="px-1 py-3 text-sm text-slate-800">{viewingOrder.sourceType === "self_owned" ? "自接" : "转包"} / {viewingOrder.status}</div></FieldRow>
              <FieldRow label="服务/包干"><div className="px-1 py-3 text-sm text-slate-800">{viewingOrder.serviceType} / {viewingOrder.packageMode}</div></FieldRow>
              <FieldRow label="写手信息"><div className="px-1 py-3 text-sm text-slate-800">{writer ? `${writer.name} / ${writer.ownerName} / ${writer.settlementMode}` : "待分配"}</div></FieldRow>
              <FieldRow label="金额口径"><div className="px-1 py-3 text-sm text-slate-800">总价 ¥{viewingOrder.amount.toLocaleString()} / 成本 ¥{viewingOrder.costAmount.toLocaleString()} / 利润 ¥{viewingOrder.profitAmount.toLocaleString()}</div></FieldRow>
              <FieldRow label="回款口径"><div className="px-1 py-3 text-sm text-slate-800">已结 ¥{viewingOrder.settledAmount.toLocaleString()} / 应收 ¥{viewingOrder.receivableAmount.toLocaleString()}</div></FieldRow>
              <FieldRow label="时间节点"><div className="px-1 py-3 text-sm text-slate-800">交易 {viewingOrder.transactionDate} / 计划 {viewingOrder.deadline} / 写手 {viewingOrder.writerDeadline ?? "-"} / 实际 {viewingOrder.completedAt ?? "-"}</div></FieldRow>
              <FieldRow label="备注"><div className="px-1 py-3 text-sm text-slate-800">{viewingOrder.notes ?? viewingOrder.remark ?? "-"}</div></FieldRow>
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
              <button
                type="button"
                onClick={() => viewingOrder.writerId && router.push(`/writers?writerId=${viewingOrder.writerId}`)}
                disabled={!viewingOrder.writerId}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-40"
              >
                跳到写手
              </button>
            </div>
              </>
            );
          })()}
        </ModalShell>
      ) : null}

      {selectedOrder ? (
        <ModalShell
          title="编辑工单"
          subtitle="工单只维护业务字段；客户信息和写手信息从关联对象读取展示。"
          onClose={() => setSelectedOrder(null)}
        >
          {(() => {
            const client = clients.find((item) => item.id === selectedOrder.clientId);
            return (
              <>

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
                    const response = await fetch(`/api/orders/${selectedOrder.id}`, {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                      setMessage("工单已更新。");
                      setSelectedOrder(null);
                      router.refresh();
                    } else {
                      setMessage("工单更新失败。");
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
                  {client?.name ?? "-"} / {client?.schoolType ?? "-"} / {client?.educationLevel ?? "-"} / {client?.school ?? "-"}
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
                  <option value="lead">lead</option>
                  <option value="quoted">quoted</option>
                  <option value="in_progress">in_progress</option>
                  <option value="review">review</option>
                  <option value="delivered">delivered</option>
                  <option value="after_sales">after_sales</option>
                </select>
              </FieldRow>
              <FieldRow label="总价 / 收入">
                <input name="amount" type="number" defaultValue={selectedOrder.amount} className={inputClassName} />
              </FieldRow>
              <FieldRow label="已结算金额">
                <input name="settledAmount" type="number" defaultValue={selectedOrder.settledAmount} className={inputClassName} />
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
              </>
            );
          })()}
        </ModalShell>
      ) : null}

      {message ? <p className="text-sm text-slate-500">{message}</p> : null}
    </div>
  );
}
