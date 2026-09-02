import { jsonData, runRoute } from "@/lib/api/responses";
import { parseJsonBody, parseRouteParams } from "@/lib/api/parse-request";
import { createOrderFromClient } from "@/lib/api/services/order.service";
import { createOrderFromClientSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return runRoute(async () => {
    const { id } = await parseRouteParams(context);
    const input = await parseJsonBody(request, createOrderFromClientSchema);
    const created = await createOrderFromClient(id, input);
    return jsonData(created, 201);
  });
}
