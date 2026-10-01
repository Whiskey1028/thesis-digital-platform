/**
 * One-shot repair: 2025 orders marked settled (is_settled=1) but settled_amount left at 0.
 * Sets settled_amount = amount, receivable_amount = 0, payment_status = paid,
 * and promotes review → delivered when settlement is complete.
 *
 * Usage:
 *   npx tsx -r ./scripts/stub-server-only.cjs scripts/repair-2025-settled-amount.ts [path/to/thesis.db]
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dbPath = path.resolve(process.argv[2] ?? path.join(process.cwd(), "data", "thesis.db"));

async function maybeRepairOrdersJson() {
  const jsonPath = path.join(path.dirname(dbPath), "orders.json");
  try {
    const raw = await fs.readFile(jsonPath, "utf-8");
    const orders = JSON.parse(raw) as Array<Record<string, unknown>>;
    let changed = 0;
    const next = orders.map((order) => {
      const date = String(order.transactionDate ?? "");
      const settledAmount = Number(order.settledAmount ?? 0);
      const isSettled = Boolean(order.isSettled);
      if (!date.startsWith("2025") || !isSettled || settledAmount > 0) {
        return order;
      }
      changed += 1;
      const amount = Number(order.amount ?? 0);
      return {
        ...order,
        settledAmount: amount,
        receivableAmount: 0,
        paymentStatus: "paid",
        status: order.status === "review" ? "delivered" : order.status,
        updatedAt: new Date().toISOString()
      };
    });
    if (changed > 0) {
      await fs.writeFile(jsonPath, `${JSON.stringify(next, null, 2)}\n`, "utf-8");
    }
    return changed;
  } catch {
    return 0;
  }
}

function repairSqlite(file: string) {
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const preview = db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN settled_amount = 0 THEN 1 ELSE 0 END) AS settled0
       FROM orders
       WHERE transaction_date LIKE '2025%' AND is_settled = 1`
    )
    .get() as { total: number; settled0: number };

  const now = new Date().toISOString();
  const result = db
    .prepare(
      `UPDATE orders
       SET settled_amount = amount,
           receivable_amount = 0,
           payment_status = 'paid',
           status = CASE WHEN status = 'review' THEN 'delivered' ELSE status END,
           updated_at = ?
       WHERE transaction_date LIKE '2025%'
         AND is_settled = 1
         AND settled_amount = 0`
    )
    .run(now);

  const after = db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN settled_amount = 0 THEN 1 ELSE 0 END) AS settled0,
              ROUND(SUM(settled_amount), 2) AS settled_sum,
              ROUND(SUM(receivable_amount), 2) AS receivable_sum
       FROM orders
       WHERE transaction_date LIKE '2025%' AND is_settled = 1`
    )
    .get() as {
      total: number;
      settled0: number;
      settled_sum: number;
      receivable_sum: number;
    };

  db.close();
  return { preview, changed: result.changes, after };
}

async function main() {
  const sqlite = repairSqlite(dbPath);
  const jsonChanged = await maybeRepairOrdersJson();
  console.log(
    JSON.stringify(
      {
        dbPath,
        matchedSettled2025: sqlite.preview.total,
        settledAmountWasZero: sqlite.preview.settled0,
        rowsUpdated: sqlite.changed,
        after: sqlite.after,
        ordersJsonUpdated: jsonChanged
      },
      null,
      2
    )
  );
}

void main();
