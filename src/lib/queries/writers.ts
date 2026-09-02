import "server-only";

import { countActiveOrdersForWriter } from "@/lib/domain/order-status";
import { repositories } from "@/lib/repositories";
import type { Writer } from "@/lib/types";

export async function listWritersWithLoad(): Promise<Writer[]> {
  const [writers, orders] = await Promise.all([
    repositories.writers.list(),
    repositories.orders.list()
  ]);

  return writers.map((writer) => ({
    ...writer,
    activeOrderCount: countActiveOrdersForWriter(writer.id, orders)
  }));
}

export async function getWriterWithLoad(id: string): Promise<Writer | null> {
  const writer = await repositories.writers.getById(id);

  if (!writer) {
    return null;
  }

  const orders = await repositories.orders.list();

  return {
    ...writer,
    activeOrderCount: countActiveOrdersForWriter(writer.id, orders)
  };
}
