"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/inbox", label: "在途", helper: "个人待办" },
  { href: "/overview", label: "总览", helper: "经营视角" },
  { href: "/reports", label: "报表", helper: "客户与订单画像" },
  { href: "/clients", label: "论文客户", helper: "先建客户档案" },
  { href: "/orders", label: "论文工单", helper: "客户驱动工单" },
  { href: "/writers", label: "论文写手", helper: "独立写手池" }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col rounded-[28px] border border-white/55 bg-white/70 p-4 shadow-glass backdrop-blur-2xl sm:rounded-[36px] sm:p-5 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[min(280px,28vw)] lg:max-w-[320px]">
      <div className="rounded-[24px] bg-slate-950 px-4 py-5 text-white sm:rounded-[28px] sm:px-5 sm:py-6">
        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400 sm:text-xs sm:tracking-[0.32em]">
          Thesis Ops
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:mt-3 sm:text-2xl">论文数字化平台</h1>
        <p className="mt-2 hidden text-sm leading-6 text-slate-300 sm:mt-3 sm:block">
          以客户为入口，串起工单、写手与分析视图。
        </p>
      </div>

      <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:mt-6 lg:flex-col lg:space-y-2 lg:overflow-visible lg:pb-0">
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "shrink-0 rounded-[20px] px-3 py-3 transition sm:rounded-[24px] sm:px-4 sm:py-4",
                active ? "bg-slate-900 text-white shadow-soft" : "bg-white/60 text-slate-700 hover:bg-white"
              ].join(" ")}
            >
              <div className="whitespace-nowrap text-sm font-medium">{item.label}</div>
              <div
                className={[
                  "mt-1 hidden text-xs lg:block",
                  active ? "text-slate-300" : "text-slate-500"
                ].join(" ")}
              >
                {item.helper}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 hidden rounded-[28px] bg-white/80 p-4 text-sm text-slate-600 lg:mt-auto lg:block">
        <p className="font-medium text-slate-900">本地 SQLite</p>
        <p className="mt-2 leading-6">运行时写入 data/thesis.db；JSON 仅作空库种子。</p>
      </div>
    </aside>
  );
}
