import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import lockfile from "proper-lockfile";

const dataDir = path.join(process.cwd(), "data");

type CacheEntry = {
  mtimeMs: number;
  data: unknown;
};

const fileCache = new Map<string, CacheEntry>();

export async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

function filePathFor(filename: string) {
  return path.join(dataDir, filename);
}

async function statMtimeMs(filePath: string) {
  try {
    const stat = await fs.stat(filePath);
    return stat.mtimeMs;
  } catch {
    return 0;
  }
}

async function ensureLockTarget(filePath: string, fallbackContent: string) {
  await ensureDataDir();

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, fallbackContent, "utf-8");
  }
}

export async function withFileLock<T>(filename: string, fallbackContent: string, fn: () => Promise<T>) {
  const filePath = filePathFor(filename);
  await ensureLockTarget(filePath, fallbackContent);

  const release = await lockfile.lock(filePath, {
    retries: {
      retries: 8,
      minTimeout: 25,
      maxTimeout: 250
    }
  });

  try {
    return await fn();
  } finally {
    await release();
  }
}

async function readJsonFileDirect<T>(filename: string, fallback: T): Promise<T> {
  const filePath = filePathFor(filename);
  await ensureDataDir();

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as T;
    const mtimeMs = await statMtimeMs(filePath);
    fileCache.set(filename, { mtimeMs, data });
    return data;
  } catch {
    await writeJsonFileDirect(filename, fallback);
    return fallback;
  }
}

async function writeJsonFileDirect<T>(filename: string, data: T) {
  const filePath = filePathFor(filename);
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  fileCache.set(filename, { mtimeMs: await statMtimeMs(filePath), data });
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  const filePath = filePathFor(filename);
  await ensureDataDir();

  const mtimeMs = await statMtimeMs(filePath);
  const cached = fileCache.get(filename);

  if (cached && cached.mtimeMs === mtimeMs && mtimeMs > 0) {
    return cached.data as T;
  }

  return readJsonFileDirect(filename, fallback);
}

export async function writeJsonFile<T>(filename: string, data: T) {
  const fallbackContent = JSON.stringify(data, null, 2);
  await withFileLock(filename, fallbackContent, async () => {
    await writeJsonFileDirect(filename, data);
  });
}

export async function mutateJsonFile<T>(
  filename: string,
  fallback: T,
  mutator: (current: T) => T | Promise<T>
): Promise<T> {
  const fallbackContent = JSON.stringify(fallback, null, 2);

  return withFileLock(filename, fallbackContent, async () => {
    fileCache.delete(filename);
    const current = await readJsonFileDirect(filename, fallback);
    const next = await mutator(current);
    await writeJsonFileDirect(filename, next);
    return next;
  });
}

export function invalidateJsonCache(filename?: string) {
  if (filename) {
    fileCache.delete(filename);
    return;
  }

  fileCache.clear();
}
