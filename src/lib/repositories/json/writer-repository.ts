import "server-only";

import { mockWriters } from "@/lib/mock-data";
import type { Writer } from "@/lib/types";
import type { WriterRepository } from "@/lib/repositories/interfaces";
import { mutateJsonFile, readJsonFile } from "@/lib/server/storage";

const filename = "writers.json";

export const jsonWriterRepository: WriterRepository = {
  async list() {
    return readJsonFile<Writer[]>(filename, mockWriters);
  },
  async getById(id) {
    const writers = await readJsonFile<Writer[]>(filename, mockWriters);
    return writers.find((item) => item.id === id) ?? null;
  },
  async create(input) {
    await mutateJsonFile<Writer[]>(filename, mockWriters, (writers) => {
      writers.unshift(input);
      return writers;
    });
    return input;
  },
  async update(id, input) {
    let updated: Writer | null = null;

    await mutateJsonFile<Writer[]>(filename, mockWriters, (writers) => {
      const index = writers.findIndex((item) => item.id === id);

      if (index === -1) {
        return writers;
      }

      updated = {
        ...writers[index],
        ...input
      };
      writers[index] = updated;
      return writers;
    });

    return updated;
  },
  async remove(id) {
    let removed = false;

    await mutateJsonFile<Writer[]>(filename, mockWriters, (writers) => {
      const nextWriters = writers.filter((item) => item.id !== id);
      removed = nextWriters.length !== writers.length;
      return nextWriters;
    });

    return removed;
  }
};
