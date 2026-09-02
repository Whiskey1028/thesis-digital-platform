import "server-only";

import { mockOrders } from "@/lib/mock-data";
import type { Order } from "@/lib/types";
import type { OrderRepository } from "@/lib/repositories/interfaces";
import { mutateJsonFile, readJsonFile } from "@/lib/server/storage";

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
    await mutateJsonFile<Order[]>(filename, mockOrders, (orders) => {
      orders.unshift(input);
      return orders;
    });
    return input;
  },
  async update(id, input) {
    let updated: Order | null = null;

    await mutateJsonFile<Order[]>(filename, mockOrders, (orders) => {
      const index = orders.findIndex((item) => item.id === id);

      if (index === -1) {
        return orders;
      }

      updated = {
        ...orders[index],
        ...input,
        updatedAt: new Date().toISOString()
      };
      orders[index] = updated;
      return orders;
    });

    return updated;
  },
  async remove(id) {
    let removed = false;

    await mutateJsonFile<Order[]>(filename, mockOrders, (orders) => {
      const nextOrders = orders.filter((item) => item.id !== id);
      removed = nextOrders.length !== orders.length;
      return nextOrders;
    });

    return removed;
  }
};
