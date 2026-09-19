// ============================================================
// Consignments Routes — Konsinyasi Sales → Toko
// ============================================================

import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { getDb, generateId, getNow, paginatedList } from "./helpers";
import type { AppEnv } from "../index";

const consignments = new Hono<AppEnv>();
consignments.use("*", authMiddleware);

consignments.get("/", requirePermission("consignments", "list"), async (c) => {
  return paginatedList(c, schema.consignments, schema.consignments.tenant_id);
});

consignments.get("/:id", requirePermission("consignments", "show"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const consignment = await db
    .select()
    .from(schema.consignments)
    .where(and(eq(schema.consignments.id, id), eq(schema.consignments.tenant_id, tenantId)))
    .limit(1);

  if (consignment.length === 0) return c.json({ success: false, error: "Konsinyasi tidak ditemukan" }, 404);

  const items = await db
    .select({
      id: schema.consignmentItems.id,
      product_id: schema.consignmentItems.product_id,
      product_name: schema.products.name,
      batch_id: schema.consignmentItems.batch_id,
      quantity_consigned: schema.consignmentItems.quantity_consigned,
      quantity_sold: schema.consignmentItems.quantity_sold,
      quantity_returned: schema.consignmentItems.quantity_returned,
      price: schema.consignmentItems.price,
    })
    .from(schema.consignmentItems)
    .innerJoin(schema.products, eq(schema.consignmentItems.product_id, schema.products.id))
    .where(eq(schema.consignmentItems.consignment_id, id));

  const store = await db
    .select()
    .from(schema.stores)
    .where(eq(schema.stores.id, consignment[0].store_id))
    .limit(1);

  return c.json({ success: true, data: { ...consignment[0], items, store: store[0] || null } });
});

// POST / — Create consignment (Sales titip barang ke Toko)
consignments.post("/", requirePermission("consignments", "create"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const salesId = c.get("userId");
  const body = await c.req.json();
  const now = getNow();
  const consignmentId = generateId();

  // Optionally create store visit
  let visitId: string | null = null;
  if (body.create_visit) {
    visitId = generateId();
    await db.insert(schema.storeVisits).values({
      id: visitId,
      tenant_id: tenantId,
      sales_id: salesId,
      store_id: body.store_id,
      visit_date: body.consignment_date || now.split("T")[0],
      photo_url: body.visit_photo_url || null,
      notes: body.visit_notes || null,
      created_at: now,
      updated_at: now,
    });
  }

  await db.insert(schema.consignments).values({
    id: consignmentId,
    tenant_id: tenantId,
    sales_id: salesId,
    store_id: body.store_id,
    visit_id: visitId,
    status: "active",
    consignment_date: body.consignment_date || now.split("T")[0],
    notes: body.notes || null,
    created_at: now,
    updated_at: now,
  });

  for (const item of body.items || []) {
    await db.insert(schema.consignmentItems).values({
      id: generateId(),
      consignment_id: consignmentId,
      product_id: item.product_id,
      batch_id: item.batch_id,
      quantity_consigned: item.quantity_consigned,
      quantity_sold: 0,
      quantity_returned: 0,
      price: item.price,
      created_at: now,
      updated_at: now,
    });
  }

  return c.json({ success: true, data: { id: consignmentId } }, 201);
});

// PUT /:id/update-sold — Update penjualan dari konsinyasi
consignments.put("/:id/update-sold", requirePermission("consignments", "edit"), async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = getNow();

  for (const item of body.items || []) {
    await db
      .update(schema.consignmentItems)
      .set({
        quantity_sold: item.quantity_sold,
        updated_at: now,
      })
      .where(eq(schema.consignmentItems.id, item.consignment_item_id));
  }

  // Check if all items are fully sold/returned → mark as completed
  const allItems = await db
    .select()
    .from(schema.consignmentItems)
    .where(eq(schema.consignmentItems.consignment_id, id));

  const allDone = allItems.every(
    (item) => item.quantity_sold + item.quantity_returned >= item.quantity_consigned
  );

  if (allDone) {
    await db
      .update(schema.consignments)
      .set({ status: "completed", updated_at: now })
      .where(eq(schema.consignments.id, id));
  }

  return c.json({ success: true, data: { id } });
});

export { consignments as consignmentRoutes };
