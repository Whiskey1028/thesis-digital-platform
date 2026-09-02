import type { Client, Order, Writer } from "@/lib/types";

export interface ClientRepository {
  list(): Promise<Client[]>;
  getById(id: string): Promise<Client | null>;
  create(input: Client): Promise<Client>;
  update(id: string, input: Partial<Client>): Promise<Client | null>;
  remove(id: string): Promise<boolean>;
}

export interface OrderRepository {
  list(): Promise<Order[]>;
  getById(id: string): Promise<Order | null>;
  countByClientId(clientId: string): Promise<number>;
  countByWriterId(writerId: string): Promise<number>;
  create(input: Order): Promise<Order>;
  update(id: string, input: Partial<Order>): Promise<Order | null>;
  remove(id: string): Promise<boolean>;
}

export interface WriterRepository {
  list(): Promise<Writer[]>;
  getById(id: string): Promise<Writer | null>;
  create(input: Writer): Promise<Writer>;
  update(id: string, input: Partial<Writer>): Promise<Writer | null>;
  remove(id: string): Promise<boolean>;
}
