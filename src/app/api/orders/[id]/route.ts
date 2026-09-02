import { jsonData, jsonOk, runRoute } from "@/lib/api/responses";
import { parseJsonBody, parseRouteParams } from "@/lib/api/parse-request";
import { deleteOrder, getOrderById, updateOrder } from "@/lib/api/services/order.service";
import { updateOrderSchema } from "@/lib/validation";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return runRoute(async () => {
    const { id } = await parseRouteParams(context);
    return jsonData(await getOrderById(id));
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return runRoute(async () => {
    const { id } = await parseRouteParams(context);
    const input = await parseJsonBody(request, updateOrderSchema);
    return jsonData(await updateOrder(id, input));
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return runRoute(async () => {
    const { id } = await parseRouteParams(context);
    await deleteOrder(id);
    return jsonOk();
  });
}
