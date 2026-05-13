import { mockClients } from "@/lib/mock-data";
import type { Client } from "@/lib/types";
import type { ClientRepository } from "@/lib/repositories/interfaces";
import { readJsonFile, writeJsonFile } from "@/lib/server/storage";

const filename = "clients.json";

export const jsonClientRepository: ClientRepository = {
  async list() {
    return readJsonFile<Client[]>(filename, mockClients);
  },
  async getById(id) {
    const clients = await readJsonFile<Client[]>(filename, mockClients);
    return clients.find((item) => item.id === id) ?? null;
  },
  async create(input) {
    const clients = await readJsonFile<Client[]>(filename, mockClients);
    clients.unshift(input);
    await writeJsonFile(filename, clients);
    return input;
  },
  async update(id, input) {
    const clients = await readJsonFile<Client[]>(filename, mockClients);
    const index = clients.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const updated = {
      ...clients[index],
      ...input
    };

    clients[index] = updated;
    await writeJsonFile(filename, clients);
    return updated;
  },
  async remove(id) {
    const clients = await readJsonFile<Client[]>(filename, mockClients);
    const nextClients = clients.filter((item) => item.id !== id);

    if (nextClients.length === clients.length) {
      return false;
    }

    await writeJsonFile(filename, nextClients);
    return true;
  }
};
