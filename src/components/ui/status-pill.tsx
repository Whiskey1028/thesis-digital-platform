const toneClassMap = {
  blue: "bg-blue-500/10 text-blue-700",
  green: "bg-emerald-500/10 text-emerald-700",
  amber: "bg-amber-500/10 text-amber-700",
  red: "bg-rose-500/10 text-rose-700",
  slate: "bg-slate-500/10 text-slate-700"
} as const;

export function StatusPill({
  label,
  tone
}: {
  label: string;
  tone: keyof typeof toneClassMap;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        toneClassMap[tone]
      ].join(" ")}
    >
      {label}
    </span>
  );
}
