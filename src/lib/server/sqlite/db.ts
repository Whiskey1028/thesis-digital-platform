import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import lockfile from "proper-lockfile";
import { mockClients, mockOrders, mockWriters } from "@/lib/mock-data";
import {
  clientToRow,
  mapClientRow,
  mapOrderRow,
  mapWriterRow,
  orderToRow,
  writerToRow,
  type ClientRow,
  type OrderRow,
  type WriterRow
} from "@/lib/server/sqlite/mappers";
import type { Client, Order, Writer } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "thesis.db");

const globalForDb = globalThis as unknown as {
  thesisSqlite?: Database.Database;
  thesisSqliteInit?: Promise<Database.Database>;
};

async function withMigrationLock<T>(fn: () => Promise<T> | T): Promise<T> {
  await fs.mkdir(dataDir, { recursive: true });
  const lockPath = path.join(dataDir, ".thesis-migrate.lock");

  try {
    await fs.writeFile(lockPath, "", { flag: "a" });
  } catch {
    // lock file may already exist
  }

  const release = await lockfile.lock(lockPath, {
    retries: {
      retries: 12,
      minTimeout: 50,
      maxTimeout: 500
    }
  });

  try {
    return await fn();
  } finally {
    await release();
  }
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_handle TEXT NOT NULL,
      source_channel TEXT NOT NULL,
      school_type TEXT NOT NULL,
      school TEXT NOT NULL,
      education_level TEXT NOT NULL,
      major TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      preferred_title TEXT,
      preferred_service_type TEXT,
      preferred_deadline TEXT,
      preferred_budget REAL,
      notes TEXT,
      last_contact_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS writers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      specialties TEXT NOT NULL,
      availability TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      rating REAL NOT NULL,
      completion_rate REAL NOT NULL,
      average_turnaround_days REAL NOT NULL,
      price_tier TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      settlement_mode TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id),
      client_name TEXT,
      source_type TEXT NOT NULL,
      title TEXT NOT NULL,
      school_type TEXT,
      school TEXT,
      education_level TEXT,
      major TEXT,
      service_type TEXT NOT NULL,
      package_mode TEXT NOT NULL,
      writer_id TEXT REFERENCES writers(id),
      owner_name TEXT NOT NULL,
      status TEXT NOT NULL,
      deadline TEXT NOT NULL,
      writer_deadline TEXT,
      completed_at TEXT,
      transaction_date TEXT NOT NULL,
      amount REAL NOT NULL,
      settled_amount REAL NOT NULL,
      receivable_amount REAL NOT NULL,
      cost_amount REAL NOT NULL,
      profit_amount REAL NOT NULL,
      payment_status TEXT NOT NULL,
      is_settled INTEGER NOT NULL,
      urgency TEXT NOT NULL,
      source_channel TEXT NOT NULL,
      notes TEXT,
      remark TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
    CREATE INDEX IF NOT EXISTS idx_orders_writer_id ON orders(writer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_clients_risk_level ON clients(risk_level);
    CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
  `);
}

async function readJsonSeed<T>(filename: string, fallback: T): Promise<T> {
  const filePath = path.join(dataDir, filename);

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function sanitizeSeedOrders(clients: Client[], writers: Writer[], orders: Order[]) {
  const clientIds = new Set(clients.map((client) => client.id));
  const writerIds = new Set(writers.map((writer) => writer.id));

  return orders
    .filter((order) => clientIds.has(order.clientId))
    .map((order) => ({
      ...order,
      writerId: order.writerId && writerIds.has(order.writerId) ? order.writerId : null
    }));
}

function seedDatabase(db: Database.Database, clients: Client[], writers: Writer[], orders: Order[]) {
  const sanitizedOrders = sanitizeSeedOrders(clients, writers, orders);

  const insertClient = db.prepare(`
    INSERT INTO clients (
      id, name, contact_handle, source_channel, school_type, school, education_level, major,
      risk_level, preferred_title, preferred_service_type, preferred_deadline, preferred_budget,
      notes, last_contact_at, created_at
    ) VALUES (
      @id, @name, @contact_handle, @source_channel, @school_type, @school, @education_level, @major,
      @risk_level, @preferred_title, @preferred_service_type, @preferred_deadline, @preferred_budget,
      @notes, @last_contact_at, @created_at
    )
  `);

  const insertWriter = db.prepare(`
    INSERT INTO writers (
      id, name, specialties, availability, capacity, rating, completion_rate,
      average_turnaround_days, price_tier, owner_name, settlement_mode, notes
    ) VALUES (
      @id, @name, @specialties, @availability, @capacity, @rating, @completion_rate,
      @average_turnaround_days, @price_tier, @owner_name, @settlement_mode, @notes
    )
  `);

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, client_id, client_name, source_type, title, school_type, school, education_level, major,
      service_type, package_mode, writer_id, owner_name, status, deadline, writer_deadline,
      completed_at, transaction_date, amount, settled_amount, receivable_amount, cost_amount,
      profit_amount, payment_status, is_settled, urgency, source_channel, notes, remark,
      created_at, updated_at
    ) VALUES (
      @id, @client_id, @client_name, @source_type, @title, @school_type, @school, @education_level, @major,
      @service_type, @package_mode, @writer_id, @owner_name, @status, @deadline, @writer_deadline,
      @completed_at, @transaction_date, @amount, @settled_amount, @receivable_amount, @cost_amount,
      @profit_amount, @payment_status, @is_settled, @urgency, @source_channel, @notes, @remark,
      @created_at, @updated_at
    )
  `);

  const tx = db.transaction(() => {
    for (const client of clients) {
      insertClient.run(clientToRow(client));
    }
    for (const writer of writers) {
      insertWriter.run(writerToRow(writer));
    }
    for (const order of sanitizedOrders) {
      insertOrder.run(orderToRow(order));
    }
  });

  db.pragma("foreign_keys = OFF");
  tx();
  db.pragma("foreign_keys = ON");
}

function clearAllTables(db: Database.Database) {
  db.pragma("foreign_keys = OFF");
  db.exec(`
    DELETE FROM orders;
    DELETE FROM clients;
    DELETE FROM writers;
  `);
  db.pragma("foreign_keys = ON");
}

async function migrateFromLegacyJson(db: Database.Database) {
  await withMigrationLock(async () => {
    const clientCount = db.prepare("SELECT COUNT(*) AS count FROM clients").get() as { count: number };
    if (clientCount.count > 0) {
      return;
    }

    const [clients, writers, orders] = await Promise.all([
      readJsonSeed<Client[]>("clients.json", mockClients),
      readJsonSeed<Writer[]>("writers.json", mockWriters),
      readJsonSeed<Order[]>("orders.json", mockOrders)
    ]);

    seedDatabase(db, clients, writers, orders);
  });
}

/** 全量替换业务数据（导入/修复脚本用）。会清空三表后重写。 */
export async function replaceSqliteDataset(input: {
  clients: Client[];
  writers: Writer[];
  orders: Order[];
}) {
  const db = await ensureSqliteDatabase();

  await withMigrationLock(() => {
    clearAllTables(db);
    seedDatabase(db, input.clients, input.writers, input.orders);
  });
}

export async function ensureSqliteDatabase() {
  if (globalForDb.thesisSqlite) {
    return globalForDb.thesisSqlite;
  }

  if (!globalForDb.thesisSqliteInit) {
    globalForDb.thesisSqliteInit = (async () => {
      await fs.mkdir(dataDir, { recursive: true });
      const db = new Database(dbPath);
      db.pragma("journal_mode = WAL");
      db.pragma("foreign_keys = ON");
      initSchema(db);
      await migrateFromLegacyJson(db);
      globalForDb.thesisSqlite = db;
      return db;
    })();
  }

  return globalForDb.thesisSqliteInit;
}

export function getSqliteDatabase() {
  if (!globalForDb.thesisSqlite) {
    throw new Error("SQLite database is not initialized. Call ensureSqliteDatabase() first.");
  }

  return globalForDb.thesisSqlite;
}

export function mapAllClients(db: Database.Database) {
  const rows = db.prepare("SELECT * FROM clients ORDER BY created_at DESC").all() as ClientRow[];
  return rows.map(mapClientRow);
}

export function mapAllWriters(db: Database.Database, activeCounts?: Map<string, number>) {
  const rows = db.prepare("SELECT * FROM writers ORDER BY name ASC").all() as WriterRow[];
  return rows.map((row) => mapWriterRow(row, activeCounts?.get(row.id) ?? 0));
}

export function mapAllOrders(db: Database.Database) {
  const rows = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all() as OrderRow[];
  return rows.map(mapOrderRow);
}
