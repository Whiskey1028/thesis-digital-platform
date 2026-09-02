import { jsonData, runRoute, toErrorResponse } from "@/lib/api/responses";
import { ApiError } from "@/lib/api/errors";
import { parseSearchParams } from "@/lib/api/parse-request";
import { listOrders } from "@/lib/api/services/order.service";
import { orderListQuerySchema } from "@/lib/api/pagination";

export async function GET(request: Request) {
  return runRoute(async () => {
    const query = parseSearchParams(request, orderListQuerySchema);
    return jsonData(await listOrders(query));
  });
}

export function POST() {
  return toErrorResponse(
    ApiError.methodNotAllowed("Orders must be created from a client profile.")
  );
}
