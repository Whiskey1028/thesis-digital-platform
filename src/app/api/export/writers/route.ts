import { listWritersWithLoad } from "@/lib/queries/writers";
import { buildExportFilename, buildWritersWorkbook, createExcelResponse } from "@/lib/server/excel-export";

export async function GET() {
  const writers = await listWritersWithLoad();
  const workbook = buildWritersWorkbook(writers);
  return createExcelResponse(workbook, buildExportFilename("写手数据"));
}
