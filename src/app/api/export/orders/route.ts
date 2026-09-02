import { repositories } from "@/lib/repositories";
import { listWritersWithLoad } from "@/lib/queries/writers";
import { buildExportFilename, buildOrdersWorkbook, createExcelResponse } from "@/lib/server/excel-export";

export async function GET() {
  const [orders, clients, writers] = await Promise.all([
    repositories.orders.list(),
    repositories.clients.list(),
    listWritersWithLoad()
  ]);

  const workbook = buildOrdersWorkbook(orders, clients, writers);
  return createExcelResponse(workbook, buildExportFilename("工单数据"));
}
