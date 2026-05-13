"use client";

export function Pagination({
  page,
  totalPages,
  pageSize,
  onChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50]
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  onChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}) {
  if (totalPages <= 1 && pageSizeOptions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <span>
          第 {page} / {totalPages} 页
        </span>
        <label className="flex items-center gap-2">
          <span>每页</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-full border border-slate-200 px-4 py-2 disabled:opacity-40"
        >
          上一页
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded-full border border-slate-200 px-4 py-2 disabled:opacity-40"
        >
          下一页
        </button>
      </div>
    </div>
  );
}
