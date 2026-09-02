import "server-only";

import { mockClients } from "@/lib/mock-data";
import type { Client } from "@/lib/types";
import type { ClientRepository } from "@/lib/repositories/interfaces";
import { mutateJsonFile, readJsonFile } from "@/lib/server/storage";

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
    await mutateJsonFile<Client[]>(filename, mockClients, (clients) => {
      clients.unshift(input);
      return clients;
    });
    return input;
  },
  async update(id, input) {
    let updated: Client | null = null;

    await mutateJsonFile<Client[]>(filename, mockClients, (clients) => {
      const index = clients.findIndex((item) => item.id === id);

      if (index === -1) {
        return clients;
      }

      updated = {
        ...clients[index],
        ...input
      };
      clients[index] = updated;
      return clients;
    });

    return updated;
  },
  async remove(id) {
    let removed = false;

    await mutateJsonFile<Client[]>(filename, mockClients, (clients) => {
      const nextClients = clients.filter((item) => item.id !== id);
      removed = nextClients.length !== clients.length;
      return nextClients;
    });

    return removed;
  }
};
