import { jsonData, runRoute, toErrorResponse } from "@/lib/api/responses";
import { ApiError } from "@/lib/api/errors";
import { listOrders } from "@/lib/api/services/order.service";

export async function GET() {
  return runRoute(async () => jsonData(await listOrders()));
}

export function POST() {
  return toErrorResponse(
    ApiError.methodNotAllowed("Orders must be created from a client profile.")
  );
}
