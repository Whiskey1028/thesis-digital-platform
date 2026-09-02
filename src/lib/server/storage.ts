import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");

export async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  await ensureDataDir();
  const filePath = path.join(dataDir, filename);

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    await writeJsonFile(filename, fallback);
    return fallback;
  }
}

export async function writeJsonFile<T>(filename: string, data: T) {
  await ensureDataDir();
  const filePath = path.join(dataDir, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}
