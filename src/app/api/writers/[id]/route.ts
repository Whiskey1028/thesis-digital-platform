import { jsonData, jsonOk, runRoute } from "@/lib/api/responses";
import { parseJsonBody, parseRouteParams } from "@/lib/api/parse-request";
import {
  deleteWriter,
  getWriterById,
  updateWriter
} from "@/lib/api/services/writer.service";
import { writerInputSchema } from "@/lib/validation";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return runRoute(async () => {
    const { id } = await parseRouteParams(context);
    return jsonData(await getWriterById(id));
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return runRoute(async () => {
    const { id } = await parseRouteParams(context);
    const input = await parseJsonBody(request, writerInputSchema.partial());
    return jsonData(await updateWriter(id, input));
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return runRoute(async () => {
    const { id } = await parseRouteParams(context);
    await deleteWriter(id);
    return jsonOk();
  });
}
