import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
