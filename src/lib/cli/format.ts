import { readFileSync } from "node:fs";
import { ApiError } from "@/lib/api/errors";

export function printJson(data: unknown) {
  console.log(JSON.stringify(data, null, 2));
}

export function readJsonArg(path?: string) {
  if (!path) {
    throw new Error("Missing --json <file> argument.");
  }

  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as unknown;
}

export function handleCliError(error: unknown): never {
  if (error instanceof ApiError) {
    printJson({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
    process.exit(1);
  }

  if (error instanceof Error) {
    printJson({ error: { code: "CLI_ERROR", message: error.message } });
    process.exit(1);
  }

  printJson({ error: { code: "CLI_ERROR", message: "Unknown error" } });
  process.exit(1);
}

export function parseListQueryFlags(args: string[]) {
  const query: Record<string, string> = {};

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];

    if (token === "--page" && args[index + 1]) {
      query.page = args[index + 1];
      index += 1;
      continue;
    }

    if (token === "--page-size" && args[index + 1]) {
      query.pageSize = args[index + 1];
      index += 1;
      continue;
    }

    if (token === "--q" && args[index + 1]) {
      query.q = args[index + 1];
      index += 1;
    }
  }

  return query;
}
