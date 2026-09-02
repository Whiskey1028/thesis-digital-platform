#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { replaceSqliteDataset } from "@/lib/server/sqlite/db";
import type { Client, Order, Writer } from "@/lib/types";

const execFileAsync = promisify(execFile);

const root = process.cwd();
const rawDir = path.join(root, "raw");
const dataDir = path.join(root, "data");
const scriptsDir = path.join(root, "scripts");
const pythonPath = process.env.PYTHON ?? "python";
const extractorScriptPath = path.join(scriptsDir, "extract-xlsx.py");

function normalizeDate(value: unknown) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const normalized = new Date(excelEpoch.getTime() + numeric * 24 * 60 * 60 * 1000);
  return normalized.toISOString().slice(0, 10);
}

function makeClientId(index: number) {
  return `hist_cli_${index.toString().padStart(4, "0")}`;
}

function makeOrderId(index: number) {
  return `hist_ord_${index.toString().padStart(4, "0")}`;
}

type SourceType = "self_owned" | "outsourced";
type Row = Record<string, unknown>;

function resolveOrderAmount(row: Row, sourceType: SourceType) {
  if (sourceType === "self_owned") {
    const totalPrice = Number(row["M"] ?? 0);
    const income = Number(row["H"] ?? 0);
    return totalPrice > 0 ? totalPrice : income;
  }
  return Number(row["G"] ?? 0);
}

function buildOrder(row: Row, index: number, sourceType: SourceType): Order {
  const amount = resolveOrderAmount(row, sourceType);
  const settledAmount = Number(row[sourceType === "self_owned" ? "N" : "M"] ?? 0);
  const receivableAmount = Number(
    row[sourceType === "self_owned" ? "O" : "Q"] ?? Math.max(amount - settledAmount, 0)
  );
  const costAmount = sourceType === "outsourced" ? Number(row["N"] ?? 0) : 0;
  const profitAmount =
    sourceType === "outsourced"
      ? Number(row["P"] ?? amount - costAmount)
      : amount - costAmount;
  const clientId = makeClientId(index);
  const now = new Date().toISOString();

  return {
    id: makeOrderId(index),
    clientId,
    clientName: `历史客户${index}`,
    sourceType,
    title: String(row[sourceType === "self_owned" ? "F" : "E"] ?? "未知"),
    schoolType: sourceType === "self_owned" ? String(row["B"] ?? "未知") : "未知",
    school: String(row[sourceType === "self_owned" ? "E" : "D"] ?? "未知"),
    educationLevel: String(
      row[sourceType === "self_owned" ? "C" : "B"] ?? "其他"
    ) as Order["educationLevel"],
    major: String(row[sourceType === "self_owned" ? "D" : "C"] ?? "未知"),
    serviceType:
      sourceType === "self_owned"
        ? String(row["G"] ?? "论文服务")
        : String(row["F"] ?? "论文服务"),
    packageMode:
      sourceType === "self_owned"
        ? String(row["G"] ?? "论文服务")
        : String(row["F"] ?? "通道费"),
    writerId: null,
    ownerName: String(row["O"] ?? (sourceType === "self_owned" ? "自营" : "外包负责人")),
    status: settledAmount >= amount && amount > 0 ? "delivered" : "review",
    deadline: normalizeDate(row[sourceType === "self_owned" ? "J" : "I"]),
    writerDeadline: normalizeDate(row["J"]),
    completedAt: normalizeDate(row["K"]),
    transactionDate: normalizeDate(row[sourceType === "self_owned" ? "I" : "H"]),
    amount,
    settledAmount,
    receivableAmount,
    costAmount,
    profitAmount,
    paymentStatus:
      settledAmount >= amount && amount > 0 ? "paid" : settledAmount > 0 ? "partial" : "pending",
    isSettled: String(row["L"] ?? "") === "是",
    urgency: "medium",
    sourceChannel: sourceType === "self_owned" ? "历史自接台账" : "历史转包台账",
    notes: String(row["P"] ?? row["R"] ?? ""),
    remark: String(row["Q"] ?? ""),
    createdAt: now,
    updatedAt: now
  };
}

function buildClient(order: Order): Client {
  const now = new Date().toISOString();
  return {
    id: order.clientId,
    name: order.clientName ?? `历史客户`,
    contactHandle: order.clientId.replace("hist_cli_", "history-"),
    sourceChannel: order.sourceChannel,
    schoolType: order.schoolType ?? "未知",
    school: order.school ?? "未知",
    educationLevel: order.educationLevel ?? "其他",
    major: order.major ?? "未知",
    riskLevel: "medium",
    preferredTitle: order.title,
    preferredServiceType: order.serviceType,
    preferredDeadline: order.deadline,
    preferredBudget: order.amount,
    notes: order.notes,
    lastContactAt: now,
    createdAt: now
  };
}

const seedWriters: Writer[] = [
  {
    id: "wri_001",
    name: "顾言",
    specialties: ["教育学", "心理学"],
    availability: "busy",
    capacity: 6,
    activeOrderCount: 0,
    rating: 4.8,
    completionRate: 0.96,
    averageTurnaroundDays: 4.5,
    priceTier: "premium",
    ownerName: "自营",
    settlementMode: "固定稿费",
    notes: "适合教育学与定量分析类订单。"
  },
  {
    id: "wri_002",
    name: "秦放",
    specialties: ["新闻传播学", "市场营销"],
    availability: "available",
    capacity: 5,
    activeOrderCount: 0,
    rating: 4.6,
    completionRate: 0.92,
    averageTurnaroundDays: 5.2,
    priceTier: "advanced",
    ownerName: "小樊",
    settlementMode: "通道费",
    notes: "适合转包与修改类稿件。"
  },
  {
    id: "wri_003",
    name: "陆哲",
    specialties: ["法学", "公共管理"],
    availability: "available",
    capacity: 4,
    activeOrderCount: 0,
    rating: 4.9,
    completionRate: 0.98,
    averageTurnaroundDays: 3.9,
    priceTier: "premium",
    ownerName: "自营",
    settlementMode: "固定稿费",
    notes: "适合高客单价法学项目。"
  }
];

async function main() {
  const workbookPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(rawDir, "fada❤whi (2).xlsx");

  const extractedPath = path.join(dataDir, ".workbook-extracted.json");

  await fs.mkdir(dataDir, { recursive: true });
  await execFileAsync(pythonPath, [extractorScriptPath, workbookPath, extractedPath], {
    maxBuffer: 20 * 1024 * 1024
  });

  const workbook = JSON.parse(await fs.readFile(extractedPath, "utf-8")) as Record<string, Row[]>;
  await fs.unlink(extractedPath).catch(() => undefined);

  const selfRows = (workbook["第一桶金100w（自接）"] ?? []).slice(1).filter((row) => row["F"]);
  const outsourcedRows = (workbook["第一桶金100w（转包）"] ?? []).slice(1).filter((row) => row["E"]);

  const importedOrders: Order[] = [
    ...selfRows.map((row, index) => buildOrder(row, index + 100, "self_owned")),
    ...outsourcedRows.map((row, index) => buildOrder(row, index + 1000, "outsourced"))
  ];
  const importedClients = importedOrders.map((order) => buildClient(order));

  // JSON 仅作空库种子备份；运行时主存储是 SQLite
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
  console.log(`Wrote SQLite database to ${path.join(dataDir, "thesis.db")}`);
  console.log(`Also refreshed JSON seed backups under ${dataDir}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
