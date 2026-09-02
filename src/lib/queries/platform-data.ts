import "server-only";

import { repositories } from "@/lib/repositories";
import { listWritersWithLoad } from "@/lib/queries/writers";

export async function loadPlatformSnapshot() {
  const [clients, orders, writers] = await Promise.all([
    repositories.clients.list(),
    repositories.orders.list(),
    listWritersWithLoad()
  ]);

  return { clients, orders, writers };
}
