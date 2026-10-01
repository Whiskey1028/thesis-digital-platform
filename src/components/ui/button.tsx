import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60",
  secondary:
    "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40",
  ghost: "border-transparent bg-transparent text-slate-600 hover:bg-white/70 disabled:opacity-40",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
} as const;

export type ButtonVariant = keyof typeof variants;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

export function Button({
  variant = "secondary",
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2.5 text-sm font-medium transition",
        variants[variant],
        className
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
