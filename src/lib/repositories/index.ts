import "server-only";

import { ensureSqliteDatabase } from "@/lib/server/sqlite/db";
import { sqliteClientRepository, sqliteOrderRepository, sqliteWriterRepository } from "@/lib/repositories/sqlite";

let initialized = false;

async function ensureRepositoriesReady() {
  if (!initialized) {
    await ensureSqliteDatabase();
    initialized = true;
  }
}

export const repositories = {
  clients: {
    list: async () => {
      await ensureRepositoriesReady();
      return sqliteClientRepository.list();
    },
    getById: async (id: string) => {
      await ensureRepositoriesReady();
      return sqliteClientRepository.getById(id);
    },
    create: async (input: Parameters<typeof sqliteClientRepository.create>[0]) => {
      await ensureRepositoriesReady();
      return sqliteClientRepository.create(input);
    },
    update: async (id: string, input: Parameters<typeof sqliteClientRepository.update>[1]) => {
      await ensureRepositoriesReady();
      return sqliteClientRepository.update(id, input);
    },
    remove: async (id: string) => {
      await ensureRepositoriesReady();
      return sqliteClientRepository.remove(id);
    }
  },
  orders: {
    list: async () => {
      await ensureRepositoriesReady();
      return sqliteOrderRepository.list();
    },
    getById: async (id: string) => {
      await ensureRepositoriesReady();
      return sqliteOrderRepository.getById(id);
    },
    countByClientId: async (clientId: string) => {
      await ensureRepositoriesReady();
      return sqliteOrderRepository.countByClientId(clientId);
    },
    countByWriterId: async (writerId: string) => {
      await ensureRepositoriesReady();
      return sqliteOrderRepository.countByWriterId(writerId);
    },
    create: async (input: Parameters<typeof sqliteOrderRepository.create>[0]) => {
      await ensureRepositoriesReady();
      return sqliteOrderRepository.create(input);
    },
    update: async (id: string, input: Parameters<typeof sqliteOrderRepository.update>[1]) => {
      await ensureRepositoriesReady();
      return sqliteOrderRepository.update(id, input);
    },
    remove: async (id: string) => {
      await ensureRepositoriesReady();
      return sqliteOrderRepository.remove(id);
    }
  },
  writers: {
    list: async () => {
      await ensureRepositoriesReady();
      return sqliteWriterRepository.list();
    },
    getById: async (id: string) => {
      await ensureRepositoriesReady();
      return sqliteWriterRepository.getById(id);
    },
    create: async (input: Parameters<typeof sqliteWriterRepository.create>[0]) => {
      await ensureRepositoriesReady();
      return sqliteWriterRepository.create(input);
    },
    update: async (id: string, input: Parameters<typeof sqliteWriterRepository.update>[1]) => {
      await ensureRepositoriesReady();
      return sqliteWriterRepository.update(id, input);
    },
    remove: async (id: string) => {
      await ensureRepositoriesReady();
      return sqliteWriterRepository.remove(id);
    }
  }
};
