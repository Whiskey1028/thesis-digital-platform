import { mockWriters } from "@/lib/mock-data";
import type { Writer } from "@/lib/types";
import type { WriterRepository } from "@/lib/repositories/interfaces";
import { readJsonFile, writeJsonFile } from "@/lib/server/storage";

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
    const writers = await readJsonFile<Writer[]>(filename, mockWriters);
    writers.unshift(input);
    await writeJsonFile(filename, writers);
    return input;
  },
  async update(id, input) {
    const writers = await readJsonFile<Writer[]>(filename, mockWriters);
    const index = writers.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const updated = {
      ...writers[index],
      ...input
    };

    writers[index] = updated;
    await writeJsonFile(filename, writers);
    return updated;
  },
  async remove(id) {
    const writers = await readJsonFile<Writer[]>(filename, mockWriters);
    const nextWriters = writers.filter((item) => item.id !== id);

    if (nextWriters.length === writers.length) {
      return false;
    }

    await writeJsonFile(filename, nextWriters);
    return true;
  }
};
