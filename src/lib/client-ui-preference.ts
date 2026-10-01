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

function urlTokenForOpen(open: boolean, defaultOpen: boolean): string | null {
  if (open === defaultOpen) {
    return null;
  }
  return open ? "1" : "0";
}

/**
 * 折叠区开合：URL 显式参数优先，否则读 localStorage，再否则用 defaultOpen。
 * 切换时写入 localStorage；URL 仅在与默认不同时写入，且避免无变化的 replace。
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
    const desired = urlTokenForOpen(open, defaultOpen);
    const current = searchParams.get(urlKey);
    const currentNormalized = current === "1" || current === "0" ? current : null;
    if (desired === currentNormalized) {
      return;
    }
    replaceUrlParams({
      pathname,
      router,
      updates: {
        [urlKey]: desired
      }
    });
  }, [defaultOpen, open, pathname, router, searchParams, storageKey, urlKey]);

  return [open, setOpen] as const;
}
