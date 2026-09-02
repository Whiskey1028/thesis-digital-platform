"use client";

import { useEffect, useState, useTransition } from "react";
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
import type { PaginatedResult } from "@/lib/api/pagination";
import type { Writer } from "@/lib/types";

const inputClassName = "w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm";
const availabilityOptions = ["all", "available", "busy", "offline"] as const;
const writerSortOptions = ["name_asc", "load_desc", "rating_desc", "capacity_desc"] as const;

export function WriterManagementPanel({ list }: { list: PaginatedResult<Writer> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [editingWriter, setEditingWriter] = useState<Writer | null>(null);
  const [viewingWriter, setViewingWriter] = useState<Writer | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [listOpen, setListOpen] = useState(() => getBooleanParam(searchParams, "writerListOpen", true));

  const focusedWriterId = getStringParam(searchParams, "writerId", "");
  const availability = getEnumParam(searchParams, "writerAvailability", availabilityOptions, "all");
  const sort = getEnumParam(searchParams, "writerSort", writerSortOptions, "rating_desc");
  const page = getNumberParam(searchParams, "writerPage", 1);
  const pageSize = getNumberParam(searchParams, "writerPageSize", 8);
  const queryFromUrl = getStringParam(searchParams, "writerQuery", "");
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
          writerQuery: queryInput || null,
          writerPage: null
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
        writerListOpen: listOpen ? null : "0"
      }
    });
  }, [listOpen, pathname, router]);

  function updateParams(updates: Record<string, string | null>) {
    replaceUrlParams({ pathname, router, updates });
  }

  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <div className="space-y-6">
      <CollapsibleSection
        title="写手列表"
        description="筛选与分页在服务端执行，只加载当前页数据。"
        open={listOpen}
        onToggle={setListOpen}
      >
        <div className="mb-5 grid gap-4 rounded-[24px] border border-white/60 bg-white/75 p-5 md:grid-cols-4">
          <input
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="搜索写手、专长、负责人"
            className={inputClassName}
          />
          <select
            value={availability}
            onChange={(event) =>
              updateParams({
                writerAvailability: event.target.value === "all" ? null : event.target.value,
                writerPage: null
              })
            }
            className={inputClassName}
          >
            <option value="all">全部状态</option>
            <option value="available">available</option>
            <option value="busy">busy</option>
            <option value="offline">offline</option>
          </select>
          <select
            value={sort}
            onChange={(event) =>
              updateParams({
                writerSort: event.target.value === "rating_desc" ? null : event.target.value,
                writerPage: null
              })
            }
            className={inputClassName}
          >
            <option value="rating_desc">按评分从高到低</option>
            <option value="load_desc">按负载从高到低</option>
            <option value="capacity_desc">按容量从高到低</option>
            <option value="name_asc">按姓名 A-Z</option>
          </select>
          <div className="flex items-center rounded-[18px] bg-slate-950 px-4 py-3 text-sm text-white">
            共 {list.total} 位写手
          </div>
          <button
            type="button"
            onClick={() =>
              updateParams({
                writerQuery: null,
                writerAvailability: null,
                writerSort: null,
                writerId: null,
                writerPage: null,
                writerPageSize: null
              })
            }
            className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
          >
            重置筛选
          </button>
          <ExportExcelButton exportUrl="/api/export/writers" label="导出写手 Excel" />
        </div>

        {focusedWriterId ? (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <span>当前仅展示指定写手。</span>
            <button
              type="button"
              onClick={() => updateParams({ writerId: null, writerPage: null })}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
            >
              清除指定写手
            </button>
          </div>
        ) : null}

        <WriterGrid
          writers={list.items}
          onViewWriter={setViewingWriter}
          onEditWriter={setEditingWriter}
        />
        <div className="mt-4">
          <Pagination
            page={Math.min(page, totalPages)}
            totalPages={totalPages}
            pageSize={pageSize}
            onChange={(nextPage) => updateParams({ writerPage: nextPage === 1 ? null : String(nextPage) })}
            onPageSizeChange={(size) =>
              updateParams({
                writerPageSize: size === 8 ? null : String(size),
                writerPage: null
              })
            }
          />
        </div>
      </CollapsibleSection>

      {viewingWriter ? (
        <ModalShell title="写手详情" onClose={() => setViewingWriter(null)} width="max-w-4xl">
          <div className="mt-6 space-y-4">
            <FieldRow label="姓名">
              <div className="px-1 py-3 text-sm text-slate-800">{viewingWriter.name}</div>
            </FieldRow>
            <FieldRow label="专长">
              <div className="px-1 py-3 text-sm text-slate-800">{viewingWriter.specialties.join(" / ")}</div>
            </FieldRow>
            <FieldRow label="负载/容量">
              <div className="px-1 py-3 text-sm text-slate-800">
                {viewingWriter.activeOrderCount} / {viewingWriter.capacity}
              </div>
            </FieldRow>
            <FieldRow label="备注">
              <div className="px-1 py-3 text-sm text-slate-800">{viewingWriter.notes ?? "-"}</div>
            </FieldRow>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingWriter(viewingWriter);
                setViewingWriter(null);
              }}
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
        <ModalShell title="编辑写手" onClose={() => setEditingWriter(null)} width="max-w-5xl">
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const payload = {
                name: String(formData.get("name") ?? ""),
                specialties: String(formData.get("specialties") ?? "")
                  .split(/[,，/]/)
                  .map((item) => item.trim())
                  .filter(Boolean),
                availability: String(formData.get("availability") ?? "available"),
                capacity: Number(formData.get("capacity") ?? 1),
                rating: Number(formData.get("rating") ?? 0),
                completionRate: Number(formData.get("completionRate") ?? 0),
                averageTurnaroundDays: Number(formData.get("averageTurnaroundDays") ?? 1),
                priceTier: String(formData.get("priceTier") ?? "standard"),
                ownerName: String(formData.get("ownerName") ?? ""),
                settlementMode: String(formData.get("settlementMode") ?? ""),
                notes: String(formData.get("notes") ?? "")
              };

              startTransition(() => {
                void (async () => {
                  const result = await apiFetch(`/api/writers/${editingWriter.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                  });

                  if (result.ok) {
                    setMessage("写手已更新。");
                    setEditingWriter(null);
                    router.refresh();
                  } else {
                    setMessage(formatApiError(result.error));
                  }
                })();
              });
            }}
          >
            <FieldRow label="姓名">
              <input name="name" defaultValue={editingWriter.name} className={inputClassName} />
            </FieldRow>
            <FieldRow label="专长（逗号分隔）">
              <input
                name="specialties"
                defaultValue={editingWriter.specialties.join(",")}
                className={inputClassName}
              />
            </FieldRow>
            <FieldRow label="状态">
              <select name="availability" defaultValue={editingWriter.availability} className={inputClassName}>
                <option value="available">available</option>
                <option value="busy">busy</option>
                <option value="offline">offline</option>
              </select>
            </FieldRow>
            <FieldRow label="容量">
              <input name="capacity" type="number" defaultValue={editingWriter.capacity} className={inputClassName} />
            </FieldRow>
            <FieldRow label="评分">
              <input name="rating" type="number" step="0.1" defaultValue={editingWriter.rating} className={inputClassName} />
            </FieldRow>
            <FieldRow label="完成率">
              <input
                name="completionRate"
                type="number"
                step="0.01"
                defaultValue={editingWriter.completionRate}
                className={inputClassName}
              />
            </FieldRow>
            <FieldRow label="平均交付天数">
              <input
                name="averageTurnaroundDays"
                type="number"
                defaultValue={editingWriter.averageTurnaroundDays}
                className={inputClassName}
              />
            </FieldRow>
            <FieldRow label="报价层级">
              <select name="priceTier" defaultValue={editingWriter.priceTier} className={inputClassName}>
                <option value="standard">standard</option>
                <option value="advanced">advanced</option>
                <option value="premium">premium</option>
              </select>
            </FieldRow>
            <FieldRow label="负责人">
              <input name="ownerName" defaultValue={editingWriter.ownerName} className={inputClassName} />
            </FieldRow>
            <FieldRow label="结算方式">
              <input name="settlementMode" defaultValue={editingWriter.settlementMode} className={inputClassName} />
            </FieldRow>
            <FieldRow label="备注">
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
