// ============================================================
// Products Routes — CRUD Master Barang & Harga
// ============================================================

import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { getDb, generateId, getNow, paginatedList } from "./helpers";
import type { AppEnv } from "../index";

const products = new Hono<AppEnv>();
products.use("*", authMiddleware);

products.get("/", requirePermission("products", "list"), async (c) => {
  return paginatedList(c, schema.products, schema.products.tenant_id, {
    searchCol: schema.products.name,
  });
});

products.get("/:id", requirePermission("products", "show"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const product = await db
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.id, id), eq(schema.products.tenant_id, tenantId)))
    .limit(1);

  if (product.length === 0) return c.json({ success: false, error: "Produk tidak ditemukan" }, 404);

  // Get prices
  const prices = await db
    .select()
    .from(schema.productPrices)
    .where(eq(schema.productPrices.product_id, id));

  // Get producer
  let producer = null;
  if (product[0].producer_id) {
    const producerResult = await db
      .select()
      .from(schema.producers)
      .where(eq(schema.producers.id, product[0].producer_id))
      .limit(1);
    producer = producerResult[0] || null;
  }

  return c.json({ success: true, data: { ...product[0], prices, producer } });
});

products.post("/", requirePermission("products", "create"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const body = await c.req.json();
  const now = getNow();
  const id = generateId();

  await db.insert(schema.products).values({
    id,
    tenant_id: tenantId,
    name: body.name,
    source: body.source || "own_production",
    producer_id: body.producer_id || null,
    variation: body.variation || null,
    description: body.description || null,
    photo_url: body.photo_url || null,
    is_active: body.is_active !== false,
    created_at: now,
    updated_at: now,
  });

  // Create prices
  if (body.prices && Array.isArray(body.prices)) {
    for (const price of body.prices) {
      await db.insert(schema.productPrices).values({
        id: generateId(),
        product_id: id,
        price_type: price.price_type,
        price: price.price,
        created_at: now,
        updated_at: now,
      });
    }
  }

  return c.json({ success: true, data: { id } }, 201);
});

products.put("/:id", requirePermission("products", "edit"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = getNow();

  await db
    .update(schema.products)
    .set({
      name: body.name,
      source: body.source,
      producer_id: body.producer_id || null,
      variation: body.variation || null,
      description: body.description || null,
      photo_url: body.photo_url || null,
      is_active: body.is_active,
      updated_at: now,
    })
    .where(and(eq(schema.products.id, id), eq(schema.products.tenant_id, tenantId)));

  // Update prices
  if (body.prices && Array.isArray(body.prices)) {
    await db.delete(schema.productPrices).where(eq(schema.productPrices.product_id, id));
    for (const price of body.prices) {
      await db.insert(schema.productPrices).values({
        id: generateId(),
        product_id: id,
        price_type: price.price_type,
        price: price.price,
        created_at: now,
        updated_at: now,
      });
    }
  }

  return c.json({ success: true, data: { id } });
});

products.delete("/:id", requirePermission("products", "delete"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  await db
    .delete(schema.products)
    .where(and(eq(schema.products.id, id), eq(schema.products.tenant_id, tenantId)));

  return c.json({ success: true });
});

export { products as productRoutes };
