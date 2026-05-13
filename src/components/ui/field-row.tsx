import type { ReactNode } from "react";

export function FieldRow({
  label,
  children,
  hint
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid items-start gap-3 rounded-[20px] border border-slate-200/90 bg-white/80 px-4 py-4 md:grid-cols-[140px_minmax(0,1fr)]">
      <div className="pt-3">
        <div className="text-sm font-medium text-slate-700">{label}</div>
        {hint ? <div className="mt-1 text-xs leading-5 text-slate-400">{hint}</div> : null}
      </div>
      <div>{children}</div>
    </label>
  );
}
