import { repositories } from "@/lib/repositories";
import { buildExportFilename, buildWritersWorkbook, createExcelResponse } from "@/lib/server/excel-export";

export async function GET() {
  const writers = await repositories.writers.list();
  const workbook = buildWritersWorkbook(writers);
  return createExcelResponse(workbook, buildExportFilename("写手数据"));
}
