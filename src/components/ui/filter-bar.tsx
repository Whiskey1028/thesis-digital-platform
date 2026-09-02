"use client";

import type { ReactNode } from "react";
import { cn, filterControlClass } from "@/lib/ui/filter-state";

export function ActiveFilterBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-slate-950 px-2.5 py-1 text-xs font-medium text-white">
      已筛 {count}
    </span>
  );
}

export function FilterBarShell({
  active,
  className,
  children
}: {
  active: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-5 grid gap-4 rounded-[24px] p-5 md:grid-cols-4",
        active
          ? "border border-slate-900/20 bg-slate-50/90 ring-1 ring-slate-900/10"
          : "border border-white/60 bg-white/75",
        className
      )}
    >
      {children}
    </div>
  );
}

export { filterControlClass };

export function ResetFilterButton({
  disabled,
  onClick
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-[18px] px-4 py-3 text-sm transition",
        disabled
          ? "cursor-not-allowed border border-slate-100 bg-slate-50 text-slate-300"
          : "border border-slate-900 bg-slate-950 text-white hover:bg-slate-800"
      )}
    >
      重置筛选
    </button>
  );
}

export type FilterChip = {
  key: string;
  label: string;
  onClear: () => void;
};

export function FilterChipRow({ chips }: { chips: FilterChip[] }) {
  if (chips.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onClear}
          className="inline-flex items-center gap-2 rounded-full border border-slate-900/15 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm hover:border-slate-900/40"
        >
          <span>{chip.label}</span>
          <span aria-hidden className="text-slate-400">
            ×
          </span>
        </button>
      ))}
    </div>
  );
}

export function FilteredEmptyState({
  hasActiveFilters,
  onReset,
  emptyLabel = "暂无数据",
  filteredLabel = "当前筛选没有匹配结果"
}: {
  hasActiveFilters: boolean;
  onReset?: () => void;
  emptyLabel?: string;
  filteredLabel?: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/70 px-6 py-10 text-center">
      <p className="text-sm text-slate-500">{hasActiveFilters ? filteredLabel : emptyLabel}</p>
      {hasActiveFilters && onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 rounded-full border border-slate-900 bg-slate-950 px-4 py-2 text-sm text-white"
        >
          清除筛选
        </button>
      ) : null}
    </div>
  );
}
