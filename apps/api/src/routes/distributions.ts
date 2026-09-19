// ============================================================
// Distributions Routes — Distribusi ke Agen & Sales
// ============================================================

import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { getDb, generateId, getNow, paginatedList } from "./helpers";
import type { AppEnv } from "../index";

const distributions = new Hono<AppEnv>();
distributions.use("*", authMiddleware);

// GET / — List distributions (filtered by channel)
distributions.get("/", async (c) => {
  const url = new URL(c.req.url);
  const channel = url.searchParams.get("channel") || "sales";
  const resource = channel === "agent" ? "distribution_agent" : "distribution_sales";

  return paginatedList(c, schema.distributions, schema.distributions.tenant_id, {
    additionalFilters: [eq(schema.distributions.channel, channel)],
  });
});

// GET /:id — Distribution detail with items
distributions.get("/:id", async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const dist = await db
    .select()
    .from(schema.distributions)
    .where(and(eq(schema.distributions.id, id), eq(schema.distributions.tenant_id, tenantId)))
    .limit(1);

  if (dist.length === 0) return c.json({ success: false, error: "Distribusi tidak ditemukan" }, 404);

  const items = await db
    .select({
      id: schema.distributionItems.id,
      product_id: schema.distributionItems.product_id,
      product_name: schema.products.name,
      batch_id: schema.distributionItems.batch_id,
      quantity: schema.distributionItems.quantity,
      price: schema.distributionItems.price,
      subtotal: schema.distributionItems.subtotal,
    })
    .from(schema.distributionItems)
    .innerJoin(schema.products, eq(schema.distributionItems.product_id, schema.products.id))
    .where(eq(schema.distributionItems.distribution_id, id));

  const approvals = await db
    .select()
    .from(schema.distributionApprovals)
    .where(eq(schema.distributionApprovals.distribution_id, id));

  return c.json({ success: true, data: { ...dist[0], items, approvals } });
});

// POST / — Create distribution
distributions.post("/", async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const body = await c.req.json();
  const now = getNow();
  const distId = generateId();

  // Calculate total
  let totalAmount = 0;
  const items = body.items || [];

  await db.insert(schema.distributions).values({
    id: distId,
    tenant_id: tenantId,
    channel: body.channel || "sales",
    method: body.method || null,
    recipient_id: body.recipient_id,
    recipient_name: body.recipient_name || null,
    status: body.channel === "agent" ? "draft" : "pending_approval",
    total_amount: 0,
    notes: body.notes || null,
    created_at: now,
    updated_at: now,
  });

  // Create items and update batch quantities
  for (const item of items) {
    const subtotal = item.quantity * item.price;
    totalAmount += subtotal;

    await db.insert(schema.distributionItems).values({
      id: generateId(),
      distribution_id: distId,
      product_id: item.product_id,
      batch_id: item.batch_id,
      quantity: item.quantity,
      price: item.price,
      subtotal,
      created_at: now,
    });
  }

  // Update total amount
  await db
    .update(schema.distributions)
    .set({ total_amount: totalAmount })
    .where(eq(schema.distributions.id, distId));

  return c.json({ success: true, data: { id: distId } }, 201);
});

// POST /:id/approve — Approve/Reject distribution
distributions.post("/:id/approve", async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = getNow();

  const dist = await db
    .select()
    .from(schema.distributions)
    .where(and(eq(schema.distributions.id, id), eq(schema.distributions.tenant_id, tenantId)))
    .limit(1);

  if (dist.length === 0) return c.json({ success: false, error: "Distribusi tidak ditemukan" }, 404);

  // Create approval record
  await db.insert(schema.distributionApprovals).values({
    id: generateId(),
    distribution_id: id,
    user_id: userId,
    status: body.status, // "approved" or "rejected"
    notes: body.notes || null,
    created_at: now,
  });

  // Update distribution status
  const newStatus = body.status === "approved" ? "approved" : "rejected";
  await db
    .update(schema.distributions)
    .set({ status: newStatus, updated_at: now })
    .where(eq(schema.distributions.id, id));

  // If approved, deduct stock from batches
  if (body.status === "approved") {
    const items = await db
      .select()
      .from(schema.distributionItems)
      .where(eq(schema.distributionItems.distribution_id, id));

    for (const item of items) {
      const batch = await db
        .select()
        .from(schema.stockBatches)
        .where(eq(schema.stockBatches.id, item.batch_id))
        .limit(1);

      if (batch.length > 0) {
        const newQty = Math.max(0, batch[0].current_quantity - item.quantity);
        await db
          .update(schema.stockBatches)
          .set({
            current_quantity: newQty,
            status: newQty === 0 ? "out_of_stock" : newQty < 10 ? "low_stock" : "available",
            updated_at: now,
          })
          .where(eq(schema.stockBatches.id, item.batch_id));
      }
    }
  }

  return c.json({ success: true, data: { id, status: newStatus } });
});

export { distributions as distributionRoutes };
