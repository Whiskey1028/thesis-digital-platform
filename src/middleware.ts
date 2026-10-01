import { NextResponse, type NextRequest } from "next/server";
import {
  GATE_COOKIE_NAME,
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

export async function middleware(request: NextRequest) {
  if (!isGateEnabled()) {
    return NextResponse.next();
  }

  // nextUrl.pathname includes basePath; strip for matching. Assign redirects
  // without basePath — Next.js prepends basePath when using nextUrl.
  const pathname = stripBasePath(request.nextUrl.pathname);

  if (isPublicPath(pathname)) {
    if (pathname === "/login") {
      const token = request.cookies.get(GATE_COOKIE_NAME)?.value;
      if (await verifyGateToken(token)) {
        const url = request.nextUrl.clone();
        url.pathname = "/overview";
        url.search = "";
        return NextResponse.redirect(url);
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

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("from", pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
