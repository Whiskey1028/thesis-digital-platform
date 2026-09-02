import "server-only";

import { ApiError } from "@/lib/api/errors";
import { createEntityId } from "@/lib/api/ids";
import { queryWriters } from "@/lib/api/list-queries";
import type { WriterListQuery } from "@/lib/api/pagination";
import { getWriterWithLoad } from "@/lib/queries/writers";
import { repositories } from "@/lib/repositories";
import type { Writer } from "@/lib/types";
import type { WriterInput } from "@/lib/validation";

export async function listWriters(query: WriterListQuery = {}) {
  return queryWriters(query);
}

export async function getWriterById(id: string) {
  const writer = await getWriterWithLoad(id);

  if (!writer) {
    throw ApiError.notFound("Writer");
  }

  return writer;
}

export async function createWriter(input: WriterInput) {
  const writer: Writer = {
    id: createEntityId("wri"),
    ...input,
    activeOrderCount: 0
  };

  const created = await repositories.writers.create(writer);
  return { ...created, activeOrderCount: 0 };
}

export async function updateWriter(id: string, input: Partial<WriterInput>) {
  const updated = await repositories.writers.update(id, input);

  if (!updated) {
    throw ApiError.notFound("Writer");
  }

  const writer = await getWriterWithLoad(id);

  if (!writer) {
    throw ApiError.notFound("Writer");
  }

  return writer;
}

export async function deleteWriter(id: string) {
  const relatedOrders = await repositories.orders.countByWriterId(id);

  if (relatedOrders > 0) {
    throw ApiError.conflict("Writer has related orders and cannot be deleted.", {
      relatedOrderCount: relatedOrders
    });
  }

  const removed = await repositories.writers.remove(id);

  if (!removed) {
    throw ApiError.notFound("Writer");
  }
}
