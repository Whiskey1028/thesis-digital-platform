import { NextResponse, type NextRequest } from "next/server";
import {
  GATE_COOKIE_NAME,
  getAppBasePath,
  isGateEnabled,
  stripBasePath,
  verifyGateToken
} from "@/lib/site-gate";

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/api/auth/unlock" ||
    pathname === "/api/auth/status"
  );
}

/** Prefer proxy headers so redirects are public-facing, not 127.0.0.1:3020. */
function redirectToAppPath(request: NextRequest, appPath: string, search?: string) {
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    request.nextUrl.protocol.replace(":", "") ||
    "http";
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    request.nextUrl.host;
  const basePath = getAppBasePath();
  const normalized = appPath.startsWith("/") ? appPath : `/${appPath}`;
  const pathWithBase =
    !basePath || normalized === basePath || normalized.startsWith(`${basePath}/`)
      ? normalized
      : `${basePath}${normalized}`;
  const url = new URL(`${proto}://${host}${pathWithBase}`);
  if (search) {
    url.search = search.startsWith("?") ? search.slice(1) : search;
  }
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  if (!isGateEnabled()) {
    return NextResponse.next();
  }

  const pathname = stripBasePath(request.nextUrl.pathname);

  if (isPublicPath(pathname)) {
    if (pathname === "/login") {
      const token = request.cookies.get(GATE_COOKIE_NAME)?.value;
      if (await verifyGateToken(token)) {
        return redirectToAppPath(request, "/overview");
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(GATE_COOKIE_NAME)?.value;
  if (await verifyGateToken(token)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "请先解锁站点访问" } },
      { status: 401 }
    );
  }

  const from = `${pathname}${request.nextUrl.search}`;
  return redirectToAppPath(request, "/login", `from=${encodeURIComponent(from)}`);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
