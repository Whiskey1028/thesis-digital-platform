import * as XLSX from "xlsx";
import { NextResponse } from "next/server";
import type { Client, Order, Writer } from "@/lib/types";

function sourceTypeLabel(sourceType: Order["sourceType"]) {
  return sourceType === "self_owned" ? "自接" : "转包";
}

function boolLabel(value: boolean) {
  return value ? "是" : "否";
}

function formatDateStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function buildExportFilename(prefix: string, date = new Date()) {
  return `${prefix}-${formatDateStamp(date)}.xlsx`;
}

function writeWorkbookBytes(workbook: XLSX.WorkBook) {
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as number[];
}

function contentDisposition(filename: string) {
  const asciiFallback = filename.replace(/[^\u0020-\u007E]/g, "_");
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export function createExcelResponse(workbook: XLSX.WorkBook, filename: string) {
  const bytes = writeWorkbookBytes(workbook);
  const body = new Uint8Array(bytes);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": contentDisposition(filename)
    }
  });
}

export function buildOrdersWorkbook(
  orders: Order[],
  clients: Client[],
  writers: Writer[]
) {
  const clientMap = new Map(clients.map((client) => [client.id, client]));
  const writerMap = new Map(writers.map((writer) => [writer.id, writer]));

  const rows = orders.map((order) => {
    const client = clientMap.get(order.clientId);
    const writer = order.writerId ? writerMap.get(order.writerId) : undefined;

    return {
      工单ID: order.id,
      论文题目: order.title,
      客户ID: order.clientId,
      客户姓名: client?.name ?? order.clientName ?? "",
      类型: sourceTypeLabel(order.sourceType),
      学校类型: client?.schoolType ?? order.schoolType ?? "",
      学校: client?.school ?? order.school ?? "",
      学历: client?.educationLevel ?? order.educationLevel ?? "",
      专业: client?.major ?? order.major ?? "",
      服务类型: order.serviceType,
      包干方式: order.packageMode,
      写手: writer?.name ?? "",
      负责人: order.ownerName,
      状态: order.status,
      交易日期: order.transactionDate,
      计划完成日期: order.deadline,
      写手截止日期: order.writerDeadline ?? "",
      实际完成日期: order.completedAt ?? "",
      总价: order.amount,
      已结算: order.settledAmount,
      应收: order.receivableAmount,
      成本: order.costAmount,
      利润: order.profitAmount,
      付款状态: order.paymentStatus,
      是否结清: boolLabel(order.isSettled),
      紧急度: order.urgency,
      来源渠道: order.sourceChannel,
      备注: order.notes ?? order.remark ?? "",
      创建时间: order.createdAt,
      更新时间: order.updatedAt
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "工单数据");
  return workbook;
}

export function buildClientsWorkbook(clients: Client[]) {
  const rows = clients.map((client) => ({
    客户ID: client.id,
    客户姓名: client.name,
    联系方式: client.contactHandle,
    来源渠道: client.sourceChannel,
    学校类型: client.schoolType,
    学校: client.school,
    学历: client.educationLevel,
    专业: client.major,
    风险等级: client.riskLevel,
    预设题目: client.preferredTitle ?? "",
    预设服务类型: client.preferredServiceType ?? "",
    预设截止日期: client.preferredDeadline ?? "",
    预设预算: client.preferredBudget ?? "",
    备注: client.notes ?? "",
    最后联系: client.lastContactAt,
    创建时间: client.createdAt
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "客户数据");
  return workbook;
}

export function buildWritersWorkbook(writers: Writer[]) {
  const rows = writers.map((writer) => ({
    写手ID: writer.id,
    写手姓名: writer.name,
    负责人: writer.ownerName,
    擅长专业: writer.specialties.join("、"),
    可用状态: writer.availability,
    容量上限: writer.capacity,
    当前单量: writer.activeOrderCount,
    评分: writer.rating,
    完成率: writer.completionRate,
    平均交付天数: writer.averageTurnaroundDays,
    报价层级: writer.priceTier,
    结算方式: writer.settlementMode,
    备注: writer.notes ?? ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "写手数据");
  return workbook;
}
