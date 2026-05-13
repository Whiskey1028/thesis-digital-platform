import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-6 py-6">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
