#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { repositories } from "@/lib/repositories";
import { replaceSqliteDataset } from "@/lib/server/sqlite/db";
import type { Client, Order } from "@/lib/types";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const dataDir = path.join(root, "data");
const docsDir = path.join(root, "docs");
const pythonPath = process.env.PYTHON ?? "python3";

const extractorScript = `
from zipfile import ZipFile
from xml.etree import ElementTree as ET
import json
import re
import sys

NS = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def col_letters(cell_ref):
    m = re.match(r'([A-Z]+)', cell_ref)
    return m.group(1) if m else cell_ref

def load_shared_strings(zf):
    if 'xl/sharedStrings.xml' not in zf.namelist():
        return []
    root = ET.fromstring(zf.read('xl/sharedStrings.xml'))
    strings = []
    for si in root.findall('main:si', NS):
        texts = [t.text or '' for t in si.findall('.//main:t', NS)]
        strings.append(''.join(texts))
    return strings

def load_workbook_info(zf):
    wb = ET.fromstring(zf.read('xl/workbook.xml'))
    rels = ET.fromstring(zf.read('xl/_rels/workbook.xml.rels'))
    rid_to_target = {}
    for rel in rels:
        rid_to_target[rel.attrib['Id']] = rel.attrib['Target']
    sheets = []
    for sheet in wb.findall('main:sheets/main:sheet', NS):
        name = sheet.attrib['name']
        rid = sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
        target = rid_to_target[rid]
        if target.startswith('worksheets/'):
            sheets.append((name, 'xl/' + target))
    return sheets

def cell_value(cell, shared_strings):
    cell_type = cell.attrib.get('t')
    if cell_type == 'inlineStr':
      texts = [t.text or '' for t in cell.findall('.//main:t', NS)]
      return ''.join(texts)
    v = cell.find('main:v', NS)
    if v is None:
      texts = [t.text or '' for t in cell.findall('.//main:t', NS)]
      return ''.join(texts) if texts else None
    raw = v.text
    if cell_type == 's':
      return shared_strings[int(raw)]
    return raw

def rows_from_sheet(zf, sheet_path, shared_strings):
    root = ET.fromstring(zf.read(sheet_path))
    rows = []
    for row in root.findall('main:sheetData/main:row', NS):
        current = {}
        for c in row.findall('main:c', NS):
            current[col_letters(c.attrib.get('r', ''))] = cell_value(c, shared_strings)
        if any(v not in (None, '') for v in current.values()):
            rows.append(current)
    return rows

with ZipFile(sys.argv[1]) as zf:
    shared = load_shared_strings(zf)
    payload = {}
    for name, sheet_path in load_workbook_info(zf):
        payload[name] = rows_from_sheet(zf, sheet_path, shared)
    print(json.dumps(payload, ensure_ascii=False))
`;

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

function buildOrder(row: Row, index: number, sourceType: SourceType, previous: Order): Order {
  const amount = resolveOrderAmount(row, sourceType);
  const settledAmount = Number(row[sourceType === "self_owned" ? "N" : "M"] ?? previous.settledAmount);
  const receivableAmount = Number(
    row[sourceType === "self_owned" ? "O" : "Q"] ?? Math.max(amount - settledAmount, 0)
  );
  const costAmount = sourceType === "outsourced" ? Number(row["N"] ?? previous.costAmount) : 0;
  const profitAmount =
    sourceType === "outsourced"
      ? Number(row["P"] ?? amount - costAmount)
      : amount - costAmount;

  return {
    ...previous,
    amount,
    settledAmount,
    receivableAmount,
    costAmount,
    profitAmount,
    paymentStatus:
      settledAmount >= amount && amount > 0 ? "paid" : settledAmount > 0 ? "partial" : "pending",
    isSettled: String(row["L"] ?? "") === "是" || previous.isSettled,
    deadline: normalizeDate(row[sourceType === "self_owned" ? "J" : "I"]) || previous.deadline,
    writerDeadline: normalizeDate(row["J"]) || previous.writerDeadline,
    completedAt: normalizeDate(row["K"]) || previous.completedAt,
    transactionDate:
      normalizeDate(row[sourceType === "self_owned" ? "I" : "H"]) || previous.transactionDate,
    updatedAt: new Date().toISOString()
  };
}

function buildClientFromOrder(order: Order, previous: Client): Client {
  return {
    ...previous,
    preferredBudget: order.amount,
    preferredDeadline: order.deadline,
    preferredTitle: order.title,
    preferredServiceType: order.serviceType,
    lastContactAt: new Date().toISOString()
  };
}

async function main() {
  const workbookPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(docsDir, "fada❤whi.xlsx");

  const extractorPath = path.join(dataDir, ".repair-extract.py");
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(extractorPath, extractorScript, "utf8");

  const { stdout } = await execFileAsync(pythonPath, [extractorPath, workbookPath], {
    maxBuffer: 20 * 1024 * 1024
  });
  await fs.unlink(extractorPath).catch(() => undefined);

  const workbook = JSON.parse(stdout) as Record<string, Row[]>;
  const selfRows = (workbook["第一桶金100w（自接）"] ?? []).slice(1).filter((row) => row["F"]);
  const outsourcedRows = (workbook["第一桶金100w（转包）"] ?? []).slice(1).filter((row) => row["E"]);

  const [orders, clients, writers] = await Promise.all([
    repositories.orders.list(),
    repositories.clients.list(),
    repositories.writers.list()
  ]);

  let repairedOrders = [...orders];
  let repairedClients = [...clients];

  for (const [offset, row] of selfRows.entries()) {
    const index = offset + 100;
    const orderId = makeOrderId(index);
    const clientId = makeClientId(index);
    const orderIndex = repairedOrders.findIndex((item) => item.id === orderId);
    const clientIndex = repairedClients.findIndex((item) => item.id === clientId);
    if (orderIndex === -1 || clientIndex === -1) continue;
    const nextOrder = buildOrder(row, index, "self_owned", repairedOrders[orderIndex]);
    repairedOrders[orderIndex] = nextOrder;
    repairedClients[clientIndex] = buildClientFromOrder(nextOrder, repairedClients[clientIndex]);
  }

  for (const [offset, row] of outsourcedRows.entries()) {
    const index = offset + 1000;
    const orderId = makeOrderId(index);
    const clientId = makeClientId(index);
    const orderIndex = repairedOrders.findIndex((item) => item.id === orderId);
    const clientIndex = repairedClients.findIndex((item) => item.id === clientId);
    if (orderIndex === -1 || clientIndex === -1) continue;
    const nextOrder = buildOrder(row, index, "outsourced", repairedOrders[orderIndex]);
    repairedOrders[orderIndex] = nextOrder;
    repairedClients[clientIndex] = buildClientFromOrder(nextOrder, repairedClients[clientIndex]);
  }

  await fs.writeFile(path.join(dataDir, "orders.json"), JSON.stringify(repairedOrders, null, 2), "utf8");
  await fs.writeFile(path.join(dataDir, "clients.json"), JSON.stringify(repairedClients, null, 2), "utf8");

  await replaceSqliteDataset({
    clients: repairedClients,
    writers,
    orders: repairedOrders
  });

  const selfOwnedAmountFallbacks = repairedOrders.filter(
    (order) => order.sourceType === "self_owned" && order.id.startsWith("hist_ord_") && order.amount === 0
  ).length;

  console.log(
    JSON.stringify(
      {
        repairedOrders: repairedOrders.length,
        repairedClients: repairedClients.length,
        selfOwnedAmountFallbacks,
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
