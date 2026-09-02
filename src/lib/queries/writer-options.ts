import "server-only";

import { listWritersWithLoad } from "@/lib/queries/writers";

export async function loadWriterOptions() {
  return listWritersWithLoad();
}
