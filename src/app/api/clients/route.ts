import { jsonData, runRoute } from "@/lib/api/responses";
import { parseJsonBody, parseSearchParams } from "@/lib/api/parse-request";
import { createClient, listClients } from "@/lib/api/services/client.service";
import { clientListQuerySchema } from "@/lib/api/pagination";
import { clientSchema } from "@/lib/validation";

export async function GET(request: Request) {
  return runRoute(async () => {
    const query = parseSearchParams(request, clientListQuerySchema);
    return jsonData(await listClients(query));
  });
}

export async function POST(request: Request) {
  return runRoute(async () => {
    const input = await parseJsonBody(request, clientSchema);
    const created = await createClient(input);
    return jsonData(created, 201);
  });
}
