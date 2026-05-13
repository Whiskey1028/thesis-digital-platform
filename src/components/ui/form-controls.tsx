"use client";

import { useMemo, useState } from "react";

export function SegmentedSelect({
  name,
  value,
  onChange,
  options
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {name ? <input type="hidden" name={name} value={value} /> : null}
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              active
                ? "bg-slate-950 text-white shadow-soft"
                : "border border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function SearchableSingleSelect({
  name,
  value,
  onChange,
  placeholder,
  options
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return options;
    }
    return options.filter((option) => option.toLowerCase().includes(normalized));
  }, [options, query]);

  return (
    <div className="relative">
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm"
      >
        <span className="flex min-w-0 items-center gap-2">
          {value ? (
            <span className="rounded-[12px] bg-amber-100 px-3 py-1 text-slate-800">{value}</span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{open ? "⌃" : "⌄"}</span>
      </button>

      {open ? (
        <div className="absolute z-30 mt-2 w-full rounded-[24px] border border-slate-200 bg-white p-3 shadow-xl">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="查找或添加选项"
            className="w-full rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none"
          />
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
            {filtered.map((option) => {
              const active = option === value;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-left text-sm ${
                    active ? "bg-slate-100" : "hover:bg-slate-50"
                  }`}
                >
                  <span className={`text-base ${active ? "text-blue-600" : "text-transparent"}`}>✓</span>
                  <span className="rounded-[12px] bg-emerald-50 px-3 py-2 text-slate-800">{option}</span>
                </button>
              );
            })}
            {filtered.length === 0 ? (
              <div className="rounded-[18px] bg-slate-50 px-4 py-3 text-sm text-slate-400">没有匹配项</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
