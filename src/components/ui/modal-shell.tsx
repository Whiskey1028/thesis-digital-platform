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
    ? "grid h-[min(90dvh,900px)] max-h-[min(90dvh,900px)] grid-rows-[auto_minmax(0,1fr)_auto]"
    : "grid h-[min(90dvh,900px)] max-h-[min(90dvh,900px)] grid-rows-[auto_minmax(0,1fr)]";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/32 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`${panelClassName} w-full overflow-hidden rounded-[32px] border border-white/50 bg-white/95 shadow-glass ${width}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-shell-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-5">
          <div>
            <h3 id="modal-shell-title" className="text-2xl font-semibold text-slate-950">
              {title}
            </h3>
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
        <div className="min-h-0 overflow-y-auto overscroll-contain px-6 py-6">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-slate-200 bg-white/95 px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
