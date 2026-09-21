// ============================================================
// Returns Routes — Manajemen Retur (Agen & Sales/Toko)
// ============================================================

import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { assertPermission, assertAnyPermission } from "../middleware/rbac";
import { getDb, generateId, getNow, paginatedList } from "./helpers";
import { adjustSalesStock } from "../services/sales-stock";
import type { AppEnv } from "../index";

const returns = new Hono<AppEnv>();
returns.use("*", authMiddleware);

const sourceResource = (source: string | null) =>
  source === "agent" ? "return_agent" : "return_sales";

returns.get("/", async (c) => {
  const url = new URL(c.req.url);
  const source = url.searchParams.get("source");

  // Which resource the caller must be allowed to list
  await assertAnyPermission(c, ["return_agent", "return_sales"], "list");

  const roles = c.get("userRoles");
  const userId = c.get("userId");
  const isSales = roles.includes("sales") && !roles.includes("admin") && !roles.includes("owner");

  const additionalFilters: any[] = [];
  if (source) {
    additionalFilters.push(eq(schema.returns.source, source));
  }
  if (isSales) {
    additionalFilters.push(eq(schema.returns.source_id, userId));
  }

  return paginatedList(c, schema.returns, schema.returns.tenant_id, {
    additionalFilters,
    sortableCols: {
      return_date: schema.returns.return_date,
      status: schema.returns.status,
    },
  });
});

returns.get("/:id", async (c) => {
  await assertAnyPermission(c, ["return_agent", "return_sales"], "show");

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
  const userId = c.get("userId");
  const roles = c.get("userRoles");
  const body = await c.req.json();
  const now = getNow();
  const returnId = generateId();

  const isSalesOnly =
    roles.includes("sales") && !roles.includes("admin") && !roles.includes("owner");
  const source = isSalesOnly ? "sales" : body.source;
  const sourceId = isSalesOnly ? userId : body.source_id;

  await assertPermission(c, sourceResource(source), "create");

  await db.insert(schema.returns).values({
    id: returnId,
    tenant_id: tenantId,
    source,
    source_id: sourceId,
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
  await assertAnyPermission(c, ["return_agent", "return_sales"], "approve");

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

  if (newStatus === "processed") {
    const returnItemsList = await db
      .select()
      .from(schema.returnItems)
      .where(eq(schema.returnItems.return_id, id));

    // Sales returns: stock goes back to the sales person's hands
    if (ret[0].source === "sales") {
      for (const item of returnItemsList) {
        if (!item.batch_id) continue;
        await adjustSalesStock(
          db,
          {
            tenantId,
            salesId: ret[0].source_id,
            productId: item.product_id,
            batchId: item.batch_id,
          },
          item.quantity
        );
      }
    }

    // Agent returns: auto-generate a draft replacement distribution
    if (ret[0].source === "agent") {
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
  }

  return c.json({ success: true, data: { id, status: newStatus } });
});

export { returns as returnRoutes };
