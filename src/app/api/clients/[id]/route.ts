import { jsonData, jsonOk, runRoute } from "@/lib/api/responses";
import { parseJsonBody, parseRouteParams } from "@/lib/api/parse-request";
import {
  deleteClient,
  getClientById,
  updateClient
} from "@/lib/api/services/client.service";
import { clientSchema } from "@/lib/validation";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return runRoute(async () => {
    const { id } = await parseRouteParams(context);
    return jsonData(await getClientById(id));
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return runRoute(async () => {
    const { id } = await parseRouteParams(context);
    const input = await parseJsonBody(request, clientSchema.partial());
    return jsonData(await updateClient(id, input));
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return runRoute(async () => {
    const { id } = await parseRouteParams(context);
    await deleteClient(id);
    return jsonOk();
  });
}
