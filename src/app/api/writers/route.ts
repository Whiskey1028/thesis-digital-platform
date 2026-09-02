import { jsonData, runRoute } from "@/lib/api/responses";
import { parseJsonBody } from "@/lib/api/parse-request";
import { createWriter, listWriters } from "@/lib/api/services/writer.service";
import { writerInputSchema } from "@/lib/validation";

export async function GET() {
  return runRoute(async () => jsonData(await listWriters()));
}

export async function POST(request: Request) {
  return runRoute(async () => {
    const input = await parseJsonBody(request, writerInputSchema);
    const created = await createWriter(input);
    return jsonData(created, 201);
  });
}
