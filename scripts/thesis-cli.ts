#!/usr/bin/env node
import {
  clientListQuerySchema,
  orderListQuerySchema,
  writerListQuerySchema
} from "@/lib/api/pagination";
import {
  createClient,
  deleteClient,
  getClientById,
  listClients,
  updateClient
} from "@/lib/api/services/client.service";
import {
  createOrderFromClient,
  deleteOrder,
  getOrderById,
  listOrders,
  updateOrder
} from "@/lib/api/services/order.service";
import {
  createWriter,
  deleteWriter,
  getWriterById,
  listWriters,
  updateWriter
} from "@/lib/api/services/writer.service";
import {
  clientSchema,
  createOrderFromClientSchema,
  updateOrderSchema,
  writerInputSchema
} from "@/lib/validation";
import { handleCliError, parseListQueryFlags, printJson, readJsonArg } from "@/lib/cli/format";

function usage() {
  printJson({
    usage: [
      "npm run cli -- clients list [--page N] [--page-size N] [--q text]",
      "npm run cli -- clients get <id>",
      "npm run cli -- clients create --json payload.json",
      "npm run cli -- clients update <id> --json payload.json",
      "npm run cli -- clients delete <id>",
      "npm run cli -- orders list [--page N] [--page-size N] [--q text]",
      "npm run cli -- orders get <id>",
      "npm run cli -- orders create --client-id <id> --json payload.json",
      "npm run cli -- orders update <id> --json payload.json",
      "npm run cli -- orders delete <id>",
      "npm run cli -- writers list [--page N] [--page-size N] [--q text]",
      "npm run cli -- writers get <id>",
      "npm run cli -- writers create --json payload.json",
      "npm run cli -- writers update <id> --json payload.json",
      "npm run cli -- writers delete <id>"
    ]
  });
}

function readFlag(args: string[], flag: string) {
  const index = args.indexOf(flag);
  if (index === -1 || !args[index + 1]) {
    return undefined;
  }

  return args[index + 1];
}

async function runClients(action: string, rest: string[]) {
  switch (action) {
    case "list": {
      const query = clientListQuerySchema.parse(parseListQueryFlags(rest));
      printJson(await listClients(query));
      return;
    }
    case "get": {
      printJson(await getClientById(rest[0]));
      return;
    }
    case "create": {
      const payload = clientSchema.parse(readJsonArg(readFlag(rest, "--json")));
      printJson(await createClient(payload));
      return;
    }
    case "update": {
      const payload = clientSchema.partial().parse(readJsonArg(readFlag(rest, "--json")));
      printJson(await updateClient(rest[0], payload));
      return;
    }
    case "delete": {
      await deleteClient(rest[0]);
      printJson({ ok: true });
      return;
    }
    default:
      usage();
  }
}

async function runOrders(action: string, rest: string[]) {
  switch (action) {
    case "list": {
      const query = orderListQuerySchema.parse(parseListQueryFlags(rest));
      printJson(await listOrders(query));
      return;
    }
    case "get": {
      printJson(await getOrderById(rest[0]));
      return;
    }
    case "create": {
      const clientId = readFlag(rest, "--client-id");
      if (!clientId) {
        throw new Error("orders create requires --client-id <id>");
      }

      const payload = createOrderFromClientSchema.parse(readJsonArg(readFlag(rest, "--json")));
      printJson(await createOrderFromClient(clientId, payload));
      return;
    }
    case "update": {
      const payload = updateOrderSchema.parse(readJsonArg(readFlag(rest, "--json")));
      printJson(await updateOrder(rest[0], payload));
      return;
    }
    case "delete": {
      await deleteOrder(rest[0]);
      printJson({ ok: true });
      return;
    }
    default:
      usage();
  }
}

async function runWriters(action: string, rest: string[]) {
  switch (action) {
    case "list": {
      const query = writerListQuerySchema.parse(parseListQueryFlags(rest));
      printJson(await listWriters(query));
      return;
    }
    case "get": {
      printJson(await getWriterById(rest[0]));
      return;
    }
    case "create": {
      const payload = writerInputSchema.parse(readJsonArg(readFlag(rest, "--json")));
      printJson(await createWriter(payload));
      return;
    }
    case "update": {
      const payload = writerInputSchema.partial().parse(readJsonArg(readFlag(rest, "--json")));
      printJson(await updateWriter(rest[0], payload));
      return;
    }
    case "delete": {
      await deleteWriter(rest[0]);
      printJson({ ok: true });
      return;
    }
    default:
      usage();
  }
}

async function main() {
  const [, , resource, action, ...rest] = process.argv;

  if (!resource || !action) {
    usage();
    return;
  }

  switch (resource) {
    case "clients":
      await runClients(action, rest);
      return;
    case "orders":
      await runOrders(action, rest);
      return;
    case "writers":
      await runWriters(action, rest);
      return;
    default:
      usage();
  }
}

main().catch((error: unknown) => {
  handleCliError(error);
});
