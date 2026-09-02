import "server-only";

import { ensureSqliteDatabase, getSqliteDatabase } from "@/lib/server/sqlite/db";
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
import type { ClientRepository, OrderRepository, WriterRepository } from "@/lib/repositories/interfaces";

async function db() {
  await ensureSqliteDatabase();
  return getSqliteDatabase();
}

export const sqliteClientRepository: ClientRepository = {
  async list() {
    const database = await db();
    const rows = database.prepare("SELECT * FROM clients ORDER BY created_at DESC").all() as ClientRow[];
    return rows.map(mapClientRow);
  },
  async getById(id) {
    const database = await db();
    const row = database.prepare("SELECT * FROM clients WHERE id = ?").get(id) as ClientRow | undefined;
    return row ? mapClientRow(row) : null;
  },
  async create(input) {
    const database = await db();
    database.prepare(`
      INSERT INTO clients (
        id, name, contact_handle, source_channel, school_type, school, education_level, major,
        risk_level, preferred_title, preferred_service_type, preferred_deadline, preferred_budget,
        notes, last_contact_at, created_at
      ) VALUES (
        @id, @name, @contact_handle, @source_channel, @school_type, @school, @education_level, @major,
        @risk_level, @preferred_title, @preferred_service_type, @preferred_deadline, @preferred_budget,
        @notes, @last_contact_at, @created_at
      )
    `).run(clientToRow(input));
    return input;
  },
  async update(id, input) {
    const database = await db();
    const current = await sqliteClientRepository.getById(id);
    if (!current) {
      return null;
    }

    const updated = { ...current, ...input };
    database.prepare(`
      UPDATE clients SET
        name = @name,
        contact_handle = @contact_handle,
        source_channel = @source_channel,
        school_type = @school_type,
        school = @school,
        education_level = @education_level,
        major = @major,
        risk_level = @risk_level,
        preferred_title = @preferred_title,
        preferred_service_type = @preferred_service_type,
        preferred_deadline = @preferred_deadline,
        preferred_budget = @preferred_budget,
        notes = @notes,
        last_contact_at = @last_contact_at,
        created_at = @created_at
      WHERE id = @id
    `).run(clientToRow(updated));
    return updated;
  },
  async remove(id) {
    const database = await db();
    const result = database.prepare("DELETE FROM clients WHERE id = ?").run(id);
    return result.changes > 0;
  }
};

export const sqliteOrderRepository: OrderRepository = {
  async list() {
    const database = await db();
    const rows = database.prepare("SELECT * FROM orders ORDER BY created_at DESC").all() as OrderRow[];
    return rows.map(mapOrderRow);
  },
  async getById(id) {
    const database = await db();
    const row = database.prepare("SELECT * FROM orders WHERE id = ?").get(id) as OrderRow | undefined;
    return row ? mapOrderRow(row) : null;
  },
  async countByClientId(clientId) {
    const database = await db();
    const row = database
      .prepare("SELECT COUNT(*) AS count FROM orders WHERE client_id = ?")
      .get(clientId) as { count: number };
    return row.count;
  },
  async countByWriterId(writerId) {
    const database = await db();
    const row = database
      .prepare("SELECT COUNT(*) AS count FROM orders WHERE writer_id = ?")
      .get(writerId) as { count: number };
    return row.count;
  },
  async create(input) {
    const database = await db();
    database.prepare(`
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
    `).run(orderToRow(input));
    return input;
  },
  async update(id, input) {
    const database = await db();
    const current = await sqliteOrderRepository.getById(id);
    if (!current) {
      return null;
    }

    const updated = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString()
    };

    database.prepare(`
      UPDATE orders SET
        client_id = @client_id,
        client_name = @client_name,
        source_type = @source_type,
        title = @title,
        school_type = @school_type,
        school = @school,
        education_level = @education_level,
        major = @major,
        service_type = @service_type,
        package_mode = @package_mode,
        writer_id = @writer_id,
        owner_name = @owner_name,
        status = @status,
        deadline = @deadline,
        writer_deadline = @writer_deadline,
        completed_at = @completed_at,
        transaction_date = @transaction_date,
        amount = @amount,
        settled_amount = @settled_amount,
        receivable_amount = @receivable_amount,
        cost_amount = @cost_amount,
        profit_amount = @profit_amount,
        payment_status = @payment_status,
        is_settled = @is_settled,
        urgency = @urgency,
        source_channel = @source_channel,
        notes = @notes,
        remark = @remark,
        created_at = @created_at,
        updated_at = @updated_at
      WHERE id = @id
    `).run(orderToRow(updated));
    return updated;
  },
  async remove(id) {
    const database = await db();
    const result = database.prepare("DELETE FROM orders WHERE id = ?").run(id);
    return result.changes > 0;
  }
};

export const sqliteWriterRepository: WriterRepository = {
  async list() {
    const database = await db();
    const rows = database.prepare("SELECT * FROM writers ORDER BY name ASC").all() as WriterRow[];
    return rows.map((row) => mapWriterRow(row));
  },
  async getById(id) {
    const database = await db();
    const row = database.prepare("SELECT * FROM writers WHERE id = ?").get(id) as WriterRow | undefined;
    return row ? mapWriterRow(row) : null;
  },
  async create(input) {
    const database = await db();
    database.prepare(`
      INSERT INTO writers (
        id, name, specialties, availability, capacity, rating, completion_rate,
        average_turnaround_days, price_tier, owner_name, settlement_mode, notes
      ) VALUES (
        @id, @name, @specialties, @availability, @capacity, @rating, @completion_rate,
        @average_turnaround_days, @price_tier, @owner_name, @settlement_mode, @notes
      )
    `).run(writerToRow({ ...input, activeOrderCount: 0 }));
    return { ...input, activeOrderCount: 0 };
  },
  async update(id, input) {
    const database = await db();
    const current = await sqliteWriterRepository.getById(id);
    if (!current) {
      return null;
    }

    const updated = { ...current, ...input };
    database.prepare(`
      UPDATE writers SET
        name = @name,
        specialties = @specialties,
        availability = @availability,
        capacity = @capacity,
        rating = @rating,
        completion_rate = @completion_rate,
        average_turnaround_days = @average_turnaround_days,
        price_tier = @price_tier,
        owner_name = @owner_name,
        settlement_mode = @settlement_mode,
        notes = @notes
      WHERE id = @id
    `).run(writerToRow(updated));
    return updated;
  },
  async remove(id) {
    const database = await db();
    const result = database.prepare("DELETE FROM writers WHERE id = ?").run(id);
    return result.changes > 0;
  }
};
