"use client";

import { useState, type ReactNode } from "react";

export function CollapsibleSection({
  title,
  description,
  open,
  onToggle,
  defaultOpen = true,
  children
}: {
  title: string;
  description?: string;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = typeof open === "boolean";
  const resolvedOpen = isControlled ? open : internalOpen;

  function handleToggle() {
    const nextOpen = !resolvedOpen;
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onToggle?.(nextOpen);
  }

  return (
    <section className="rounded-[28px] border border-white/60 bg-white/72 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
          {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
        >
          {resolvedOpen ? "收起" : "展开"}
        </button>
      </div>
      {resolvedOpen ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
