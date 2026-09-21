// ============================================================
// KonsinyasiApp — Sales Stock Service
// Maintains per-sales stock levels (warehouse → sales → store)
// ============================================================

import { and, eq, sql } from "drizzle-orm";
import * as schema from "../db/schema";
import { generateId, getNow } from "../routes/helpers";

type DB = any;

/** Current quantity of a batch held by a sales user. */
export async function getSalesStock(db: DB, salesId: string, batchId: string): Promise<number> {
  const rows = await db
    .select({ quantity: schema.salesStocks.quantity })
    .from(schema.salesStocks)
    .where(and(eq(schema.salesStocks.sales_id, salesId), eq(schema.salesStocks.batch_id, batchId)))
    .limit(1);

  return rows.length > 0 ? rows[0].quantity : 0;
}

/**
 * Add (or subtract) stock held by a sales user for a given batch.
 * Positive delta adds, negative delta subtracts. Rows are upserted.
 */
export async function adjustSalesStock(
  db: DB,
  params: { tenantId: string; salesId: string; productId: string; batchId: string },
  delta: number
): Promise<void> {
  const now = getNow();
  const existing = await db
    .select({ id: schema.salesStocks.id, quantity: schema.salesStocks.quantity })
    .from(schema.salesStocks)
    .where(
      and(
        eq(schema.salesStocks.sales_id, params.salesId),
        eq(schema.salesStocks.batch_id, params.batchId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const next = Math.max(0, existing[0].quantity + delta);
    await db
      .update(schema.salesStocks)
      .set({ quantity: next, updated_at: now })
      .where(eq(schema.salesStocks.id, existing[0].id));
    return;
  }

  if (delta <= 0) return;

  await db.insert(schema.salesStocks).values({
    id: generateId(),
    tenant_id: params.tenantId,
    sales_id: params.salesId,
    product_id: params.productId,
    batch_id: params.batchId,
    quantity: delta,
    created_at: now,
    updated_at: now,
  });
}

export interface SalesStockRow {
  id: string;
  sales_id: string;
  sales_name: string | null;
  product_id: string;
  product_name: string;
  batch_id: string;
  production_date: string;
  expiry_date: string;
  quantity: number;
}

/** Stock held by a sales user, enriched with product & batch info. */
export async function listSalesStock(
  db: DB,
  tenantId: string,
  salesId: string
): Promise<SalesStockRow[]> {
  const rows = await db
    .select({
      id: schema.salesStocks.id,
      sales_id: schema.salesStocks.sales_id,
      sales_name: schema.users.name,
      product_id: schema.salesStocks.product_id,
      product_name: schema.products.name,
      batch_id: schema.salesStocks.batch_id,
      production_date: schema.stockBatches.production_date,
      expiry_date: schema.stockBatches.expiry_date,
      quantity: schema.salesStocks.quantity,
    })
    .from(schema.salesStocks)
    .innerJoin(schema.users, eq(schema.salesStocks.sales_id, schema.users.id))
    .innerJoin(schema.products, eq(schema.salesStocks.product_id, schema.products.id))
    .innerJoin(schema.stockBatches, eq(schema.salesStocks.batch_id, schema.stockBatches.id))
    .where(
      and(
        eq(schema.salesStocks.tenant_id, tenantId),
        eq(schema.salesStocks.sales_id, salesId),
        sql`${schema.salesStocks.quantity} > 0`
      )
    );

  return rows;
}
