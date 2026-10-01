import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  className?: string;
};

/** Visual twin of secondary `Button` for Next.js links. */
export function ButtonLink({ className = "", children, ...props }: ButtonLinkProps) {
  return (
    <Link
      className={[
        "inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50",
        className
      ].join(" ")}
      {...props}
    >
      {children}
    </Link>
  );
}
