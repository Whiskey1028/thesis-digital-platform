from zipfile import ZipFile
from xml.etree import ElementTree as ET
import json
import re
import sys
from pathlib import Path

NS = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def col_letters(cell_ref):
    match = re.match(r"([A-Z]+)", cell_ref)
    return match.group(1) if match else cell_ref


def load_shared_strings(zf):
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    strings = []
    for si in root.findall("main:si", NS):
        texts = [t.text or "" for t in si.findall(".//main:t", NS)]
        strings.append("".join(texts))
    return strings


def load_workbook_info(zf):
    wb = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rid_to_target = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}
    sheets = []
    for sheet in wb.findall("main:sheets/main:sheet", NS):
        name = sheet.attrib["name"]
        rid = sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
        target = rid_to_target[rid]
        if target.startswith("worksheets/"):
            sheets.append((name, "xl/" + target))
    return sheets


def cell_value(cell, shared_strings):
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        texts = [t.text or "" for t in cell.findall(".//main:t", NS)]
        return "".join(texts)
    value_node = cell.find("main:v", NS)
    if value_node is None:
        texts = [t.text or "" for t in cell.findall(".//main:t", NS)]
        return "".join(texts) if texts else None
    raw = value_node.text
    if cell_type == "s":
        return shared_strings[int(raw)]
    return raw


def rows_from_sheet(zf, sheet_path, shared_strings):
    root = ET.fromstring(zf.read(sheet_path))
    rows = []
    for row in root.findall("main:sheetData/main:row", NS):
        current = {}
        for cell in row.findall("main:c", NS):
            current[col_letters(cell.attrib.get("r", ""))] = cell_value(cell, shared_strings)
        if any(value not in (None, "") for value in current.values()):
            rows.append(current)
    return rows


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: extract-xlsx.py <workbook.xlsx> [output.json]")

    workbook_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else None

    with ZipFile(workbook_path) as zf:
        shared = load_shared_strings(zf)
        payload = {}
        for name, sheet_path in load_workbook_info(zf):
            payload[name] = rows_from_sheet(zf, sheet_path, shared)

    serialized = json.dumps(payload, ensure_ascii=False)
    if output_path:
        output_path.write_text(serialized, encoding="utf-8")
    else:
        sys.stdout.buffer.write(serialized.encode("utf-8"))


if __name__ == "__main__":
    main()
