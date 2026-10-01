import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  className = "",
  valueClassName = "mt-2 text-2xl font-semibold text-slate-950"
}: {
  label: string;
  value: ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`rounded-[22px] bg-slate-50 p-4 ${className}`.trim()}>
      <p className="text-xs text-slate-500">{label}</p>
      <div className={valueClassName}>{value}</div>
    </div>
  );
}
