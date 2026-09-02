export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** 默认排序不算「已筛」；搜索非空、枚举非 all、日期有值算激活。 */
export function isTextFilterActive(value: string | null | undefined) {
  return Boolean(value && value.trim());
}

export function isEnumFilterActive(value: string | null | undefined, allValue = "all") {
  return Boolean(value && value !== allValue);
}

export function countActiveFilters(flags: boolean[]) {
  return flags.filter(Boolean).length;
}

export const filterControlIdleClass =
  "w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition";

export const filterControlActiveClass =
  "w-full rounded-[16px] border border-slate-900 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-950 shadow-sm transition";

export function filterControlClass(active: boolean) {
  return active ? filterControlActiveClass : filterControlIdleClass;
}

export const filterBarIdleClass =
  "mb-5 grid gap-4 rounded-[24px] border border-white/60 bg-white/75 p-5 md:grid-cols-4";

export const filterBarActiveClass =
  "mb-5 grid gap-4 rounded-[24px] border border-slate-900/20 bg-slate-50/90 p-5 ring-1 ring-slate-900/10 md:grid-cols-4";

export function filterBarClass(hasActive: boolean) {
  return hasActive ? filterBarActiveClass : filterBarIdleClass;
}
