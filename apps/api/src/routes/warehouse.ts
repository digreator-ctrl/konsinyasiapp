// ============================================================
// Warehouse Routes — Stok Gudang Real-time
// ============================================================

import { Hono } from "hono";
import { eq, and, sql, lte } from "drizzle-orm";
import * as schema from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { getDb } from "./helpers";
import type { AppEnv } from "../index";

const warehouse = new Hono<AppEnv>();
warehouse.use("*", authMiddleware);

// GET / — Aggregated stock per product
warehouse.get("/", requirePermission("warehouse", "list"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");

  const result = await db
    .select({
      product_id: schema.stockBatches.product_id,
      product_name: schema.products.name,
      product_source: schema.products.source,
      total_initial: sql<number>`SUM(${schema.stockBatches.initial_quantity})`,
      total_current: sql<number>`SUM(${schema.stockBatches.current_quantity})`,
      batch_count: sql<number>`COUNT(*)`,
    })
    .from(schema.stockBatches)
    .innerJoin(schema.products, eq(schema.stockBatches.product_id, schema.products.id))
    .where(eq(schema.stockBatches.tenant_id, tenantId))
    .groupBy(schema.stockBatches.product_id);

  return c.json({ success: true, data: result });
});

// GET /batches — All batches (with expiry warnings)
warehouse.get("/batches", requirePermission("warehouse", "list"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");

  const url = new URL(c.req.url);
  const productId = url.searchParams.get("product_id");

  let conditions: any[] = [eq(schema.stockBatches.tenant_id, tenantId)];
  if (productId) {
    conditions.push(eq(schema.stockBatches.product_id, productId));
  }

  const batches = await db
    .select({
      id: schema.stockBatches.id,
      product_id: schema.stockBatches.product_id,
      product_name: schema.products.name,
      production_date: schema.stockBatches.production_date,
      expiry_date: schema.stockBatches.expiry_date,
      initial_quantity: schema.stockBatches.initial_quantity,
      current_quantity: schema.stockBatches.current_quantity,
      status: schema.stockBatches.status,
    })
    .from(schema.stockBatches)
    .innerJoin(schema.products, eq(schema.stockBatches.product_id, schema.products.id))
    .where(and(...conditions));

  return c.json({ success: true, data: batches });
});

// GET /expiring — Products near expiry (within 7 days)
warehouse.get("/expiring", requirePermission("warehouse", "list"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const expiring = await db
    .select({
      id: schema.stockBatches.id,
      product_id: schema.stockBatches.product_id,
      product_name: schema.products.name,
      expiry_date: schema.stockBatches.expiry_date,
      current_quantity: schema.stockBatches.current_quantity,
    })
    .from(schema.stockBatches)
    .innerJoin(schema.products, eq(schema.stockBatches.product_id, schema.products.id))
    .where(
      and(
        eq(schema.stockBatches.tenant_id, tenantId),
        lte(schema.stockBatches.expiry_date, sevenDaysFromNow),
        sql`${schema.stockBatches.current_quantity} > 0`
      )
    );

  return c.json({ success: true, data: expiring });
});

export { warehouse as warehouseRoutes };
