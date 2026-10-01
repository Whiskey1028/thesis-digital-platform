import { runRoute, jsonData } from "@/lib/api/responses";
import { GATE_COOKIE_NAME, getAppBasePath } from "@/lib/site-gate";

function cookieSecure(request: Request): boolean {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) {
    return proto.split(",")[0]?.trim() === "https";
  }
  return new URL(request.url).protocol === "https:";
}

export async function POST(request: Request) {
  return runRoute(() => {
    const response = jsonData({ locked: true });
    response.cookies.set(GATE_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecure(request),
      path: getAppBasePath() || "/",
      maxAge: 0
    });
    return Promise.resolve(response);
  });
}
