"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { WriterGrid } from "@/components/writers/writer-grid";
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
import type { Writer } from "@/lib/types";

const inputClassName = "w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm";
const availabilityOptions = ["all", "available", "busy", "offline"] as const;
const writerSortOptions = ["name_asc", "load_desc", "rating_desc", "created_desc"] as const;

export function WriterManagementPanel({ writers }: { writers: Writer[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [editingWriter, setEditingWriter] = useState<Writer | null>(null);
  const [viewingWriter, setViewingWriter] = useState<Writer | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState(() => getStringParam(searchParams, "writerQuery", ""));
  const [focusedWriterId, setFocusedWriterId] = useState(() => getStringParam(searchParams, "writerId", ""));
  const [availability, setAvailability] = useState<"all" | "available" | "busy" | "offline">(() =>
    getEnumParam(searchParams, "writerAvailability", availabilityOptions, "all")
  );
  const [quickSort, setQuickSort] = useState<(typeof writerSortOptions)[number]>(() =>
    getEnumParam(searchParams, "writerQuickSort", writerSortOptions, "name_asc")
  );
  const [page, setPage] = useState(() => getNumberParam(searchParams, "writerPage", 1));
  const [pageSize, setPageSize] = useState(() => getNumberParam(searchParams, "writerPageSize", 8));
  const [listQuery, setListQuery] = useState(() => getStringParam(searchParams, "writerListQuery", ""));
  const [listAvailability, setListAvailability] = useState<"all" | "available" | "busy" | "offline">(() =>
    getEnumParam(searchParams, "writerListAvailability", availabilityOptions, "all")
  );
  const [listSort, setListSort] = useState<(typeof writerSortOptions)[number]>(() =>
    getEnumParam(searchParams, "writerListSort", writerSortOptions, "rating_desc")
  );
  const [listPage, setListPage] = useState(() => getNumberParam(searchParams, "writerListPage", 1));
  const [listPageSize, setListPageSize] = useState(() => getNumberParam(searchParams, "writerListPageSize", 8));
  const [quickOpen, setQuickOpen] = useState(() =>
    getBooleanParam(searchParams, "writerQuickOpen", true)
  );
  const [listOpen, setListOpen] = useState(() =>
    getBooleanParam(searchParams, "writerListOpen", true)
  );
  const [isPending, startTransition] = useTransition();

  function sortWriters(items: Writer[], sort: (typeof writerSortOptions)[number]) {
    return [...items].sort((a, b) => {
      switch (sort) {
        case "load_desc":
          return b.activeOrderCount - a.activeOrderCount;
        case "rating_desc":
          return b.rating - a.rating;
        case "created_desc":
          return a.name.localeCompare(b.name, "zh-CN");
        default:
          return a.name.localeCompare(b.name, "zh-CN");
      }
    });
  }

  const filteredWriters = useMemo(() => {
    return sortWriters(writers.filter((writer) => {
      const matchesFocused = !focusedWriterId || writer.id === focusedWriterId;
      const matchesQuery =
        query.trim() === "" ||
        [writer.name, writer.ownerName, writer.settlementMode, writer.specialties.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(query.trim().toLowerCase());
      const matchesAvailability = availability === "all" || writer.availability === availability;
      return matchesFocused && matchesQuery && matchesAvailability;
    }), quickSort);
  }, [availability, focusedWriterId, query, quickSort, writers]);

  const mainFilteredWriters = useMemo(() => {
    return sortWriters(
      writers.filter((writer) => {
        const matchesQuery =
          listQuery.trim() === "" ||
          [writer.name, writer.ownerName, writer.settlementMode, writer.specialties.join(" ")]
            .join(" ")
            .toLowerCase()
            .includes(listQuery.trim().toLowerCase());
        const matchesAvailability = listAvailability === "all" || writer.availability === listAvailability;
        return matchesQuery && matchesAvailability;
      }),
      listSort
    );
  }, [listAvailability, listQuery, listSort, writers]);

  const totalPages = Math.max(1, Math.ceil(filteredWriters.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedWriters = useMemo(
    () => filteredWriters.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredWriters, pageSize, safePage]
  );
  const listTotalPages = Math.max(1, Math.ceil(mainFilteredWriters.length / listPageSize));
  const safeListPage = Math.min(listPage, listTotalPages);
  const pagedMainWriters = useMemo(
    () => mainFilteredWriters.slice((safeListPage - 1) * listPageSize, safeListPage * listPageSize),
    [listPageSize, mainFilteredWriters, safeListPage]
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
        writerQuery: query || null,
        writerId: focusedWriterId || null,
        writerAvailability: availability === "all" ? null : availability,
        writerQuickSort: quickSort === "name_asc" ? null : quickSort,
        writerPage: safePage === 1 ? null : String(safePage),
        writerPageSize: pageSize === 8 ? null : String(pageSize),
        writerListQuery: listQuery || null,
        writerListAvailability: listAvailability === "all" ? null : listAvailability,
        writerListSort: listSort === "rating_desc" ? null : listSort,
        writerListPage: safeListPage === 1 ? null : String(safeListPage),
        writerListPageSize: listPageSize === 8 ? null : String(listPageSize),
        writerQuickOpen: quickOpen ? null : "0",
        writerListOpen: listOpen ? null : "0"
      }
    });
  }, [availability, focusedWriterId, listAvailability, listOpen, listPageSize, listQuery, listSort, pageSize, pathname, query, quickOpen, quickSort, router, safeListPage, safePage]);

  function resetFilters() {
    setQuery("");
    setFocusedWriterId("");
    setAvailability("all");
    setQuickSort("name_asc");
    setPage(1);
    setPageSize(8);
  }
  function resetListFilters() {
    setListQuery("");
    setListAvailability("all");
    setListSort("rating_desc");
    setListPage(1);
    setListPageSize(8);
  }

  function openWriterDetails(writer: Writer) {
    setViewingWriter(writer);
    setEditingWriter(null);
  }

  function openWriterEditor(writer: Writer) {
    setEditingWriter(writer);
    setViewingWriter(null);
    setMessage(null);
  }

  return (
    <div className="space-y-6">
      <CollapsibleSection
        title="写手快捷操作"
        description="支持在列表很长时先收起明细区，只保留常用编辑入口。"
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
              placeholder="搜索写手、负责人、擅长专业"
              className={inputClassName}
            />
            <select
              value={availability}
              onChange={(event) => {
                setAvailability(event.target.value as "all" | "available" | "busy" | "offline");
                setPage(1);
              }}
              className={inputClassName}
            >
              <option value="all">全部可用状态</option>
              <option value="available">available</option>
              <option value="busy">busy</option>
              <option value="offline">offline</option>
            </select>
            <select
              value={quickSort}
              onChange={(event) => {
                setQuickSort(event.target.value as (typeof writerSortOptions)[number]);
                setPage(1);
              }}
              className={inputClassName}
            >
              <option value="name_asc">按姓名 A-Z</option>
              <option value="load_desc">按当前单量</option>
              <option value="rating_desc">按评分</option>
              <option value="created_desc">按默认顺序</option>
            </select>
            <div className="flex items-center rounded-[18px] bg-slate-950 px-4 py-3 text-sm text-white">
              当前结果 {filteredWriters.length} 位写手
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              重置筛选
            </button>
            <ExportExcelButton exportUrl="/api/export/writers" label="导出写手 Excel" />
          </div>

          {focusedWriterId ? (
            <div className="flex flex-wrap items-center gap-3 rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <span>当前仅展示指定写手及其上下文联动结果。</span>
              <button
                type="button"
                onClick={() => {
                  setFocusedWriterId("");
                  setPage(1);
                }}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
              >
                清除指定写手
              </button>
            </div>
          ) : null}

          <div className="space-y-3">
            {pagedWriters.map((writer) => (
              <div
                key={writer.id}
                className="flex flex-col gap-3 rounded-[24px] border border-white/60 bg-white/75 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="text-base font-medium text-slate-950">{writer.name}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {writer.ownerName} / {writer.settlementMode} / {writer.specialties.join("、")}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openWriterDetails(writer)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
                  >
                    详情
                  </button>
                  <button
                    type="button"
                    onClick={() => openWriterEditor(writer)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/orders?writerId=${writer.id}`)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
                  >
                    关联工单
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const confirmed = window.confirm("删除写手后无法恢复。确认删除吗？");
                      if (!confirmed) return;
                      startTransition(() => {
                        void (async () => {
                          const result = await apiFetch<{ ok: true }>(
                            `/api/writers/${writer.id}`,
                            { method: "DELETE" }
                          );
                          if (result.ok) {
                            setMessage("写手已删除。");
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
        title="写手列表"
        description="可以收起此区域，避免页面在列表增长后过长。"
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
            placeholder="筛选主列表中的写手"
            className={inputClassName}
          />
          <select
            value={listAvailability}
            onChange={(event) => {
              setListAvailability(event.target.value as "all" | "available" | "busy" | "offline");
              setListPage(1);
            }}
            className={inputClassName}
          >
            <option value="all">全部可用状态</option>
            <option value="available">available</option>
            <option value="busy">busy</option>
            <option value="offline">offline</option>
          </select>
          <select
            value={listSort}
            onChange={(event) => {
              setListSort(event.target.value as (typeof writerSortOptions)[number]);
              setListPage(1);
            }}
            className={inputClassName}
          >
            <option value="rating_desc">按评分</option>
            <option value="load_desc">按当前单量</option>
            <option value="name_asc">按姓名 A-Z</option>
            <option value="created_desc">按默认顺序</option>
          </select>
          <button type="button" onClick={resetListFilters} className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            重置主列表
          </button>
        </div>
        <WriterGrid
          writers={pagedMainWriters}
          onViewWriter={openWriterDetails}
          onEditWriter={openWriterEditor}
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

      {viewingWriter ? (
        <ModalShell
          title="写手详情"
          subtitle="这里展示写手能力、负载、结算方式和补充说明。"
          onClose={() => setViewingWriter(null)}
          width="max-w-4xl"
        >
            <div className="mt-6 space-y-4">
              <FieldRow label="写手姓名"><div className="px-1 py-3 text-sm text-slate-800">{viewingWriter.name}</div></FieldRow>
              <FieldRow label="负责人"><div className="px-1 py-3 text-sm text-slate-800">{viewingWriter.ownerName}</div></FieldRow>
              <FieldRow label="擅长专业"><div className="px-1 py-3 text-sm text-slate-800">{viewingWriter.specialties.join("、")}</div></FieldRow>
              <FieldRow label="结算方式"><div className="px-1 py-3 text-sm text-slate-800">{viewingWriter.settlementMode}</div></FieldRow>
              <FieldRow label="状态/容量"><div className="px-1 py-3 text-sm text-slate-800">{viewingWriter.availability} / {viewingWriter.capacity}</div></FieldRow>
              <FieldRow label="当前单量"><div className="px-1 py-3 text-sm text-slate-800">{viewingWriter.activeOrderCount}</div></FieldRow>
              <FieldRow label="评分/完成率"><div className="px-1 py-3 text-sm text-slate-800">{viewingWriter.rating} / {Math.round(viewingWriter.completionRate * 100)}%</div></FieldRow>
              <FieldRow label="平均交付天数"><div className="px-1 py-3 text-sm text-slate-800">{viewingWriter.averageTurnaroundDays} 天</div></FieldRow>
              <FieldRow label="报价层级"><div className="px-1 py-3 text-sm text-slate-800">{viewingWriter.priceTier}</div></FieldRow>
              <FieldRow label="备注"><div className="px-1 py-3 text-sm text-slate-800">{viewingWriter.notes ?? "-"}</div></FieldRow>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => openWriterEditor(viewingWriter)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
              >
                编辑写手
              </button>
              <button
                type="button"
                onClick={() => router.push(`/orders?writerId=${viewingWriter.id}`)}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm text-white"
              >
                查看关联工单
              </button>
            </div>
        </ModalShell>
      ) : null}

      {editingWriter ? (
        <ModalShell
          title="编辑写手"
          subtitle="写手基础信息、能力参数和结算方式都可以在这里维护。"
          onClose={() => setEditingWriter(null)}
          width="max-w-5xl"
        >
            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const payload = {
                  name: String(formData.get("name") ?? ""),
                  specialties: String(formData.get("specialties") ?? "")
                    .split(/[,\n，]/)
                    .map((item) => item.trim())
                    .filter(Boolean),
                  availability: String(formData.get("availability") ?? "available"),
                  capacity: Number(formData.get("capacity") ?? 1),
                  rating: Number(formData.get("rating") ?? 4.5),
                  completionRate: Number(formData.get("completionRate") ?? 0.9),
                  averageTurnaroundDays: Number(formData.get("averageTurnaroundDays") ?? 5),
                  priceTier: String(formData.get("priceTier") ?? "standard"),
                  ownerName: String(formData.get("ownerName") ?? ""),
                  settlementMode: String(formData.get("settlementMode") ?? ""),
                  notes: String(formData.get("notes") ?? "")
                };

                startTransition(() => {
                  void (async () => {
                    const response = await fetch(`/api/writers/${editingWriter.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                      setMessage("写手已更新。");
                      setEditingWriter(null);
                      router.refresh();
                    } else {
                      setMessage("写手更新失败。");
                    }
                  })();
                });
              }}
            >
              <FieldRow label="写手姓名">
                <input name="name" defaultValue={editingWriter.name} className={inputClassName} />
              </FieldRow>
              <FieldRow label="负责人 / 对接人">
                <input name="ownerName" defaultValue={editingWriter.ownerName} className={inputClassName} />
              </FieldRow>
              <FieldRow label="擅长专业" hint="逗号分隔">
                <textarea
                  name="specialties"
                  defaultValue={editingWriter.specialties.join("，")}
                  className="min-h-[96px] w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm"
                />
              </FieldRow>
              <FieldRow label="结算方式">
                <input name="settlementMode" defaultValue={editingWriter.settlementMode} className={inputClassName} />
              </FieldRow>
              <FieldRow label="可用状态">
                <input name="availability" defaultValue={editingWriter.availability} className={inputClassName} />
              </FieldRow>
              <FieldRow label="报价层级">
                <input name="priceTier" defaultValue={editingWriter.priceTier} className={inputClassName} />
              </FieldRow>
              <FieldRow label="容量上限">
                <input name="capacity" type="number" defaultValue={editingWriter.capacity} className={inputClassName} />
              </FieldRow>
              <FieldRow label="当前单量">
                <div className="px-1 py-3 text-sm text-slate-800">{editingWriter.activeOrderCount}（由在途工单自动计算）</div>
              </FieldRow>
              <FieldRow label="评分">
                <input name="rating" type="number" step="0.1" defaultValue={editingWriter.rating} className={inputClassName} />
              </FieldRow>
              <FieldRow label="完成率">
                <input name="completionRate" type="number" step="0.01" defaultValue={editingWriter.completionRate} className={inputClassName} />
              </FieldRow>
              <FieldRow label="平均交付天数">
                <input name="averageTurnaroundDays" type="number" step="0.1" defaultValue={editingWriter.averageTurnaroundDays} className={inputClassName} />
              </FieldRow>
              <FieldRow label="写手备注">
                <textarea
                  name="notes"
                  defaultValue={editingWriter.notes ?? ""}
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
