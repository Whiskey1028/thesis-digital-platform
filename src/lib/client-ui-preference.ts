"use client";

import { useEffect, useState } from "react";
import { replaceUrlParams } from "@/lib/client-url-state";

function readStoredBoolean(storageKey: string): boolean | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === "1") return true;
    if (raw === "0") return false;
  } catch {
    // private mode / blocked storage
  }

  return null;
}

function writeStoredBoolean(storageKey: string, value: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, value ? "1" : "0");
  } catch {
    // ignore quota / privacy errors
  }
}

/**
 * 折叠区开合：URL 显式参数优先，否则读 localStorage，再否则用 defaultOpen。
 * 切换时同步写入 localStorage，并镜像到 URL（展开 "1"，收起 "0"）。
 */
export function usePersistedOpenState({
  storageKey,
  urlKey,
  searchParams,
  pathname,
  router,
  defaultOpen = false
}: {
  storageKey: string;
  urlKey: string;
  searchParams: Pick<URLSearchParams, "get">;
  pathname: string;
  router: { replace: (href: string, options?: { scroll?: boolean }) => void };
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(() => {
    const fromUrl = searchParams.get(urlKey);
    if (fromUrl === "1") return true;
    if (fromUrl === "0") return false;
    return readStoredBoolean(storageKey) ?? defaultOpen;
  });

  useEffect(() => {
    writeStoredBoolean(storageKey, open);
    replaceUrlParams({
      pathname,
      router,
      updates: {
        [urlKey]: open ? "1" : "0"
      }
    });
  }, [open, pathname, router, storageKey, urlKey]);

  return [open, setOpen] as const;
}
