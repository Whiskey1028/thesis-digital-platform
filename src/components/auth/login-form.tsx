"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, formatApiError } from "@/lib/client/api-fetch";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await apiFetch<{ unlocked: boolean }>("/api/auth/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    setPending(false);

    if (!result.ok) {
      setError(formatApiError(result.error));
      return;
    }

    const from = searchParams.get("from");
    const target =
      from && from.startsWith("/") && !from.startsWith("//") ? from : "/overview";
    router.replace(target);
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      className="space-y-5"
    >
      <label className="block space-y-2">
        <span className="text-sm text-slate-600">访问密码</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm"
          placeholder="请输入站点密码"
          required
        />
      </label>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? "验证中..." : "进入系统"}
      </Button>
    </form>
  );
}
