import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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

function asText(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }]
  };
}

const server = new McpServer({
  name: "thesis-platform",
  version: "1.0.0"
});

server.registerTool(
  "list_clients",
  {
    description: "List thesis clients with optional pagination and search.",
    inputSchema: clientListQuerySchema.partial()
  },
  async (query) => asText(await listClients(clientListQuerySchema.parse(query ?? {})))
);

server.registerTool(
  "get_client",
  {
    description: "Get a single client by id.",
    inputSchema: { id: z.string().min(1) }
  },
  async ({ id }) => asText(await getClientById(id))
);

server.registerTool(
  "create_client",
  {
    description: "Create a client record.",
    inputSchema: clientSchema
  },
  async (input) => asText(await createClient(clientSchema.parse(input)))
);

server.registerTool(
  "update_client",
  {
    description: "Update a client record.",
    inputSchema: {
      id: z.string().min(1),
      patch: clientSchema.partial()
    }
  },
  async ({ id, patch }) => asText(await updateClient(id, clientSchema.partial().parse(patch)))
);

server.registerTool(
  "delete_client",
  {
    description: "Delete a client when it has no related orders.",
    inputSchema: { id: z.string().min(1) }
  },
  async ({ id }) => {
    await deleteClient(id);
    return asText({ ok: true });
  }
);

server.registerTool(
  "list_orders",
  {
    description: "List thesis orders with optional pagination and filters.",
    inputSchema: orderListQuerySchema.partial()
  },
  async (query) => asText(await listOrders(orderListQuerySchema.parse(query ?? {})))
);

server.registerTool(
  "get_order",
  {
    description: "Get a single order by id.",
    inputSchema: { id: z.string().min(1) }
  },
  async ({ id }) => asText(await getOrderById(id))
);

server.registerTool(
  "create_order_for_client",
  {
    description: "Create an order from a client profile (the only valid order creation path).",
    inputSchema: {
      clientId: z.string().min(1),
      order: createOrderFromClientSchema
    }
  },
  async ({ clientId, order }) =>
    asText(await createOrderFromClient(clientId, createOrderFromClientSchema.parse(order)))
);

server.registerTool(
  "update_order",
  {
    description: "Update an order record.",
    inputSchema: {
      id: z.string().min(1),
      patch: updateOrderSchema
    }
  },
  async ({ id, patch }) => asText(await updateOrder(id, updateOrderSchema.parse(patch)))
);

server.registerTool(
  "delete_order",
  {
    description: "Delete an order by id.",
    inputSchema: { id: z.string().min(1) }
  },
  async ({ id }) => {
    await deleteOrder(id);
    return asText({ ok: true });
  }
);

server.registerTool(
  "list_writers",
  {
    description: "List thesis writers with derived active load.",
    inputSchema: writerListQuerySchema.partial()
  },
  async (query) => asText(await listWriters(writerListQuerySchema.parse(query ?? {})))
);

server.registerTool(
  "get_writer",
  {
    description: "Get a single writer by id.",
    inputSchema: { id: z.string().min(1) }
  },
  async ({ id }) => asText(await getWriterById(id))
);

server.registerTool(
  "create_writer",
  {
    description: "Create a writer in the resource pool.",
    inputSchema: writerInputSchema
  },
  async (input) => asText(await createWriter(writerInputSchema.parse(input)))
);

server.registerTool(
  "update_writer",
  {
    description: "Update a writer record.",
    inputSchema: {
      id: z.string().min(1),
      patch: writerInputSchema.partial()
    }
  },
  async ({ id, patch }) => asText(await updateWriter(id, writerInputSchema.partial().parse(patch)))
);

server.registerTool(
  "delete_writer",
  {
    description: "Delete a writer when it has no related orders.",
    inputSchema: { id: z.string().min(1) }
  },
  async ({ id }) => {
    await deleteWriter(id);
    return asText({ ok: true });
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
