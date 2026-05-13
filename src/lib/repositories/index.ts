import { jsonClientRepository } from "@/lib/repositories/json/client-repository";
import { jsonOrderRepository } from "@/lib/repositories/json/order-repository";
import { jsonWriterRepository } from "@/lib/repositories/json/writer-repository";

export const repositories = {
  clients: jsonClientRepository,
  orders: jsonOrderRepository,
  writers: jsonWriterRepository
};
