"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import {
  FilterBarShell,
  FilterChipRow,
  FilteredEmptyState,
  ResetFilterButton,
  filterControlClass,
  type FilterChip
} from "@/components/ui/filter-bar";
import { KpiCard } from "@/components/ui/kpi-card";
import { Pagination } from "@/components/ui/pagination";
import { StatusPill } from "@/components/ui/status-pill";
import {
  getBooleanParam,
  getEnumParam,
  getNumberParam,
  getStringParam,
  replaceUrlParams
} from "@/lib/client-url-state";
import type { InboxItem, InboxKpis } from "@/lib/queries/inbox";
import type { PaginatedResult } from "@/lib/api/pagination";
import {
  countActiveFilters,
  isEnumFilterActive,
  isTextFilterActive
} from "@/lib/ui/filter-state";
import {
  labelOf,
  orderStatusLabels,
  sourceTypeLabels,
  urgencyLabels
} from "@/lib/ui/labels";

const statusOptions = ["all", "lead", "quoted", "in_progress", "review"] as const;
const sourceOptions = ["all", "self_owned", "outsourced"] as const;
const urgencyOptions = ["all", "low", "medium", "high"] as const;
const focusOptions = ["all", "overdue", "due_soon", "no_deadline", "unassigned"] as const;

function deadlineTone(item: InboxItem): "red" | "amber" | "slate" | "green" {
  if (item.overdue) return "red";
  if (item.dueSoon) return "amber";
  if (item.noDeadline) return "slate";
  return "green";
}

function deadlineLabel(item: InboxItem) {
  if (item.noDeadline) return "无截止";
  if (item.daysToDeadline === null) return item.deadline || "无截止";
  if (item.daysToDeadline < 0) return `逾期 ${Math.abs(item.daysToDeadline)} 天`;
  if (item.daysToDeadline === 0) return "今日到期";
  if (item.daysToDeadline <= 7) return `${item.daysToDeadline} 天后`;
  return `${item.daysToDeadline} 天后`;
}

export function InboxView({
  kpis,
  list
}: {
  kpis: InboxKpis;
  list: PaginatedResult<InboxItem>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [filterOpen, setFilterOpen] = useState(() =>
    getBooleanParam(searchParams, "inboxFiltersOpen", true)
  );

  const queryFromUrl = getStringParam(searchParams, "inboxQuery", "");
  const [queryInput, setQueryInput] = useState(queryFromUrl);
  const status = getEnumParam(searchParams, "inboxStatus", statusOptions, "all");
  const sourceType = getEnumParam(searchParams, "inboxSourceType", sourceOptions, "all");
  const urgency = getEnumParam(searchParams, "inboxUrgency", urgencyOptions, "all");
  const focus = getEnumParam(searchParams, "inboxFocus", focusOptions, "all");
  const page = getNumberParam(searchParams, "inboxPage", 1);
  const pageSize = getNumberParam(searchParams, "inboxPageSize", 20);

  useEffect(() => {
    setQueryInput(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (queryInput === queryFromUrl) return;
      startTransition(() => {
        replaceUrlParams({
          pathname,
          router,
          updates: {
            inboxQuery: queryInput || null,
            inboxPage: null
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
        inboxFiltersOpen: filterOpen ? null : "0"
      }
    });
  }, [filterOpen, pathname, router]);

  function updateParams(updates: Record<string, string | null>) {
    startTransition(() => {
      replaceUrlParams({ pathname, router, updates });
    });
  }

  function resetFilters() {
    setQueryInput("");
    updateParams({
      inboxQuery: null,
      inboxStatus: null,
      inboxSourceType: null,
      inboxUrgency: null,
      inboxFocus: null,
      inboxPage: null,
      inboxPageSize: null
    });
  }

  const queryActive = isTextFilterActive(queryInput);
  const statusActive = isEnumFilterActive(status);
  const sourceActive = isEnumFilterActive(sourceType);
  const urgencyActive = isEnumFilterActive(urgency);
  const focusActive = isEnumFilterActive(focus);
  const activeFilterCount = countActiveFilters([
    queryActive,
    statusActive,
    sourceActive,
    urgencyActive,
    focusActive
  ]);
  const hasActiveFilters = activeFilterCount > 0;
  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  const chips: FilterChip[] = [];
  if (queryActive) {
    chips.push({
      key: "q",
      label: `搜索：${queryInput}`,
      onClear: () => {
        setQueryInput("");
        updateParams({ inboxQuery: null, inboxPage: null });
      }
    });
  }
  if (statusActive) {
    chips.push({
      key: "status",
      label: `状态：${labelOf(orderStatusLabels, status)}`,
      onClear: () => updateParams({ inboxStatus: null, inboxPage: null })
    });
  }
  if (sourceActive) {
    chips.push({
      key: "source",
      label: labelOf(sourceTypeLabels, sourceType),
      onClear: () => updateParams({ inboxSourceType: null, inboxPage: null })
    });
  }
  if (urgencyActive) {
    chips.push({
      key: "urgency",
      label: `紧急：${labelOf(urgencyLabels, urgency)}`,
      onClear: () => updateParams({ inboxUrgency: null, inboxPage: null })
    });
  }
  if (focusActive) {
    const focusLabels: Record<string, string> = {
      overdue: "仅逾期",
      due_soon: "仅临期",
      no_deadline: "仅无截止",
      unassigned: "仅未派写手"
    };
    chips.push({
      key: "focus",
      label: focusLabels[focus] ?? focus,
      onClear: () => updateParams({ inboxFocus: null, inboxPage: null })
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => updateParams({ inboxFocus: null, inboxPage: null })}
          className="text-left"
        >
          <KpiCard label="在途总数" value={kpis.activeTotal} detail="lead～review" />
        </button>
        <button
          type="button"
          onClick={() => updateParams({ inboxFocus: "overdue", inboxPage: null })}
          className="text-left"
        >
          <KpiCard label="已逾期" value={kpis.overdue} detail="deadline 已过" />
        </button>
        <button
          type="button"
          onClick={() => updateParams({ inboxFocus: "due_soon", inboxPage: null })}
          className="text-left"
        >
          <KpiCard label="7 日内到期" value={kpis.dueSoon} detail="含今日" />
        </button>
        <button
          type="button"
          onClick={() => updateParams({ inboxFocus: "no_deadline", inboxPage: null })}
          className="text-left"
        >
          <KpiCard label="无截止" value={kpis.noDeadline} detail="需补截止日期" />
        </button>
        <button
          type="button"
          onClick={() => updateParams({ inboxFocus: "unassigned", inboxPage: null })}
          className="col-span-2 text-left lg:col-span-1"
        >
          <KpiCard label="未派写手" value={kpis.unassigned} detail="writer 为空" />
        </button>
      </section>

      <CollapsibleSection
        title="筛选"
        open={filterOpen}
        onToggle={setFilterOpen}
        activeFilterCount={activeFilterCount}
      >
        <FilterBarShell active={hasActiveFilters} className="sm:grid-cols-2 xl:grid-cols-4">
          <input
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="搜索题目、客户、负责人"
            className={filterControlClass(queryActive)}
          />
          <select
            value={status}
            onChange={(event) =>
              updateParams({
                inboxStatus: event.target.value === "all" ? null : event.target.value,
                inboxPage: null
              })
            }
            className={filterControlClass(statusActive)}
          >
            <option value="all">全部在途状态</option>
            {statusOptions.slice(1).map((item) => (
              <option key={item} value={item}>
                {labelOf(orderStatusLabels, item)}
              </option>
            ))}
          </select>
          <select
            value={sourceType}
            onChange={(event) =>
              updateParams({
                inboxSourceType: event.target.value === "all" ? null : event.target.value,
                inboxPage: null
              })
            }
            className={filterControlClass(sourceActive)}
          >
            <option value="all">全部来源</option>
            <option value="self_owned">自接</option>
            <option value="outsourced">转包</option>
          </select>
          <select
            value={urgency}
            onChange={(event) =>
              updateParams({
                inboxUrgency: event.target.value === "all" ? null : event.target.value,
                inboxPage: null
              })
            }
            className={filterControlClass(urgencyActive)}
          >
            <option value="all">全部紧急度</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
          <select
            value={focus}
            onChange={(event) =>
              updateParams({
                inboxFocus: event.target.value === "all" ? null : event.target.value,
                inboxPage: null
              })
            }
            className={filterControlClass(focusActive)}
          >
            <option value="all">全部焦点</option>
            <option value="overdue">仅逾期</option>
            <option value="due_soon">仅临期（7 日）</option>
            <option value="no_deadline">仅无截止</option>
            <option value="unassigned">仅未派写手</option>
          </select>
          <div className="flex items-center rounded-[18px] bg-slate-950 px-4 py-3 text-sm text-white">
            共 {list.total} 条{isPending ? " · 更新中" : ""}
          </div>
          <ResetFilterButton disabled={!hasActiveFilters} onClick={resetFilters} />
        </FilterBarShell>
        <FilterChipRow chips={chips} />
      </CollapsibleSection>

      <div className={isPending ? "opacity-55 transition-opacity" : "transition-opacity"}>
        {list.items.length === 0 ? (
          <FilteredEmptyState
            hasActiveFilters={hasActiveFilters}
            onReset={resetFilters}
            emptyLabel="当前没有在途工单"
          />
        ) : (
          <div className="space-y-3">
            {/* Desktop / wide table */}
            <div className="hidden overflow-x-auto rounded-[28px] border border-white/60 bg-white/75 shadow-soft lg:block">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200/80 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">题目 / 客户</th>
                    <th className="px-4 py-3 font-medium">状态</th>
                    <th className="px-4 py-3 font-medium">客截止</th>
                    <th className="px-4 py-3 font-medium">写手截稿</th>
                    <th className="px-4 py-3 font-medium">紧急</th>
                    <th className="px-4 py-3 font-medium">写手</th>
                    <th className="px-4 py-3 font-medium">距到期</th>
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100/80 last:border-0">
                      <td className="max-w-[280px] px-4 py-3">
                        <Link
                          href={`/orders?orderQuery=${encodeURIComponent(item.title)}`}
                          className="font-medium text-slate-950 hover:underline"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {item.clientName ?? "未命名客户"} · {labelOf(sourceTypeLabels, item.sourceType)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill label={labelOf(orderStatusLabels, item.status)} tone="blue" />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {item.deadline?.trim() || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {item.writerDeadline?.trim() || "—"}
                      </td>
                      <td className="px-4 py-3">{labelOf(urgencyLabels, item.urgency)}</td>
                      <td className="px-4 py-3 text-slate-700">{item.writerId ? "已派" : "未派"}</td>
                      <td className="px-4 py-3">
                        <StatusPill label={deadlineLabel(item)} tone={deadlineTone(item)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Compact cards for narrow / zoomed viewports */}
            <div className="grid gap-3 lg:hidden">
              {list.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[24px] border border-white/65 bg-white/80 p-4 shadow-soft"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/orders?orderQuery=${encodeURIComponent(item.title)}`}
                        className="block truncate font-medium text-slate-950 hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.clientName ?? "未命名客户"} · {labelOf(sourceTypeLabels, item.sourceType)}
                      </p>
                    </div>
                    <StatusPill label={deadlineLabel(item)} tone={deadlineTone(item)} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4">
                    <div>
                      <span className="text-slate-400">状态</span>
                      <p className="mt-0.5">{labelOf(orderStatusLabels, item.status)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">客截止</span>
                      <p className="mt-0.5">{item.deadline?.trim() || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">写手截稿</span>
                      <p className="mt-0.5">{item.writerDeadline?.trim() || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">紧急 / 写手</span>
                      <p className="mt-0.5">
                        {labelOf(urgencyLabels, item.urgency)} · {item.writerId ? "已派" : "未派"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <Pagination
            page={Math.min(page, totalPages)}
            totalPages={totalPages}
            pageSize={pageSize}
            onChange={(nextPage) =>
              updateParams({ inboxPage: nextPage === 1 ? null : String(nextPage) })
            }
            onPageSizeChange={(size) =>
              updateParams({
                inboxPageSize: size === 20 ? null : String(size),
                inboxPage: null
              })
            }
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
      </div>
    </div>
  );
}
