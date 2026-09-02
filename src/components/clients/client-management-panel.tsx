"use client";

import { ClientTable } from "@/components/clients/client-table";
import { FieldRow } from "@/components/ui/field-row";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { ModalShell } from "@/components/ui/modal-shell";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { Pagination } from "@/components/ui/pagination";
import {
  FilterBarShell,
  FilterChipRow,
  FilteredEmptyState,
  ResetFilterButton,
  filterControlClass,
  type FilterChip
} from "@/components/ui/filter-bar";
import { apiFetch, formatApiError } from "@/lib/client/api-fetch";
import {
  getBooleanParam,
  getEnumParam,
  getNumberParam,
  getStringParam,
  replaceUrlParams
} from "@/lib/client-url-state";
import {
  countActiveFilters,
  isEnumFilterActive,
  isTextFilterActive
} from "@/lib/ui/filter-state";
import { labelOf, riskLevelLabels } from "@/lib/ui/labels";
import type { PaginatedResult } from "@/lib/api/pagination";
import type { ClientListItem } from "@/lib/api/list-queries";
import type { Client, Writer } from "@/lib/types";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const inputClassName = "w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm";
const riskOptions = ["all", "low", "medium", "high"] as const;
const clientSortOptions = ["name_asc", "name_desc", "created_desc", "budget_desc"] as const;

export function ClientManagementPanel({
  list,
  writers
}: {
  list: PaginatedResult<ClientListItem>;
  writers: Writer[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [listOpen, setListOpen] = useState(() => getBooleanParam(searchParams, "clientListOpen", true));

  const focusedClientId = getStringParam(searchParams, "clientId", "");
  const riskLevel = getEnumParam(searchParams, "clientRisk", riskOptions, "all");
  const sort = getEnumParam(searchParams, "clientSort", clientSortOptions, "created_desc");
  const page = getNumberParam(searchParams, "clientPage", 1);
  const pageSize = getNumberParam(searchParams, "clientPageSize", 10);
  const queryFromUrl = getStringParam(searchParams, "clientQuery", "");
  const [queryInput, setQueryInput] = useState(queryFromUrl);

  useEffect(() => {
    setQueryInput(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (queryInput === queryFromUrl) {
        return;
      }

      startTransition(() => {
        replaceUrlParams({
          pathname,
          router,
          updates: {
            clientQuery: queryInput || null,
            clientPage: null
          }
        });
      });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [pathname, queryFromUrl, queryInput, router]);

  useEffect(() => {
    replaceUrlParams({
      pathname,
      router,
      updates: {
        clientListOpen: listOpen ? null : "0"
      }
    });
  }, [listOpen, pathname, router]);

  function updateParams(updates: Record<string, string | null>) {
    startTransition(() => {
      replaceUrlParams({ pathname, router, updates });
    });
  }

  function resetFilters() {
    setQueryInput("");
    updateParams({
      clientQuery: null,
      clientRisk: null,
      clientSort: null,
      clientId: null,
      clientPage: null,
      clientPageSize: null
    });
  }

  const queryActive = isTextFilterActive(queryInput);
  const riskActive = isEnumFilterActive(riskLevel);
  const focusedActive = isTextFilterActive(focusedClientId);
  const activeFilterCount = countActiveFilters([queryActive, riskActive, focusedActive]);
  const hasActiveFilters = activeFilterCount > 0;

  const chips: FilterChip[] = [];
  if (queryActive) {
    chips.push({
      key: "q",
      label: `搜索：${queryInput}`,
      onClear: () => {
        setQueryInput("");
        updateParams({ clientQuery: null, clientPage: null });
      }
    });
  }
  if (riskActive) {
    chips.push({
      key: "risk",
      label: `风险：${labelOf(riskLevelLabels, riskLevel)}`,
      onClear: () => updateParams({ clientRisk: null, clientPage: null })
    });
  }
  if (focusedActive) {
    chips.push({
      key: "clientId",
      label: "指定客户",
      onClear: () => updateParams({ clientId: null, clientPage: null })
    });
  }

  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <div className="space-y-6">
      <CollapsibleSection
        title="客户列表"
        open={listOpen}
        onToggle={setListOpen}
        activeFilterCount={activeFilterCount}
      >
        <FilterBarShell active={hasActiveFilters}>
          <input
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="搜索客户、学校、专业、联系方式"
            className={filterControlClass(queryActive)}
          />
          <select
            value={riskLevel}
            onChange={(event) =>
              updateParams({
                clientRisk: event.target.value === "all" ? null : event.target.value,
                clientPage: null
              })
            }
            className={filterControlClass(riskActive)}
          >
            <option value="all">全部风险等级</option>
            <option value="low">低风险</option>
            <option value="medium">中风险</option>
            <option value="high">高风险</option>
          </select>
          <select
            value={sort}
            onChange={(event) =>
              updateParams({
                clientSort: event.target.value === "created_desc" ? null : event.target.value,
                clientPage: null
              })
            }
            className={filterControlClass(false)}
          >
            <option value="created_desc">按最新创建</option>
            <option value="name_asc">按姓名 A-Z</option>
            <option value="name_desc">按姓名 Z-A</option>
            <option value="budget_desc">按预算从高到低</option>
          </select>
          <div className="flex items-center rounded-[18px] bg-slate-950 px-4 py-3 text-sm text-white">
            共 {list.total} 位客户{isPending ? " · 更新中" : ""}
          </div>
          <ResetFilterButton disabled={!hasActiveFilters} onClick={resetFilters} />
          <ExportExcelButton exportUrl="/api/export/clients" label="导出客户 Excel" />
        </FilterBarShell>

        <FilterChipRow chips={chips} />

        <div className={isPending ? "opacity-55 transition-opacity" : "transition-opacity"}>
          {list.items.length === 0 ? (
            <FilteredEmptyState hasActiveFilters={hasActiveFilters} onReset={resetFilters} />
          ) : (
            <ClientTable
              clients={list.items}
              writers={writers}
              onViewClient={setViewingClient}
              onEditClient={setEditingClient}
            />
          )}
          <div className="mt-4">
            <Pagination
              page={Math.min(page, totalPages)}
              totalPages={totalPages}
              pageSize={pageSize}
              onChange={(nextPage) => updateParams({ clientPage: nextPage === 1 ? null : String(nextPage) })}
              onPageSizeChange={(size) =>
                updateParams({
                  clientPageSize: size === 10 ? null : String(size),
                  clientPage: null
                })
              }
            />
          </div>
        </div>
      </CollapsibleSection>

      {viewingClient ? (
        <ModalShell title="客户详情" onClose={() => setViewingClient(null)} width="max-w-4xl">
          <div className="mt-6 space-y-4">
            <FieldRow label="客户姓名">
              <div className="px-1 py-3 text-sm text-slate-800">{viewingClient.name}</div>
            </FieldRow>
            <FieldRow label="联系方式">
              <div className="px-1 py-3 text-sm text-slate-800">{viewingClient.contactHandle}</div>
            </FieldRow>
            <FieldRow label="学校/学历">
              <div className="px-1 py-3 text-sm text-slate-800">
                {viewingClient.schoolType} / {viewingClient.educationLevel} / {viewingClient.school}
              </div>
            </FieldRow>
            <FieldRow label="专业">
              <div className="px-1 py-3 text-sm text-slate-800">{viewingClient.major}</div>
            </FieldRow>
            <FieldRow label="预设题目">
              <div className="px-1 py-3 text-sm text-slate-800">{viewingClient.preferredTitle ?? "-"}</div>
            </FieldRow>
            <FieldRow label="备注">
              <div className="px-1 py-3 text-sm text-slate-800">{viewingClient.notes ?? "-"}</div>
            </FieldRow>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingClient(viewingClient);
                setViewingClient(null);
              }}
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
        <ModalShell title="编辑客户" onClose={() => setEditingClient(null)} width="max-w-5xl">
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
                  const result = await apiFetch(`/api/clients/${editingClient.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                  });

                  if (result.ok) {
                    setMessage("客户已更新。");
                    setEditingClient(null);
                    router.refresh();
                  } else {
                    setMessage(formatApiError(result.error));
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
              <input
                name="preferredServiceType"
                defaultValue={editingClient.preferredServiceType ?? ""}
                className={inputClassName}
              />
            </FieldRow>
            <FieldRow label="预设截止日期">
              <input
                name="preferredDeadline"
                defaultValue={editingClient.preferredDeadline ?? ""}
                className={inputClassName}
              />
            </FieldRow>
            <FieldRow label="预设预算">
              <input
                name="preferredBudget"
                type="number"
                defaultValue={editingClient.preferredBudget ?? 0}
                className={inputClassName}
              />
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
