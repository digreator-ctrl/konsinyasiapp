// ============================================================
// Returns Routes — Manajemen Retur (Agen & Sales/Toko)
// ============================================================

import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { getDb, generateId, getNow, paginatedList } from "./helpers";
import type { AppEnv } from "../index";

const returns = new Hono<AppEnv>();
returns.use("*", authMiddleware);

returns.get("/", async (c) => {
  const roles = c.get("userRoles");
  const userId = c.get("userId");
  const isSales = roles.includes("sales") && !roles.includes("admin") && !roles.includes("owner");
  
  const additionalFilters = isSales ? [eq(schema.returns.source_id, userId)] : [];

  return paginatedList(c, schema.returns, schema.returns.tenant_id, {
    additionalFilters
  });
});

returns.get("/:id", async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const roles = c.get("userRoles");
  const userId = c.get("userId");
  const isSales = roles.includes("sales") && !roles.includes("admin") && !roles.includes("owner");

  const conditions = [eq(schema.returns.id, id), eq(schema.returns.tenant_id, tenantId)];
  if (isSales) {
    conditions.push(eq(schema.returns.source_id, userId));
  }

  const ret = await db
    .select()
    .from(schema.returns)
    .where(and(...conditions))
    .limit(1);

  if (ret.length === 0) return c.json({ success: false, error: "Retur tidak ditemukan" }, 404);

  const items = await db
    .select({
      id: schema.returnItems.id,
      product_id: schema.returnItems.product_id,
      product_name: schema.products.name,
      batch_id: schema.returnItems.batch_id,
      quantity: schema.returnItems.quantity,
      reason: schema.returnItems.reason,
      photo_url: schema.returnItems.photo_url,
      notes: schema.returnItems.notes,
    })
    .from(schema.returnItems)
    .innerJoin(schema.products, eq(schema.returnItems.product_id, schema.products.id))
    .where(eq(schema.returnItems.return_id, id));

  return c.json({ success: true, data: { ...ret[0], items } });
});

// POST / — Create return
returns.post("/", async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const body = await c.req.json();
  const now = getNow();
  const returnId = generateId();

  await db.insert(schema.returns).values({
    id: returnId,
    tenant_id: tenantId,
    source: body.source,
    source_id: body.source_id,
    distribution_id: body.distribution_id || null,
    status: "submitted",
    return_date: body.return_date || now.split("T")[0],
    notes: body.notes || null,
    created_at: now,
    updated_at: now,
  });

  for (const item of body.items || []) {
    await db.insert(schema.returnItems).values({
      id: generateId(),
      return_id: returnId,
      product_id: item.product_id,
      batch_id: item.batch_id || null,
      quantity: item.quantity,
      reason: item.reason,
      photo_url: item.photo_url || null,
      notes: item.notes || null,
      created_at: now,
    });
  }

  return c.json({ success: true, data: { id: returnId } }, 201);
});

// POST /:id/process — Process return (verify & complete)
returns.post("/:id/process", async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = getNow();

  const ret = await db
    .select()
    .from(schema.returns)
    .where(and(eq(schema.returns.id, id), eq(schema.returns.tenant_id, tenantId)))
    .limit(1);

  if (ret.length === 0) return c.json({ success: false, error: "Retur tidak ditemukan" }, 404);

  const newStatus = body.status || "processed"; // "verified", "processed", "rejected"

  await db
    .update(schema.returns)
    .set({ status: newStatus, updated_at: now })
    .where(eq(schema.returns.id, id));

  // For agent returns with status "processed": auto-generate replacement distribution
  if (newStatus === "processed" && ret[0].source === "agent") {
    const returnItemsList = await db
      .select()
      .from(schema.returnItems)
      .where(eq(schema.returnItems.return_id, id));

    // Create a replacement distribution (draft)
    const replacementDistId = generateId();
    await db.insert(schema.distributions).values({
      id: replacementDistId,
      tenant_id: tenantId,
      channel: "agent",
      recipient_id: ret[0].source_id,
      recipient_name: null,
      status: "draft",
      total_amount: 0,
      notes: `Penggantian retur #${id}`,
      created_at: now,
      updated_at: now,
    });

    // Note: Items need to be manually selected by admin from available batches
  }

  return c.json({ success: true, data: { id, status: newStatus } });
});

export { returns as returnRoutes };
