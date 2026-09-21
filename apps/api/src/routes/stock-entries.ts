// ============================================================
// Stock Entries Routes — Pencatatan Stok Masuk (Inbound)
// ============================================================

import { Hono } from "hono";
import { eq, and, like, asc, desc, sql } from "drizzle-orm";
import * as schema from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { getDb, generateId, getNow } from "./helpers";
import type { AppEnv } from "../index";

const stockEntries = new Hono<AppEnv>();
stockEntries.use("*", authMiddleware);

stockEntries.get("/", requirePermission("stock_entries", "list"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");

  const url = new URL(c.req.url);
  const page = Math.max(parseInt(url.searchParams.get("_page") || "1", 10) || 1, 1);
  const pageSize = Math.min(
    Math.max(parseInt(url.searchParams.get("_pageSize") || "10", 10) || 10, 1),
    100
  );
  const search = url.searchParams.get("_search") || "";
  const sortField = url.searchParams.get("_sort") || "";
  const sortOrder = url.searchParams.get("_order") === "asc" ? "asc" : "desc";

  const sortableCols: Record<string, any> = {
    product_name: schema.products.name,
    production_date: schema.stockEntries.production_date,
    expiry_date: schema.stockEntries.expiry_date,
    quantity: schema.stockEntries.quantity,
    created_at: schema.stockEntries.created_at,
  };

  const conditions: any[] = [eq(schema.stockEntries.tenant_id, tenantId)];
  if (search) {
    conditions.push(like(schema.products.name, `%${search}%`));
  }
  const whereClause = and(...conditions);

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.stockEntries)
    .innerJoin(schema.products, eq(schema.stockEntries.product_id, schema.products.id))
    .where(whereClause);
  const total = Number(countResult[0]?.count || 0);

  const orderCol = sortableCols[sortField] || schema.stockEntries.created_at;
  const orderBy = sortOrder === "asc" ? asc(orderCol) : desc(orderCol);

  const data = await db
    .select({
      id: schema.stockEntries.id,
      product_id: schema.stockEntries.product_id,
      product_name: schema.products.name,
      producer_id: schema.stockEntries.producer_id,
      producer_name: schema.producers.name,
      source: schema.stockEntries.source,
      production_period: schema.stockEntries.production_period,
      production_date: schema.stockEntries.production_date,
      expiry_date: schema.stockEntries.expiry_date,
      quantity: schema.stockEntries.quantity,
      production_cost: schema.stockEntries.production_cost,
      notes: schema.stockEntries.notes,
      created_at: schema.stockEntries.created_at,
      updated_at: schema.stockEntries.updated_at,
    })
    .from(schema.stockEntries)
    .innerJoin(schema.products, eq(schema.stockEntries.product_id, schema.products.id))
    .leftJoin(schema.producers, eq(schema.stockEntries.producer_id, schema.producers.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return c.json({
    success: true,
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
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

  let producer = null;
  if (entry[0].producer_id) {
    const producerResult = await db
      .select()
      .from(schema.producers)
      .where(eq(schema.producers.id, entry[0].producer_id))
      .limit(1);
    producer = producerResult[0] || null;
  }

  return c.json({
    success: true,
    data: { ...entry[0], batches, product: product[0] || null, producer },
  });
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
