import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const root = process.cwd();
const dataDir = path.join(root, "data");
const docsDir = path.join(root, "docs");
const pythonPath =
  "/Users/whiskey/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";

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

function normalizeDate(value) {
  if (!value) return "";
  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(String(value))) return String(value);
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const normalized = new Date(excelEpoch.getTime() + numeric * 24 * 60 * 60 * 1000);
  return normalized.toISOString().slice(0, 10);
}

function numberValue(raw, fallback = 0) {
  if (raw === null || raw === undefined || raw === "") {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function makeClientId(index) {
  return `hist_cli_${index.toString().padStart(4, "0")}`;
}

function makeOrderId(index) {
  return `hist_ord_${index.toString().padStart(4, "0")}`;
}

function buildOrder(row, index, sourceType, originalOrder) {
  const amountRaw = sourceType === "self_owned" ? row["H"] ?? row["M"] : row["G"];
  const amount = numberValue(amountRaw, 0);
  const settledAmount = numberValue(row[sourceType === "self_owned" ? "N" : "M"], 0);
  const receivableAmount = numberValue(
    row[sourceType === "self_owned" ? "O" : "Q"],
    Math.max(amount - settledAmount, 0)
  );
  const costAmount = sourceType === "outsourced" ? numberValue(row["N"], 0) : 0;
  const profitAmount = sourceType === "outsourced" ? numberValue(row["P"], amount - costAmount) : amount - costAmount;
  const schoolType = sourceType === "self_owned" ? String(row["B"] ?? originalOrder.schoolType ?? "未知") : "未知";
  const school = String(row[sourceType === "self_owned" ? "E" : "D"] ?? originalOrder.school ?? "未知");

  return {
    ...originalOrder,
    id: makeOrderId(index),
    clientId: makeClientId(index),
    sourceType,
    title: String(row[sourceType === "self_owned" ? "F" : "E"] ?? originalOrder.title ?? "未知"),
    serviceType: sourceType === "self_owned" ? String(row["G"] ?? originalOrder.serviceType ?? "论文服务") : String(row["F"] ?? originalOrder.serviceType ?? "论文服务"),
    packageMode: sourceType === "self_owned" ? String(row["G"] ?? originalOrder.packageMode ?? "论文服务") : String(row["F"] ?? originalOrder.packageMode ?? "通道费"),
    schoolType,
    school,
    educationLevel: String(row[sourceType === "self_owned" ? "C" : "B"] ?? originalOrder.educationLevel ?? "其他"),
    major: String(row[sourceType === "self_owned" ? "D" : "C"] ?? originalOrder.major ?? "未知"),
    amount,
    settledAmount,
    receivableAmount,
    costAmount,
    profitAmount,
    isSettled: String(row[sourceType === "self_owned" ? "L" : "L"] ?? "") === "是",
    paymentStatus: settledAmount >= amount && amount > 0 ? "paid" : settledAmount > 0 ? "partial" : "pending",
    deadline: normalizeDate(row[sourceType === "self_owned" ? "J" : "I"]),
    writerDeadline: normalizeDate(row["J"]) || undefined,
    completedAt: normalizeDate(row["K"]) || undefined,
    transactionDate: normalizeDate(row[sourceType === "self_owned" ? "I" : "H"]),
    ownerName:
      sourceType === "outsourced"
        ? String(row["O"] ?? originalOrder.ownerName ?? "外包负责人")
        : "自营",
    notes: String(row[sourceType === "self_owned" ? "P" : "R"] ?? ""),
    remark: String(row[sourceType === "self_owned" ? "Q" : ""] ?? ""),
    updatedAt: new Date().toISOString()
  };
}

function buildClientFromOrder(order, originalClient) {
  return {
    ...originalClient,
    id: order.clientId,
    sourceChannel: order.sourceChannel,
    schoolType: order.schoolType,
    school: order.school,
    educationLevel: order.educationLevel,
    major: order.major,
    preferredTitle: order.title,
    preferredServiceType: order.serviceType,
    preferredDeadline: order.deadline,
    preferredBudget: order.amount,
    notes: order.notes
  };
}

const workbookPath = path.join(docsDir, "fada❤whi (1).xlsx");
const { stdout } = await execFileAsync(pythonPath, ["-c", extractorScript, workbookPath], {
  maxBuffer: 20 * 1024 * 1024
});

const workbook = JSON.parse(stdout);
const selfRows = (workbook["第一桶金100w（自接）"] ?? []).slice(1).filter((row) => row["F"]);
const outsourcedRows = (workbook["第一桶金100w（转包）"] ?? []).slice(1).filter((row) => row["E"]);

const ordersPath = path.join(dataDir, "orders.json");
const clientsPath = path.join(dataDir, "clients.json");
const orders = JSON.parse(await fs.readFile(ordersPath, "utf8"));
const clients = JSON.parse(await fs.readFile(clientsPath, "utf8"));

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

await fs.writeFile(ordersPath, JSON.stringify(repairedOrders, null, 2), "utf8");
await fs.writeFile(clientsPath, JSON.stringify(repairedClients, null, 2), "utf8");

const selfOwnedAmountFallbacks = repairedOrders.filter(
  (order) => order.sourceType === "self_owned" && order.id.startsWith("hist_ord_") && order.amount === 0
).length;

console.log(
  JSON.stringify(
    {
      repairedOrders: repairedOrders.length,
      repairedClients: repairedClients.length,
      selfOwnedAmountFallbacks
    },
    null,
    2
  )
);
