#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { educationLevels } from "@/lib/constants";
import { resolveSchoolType } from "@/lib/school-type-map";
import { replaceSqliteDataset } from "@/lib/server/sqlite/db";
import type { Client, EducationLevel, Order, Writer } from "@/lib/types";

const execFileAsync = promisify(execFile);

const root = process.cwd();
const rawDir = path.join(root, "raw");
const dataDir = path.join(root, "data");
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

function normalizeEducationLevel(value: unknown): EducationLevel {
  const text = asText(value, "其他");
  return (educationLevels as string[]).includes(text) ? (text as EducationLevel) : "其他";
}

function joinNotes(...parts: unknown[]) {
  return parts
    .map((part) => asText(part))
    .filter(Boolean)
    .join(" | ");
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

function buildOrderFromSelf(row: NamedRow, index: number): Order {
  const amount = asNumber(row["总价"]) ?? asNumber(row["收入"]) ?? 0;
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
  const school = asText(row["学校名称"], "未知");
  const schoolResolved = resolveSchoolType({
    schoolType: row["学校类型"],
    school
  });
  const leadSource = asText(row["单子来源"]);
  const sourceChannel = leadSource || "历史自接台账";
  const graduationDate = normalizeDate(row["毕业时间"]) || undefined;
  const now = new Date().toISOString();
  const clientId = makeClientId(index);

  return {
    id: makeOrderId(index),
    clientId,
    clientName: `历史客户${index}`,
    sourceType: "self_owned",
    title: asText(row["论文标题"], "未知"),
    schoolType: schoolResolved.schoolType,
    school,
    educationLevel: normalizeEducationLevel(row["学历"]),
    major: asText(row["专业"], "未知"),
    serviceType: asText(row["包干方式"], "论文服务"),
    packageMode: asText(row["包干方式"], "论文服务"),
    writerId: FADA_WRITER.id,
    ownerName: FADA_WRITER.name,
    status: settledAmount >= amount && amount > 0 ? "delivered" : "review",
    deadline: normalizeDate(row["计划完成日期"]),
    writerDeadline: normalizeDate(row["计划完成日期"]) || undefined,
    completedAt: normalizeDate(row["实际完成日期"]) || undefined,
    transactionDate: normalizeDate(row["交易日期"]),
    amount,
    depositAmount,
    draftPaymentAmount,
    blindReviewPaymentAmount,
    settledAmount,
    receivableAmount,
    costAmount: 0,
    profitAmount: amount,
    paymentStatus:
      settledAmount >= amount && amount > 0 ? "paid" : settledAmount > 0 ? "partial" : "pending",
    isSettled: asText(row["是否结清"]) === "是",
    urgency: "medium",
    sourceChannel,
    settlementStage: asText(row["结算阶段"]) || undefined,
    graduationDate,
    notes: joinNotes(row["备注说明"], row["字段3"]) || undefined,
    remark: undefined,
    createdAt: now,
    updatedAt: now
  };
}

function buildOrderFromOutsourced(row: NamedRow, index: number): Order {
  const amount = asNumber(row["收入"]) ?? 0;
  const settledAmount = asNumber(row["已结算金额"]) ?? 0;
  const costAmount = asNumber(row["成本"]) ?? 0;
  const receivableAmount = asNumber(row["应收账款"]) ?? Math.max(amount - settledAmount, 0);
  const profitAmount = asNumber(row["利润"]) ?? amount - costAmount;
  const school = asText(row["学校名称"], "未知");
  const schoolResolved = resolveSchoolType({ school, schoolType: undefined });
  const now = new Date().toISOString();
  const clientId = makeClientId(index);

  return {
    id: makeOrderId(index),
    clientId,
    clientName: `历史客户${index}`,
    sourceType: "outsourced",
    title: asText(row["论文标题"], "未知"),
    schoolType: schoolResolved.schoolType,
    school,
    educationLevel: normalizeEducationLevel(row["学历"]),
    major: asText(row["专业"], "未知"),
    serviceType: asText(row["包干方式"], "论文服务"),
    packageMode: asText(row["包干方式"], "通道费"),
    writerId: null,
    ownerName: asText(row["负责人"], "外包负责人"),
    status: settledAmount >= amount && amount > 0 ? "delivered" : "review",
    deadline: normalizeDate(row["客户要求完成日期"]),
    writerDeadline: normalizeDate(row["写手完成日期"]) || undefined,
    completedAt: normalizeDate(row["实际完成日期"]) || undefined,
    transactionDate: normalizeDate(row["交易日期"]),
    amount,
    settledAmount,
    receivableAmount,
    costAmount,
    profitAmount,
    paymentStatus:
      settledAmount >= amount && amount > 0 ? "paid" : settledAmount > 0 ? "partial" : "pending",
    isSettled: asText(row["是否已结清"]) === "是" || asText(row["是否结清"]) === "是",
    urgency: "medium",
    sourceChannel: "历史转包台账",
    notes: asText(row["备注说明"]) || undefined,
    remark: undefined,
    createdAt: now,
    updatedAt: now
  };
}

function buildClient(order: Order): Client {
  const now = new Date().toISOString();
  return {
    id: order.clientId,
    name: order.clientName ?? "历史客户",
    contactHandle: order.clientId.replace("hist_cli_", "history-"),
    sourceChannel: order.sourceChannel,
    schoolType: order.schoolType ?? "其他",
    school: order.school ?? "未知",
    educationLevel: order.educationLevel ?? "其他",
    major: order.major ?? "未知",
    riskLevel: "medium",
    preferredTitle: order.title,
    preferredServiceType: order.serviceType,
    preferredDeadline: order.deadline,
    preferredBudget: order.amount,
    graduationDate: order.graduationDate,
    notes: order.notes,
    lastContactAt: now,
    createdAt: now
  };
}

const FADA_WRITER: Writer = {
  id: "wri_fada",
  name: "fada",
  specialties: ["综合"],
  availability: "available",
  capacity: 99,
  activeOrderCount: 0,
  rating: 5,
  completionRate: 1,
  averageTurnaroundDays: 5,
  priceTier: "premium",
  ownerName: "fada",
  settlementMode: "自营",
  notes: "自接写手。"
};

const seedWriters: Writer[] = [FADA_WRITER];

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

function collectUnresolvedSchools(rows: NamedRow[]) {
  return [
    ...new Set(
      rows
        .map((row) => {
          const school = asText(row["学校名称"]);
          const resolved = resolveSchoolType({
            schoolType: row["学校类型"],
            school
          });
          return resolved.unresolved && school && school !== "其他" ? school : "";
        })
        .filter(Boolean)
    )
  ].sort();
}

async function main() {
  const workbookPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(rawDir, "fada❤whi.xlsx");

  const extractedPath = path.join(dataDir, ".workbook-extracted.json");

  await fs.mkdir(dataDir, { recursive: true });
  await execFileAsync(pythonPath, [extractorScriptPath, workbookPath, extractedPath], {
    maxBuffer: 20 * 1024 * 1024
  });

  const workbook = JSON.parse(await fs.readFile(extractedPath, "utf-8")) as Record<string, RawRow[]>;
  await fs.unlink(extractedPath).catch(() => undefined);

  const selfRows = extractSheetRows(workbook, SELF_SHEET);
  const outsourcedRows = extractSheetRows(workbook, OUTSOURCED_SHEET);

  const importedOrders: Order[] = [
    ...selfRows.map((row, index) => buildOrderFromSelf(row, index + 100)),
    ...outsourcedRows.map((row, index) => buildOrderFromOutsourced(row, index + 1000))
  ];
  const importedClients = importedOrders.map((order) => buildClient(order));
  const unresolvedFromResolver = collectUnresolvedSchools([...selfRows, ...outsourcedRows]);

  const inferredSchoolTypeCount = [...selfRows, ...outsourcedRows].filter((row) => {
    const resolved = resolveSchoolType({
      schoolType: row["学校类型"],
      school: row["学校名称"]
    });
    return resolved.inferred;
  }).length;

  const runtimeFiles: Record<string, unknown> = {
    "imported-orders.json": importedOrders,
    "imported-clients.json": importedClients,
    "orders.json": importedOrders,
    "clients.json": importedClients,
    "writers.json": seedWriters
  };

  for (const [filename, payload] of Object.entries(runtimeFiles)) {
    await fs.writeFile(path.join(dataDir, filename), JSON.stringify(payload, null, 2), "utf-8");
  }

  await replaceSqliteDataset({
    clients: importedClients,
    writers: seedWriters,
    orders: importedOrders
  });

  console.log(`Source: ${workbookPath}`);
  console.log(`Imported ${importedOrders.length} orders and ${importedClients.length} clients.`);
  console.log(`  self_owned: ${selfRows.length}, outsourced: ${outsourcedRows.length}`);
  console.log(`  schoolType inferred: ${inferredSchoolTypeCount}`);
  console.log(`Wrote SQLite database to ${path.join(dataDir, "thesis.db")}`);
  console.log(`Also refreshed JSON seed backups under ${dataDir}`);
  if (unresolvedFromResolver.length > 0) {
    console.log(`Unresolved school types (${unresolvedFromResolver.length}):`);
    for (const school of unresolvedFromResolver) {
      console.log(`  - ${school}`);
    }
  } else {
    console.log("All empty school types were resolved via mapping table or placeholders.");
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
