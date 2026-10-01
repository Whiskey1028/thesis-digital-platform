import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { BrandMark } from "@/components/layout/brand-mark";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <section className="w-full rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-glass backdrop-blur-xl sm:p-8">
        <div className="flex items-center gap-3">
          <BrandMark className="h-10 w-10 shrink-0" />
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Thesis Ops</p>
            <h1 className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">
              Thesis Digital Platform
            </h1>
          </div>
        </div>
        <p className="mt-5 text-sm text-slate-600">解锁访问</p>
        <div className="mt-4">
          <Suspense fallback={<p className="text-sm text-slate-500">载入中...</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
