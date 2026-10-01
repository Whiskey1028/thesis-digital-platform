import { jsonData, runRoute } from "@/lib/api/responses";
import {
  GATE_COOKIE_NAME,
  GATE_MAX_AGE_SECONDS,
  createGateToken,
  getAppBasePath,
  isGateEnabled,
  verifySitePassword
} from "@/lib/site-gate";
import { parseJsonBody } from "@/lib/api/parse-request";
import { ApiError } from "@/lib/api/errors";
import { z } from "zod";

const unlockSchema = z.object({
  password: z.string().min(1, "请输入密码")
});

function cookieSecure(request: Request): boolean {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) {
    return proto.split(",")[0]?.trim() === "https";
  }
  return new URL(request.url).protocol === "https:";
}

export async function POST(request: Request) {
  return runRoute(async () => {
    if (!isGateEnabled()) {
      return jsonData({ unlocked: true, gateEnabled: false });
    }

    const body = await parseJsonBody(request, unlockSchema);
    if (!verifySitePassword(body.password)) {
      throw new ApiError("INVALID_PASSWORD", "密码不正确", 401);
    }

    const token = await createGateToken();
    const response = jsonData({ unlocked: true, gateEnabled: true });
    response.cookies.set(GATE_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecure(request),
      path: getAppBasePath() || "/",
      maxAge: GATE_MAX_AGE_SECONDS
    });
    return response;
  });
}
