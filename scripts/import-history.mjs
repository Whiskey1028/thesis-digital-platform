#!/usr/bin/env node
/**
 * @deprecated Use `npm run import:history` (scripts/import-history.ts).
 * Kept so older docs/commands still work.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const result = spawnSync(
  "npx",
  ["tsx", "-r", "./scripts/stub-server-only.cjs", "scripts/import-history.ts", ...process.argv.slice(2)],
  {
    cwd: path.join(root, ".."),
    stdio: "inherit",
    shell: process.platform === "win32"
  }
);

process.exit(result.status ?? 1);
