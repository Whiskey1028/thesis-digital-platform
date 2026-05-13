"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/overview", label: "总览", helper: "经营视角" },
  { href: "/clients", label: "论文客户", helper: "先建客户档案" },
  { href: "/orders", label: "论文工单", helper: "客户驱动工单" },
  { href: "/writers", label: "论文写手", helper: "独立写手池" }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-6 flex h-[calc(100vh-3rem)] w-[280px] flex-col rounded-[36px] border border-white/55 bg-white/70 p-5 shadow-glass backdrop-blur-2xl">
      <div className="rounded-[28px] bg-slate-950 px-5 py-6 text-white">
        <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Thesis Ops</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">论文数字化平台</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          以客户为入口，串起工单、写手与分析视图。
        </p>
      </div>

      <nav className="mt-6 space-y-2">
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "block rounded-[24px] px-4 py-4 transition",
                active ? "bg-slate-900 text-white shadow-soft" : "bg-white/60 text-slate-700 hover:bg-white"
              ].join(" ")}
            >
              <div className="text-sm font-medium">{item.label}</div>
              <div className={["mt-1 text-xs", active ? "text-slate-300" : "text-slate-500"].join(" ")}>
                {item.helper}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[28px] bg-white/80 p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-900">轻量存储策略</p>
        <p className="mt-2 leading-6">
          当前使用 JSON 仓储，界面与接口已经预留后续切换 SQLite 的路径。
        </p>
      </div>
    </aside>
  );
}
