import "server-only";

import { mockOrders } from "@/lib/mock-data";
import type { Order } from "@/lib/types";
import type { OrderRepository } from "@/lib/repositories/interfaces";
import { readJsonFile, writeJsonFile } from "@/lib/server/storage";

const filename = "orders.json";

export const jsonOrderRepository: OrderRepository = {
  async list() {
    return readJsonFile<Order[]>(filename, mockOrders);
  },
  async getById(id) {
    const orders = await readJsonFile<Order[]>(filename, mockOrders);
    return orders.find((item) => item.id === id) ?? null;
  },
  async countByClientId(clientId) {
    const orders = await readJsonFile<Order[]>(filename, mockOrders);
    return orders.filter((item) => item.clientId === clientId).length;
  },
  async countByWriterId(writerId) {
    const orders = await readJsonFile<Order[]>(filename, mockOrders);
    return orders.filter((item) => item.writerId === writerId).length;
  },
  async create(input) {
    const orders = await readJsonFile<Order[]>(filename, mockOrders);
    orders.unshift(input);
    await writeJsonFile(filename, orders);
    return input;
  },
  async update(id, input) {
    const orders = await readJsonFile<Order[]>(filename, mockOrders);
    const index = orders.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const updated = {
      ...orders[index],
      ...input,
      updatedAt: new Date().toISOString()
    };

    orders[index] = updated;
    await writeJsonFile(filename, orders);
    return updated;
  },
  async remove(id) {
    const orders = await readJsonFile<Order[]>(filename, mockOrders);
    const nextOrders = orders.filter((item) => item.id !== id);

    if (nextOrders.length === orders.length) {
      return false;
    }

    await writeJsonFile(filename, nextOrders);
    return true;
  }
};
