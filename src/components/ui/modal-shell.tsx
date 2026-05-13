"use client";

import type { ReactNode } from "react";

export function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  width = "max-w-5xl"
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/32 p-4 backdrop-blur-sm">
      <div className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[32px] border border-white/50 bg-white/95 shadow-glass ${width}`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h3 className="text-2xl font-semibold text-slate-950">{title}</h3>
            {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
          >
            关闭
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
