// ============================================================
// Stock Entries Routes — Pencatatan Stok Masuk (Inbound)
// ============================================================

import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { getDb, generateId, getNow, paginatedList } from "./helpers";
import type { AppEnv } from "../index";

const stockEntries = new Hono<AppEnv>();
stockEntries.use("*", authMiddleware);

stockEntries.get("/", requirePermission("stock_entries", "list"), async (c) => {
  return paginatedList(c, schema.stockEntries, schema.stockEntries.tenant_id);
});

stockEntries.get("/:id", requirePermission("stock_entries", "show"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const entry = await db
    .select()
    .from(schema.stockEntries)
    .where(and(eq(schema.stockEntries.id, id), eq(schema.stockEntries.tenant_id, tenantId)))
    .limit(1);

  if (entry.length === 0) return c.json({ success: false, error: "Data stok tidak ditemukan" }, 404);

  // Get batches
  const batches = await db
    .select()
    .from(schema.stockBatches)
    .where(eq(schema.stockBatches.stock_entry_id, id));

  // Get product & producer
  const product = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, entry[0].product_id))
    .limit(1);

  return c.json({ success: true, data: { ...entry[0], batches, product: product[0] || null } });
});

stockEntries.post("/", requirePermission("stock_entries", "create"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const body = await c.req.json();
  const now = getNow();
  const entryId = generateId();
  const batchId = generateId();

  // Create stock entry
  await db.insert(schema.stockEntries).values({
    id: entryId,
    tenant_id: tenantId,
    product_id: body.product_id,
    producer_id: body.producer_id || null,
    source: body.source,
    production_period: body.production_period || null,
    production_date: body.production_date,
    expiry_date: body.expiry_date,
    quantity: body.quantity,
    production_cost: body.production_cost,
    notes: body.notes || null,
    created_at: now,
    updated_at: now,
  });

  // Auto-create stock batch
  await db.insert(schema.stockBatches).values({
    id: batchId,
    tenant_id: tenantId,
    stock_entry_id: entryId,
    product_id: body.product_id,
    production_date: body.production_date,
    expiry_date: body.expiry_date,
    initial_quantity: body.quantity,
    current_quantity: body.quantity,
    status: "available",
    created_at: now,
    updated_at: now,
  });

  return c.json({ success: true, data: { id: entryId, batch_id: batchId } }, 201);
});

export { stockEntries as stockEntryRoutes };
