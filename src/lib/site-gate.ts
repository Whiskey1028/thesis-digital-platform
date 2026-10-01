/** Edge + Node safe site gate helpers (no `server-only`). */

export const GATE_COOKIE_NAME = "thesis_access";
export const GATE_PAYLOAD = "ok";
export const GATE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function isGateEnabled(): boolean {
  return Boolean(process.env.SITE_ACCESS_PASSWORD?.trim());
}

export function getGateSecret(): string {
  return (
    process.env.SITE_ACCESS_SECRET?.trim() ||
    process.env.SITE_ACCESS_PASSWORD?.trim() ||
    ""
  );
}

export function getAppBasePath(): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "/thesis";
  return base === "/" ? "" : base.replace(/\/$/, "");
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toHex(signature);
}

function timingSafeEqualString(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function createGateToken(): Promise<string> {
  const secret = getGateSecret();
  if (!secret) {
    return "";
  }
  const signature = await hmacHex(secret, GATE_PAYLOAD);
  return `${GATE_PAYLOAD}.${signature}`;
}

export async function verifyGateToken(token: string | undefined | null): Promise<boolean> {
  if (!isGateEnabled()) {
    return true;
  }
  if (!token) {
    return false;
  }
  const expected = await createGateToken();
  return timingSafeEqualString(token, expected);
}

export function verifySitePassword(password: string): boolean {
  const expected = process.env.SITE_ACCESS_PASSWORD?.trim() ?? "";
  if (!expected) {
    return true;
  }
  return timingSafeEqualString(password, expected);
}

export function stripBasePath(pathname: string): string {
  const basePath = getAppBasePath();
  if (!basePath) {
    return pathname || "/";
  }
  if (pathname === basePath) {
    return "/";
  }
  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length) || "/";
  }
  return pathname || "/";
}

export function withAppBasePath(path: string): string {
  const basePath = getAppBasePath();
  if (!path.startsWith("/")) {
    return path;
  }
  if (!basePath) {
    return path;
  }
  if (path === basePath || path.startsWith(`${basePath}/`)) {
    return path;
  }
  return `${basePath}${path}`;
}
