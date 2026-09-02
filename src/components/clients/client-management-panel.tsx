"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClientTable } from "@/components/clients/client-table";
import { FieldRow } from "@/components/ui/field-row";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { ModalShell } from "@/components/ui/modal-shell";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { Pagination } from "@/components/ui/pagination";
import { apiFetch, formatApiError } from "@/lib/client/api-fetch";
import {
  getBooleanParam,
  getEnumParam,
  getNumberParam,
  getStringParam,
  replaceUrlParams
} from "@/lib/client-url-state";
import type { Client, Order, Writer } from "@/lib/types";

const inputClassName = "w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm";
const riskOptions = ["all", "low", "medium", "high"] as const;
const clientSortOptions = ["name_asc", "name_desc", "created_desc", "budget_desc"] as const;

export function ClientManagementPanel({
  clients,
  orders,
  writers
}: {
  clients: Client[];
  orders: Order[];
  writers: Writer[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState(() => getStringParam(searchParams, "clientQuery", ""));
  const [focusedClientId, setFocusedClientId] = useState(() => getStringParam(searchParams, "clientId", ""));
  const [riskLevel, setRiskLevel] = useState<"all" | "low" | "medium" | "high">(() =>
    getEnumParam(searchParams, "clientRisk", riskOptions, "all")
  );
  const [quickSort, setQuickSort] = useState<(typeof clientSortOptions)[number]>(() =>
    getEnumParam(searchParams, "clientQuickSort", clientSortOptions, "name_asc")
  );
  const [page, setPage] = useState(() => getNumberParam(searchParams, "clientPage", 1));
  const [pageSize, setPageSize] = useState(() => getNumberParam(searchParams, "clientPageSize", 10));
  const [listQuery, setListQuery] = useState(() => getStringParam(searchParams, "clientListQuery", ""));
  const [listRiskLevel, setListRiskLevel] = useState<"all" | "low" | "medium" | "high">(() =>
    getEnumParam(searchParams, "clientListRisk", riskOptions, "all")
  );
  const [listSort, setListSort] = useState<(typeof clientSortOptions)[number]>(() =>
    getEnumParam(searchParams, "clientListSort", clientSortOptions, "created_desc")
  );
  const [listPage, setListPage] = useState(() => getNumberParam(searchParams, "clientListPage", 1));
  const [listPageSize, setListPageSize] = useState(() => getNumberParam(searchParams, "clientListPageSize", 10));
  const [quickOpen, setQuickOpen] = useState(() =>
    getBooleanParam(searchParams, "clientQuickOpen", true)
  );
  const [listOpen, setListOpen] = useState(() =>
    getBooleanParam(searchParams, "clientListOpen", true)
  );
  const [isPending, startTransition] = useTransition();

  function sortClients(items: Client[], sort: (typeof clientSortOptions)[number]) {
    return [...items].sort((a, b) => {
      switch (sort) {
        case "name_desc":
          return b.name.localeCompare(a.name, "zh-CN");
        case "created_desc":
          return b.createdAt.localeCompare(a.createdAt);
        case "budget_desc":
          return (b.preferredBudget ?? 0) - (a.preferredBudget ?? 0);
        default:
          return a.name.localeCompare(b.name, "zh-CN");
      }
    });
  }

  const filteredClients = useMemo(() => {
    return sortClients(clients.filter((client) => {
      const matchesFocused = !focusedClientId || client.id === focusedClientId;
      const matchesQuery =
        query.trim() === "" ||
        [client.name, client.contactHandle, client.school, client.major, client.sourceChannel]
          .join(" ")
          .toLowerCase()
          .includes(query.trim().toLowerCase());
      const matchesRisk = riskLevel === "all" || client.riskLevel === riskLevel;
      return matchesFocused && matchesQuery && matchesRisk;
    }), quickSort);
  }, [clients, focusedClientId, query, quickSort, riskLevel]);

  const mainFilteredClients = useMemo(() => {
    return sortClients(
      clients.filter((client) => {
        const matchesQuery =
          listQuery.trim() === "" ||
          [client.name, client.contactHandle, client.school, client.major, client.sourceChannel]
            .join(" ")
            .toLowerCase()
            .includes(listQuery.trim().toLowerCase());
        const matchesRisk = listRiskLevel === "all" || client.riskLevel === listRiskLevel;
        return matchesQuery && matchesRisk;
      }),
      listSort
    );
  }, [clients, listQuery, listRiskLevel, listSort]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedClients = useMemo(
    () => filteredClients.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredClients, safePage, pageSize]
  );
  const listTotalPages = Math.max(1, Math.ceil(mainFilteredClients.length / listPageSize));
  const safeListPage = Math.min(listPage, listTotalPages);
  const pagedMainClients = useMemo(
    () => mainFilteredClients.slice((safeListPage - 1) * listPageSize, safeListPage * listPageSize),
    [listPageSize, mainFilteredClients, safeListPage]
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
        clientQuery: query || null,
        clientId: focusedClientId || null,
        clientRisk: riskLevel === "all" ? null : riskLevel,
        clientQuickSort: quickSort === "name_asc" ? null : quickSort,
        clientPage: safePage === 1 ? null : String(safePage),
        clientPageSize: pageSize === 10 ? null : String(pageSize),
        clientListQuery: listQuery || null,
        clientListRisk: listRiskLevel === "all" ? null : listRiskLevel,
        clientListSort: listSort === "created_desc" ? null : listSort,
        clientListPage: safeListPage === 1 ? null : String(safeListPage),
        clientListPageSize: listPageSize === 10 ? null : String(listPageSize),
        clientQuickOpen: quickOpen ? null : "0",
        clientListOpen: listOpen ? null : "0"
      }
    });
  }, [focusedClientId, listOpen, listPageSize, listQuery, listRiskLevel, listSort, pageSize, pathname, query, quickOpen, quickSort, riskLevel, router, safeListPage, safePage]);

  function resetFilters() {
    setQuery("");
    setFocusedClientId("");
    setRiskLevel("all");
    setQuickSort("name_asc");
    setPage(1);
    setPageSize(10);
  }
  function resetListFilters() {
    setListQuery("");
    setListRiskLevel("all");
    setListSort("created_desc");
    setListPage(1);
    setListPageSize(10);
  }

  function openClientDetails(client: Client) {
    setViewingClient(client);
    setEditingClient(null);
  }

  function openClientEditor(client: Client) {
    setEditingClient(client);
    setViewingClient(null);
    setMessage(null);
  }

  return (
    <div className="space-y-6">
      <CollapsibleSection
        title="客户快捷操作"
        description="当数据量较大时，可以先在这里快速定位并编辑或删除。"
        open={quickOpen}
        onToggle={setQuickOpen}
      >
        <div className="space-y-5">
          <div className="grid gap-4 rounded-[28px] border border-white/60 bg-white/75 p-5 md:grid-cols-4">
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="搜索客户、学校、专业、联系方式"
              className={inputClassName}
            />
            <select
              value={riskLevel}
              onChange={(event) => {
                setRiskLevel(event.target.value as "all" | "low" | "medium" | "high");
                setPage(1);
              }}
              className={inputClassName}
            >
              <option value="all">全部风险等级</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
            <select
              value={quickSort}
              onChange={(event) => {
                setQuickSort(event.target.value as (typeof clientSortOptions)[number]);
                setPage(1);
              }}
              className={inputClassName}
            >
              <option value="name_asc">按姓名 A-Z</option>
              <option value="name_desc">按姓名 Z-A</option>
              <option value="created_desc">按最新创建</option>
              <option value="budget_desc">按预算从高到低</option>
            </select>
            <div className="flex items-center rounded-[18px] bg-slate-950 px-4 py-3 text-sm text-white">
              当前结果 {filteredClients.length} 位客户
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              重置筛选
            </button>
            <ExportExcelButton exportUrl="/api/export/clients" label="导出客户 Excel" />
          </div>

          {focusedClientId ? (
            <div className="flex flex-wrap items-center gap-3 rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <span>当前仅展示指定客户及其上下文联动结果。</span>
              <button
                type="button"
                onClick={() => {
                  setFocusedClientId("");
                  setPage(1);
                }}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
              >
                清除指定客户
              </button>
            </div>
          ) : null}

          <div className="space-y-3">
            {pagedClients.map((client) => (
              <div
                key={client.id}
                className="flex flex-col gap-3 rounded-[24px] border border-white/60 bg-white/75 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="text-base font-medium text-slate-950">{client.name}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {client.schoolType} / {client.educationLevel} / {client.major}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openClientDetails(client)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
                  >
                    详情
                  </button>
                  <button
                    type="button"
                    onClick={() => openClientEditor(client)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFocusedClientId(client.id);
                      setPage(1);
                      router.push(`/orders?clientId=${client.id}`);
                    }}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
                  >
                    关联工单
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const confirmed = window.confirm("删除客户后无法恢复，且可能影响关联工单。确认删除吗？");
                      if (!confirmed) return;
                      startTransition(() => {
                        void (async () => {
                          const result = await apiFetch<{ ok: true }>(
                            `/api/clients/${client.id}`,
                            { method: "DELETE" }
                          );
                          if (result.ok) {
                            setMessage("客户已删除。");
                            router.refresh();
                          } else {
                            setMessage(formatApiError(result.error));
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
            ))}
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
        title="客户列表"
        description="可以收起此区域，避免页面在历史数据较多时过长。"
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
            placeholder="筛选主列表中的客户"
            className={inputClassName}
          />
          <select
            value={listRiskLevel}
            onChange={(event) => {
              setListRiskLevel(event.target.value as "all" | "low" | "medium" | "high");
              setListPage(1);
            }}
            className={inputClassName}
          >
            <option value="all">全部风险等级</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
          <select
            value={listSort}
            onChange={(event) => {
              setListSort(event.target.value as (typeof clientSortOptions)[number]);
              setListPage(1);
            }}
            className={inputClassName}
          >
            <option value="created_desc">按最新创建</option>
            <option value="name_asc">按姓名 A-Z</option>
            <option value="name_desc">按姓名 Z-A</option>
            <option value="budget_desc">按预算从高到低</option>
          </select>
          <button type="button" onClick={resetListFilters} className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            重置主列表
          </button>
        </div>
        <ClientTable
          clients={pagedMainClients}
          orders={orders}
          writers={writers}
          onViewClient={openClientDetails}
          onEditClient={openClientEditor}
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

      {viewingClient ? (
        <ModalShell
          title="客户详情"
          subtitle="完整查看客户档案，以及其预设工单信息。"
          onClose={() => setViewingClient(null)}
          width="max-w-4xl"
        >
            <div className="mt-6 space-y-4">
              <FieldRow label="客户姓名"><div className="px-1 py-3 text-sm text-slate-800">{viewingClient.name}</div></FieldRow>
              <FieldRow label="联系方式"><div className="px-1 py-3 text-sm text-slate-800">{viewingClient.contactHandle}</div></FieldRow>
              <FieldRow label="来源渠道"><div className="px-1 py-3 text-sm text-slate-800">{viewingClient.sourceChannel}</div></FieldRow>
              <FieldRow label="学校/学历"><div className="px-1 py-3 text-sm text-slate-800">{viewingClient.schoolType} / {viewingClient.educationLevel} / {viewingClient.school}</div></FieldRow>
              <FieldRow label="专业"><div className="px-1 py-3 text-sm text-slate-800">{viewingClient.major}</div></FieldRow>
              <FieldRow label="风险等级"><div className="px-1 py-3 text-sm text-slate-800">{viewingClient.riskLevel}</div></FieldRow>
              <FieldRow label="预设题目"><div className="px-1 py-3 text-sm text-slate-800">{viewingClient.preferredTitle ?? "-"}</div></FieldRow>
              <FieldRow label="预设服务类型"><div className="px-1 py-3 text-sm text-slate-800">{viewingClient.preferredServiceType ?? "-"}</div></FieldRow>
              <FieldRow label="预设截止日期"><div className="px-1 py-3 text-sm text-slate-800">{viewingClient.preferredDeadline ?? "-"}</div></FieldRow>
              <FieldRow label="预设预算"><div className="px-1 py-3 text-sm text-slate-800">¥{(viewingClient.preferredBudget ?? 0).toLocaleString()}</div></FieldRow>
              <FieldRow label="备注"><div className="px-1 py-3 text-sm text-slate-800">{viewingClient.notes ?? "-"}</div></FieldRow>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => openClientEditor(viewingClient)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
              >
                编辑客户
              </button>
              <button
                type="button"
                onClick={() => router.push(`/orders?clientId=${viewingClient.id}`)}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm text-white"
              >
                查看关联工单
              </button>
            </div>
        </ModalShell>
      ) : null}

      {editingClient ? (
        <ModalShell
          title="编辑客户"
          subtitle="客户字段和预设工单字段都可以在这里一次改完。"
          onClose={() => setEditingClient(null)}
          width="max-w-5xl"
        >
            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const payload = {
                  name: String(formData.get("name") ?? ""),
                  contactHandle: String(formData.get("contactHandle") ?? ""),
                  sourceChannel: String(formData.get("sourceChannel") ?? ""),
                  schoolType: String(formData.get("schoolType") ?? ""),
                  school: String(formData.get("school") ?? ""),
                  educationLevel: String(formData.get("educationLevel") ?? "本科"),
                  major: String(formData.get("major") ?? ""),
                  riskLevel: String(formData.get("riskLevel") ?? "medium"),
                  preferredTitle: String(formData.get("preferredTitle") ?? ""),
                  preferredServiceType: String(formData.get("preferredServiceType") ?? ""),
                  preferredDeadline: String(formData.get("preferredDeadline") ?? ""),
                  preferredBudget: Number(formData.get("preferredBudget") ?? 0),
                  notes: String(formData.get("notes") ?? "")
                };

                startTransition(() => {
                  void (async () => {
                    const response = await fetch(`/api/clients/${editingClient.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                      setMessage("客户已更新。");
                      setEditingClient(null);
                      router.refresh();
                    } else {
                      setMessage("客户更新失败。");
                    }
                  })();
                });
              }}
            >
              <FieldRow label="客户姓名">
                <input name="name" defaultValue={editingClient.name} className={inputClassName} />
              </FieldRow>
              <FieldRow label="联系方式">
                <input name="contactHandle" defaultValue={editingClient.contactHandle} className={inputClassName} />
              </FieldRow>
              <FieldRow label="来源渠道">
                <input name="sourceChannel" defaultValue={editingClient.sourceChannel} className={inputClassName} />
              </FieldRow>
              <FieldRow label="学校类型">
                <input name="schoolType" defaultValue={editingClient.schoolType} className={inputClassName} />
              </FieldRow>
              <FieldRow label="学校名称">
                <input name="school" defaultValue={editingClient.school} className={inputClassName} />
              </FieldRow>
              <FieldRow label="学历">
                <input name="educationLevel" defaultValue={editingClient.educationLevel} className={inputClassName} />
              </FieldRow>
              <FieldRow label="专业">
                <input name="major" defaultValue={editingClient.major} className={inputClassName} />
              </FieldRow>
              <FieldRow label="风险等级">
                <input name="riskLevel" defaultValue={editingClient.riskLevel} className={inputClassName} />
              </FieldRow>
              <FieldRow label="预设题目">
                <input name="preferredTitle" defaultValue={editingClient.preferredTitle ?? ""} className={inputClassName} />
              </FieldRow>
              <FieldRow label="预设服务类型">
                <input name="preferredServiceType" defaultValue={editingClient.preferredServiceType ?? ""} className={inputClassName} />
              </FieldRow>
              <FieldRow label="预设截止日期">
                <input name="preferredDeadline" defaultValue={editingClient.preferredDeadline ?? ""} className={inputClassName} />
              </FieldRow>
              <FieldRow label="预设预算">
                <input name="preferredBudget" type="number" defaultValue={editingClient.preferredBudget ?? 0} className={inputClassName} />
              </FieldRow>
              <FieldRow label="客户备注">
                <textarea
                  name="notes"
                  defaultValue={editingClient.notes ?? ""}
                  className="min-h-[96px] w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm"
                />
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
