import { repositories } from "@/lib/repositories";
import { buildClientsWorkbook, buildExportFilename, createExcelResponse } from "@/lib/server/excel-export";

export async function GET() {
  const clients = await repositories.clients.list();
  const workbook = buildClientsWorkbook(clients);
  return createExcelResponse(workbook, buildExportFilename("客户数据"));
}
