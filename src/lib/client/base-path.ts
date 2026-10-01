/** Must match `basePath` in next.config.ts (injected via env). */
export const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/thesis";

/** Prefix absolute app paths for hand-written fetch/export URLs. Next `<Link>` / `redirect` already respect basePath. */
export function withBasePath(path: string): string {
  if (!path.startsWith("/")) {
    return path;
  }

  if (path === APP_BASE_PATH || path.startsWith(`${APP_BASE_PATH}/`)) {
    return path;
  }

  return `${APP_BASE_PATH}${path}`;
}
