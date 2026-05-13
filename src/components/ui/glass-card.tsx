import type { ReactNode } from "react";

export function GlassCard({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-[30px] border border-white/55 bg-white/65 shadow-glass backdrop-blur-2xl",
        className
      ].join(" ")}
    >
      {children}
    </section>
  );
}
