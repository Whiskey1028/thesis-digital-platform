"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";

export function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = "max-w-5xl"
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!mounted) {
    return null;
  }

  const panelClassName = footer
    ? "grid h-[min(100dvh,900px)] max-h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto] sm:h-[min(90dvh,900px)] sm:max-h-[min(90dvh,900px)]"
    : "grid h-[min(100dvh,900px)] max-h-[100dvh] grid-rows-[auto_minmax(0,1fr)] sm:h-[min(90dvh,900px)] sm:max-h-[min(90dvh,900px)]";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-stretch justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`${panelClassName} w-full overflow-hidden rounded-none border-0 bg-white shadow-glass sm:rounded-[32px] sm:border sm:border-white/50 sm:bg-white/95 ${width}`}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)"
        }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-shell-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:gap-4 sm:bg-white/95 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h3
              id="modal-shell-title"
              className="text-xl font-semibold text-slate-950 sm:text-2xl"
            >
              {title}
            </h3>
            {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
          >
            关闭
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:bg-white/95 sm:px-6 sm:py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
