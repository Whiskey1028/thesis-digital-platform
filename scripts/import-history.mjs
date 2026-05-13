import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const root = process.cwd();
const docsDir = path.join(root, "docs");
const dataDir = path.join(root, "data");
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

function makeClientId(index) {
  return `hist_cli_${index.toString().padStart(4, "0")}`;
}

function makeOrderId(index) {
  return `hist_ord_${index.toString().padStart(4, "0")}`;
}

function buildOrder(row, index, sourceType) {
  const amount = Number(row[sourceType === "self_owned" ? "H" : "G"] ?? 0);
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

  return {
    id: makeOrderId(index),
    clientId,
    clientName: `历史客户${index}`,
    sourceType,
    title: String(row[sourceType === "self_owned" ? "F" : "E"] ?? "未知"),
    schoolType: sourceType === "self_owned" ? String(row["B"] ?? "未知") : "未知",
    school: String(row[sourceType === "self_owned" ? "E" : "D"] ?? "未知"),
    educationLevel: String(row[sourceType === "self_owned" ? "C" : "B"] ?? "其他"),
    major: String(row[sourceType === "self_owned" ? "D" : "C"] ?? "未知"),
    serviceType: sourceType === "self_owned" ? String(row["G"] ?? "论文服务") : String(row["F"] ?? "论文服务"),
    packageMode: sourceType === "self_owned" ? String(row["G"] ?? "论文服务") : String(row["F"] ?? "通道费"),
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
    paymentStatus: settledAmount >= amount && amount > 0 ? "paid" : settledAmount > 0 ? "partial" : "pending",
    isSettled: String(row["L"] ?? "") === "是",
    urgency: "medium",
    sourceChannel: sourceType === "self_owned" ? "历史自接台账" : "历史转包台账",
    notes: String(row["P"] ?? row["R"] ?? ""),
    remark: String(row["Q"] ?? ""),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function buildClient(order) {
  return {
    id: order.clientId,
    name: order.clientName,
    contactHandle: order.clientId.replace("hist_cli_", "history-"),
    sourceChannel: order.sourceChannel,
    schoolType: order.schoolType,
    school: order.school,
    educationLevel: order.educationLevel,
    major: order.major,
    riskLevel: "medium",
    preferredTitle: order.title,
    preferredServiceType: order.serviceType,
    preferredDeadline: order.deadline,
    preferredBudget: order.amount,
    notes: order.notes,
    lastContactAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
}

const workbookPath = path.join(docsDir, "fada❤whi (1).xlsx");
const { stdout } = await execFileAsync(pythonPath, ["-c", extractorScript, workbookPath], {
  maxBuffer: 20 * 1024 * 1024
});

const workbook = JSON.parse(stdout);
const selfRows = (workbook["第一桶金100w（自接）"] ?? []).slice(1).filter((row) => row["F"]);
const outsourcedRows = (workbook["第一桶金100w（转包）"] ?? []).slice(1).filter((row) => row["E"]);

const importedOrders = [
  ...selfRows.map((row, index) => buildOrder(row, index + 100, "self_owned")),
  ...outsourcedRows.map((row, index) => buildOrder(row, index + 1000, "outsourced"))
];

const importedClients = importedOrders.map((order) => buildClient(order));

await fs.mkdir(dataDir, { recursive: true });
await fs.writeFile(path.join(dataDir, "imported-orders.json"), JSON.stringify(importedOrders, null, 2), "utf-8");
await fs.writeFile(path.join(dataDir, "imported-clients.json"), JSON.stringify(importedClients, null, 2), "utf-8");

console.log(`Imported ${importedOrders.length} orders and ${importedClients.length} clients.`);
