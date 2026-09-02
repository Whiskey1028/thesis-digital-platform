import { jsonData, runRoute } from "@/lib/api/responses";
import { parseJsonBody, parseSearchParams } from "@/lib/api/parse-request";
import { createWriter, listWriters } from "@/lib/api/services/writer.service";
import { writerInputSchema } from "@/lib/validation";
import { writerListQuerySchema } from "@/lib/api/pagination";

export async function GET(request: Request) {
  return runRoute(async () => {
    const query = parseSearchParams(request, writerListQuerySchema);
    return jsonData(await listWriters(query));
  });
}

export async function POST(request: Request) {
  return runRoute(async () => {
    const input = await parseJsonBody(request, writerInputSchema);
    const created = await createWriter(input);
    return jsonData(created, 201);
  });
}
