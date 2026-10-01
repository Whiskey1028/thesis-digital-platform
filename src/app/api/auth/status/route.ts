import { jsonData, runRoute } from "@/lib/api/responses";
import { isGateEnabled } from "@/lib/site-gate";

export async function GET() {
  return runRoute(() => Promise.resolve(jsonData({ gateEnabled: isGateEnabled() })));
}
