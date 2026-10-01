#!/usr/bin/env node
/**
 * 按最新台账表头修补已导入的 hist_* 记录金额/分期/学校类型等字段。
 * 列映射与 import-history 一致（按表头名，不用列字母）。
 */
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { resolveSchoolType } from "@/lib/school-type-map";
import { repositories } from "@/lib/repositories";
import { replaceSqliteDataset } from "@/lib/server/sqlite/db";
import type { Client, Order } from "@/lib/types";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const dataDir = path.join(root, "data");
const docsDir = path.join(root, "docs");
const scriptsDir = path.join(root, "scripts");
const pythonPath = process.env.PYTHON ?? "python3";
const extractorScriptPath = path.join(scriptsDir, "extract-xlsx.py");

const SELF_SHEET = "第一桶金100w（自接）";
const OUTSOURCED_SHEET = "第一桶金100w（转包）";

type RawRow = Record<string, unknown>;
type NamedRow = Record<string, unknown>;

function normalizeDate(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return text;
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const normalized = new Date(excelEpoch.getTime() + numeric * 24 * 60 * 60 * 1000);
  return normalized.toISOString().slice(0, 10);
}

function asText(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function asNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function makeClientId(index: number) {
  return `hist_cli_${index.toString().padStart(4, "0")}`;
}

function makeOrderId(index: number) {
  return `hist_ord_${index.toString().padStart(4, "0")}`;
}

function buildHeaderMap(headerRow: RawRow | undefined) {
  const map = new Map<string, string>();
  if (!headerRow) return map;
  for (const [col, value] of Object.entries(headerRow)) {
    const name = asText(value);
    if (name) map.set(name, col);
  }
  return map;
}

function toNamedRow(row: RawRow, headerMap: Map<string, string>): NamedRow {
  const named: NamedRow = {};
  for (const [name, col] of headerMap.entries()) {
    named[name] = row[col];
  }
  return named;
}

function resolveSettledAmount(input: {
  settledFromSheet?: number;
  deposit?: number;
  draft?: number;
  blind?: number;
}) {
  if (input.settledFromSheet !== undefined) return input.settledFromSheet;
  return (input.deposit ?? 0) + (input.draft ?? 0) + (input.blind ?? 0);
}

function extractSheetRows(workbook: Record<string, RawRow[]>, sheetName: string) {
  const rows = workbook[sheetName] ?? [];
  if (rows.length === 0) return [] as NamedRow[];
  const headerMap = buildHeaderMap(rows[0]);
  const titleCol = headerMap.get("论文标题");
  if (!titleCol) {
    throw new Error(`Sheet "${sheetName}" missing required header 论文标题`);
  }
  return rows
    .slice(1)
    .filter((row) => asText(row[titleCol]))
    .map((row) => toNamedRow(row, headerMap));
}

function patchSelfOrder(row: NamedRow, previous: Order): Order {
  const amount = asNumber(row["总价"]) ?? asNumber(row["收入"]) ?? previous.amount;
  const depositAmount = asNumber(row["定金支付"]);
  const draftPaymentAmount = asNumber(row["初稿支付"]);
  const blindReviewPaymentAmount = asNumber(row["盲审支付"]);
  const settledAmount = resolveSettledAmount({
    settledFromSheet: asNumber(row["已结算金额（公式）"]) ?? asNumber(row["已结算金额"]),
    deposit: depositAmount,
    draft: draftPaymentAmount,
    blind: blindReviewPaymentAmount
  });
  const receivableAmount =
    asNumber(row["应收账款"]) ?? Math.max(amount - settledAmount, 0);
  const school = asText(row["学校名称"], previous.school ?? "未知");
  const schoolResolved = resolveSchoolType({
    schoolType: row["学校类型"] ?? previous.schoolType,
    school
  });
  const leadSource = asText(row["单子来源"]);

  return {
    ...previous,
    amount,
    depositAmount: depositAmount ?? previous.depositAmount,
    draftPaymentAmount: draftPaymentAmount ?? previous.draftPaymentAmount,
    blindReviewPaymentAmount: blindReviewPaymentAmount ?? previous.blindReviewPaymentAmount,
    settledAmount,
    receivableAmount,
    costAmount: 0,
    profitAmount: amount,
    school,
    schoolType: schoolResolved.schoolType,
    educationLevel: (asText(row["学历"]) as Order["educationLevel"]) || previous.educationLevel,
    major: asText(row["专业"]) || previous.major,
    serviceType: asText(row["包干方式"]) || previous.serviceType,
    packageMode: asText(row["包干方式"]) || previous.packageMode,
    sourceChannel: leadSource || previous.sourceChannel,
    settlementStage: asText(row["结算阶段"]) || previous.settlementStage,
    graduationDate: normalizeDate(row["毕业时间"]) || previous.graduationDate,
    paymentStatus:
      settledAmount >= amount && amount > 0 ? "paid" : settledAmount > 0 ? "partial" : "pending",
    isSettled: asText(row["是否结清"]) === "是" || previous.isSettled,
    deadline: normalizeDate(row["计划完成日期"]) || previous.deadline,
    writerDeadline: normalizeDate(row["计划完成日期"]) || previous.writerDeadline,
    completedAt: normalizeDate(row["实际完成日期"]) || previous.completedAt,
    transactionDate: normalizeDate(row["交易日期"]) || previous.transactionDate,
    notes: [asText(row["备注说明"]), asText(row["字段3"])].filter(Boolean).join(" | ") || previous.notes,
    updatedAt: new Date().toISOString()
  };
}

function patchOutsourcedOrder(row: NamedRow, previous: Order): Order {
  const amount = asNumber(row["收入"]) ?? previous.amount;
  const settledAmount = asNumber(row["已结算金额"]) ?? previous.settledAmount;
  const costAmount = asNumber(row["成本"]) ?? previous.costAmount;
  const receivableAmount =
    asNumber(row["应收账款"]) ?? Math.max(amount - settledAmount, 0);
  const profitAmount = asNumber(row["利润"]) ?? amount - costAmount;
  const school = asText(row["学校名称"], previous.school ?? "未知");
  const schoolResolved = resolveSchoolType({
    schoolType: previous.schoolType,
    school
  });

  return {
    ...previous,
    amount,
    settledAmount,
    receivableAmount,
    costAmount,
    profitAmount,
    school,
    schoolType: schoolResolved.schoolType,
    educationLevel: (asText(row["学历"]) as Order["educationLevel"]) || previous.educationLevel,
    major: asText(row["专业"]) || previous.major,
    serviceType: asText(row["包干方式"]) || previous.serviceType,
    packageMode: asText(row["包干方式"]) || previous.packageMode,
    ownerName: asText(row["负责人"]) || previous.ownerName,
    paymentStatus:
      settledAmount >= amount && amount > 0 ? "paid" : settledAmount > 0 ? "partial" : "pending",
    isSettled:
      asText(row["是否已结清"]) === "是" ||
      asText(row["是否结清"]) === "是" ||
      previous.isSettled,
    deadline: normalizeDate(row["客户要求完成日期"]) || previous.deadline,
    writerDeadline: normalizeDate(row["写手完成日期"]) || previous.writerDeadline,
    completedAt: normalizeDate(row["实际完成日期"]) || previous.completedAt,
    transactionDate: normalizeDate(row["交易日期"]) || previous.transactionDate,
    notes: asText(row["备注说明"]) || previous.notes,
    updatedAt: new Date().toISOString()
  };
}

function buildClientFromOrder(order: Order, previous: Client): Client {
  return {
    ...previous,
    schoolType: order.schoolType ?? previous.schoolType,
    school: order.school ?? previous.school,
    educationLevel: order.educationLevel ?? previous.educationLevel,
    major: order.major ?? previous.major,
    sourceChannel: order.sourceChannel || previous.sourceChannel,
    preferredBudget: order.amount,
    preferredDeadline: order.deadline,
    preferredTitle: order.title,
    preferredServiceType: order.serviceType,
    graduationDate: order.graduationDate ?? previous.graduationDate,
    notes: order.notes ?? previous.notes,
    lastContactAt: new Date().toISOString()
  };
}

async function main() {
  const workbookPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(docsDir, "fada❤whi.xlsx");

  const extractedPath = path.join(dataDir, ".repair-workbook-extracted.json");
  await fs.mkdir(dataDir, { recursive: true });
  await execFileAsync(pythonPath, [extractorScriptPath, workbookPath, extractedPath], {
    maxBuffer: 20 * 1024 * 1024
  });

  const workbook = JSON.parse(await fs.readFile(extractedPath, "utf-8")) as Record<string, RawRow[]>;
  await fs.unlink(extractedPath).catch(() => undefined);

  const selfRows = extractSheetRows(workbook, SELF_SHEET);
  const outsourcedRows = extractSheetRows(workbook, OUTSOURCED_SHEET);

  const [orders, clients, writers] = await Promise.all([
    repositories.orders.list(),
    repositories.clients.list(),
    repositories.writers.list()
  ]);

  let repairedOrders = [...orders];
  let repairedClients = [...clients];
  let patched = 0;

  for (const [offset, row] of selfRows.entries()) {
    const index = offset + 100;
    const orderId = makeOrderId(index);
    const clientId = makeClientId(index);
    const orderIndex = repairedOrders.findIndex((item) => item.id === orderId);
    const clientIndex = repairedClients.findIndex((item) => item.id === clientId);
    if (orderIndex === -1 || clientIndex === -1) continue;
    const nextOrder = patchSelfOrder(row, repairedOrders[orderIndex]);
    repairedOrders[orderIndex] = nextOrder;
    repairedClients[clientIndex] = buildClientFromOrder(nextOrder, repairedClients[clientIndex]);
    patched += 1;
  }

  for (const [offset, row] of outsourcedRows.entries()) {
    const index = offset + 1000;
    const orderId = makeOrderId(index);
    const clientId = makeClientId(index);
    const orderIndex = repairedOrders.findIndex((item) => item.id === orderId);
    const clientIndex = repairedClients.findIndex((item) => item.id === clientId);
    if (orderIndex === -1 || clientIndex === -1) continue;
    const nextOrder = patchOutsourcedOrder(row, repairedOrders[orderIndex]);
    repairedOrders[orderIndex] = nextOrder;
    repairedClients[clientIndex] = buildClientFromOrder(nextOrder, repairedClients[clientIndex]);
    patched += 1;
  }

  await fs.writeFile(path.join(dataDir, "orders.json"), JSON.stringify(repairedOrders, null, 2), "utf8");
  await fs.writeFile(path.join(dataDir, "clients.json"), JSON.stringify(repairedClients, null, 2), "utf8");

  await replaceSqliteDataset({
    clients: repairedClients,
    writers,
    orders: repairedOrders
  });

  console.log(
    JSON.stringify(
      {
        source: workbookPath,
        patched,
        repairedOrders: repairedOrders.length,
        repairedClients: repairedClients.length,
        sqlite: path.join(dataDir, "thesis.db")
      },
      null,
      2
    )
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
