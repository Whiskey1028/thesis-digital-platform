"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client/api-fetch";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/brand-mark";

const items = [
  { href: "/inbox", label: "在途" },
  { href: "/overview", label: "总览" },
  { href: "/reports", label: "报表" },
  { href: "/clients", label: "客户" },
  { href: "/orders", label: "工单" },
  { href: "/writers", label: "写手" }
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [gateEnabled, setGateEnabled] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    void apiFetch<{ gateEnabled: boolean }>("/api/auth/status").then((result) => {
      if (result.ok) {
        setGateEnabled(result.data.gateEnabled);
      }
    });
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await apiFetch("/api/auth/logout", { method: "POST" });
    setLoggingOut(false);
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-full shrink-0 flex-col rounded-[28px] border border-white/55 bg-white/70 p-4 shadow-glass backdrop-blur-2xl sm:rounded-[36px] sm:p-5 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[min(280px,28vw)] lg:max-w-[320px]">
      <div className="rounded-[24px] bg-slate-950 px-4 py-5 text-white sm:rounded-[28px] sm:px-5 sm:py-6">
        <div className="flex items-center gap-3">
          <BrandMark className="h-9 w-9 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400 sm:text-xs sm:tracking-[0.32em]">
              Thesis Ops
            </p>
            <h1 className="mt-1 truncate text-lg font-semibold tracking-tight sm:text-xl">
              Thesis Digital Platform
            </h1>
          </div>
        </div>
      </div>

      <nav className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin] lg:mx-0 lg:mt-6 lg:flex-col lg:space-y-2 lg:overflow-visible lg:px-0 lg:pb-0">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "min-h-11 shrink-0 rounded-[20px] px-3 py-3 transition sm:rounded-[24px] sm:px-4 sm:py-4",
                active
                  ? "bg-slate-900 text-white shadow-soft"
                  : "bg-white/60 text-slate-700 hover:bg-white"
              ].join(" ")}
            >
              <div className="whitespace-nowrap text-sm font-medium">{item.label}</div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-3 lg:mt-auto">
        <div className="hidden rounded-[28px] bg-white/80 p-4 text-sm text-slate-600 lg:block">
          <p className="font-medium text-slate-900">本地 SQLite</p>
          <p className="mt-2 leading-6">data/thesis.db</p>
        </div>
        {gateEnabled ? (
          <Button
            variant="secondary"
            className="w-full"
            disabled={loggingOut}
            onClick={() => {
              void handleLogout();
            }}
          >
            {loggingOut ? "退出中..." : "锁定访问"}
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
