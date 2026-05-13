"use client";

type SearchParamsLike = Pick<URLSearchParams, "get">;

export function getStringParam(
  searchParams: SearchParamsLike,
  key: string,
  fallback = ""
) {
  return searchParams.get(key) ?? fallback;
}

export function getNumberParam(
  searchParams: SearchParamsLike,
  key: string,
  fallback: number,
  minimum = 1
) {
  const raw = searchParams.get(key);
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(minimum, Math.trunc(parsed));
}

export function getEnumParam<T extends string>(
  searchParams: SearchParamsLike,
  key: string,
  allowed: readonly T[],
  fallback: T
) {
  const raw = searchParams.get(key);
  if (!raw) {
    return fallback;
  }

  return allowed.includes(raw as T) ? (raw as T) : fallback;
}

export function getBooleanParam(
  searchParams: SearchParamsLike,
  key: string,
  fallback: boolean
) {
  const raw = searchParams.get(key);
  if (raw === "1") {
    return true;
  }

  if (raw === "0") {
    return false;
  }

  return fallback;
}

export function replaceUrlParams({
  pathname,
  router,
  updates
}: {
  pathname: string;
  router: { replace: (href: string, options?: { scroll?: boolean }) => void };
  updates: Record<string, string | null | undefined>;
}) {
  const currentParams = new URLSearchParams(window.location.search);

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") {
      currentParams.delete(key);
      continue;
    }

    currentParams.set(key, value);
  }

  const query = currentParams.toString();
  const nextUrl = query ? `${pathname}?${query}` : pathname;
  const currentUrl = window.location.search
    ? `${pathname}${window.location.search}`
    : pathname;

  if (nextUrl !== currentUrl) {
    router.replace(nextUrl, { scroll: false });
  }
}
